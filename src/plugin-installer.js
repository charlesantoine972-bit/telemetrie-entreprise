// Installe (ou met à jour) le plugin de télémétrie dans Euro Truck Simulator 2 / American Truck Simulator.
// Cherche les jeux dans toutes les bibliothèques Steam, plus les dossiers choisis à la main.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const DLL_NAME = 'telemetrie_entreprise.dll';
const GAMES = [
  { id: 'ets2', name: 'Euro Truck Simulator 2', folder: 'Euro Truck Simulator 2' },
  { id: 'ats', name: 'American Truck Simulator', folder: 'American Truck Simulator' }
];

function sha(file) {
  try { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); } catch { return null; }
}

function steamRoot() {
  try {
    const out = execFileSync('reg', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const m = out.match(/SteamPath\s+REG_SZ\s+(.+)/);
    if (m) return path.normalize(m[1].trim());
  } catch {}
  for (const p of ['C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam']) if (fs.existsSync(p)) return p;
  return null;
}

function steamLibraries() {
  const root = steamRoot();
  if (!root) return [];
  const libs = new Set([root]);
  try {
    const vdf = fs.readFileSync(path.join(root, 'steamapps', 'libraryfolders.vdf'), 'utf8');
    for (const m of vdf.matchAll(/"path"\s+"([^"]+)"/g)) libs.add(path.normalize(m[1].replace(/\\\\/g, '\\')));
  } catch {}
  return [...libs];
}

// Accepte le dossier du jeu, ou directement bin\win_x64
function gameBinDir(dir) {
  for (const c of [path.join(dir, 'bin', 'win_x64'), dir]) {
    if (fs.existsSync(path.join(c, 'eurotrucks2.exe')) || fs.existsSync(path.join(c, 'amtrucks.exe'))) return c;
  }
  return null;
}

function findGames(customPaths = []) {
  const found = [];
  const seen = new Set();
  const add = (dir, game) => {
    const bin = gameBinDir(dir);
    if (!bin || seen.has(bin.toLowerCase())) return;
    seen.add(bin.toLowerCase());
    const isAts = fs.existsSync(path.join(bin, 'amtrucks.exe'));
    const g = game || GAMES[isAts ? 1 : 0];
    found.push({ id: g.id, name: g.name, dir, bin });
  };
  for (const lib of steamLibraries()) for (const g of GAMES) add(path.join(lib, 'steamapps', 'common', g.folder), g);
  for (const p of customPaths) add(p);
  return found;
}

function install(sourceDll, customPaths = []) {
  const games = findGames(customPaths);
  const want = sha(sourceDll);
  return games.map((g) => {
    const pluginsDir = path.join(g.bin, 'plugins');
    const target = path.join(pluginsDir, DLL_NAME);
    try {
      if (sha(target) === want) return { ...g, status: 'ok', message: 'Plugin installé et à jour' };
      const existed = fs.existsSync(target);
      fs.mkdirSync(pluginsDir, { recursive: true });
      fs.copyFileSync(sourceDll, target);
      return { ...g, status: 'ok', message: existed ? 'Plugin mis à jour' : 'Plugin installé' };
    } catch (e) {
      const locked = e.code === 'EBUSY' || (e.code === 'EPERM' && fs.existsSync(target));
      return {
        ...g, status: 'error',
        message: locked ? 'Le jeu est ouvert : ferme-le pour mettre à jour le plugin.'
                        : `Impossible d'écrire dans le dossier du jeu (${e.code || e.message}).`
      };
    }
  });
}

module.exports = { install, findGames, gameBinDir, DLL_NAME };
