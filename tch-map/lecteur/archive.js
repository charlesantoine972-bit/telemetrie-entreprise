// TCH Map — lecture des archives SCS (.scs HashFS v1 et v2, .scs/.zip au format ZIP, dossiers décompressés).
// Copyright (C) 2026 Truck & Coach Hub — TCH Map. GNU General Public License v3 ou ultérieure.
// Format HashFS v2 d'après truckermudgeon/maps (GPL-3), HashFS v1 d'après la documentation communautaire.
// Lecture seule : aucun fichier du jeu ou des mods n'est jamais modifié.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { city64 } = require('./cityhash');
const { gdeflate } = require('./gdeflate');

const norm = (p) => String(p).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

function readAt(fd, pos, len) {
  const b = Buffer.alloc(len);
  let off = 0;
  while (off < len) {
    const n = fs.readSync(fd, b, off, len - off, Number(pos) + off);
    if (n <= 0) break;
    off += n;
  }
  return off === len ? b : b.subarray(0, off);
}

// ---------- HashFS v2 (ETS2/ATS 1.50 et plus) ----------
const PLAIN = 0x80, DIRECTORY = 0x81, MIP_TAIL = 0x84;

class HashFs2 {
  constructor(fd, head, file) {
    this.kind = 'hashfs2'; this.fd = fd; this.file = file;
    const count = head.readUInt32LE(12);
    const etCompressed = head.readUInt32LE(16);
    const mtSize = head.readUInt32LE(20), mtCompressed = head.readUInt32LE(24);
    const etOffset = head.readBigUInt64LE(28), mtOffset = head.readBigUInt64LE(36);
    const inflateIf = (b, size) => (b.length !== size ? zlib.inflateSync(b) : b);
    const et = inflateIf(readAt(fd, etOffset, etCompressed), count * 16);
    const mt = inflateIf(readAt(fd, mtOffset, mtCompressed), mtSize);
    this.entries = new Map();
    for (let i = 0; i < count; i++) {
      const o = i * 16;
      const hash = et.readBigUInt64LE(o);
      const mIndex = et.readUInt32LE(o + 8), mCount = et.readUInt16LE(o + 12);
      const isDir = (et[o + 14] & 1) === 1;
      let plain = null;
      for (let k = 0; k < mCount; k++) {
        const h = 4 * (mIndex + k);
        const type = mt[h + 3], idx = mt.readUIntLE(h, 3) * 4;
        if (type === PLAIN || type === DIRECTORY || type === MIP_TAIL) {
          const packed = mt.readUInt32LE(idx);
          plain = {
            compressedSize: packed & 0x0fffffff,
            compression: packed >>> 28,
            size: mt.readUInt32LE(idx + 4) & 0x0fffffff,
            offset: BigInt(mt.readUInt32LE(idx + 12)) * 16n,
          };
          if (type !== MIP_TAIL) break;
        }
      }
      if (plain) this.entries.set(hash, { ...plain, isDir });
    }
  }
  _data(e) {
    const raw = readAt(this.fd, e.offset, e.compressedSize);
    switch (e.compression) {
      case 0: return raw;
      case 1: return zlib.inflateSync(raw);
      case 2: return zlib.inflateRawSync(raw);
      case 3: return gdeflate(raw, e.size);
      default: throw new Error(`compression ${e.compression} non gérée`);
    }
  }
  read(p) { const e = this.entries.get(city64(norm(p))); return e && !e.isDir ? this._data(e) : null; }
  has(p) { return this.entries.has(city64(norm(p))); }
  list(p) {
    const e = this.entries.get(city64(norm(p)));
    if (!e || !e.isDir) return null;
    const b = this._data(e);
    const n = b.readUInt32LE(0);
    const dirs = [], files = [];
    let off = 4 + n;
    for (let i = 0; i < n; i++) {
      const s = b.toString('utf8', off, off + b[4 + i]); off += b[4 + i];
      if (s.startsWith('/')) dirs.push(s.slice(1)); else files.push(s);
    }
    return { dirs, files };
  }
}

