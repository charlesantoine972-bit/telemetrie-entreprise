// Outil d'essai : copie le sous-ensemble des fichiers du jeu lus par l'extraction (trace) + les secteurs de carte.
'use strict';
const fs = require('fs'), path = require('path');
const { openArchive } = require('../lecteur/archive.js');
const [gameDir, traceFile, outDir] = process.argv.slice(2);
const ouverts = new Map();
const arch = (n) => { if (!ouverts.has(n)) ouverts.set(n, openArchive(path.join(gameDir, n))); return ouverts.get(n); };
const ecrire = (src, k, buf) => { const f = path.join(outDir, src, k); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); };
let n = 0, octets = 0;
const vus = new Set();
for (const l of fs.readFileSync(traceFile, 'utf8').split('\n')) {
  if (!l) continue; const [src, k] = JSON.parse(l); const id = src + '|' + k; if (vus.has(id)) continue; vus.add(id);
  const b = arch(src).read(k); if (b) { ecrire(src, k, b); n++; octets += b.length; }
}
console.log('fichiers tracés', n, Math.round(octets / 1e6), 'Mo');
for (const f of fs.readdirSync(gameDir).filter(f => f.endsWith('.scs'))) {
  let a; try { a = arch(f); } catch { continue; }
  const m = a.list('map'); if (!m) continue;
  for (const mbd of m.files.filter(x => x.endsWith('.mbd'))) ecrire(f, 'map/' + mbd, a.read('map/' + mbd));
  for (const d of m.dirs) {
    const l = a.list('map/' + d); if (!l) continue;
    for (const s of l.files.filter(x => /\.(base|aux)$/.test(x))) { const b = a.read(`map/${d}/${s}`); ecrire(f, `map/${d}/${s}`, b); n++; octets += b.length; }
  }
}
console.log('total', n, 'fichiers', Math.round(octets / 1e6), 'Mo');
