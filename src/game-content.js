// Lecture seule : fichiers présents != DLC possédés/activés, ni routes rendues.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const installer = require('./plugin-installer');
const GAMES = { ets2: 'Euro Truck Simulator 2', ats: 'American Truck Simulator' };
const MAX_LOG = 4 * 1024 * 1024;

async function readLog(file) {
  let h;
  try {
    h = await fs.promises.open(file, 'r');
    const stat = await h.stat();
    const size = Math.min(stat.size, MAX_LOG), b = Buffer.alloc(size);
    await h.read(b, 0, size, 0);
    return { text: b.toString('utf8'), modified: stat.mtime.toISOString(), truncated: stat.size > MAX_LOG };
  } catch (e) { return { text: '', error: e.code }; }
  finally { if (h) await h.close(); }
}

function rootFromLog(text) {
  const m = /(?:Command line:|\[fs\] device)\s+"?([^\r\n"]+?)[\\/]bin[\\/]win_x64[\\/](?:eurotrucks2|amtrucks)\.exe/i.exec(text);
  return m ? path.normalize(m[1].trim()) : null;
}

async function archives(dir) {
  const result = [];
  let list;
  try { list = await fs.promises.readdir(dir, { withFileTypes: true }); }
  catch (e) { return { files: [], error: e.code }; }
  for (const item of list.filter(e => e.isFile() && /\.scs$/i.test(e.name)).slice(0, 2048)) {
    let h;
    try {
      h = await fs.promises.open(path.join(dir, item.name), 'r');
      const stat = await h.stat(), header = Buffer.alloc(8);
      const { bytesRead } = await h.read(header, 0, 8, 0);
      const hashfs = bytesRead >= 8 && header.subarray(0, 4).toString('ascii') === 'SCS#';
      const zip = bytesRead >= 4 && header[0] === 0x50 && header[1] === 0x4b;
      result.push({ name: item.name, bytes: stat.size, modified: stat.mtimeMs,
        kind: /^dlc_/i.test(item.name) ? 'dlc' : 'base',
        format: hashfs ? 'HashFS ' + header.readUInt16LE(4) : zip ? 'ZIP' : 'inconnu',
        readable: hashfs || zip });
    } catch (e) { result.push({ name: item.name, readable: false, error: e.code }); }
    finally { if (h) await h.close(); }
  }
  return { files: result.sort((a, b) => a.name.localeCompare(b.name)) };
}

async function scan(documentsDir, customPaths = [], discovered) {
  const installed = discovered || installer.findGames(customPaths);
  const games = {};
  for (const [id, name] of Object.entries(GAMES)) {
    const log = await readLog(path.join(documentsDir, name, 'game.log.txt'));
    const candidates = installed.filter(g => g.id === id).map(g => path.resolve(g.bin, '..', '..'));
    const logged = rootFromLog(log.text);
    if (logged && installer.gameBinDir(logged)) candidates.push(logged);
    const dir = [...new Set(candidates)][0];
    const inventory = dir ? await archives(dir) : { files: [] };
    const mods = await archives(path.join(documentsDir, name, 'mod'));
    const mounted = [...log.text.matchAll(/\[fs\] device (.+?) mounted to (?:scs|mod) pool\./g)].map(m => m[1]);
    for (const f of inventory.files) f.mountedInLastLog = mounted.some(p => path.basename(p.replace(/\\/g, '/')).toLowerCase() === f.name.toLowerCase());
    games[id] = { id, name, installed: !!dir, dir: dir || null, ...inventory,
      mods: mods.files, modsError: mods.error || null,
      log: { modified: log.modified || null, truncated: !!log.truncated, error: log.error || null },
      version: (/Game version:\s*([^\r\n]+)/i.exec(log.text) || [])[1] || null,
      fingerprint: crypto.createHash('sha256').update(JSON.stringify(inventory.files.map(f => [f.name, f.bytes, f.modified]))).digest('hex'),
      mapStatus: 'legacy-tiles', coachFields: 'awaiting-live-verification' };
  }
  return { checkedAt: new Date().toISOString(), games };
}
module.exports = { scan, archives, rootFromLog };