// ---------- HashFS v1 (anciens jeux et beaucoup de mods) ----------
class HashFs1 {
  constructor(fd, head, file) {
    this.kind = 'hashfs1'; this.fd = fd; this.file = file;
    const count = head.readUInt32LE(12), start = head.readUInt32LE(16);
    const t = readAt(fd, start, count * 32);
    this.entries = new Map();
    for (let i = 0; i < count; i++) {
      const o = i * 32;
      const flags = t.readUInt32LE(o + 16);
      this.entries.set(t.readBigUInt64LE(o), {
        offset: t.readBigUInt64LE(o + 8), isDir: (flags & 1) === 1, compressed: (flags & 2) === 2,
        size: t.readUInt32LE(o + 24), compressedSize: t.readUInt32LE(o + 28),
      });
    }
  }
  _data(e) {
    const raw = readAt(this.fd, e.offset, e.compressed ? e.compressedSize : e.size);
    return e.compressed ? zlib.inflateSync(raw) : raw;
  }
  read(p) { const e = this.entries.get(city64(norm(p))); return e && !e.isDir ? this._data(e) : null; }
  has(p) { return this.entries.has(city64(norm(p))); }
  list(p) {
    const e = this.entries.get(city64(norm(p)));
    if (!e || !e.isDir) return null;
    const dirs = [], files = [];
    for (const s of this._data(e).toString('utf8').split('\n')) {
      if (!s) continue;
      if (s.startsWith('*')) dirs.push(s.slice(1)); else files.push(s);
    }
    return { dirs, files };
  }
}

// ---------- ZIP (.zip, et .scs qui sont en fait des ZIP) ----------
class Zip {
  constructor(fd, file) {
    this.kind = 'zip'; this.fd = fd; this.file = file;
    const size = fs.fstatSync(fd).size;
    const tailLen = Math.min(size, 65557);
    const tail = readAt(fd, size - tailLen, tailLen);
    let eocd = -1;
    for (let i = tail.length - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('ZIP illisible');
    let count = tail.readUInt16LE(eocd + 10), cdSize = tail.readUInt32LE(eocd + 12), cdOff = tail.readUInt32LE(eocd + 16);
    if (cdOff === 0xffffffff || count === 0xffff) { // ZIP64
      const loc = eocd - 20;
      if (loc >= 0 && tail.readUInt32LE(loc) === 0x07064b50) {
        const z = readAt(fd, tail.readBigUInt64LE(loc + 8), 56);
        count = Number(z.readBigUInt64LE(32)); cdSize = Number(z.readBigUInt64LE(40)); cdOff = Number(z.readBigUInt64LE(48));
      }
    }
    const cd = readAt(fd, cdOff, cdSize);
    this.entries = new Map(); this.dirs = new Map();
    const addDir = (d) => { if (!this.dirs.has(d)) this.dirs.set(d, { dirs: new Set(), files: new Set() }); return this.dirs.get(d); };
    addDir('');
    for (let o = 0, i = 0; i < count && o + 46 <= cd.length; i++) {
      if (cd.readUInt32LE(o) !== 0x02014b50) break;
      const utf8 = (cd.readUInt16LE(o + 8) & 0x800) !== 0;
      const method = cd.readUInt16LE(o + 10);
      let csize = cd.readUInt32LE(o + 20), usize = cd.readUInt32LE(o + 24);
      const nl = cd.readUInt16LE(o + 28), el = cd.readUInt16LE(o + 30), kl = cd.readUInt16LE(o + 32);
      let local = cd.readUInt32LE(o + 42);
      const rawName = cd.toString(utf8 ? 'utf8' : 'latin1', o + 46, o + 46 + nl).replace(/\\/g, '/');
      const name = norm(rawName);
      // ZIP64 : tailles et position dans le champ supplémentaire
      let x = o + 46 + nl; const xe = x + el;
      while (x + 4 <= xe) {
        const id = cd.readUInt16LE(x), len = cd.readUInt16LE(x + 2);
        if (id === 1) { let p = x + 4;
          if (usize === 0xffffffff) { usize = Number(cd.readBigUInt64LE(p)); p += 8; }
          if (csize === 0xffffffff) { csize = Number(cd.readBigUInt64LE(p)); p += 8; }
          if (local === 0xffffffff) { local = Number(cd.readBigUInt64LE(p)); } }
        x += 4 + len;
      }
      o += 46 + nl + el + kl;
      const isDir = name === '' || rawName.endsWith('/');
      const parts = name.split('/').filter(Boolean);
      for (let d = 0; d < parts.length - (isDir ? 0 : 1); d++) {
        const parent = parts.slice(0, d).join('/');
        addDir(parent).dirs.add(parts[d]);
        addDir(parts.slice(0, d + 1).join('/'));
      }
      if (!isDir && parts.length) {
        addDir(parts.slice(0, -1).join('/')).files.add(parts[parts.length - 1]);
        this.entries.set(name.toLowerCase(), { method, csize, usize, local });
      }
    }
  }
  read(p) {
    const e = this.entries.get(norm(p).toLowerCase());
    if (!e) return null;
    const h = readAt(this.fd, e.local, 30);
    const start = e.local + 30 + h.readUInt16LE(26) + h.readUInt16LE(28);
    const raw = readAt(this.fd, start, e.csize);
    if (e.method === 0) return raw;
    if (e.method === 8) return zlib.inflateRawSync(raw);
    throw new Error(`méthode ZIP ${e.method} non gérée`);
  }
  has(p) { const n = norm(p); return this.entries.has(n.toLowerCase()) || this.dirs.has(n); }
  list(p) { const d = this.dirs.get(norm(p)); return d ? { dirs: [...d.dirs], files: [...d.files] } : null; }
}

// ---------- Dossier décompressé (mods en développement) ----------
class Dossier {
  constructor(dir) { this.kind = 'dossier'; this.file = dir; this.root = path.resolve(dir); }
  _p(p) {
    const full = path.resolve(this.root, norm(p));
    if (full !== this.root && !full.startsWith(this.root + path.sep)) return null; // jamais en dehors du dossier
    return full;
  }
  read(p) { const f = this._p(p); try { return f && fs.statSync(f).isFile() ? fs.readFileSync(f) : null; } catch { return null; } }
  has(p) { const f = this._p(p); return !!f && fs.existsSync(f); }
  list(p) {
    const f = this._p(p);
    try {
      const ents = fs.readdirSync(f, { withFileTypes: true });
      return { dirs: ents.filter(e => e.isDirectory()).map(e => e.name), files: ents.filter(e => e.isFile()).map(e => e.name) };
    } catch { return null; }
  }
  close() {}
}

function openArchive(file) {
  const st = fs.statSync(file);
  if (st.isDirectory()) return new Dossier(file);
  const fd = fs.openSync(file, 'r');
  try {
    const head = readAt(fd, 0, 64);
    let a;
    if (head.length >= 20 && head.toString('latin1', 0, 4) === 'SCS#' && head.toString('latin1', 8, 12) === 'CITY') {
      const v = head.readUInt16LE(4);
      if (v === 2) a = new HashFs2(fd, head, file);
      else if (v === 1) a = new HashFs1(fd, head, file);
      else throw new Error(`HashFS version ${v} inconnue`);
    } else if (head.readUInt32LE(0) === 0x04034b50 || head.readUInt32LE(0) === 0x06054b50) {
      a = new Zip(fd, file);
    } else {
      throw new Error('format d’archive inconnu');
    }
    a.close = () => { try { fs.closeSync(fd); } catch {} };
    return a;
  } catch (e) {
    try { fs.closeSync(fd); } catch {}
    throw e;
  }
}

module.exports = { openArchive, norm };
