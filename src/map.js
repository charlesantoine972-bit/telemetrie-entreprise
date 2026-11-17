// Carte : tuiles du jeu servies à l'interface via le protocole « tchmap:// ».
//
// Il n'existe pas d'API officielle de SCS pour la carte. On utilise les tuiles
// générées depuis les fichiers du jeu par TsMap (collection libre « SCS_Map_Tiles »,
// licence MIT), téléchargées à la demande depuis GitHub puis gardées sur le PC :
// une zone déjà vue s'affiche ensuite instantanément, même sans Internet.
//
// La position du camion vient du plugin (coordonnées monde x / z en mètres).
// Conversion : la tuile de zoom 0 (512 px) couvre le carré [x1..x2] × [y1..y2]
// du monde du jeu (valeurs de TileMapInfo.json ci-dessous).
const { protocol, net } = require('electron');
const fs = require('fs');
const path = require('path');

const SCHEME = 'tchmap';
const SOURCE = process.env.TCH_MAP_SOURCE || 'https://raw.githubusercontent.com/Unicor-p/SCS_Map_Tiles/master';

const MAPS = {
  ets2: { dir: 'ets2/latest', x1: -94621.8047, x2: 79370.13, y1: -80209.1641, y2: 93782.77, tileSize: 512, minZoom: 0, maxZoom: 8, version: '1.49' },
  ats: { dir: 'ats/latest', x1: -127721.344, x2: 20049.6563, y1: -72181.5, y2: 75589.5, tileSize: 512, minZoom: 0, maxZoom: 8, version: '1.48' }
};

// À appeler avant app.whenReady()
function registerScheme() {
  protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
}

// tchmap://ets2/5/17/10.png -> cache local, sinon téléchargement
function setup(cacheDir) {
  const pending = new Map();
  protocol.handle(SCHEME, async (req) => {
    const u = new URL(req.url);
    const game = u.hostname;
    const m = /^\/(\d{1,2})\/(\d{1,4})\/(\d{1,4})\.png$/.exec(u.pathname);
    const map = MAPS[game];
    if (!map || !m) return new Response('', { status: 404 });
    const [z, x, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const n = 2 ** z;
    if (z > map.maxZoom || x >= n || y >= n) return new Response('', { status: 404 });
    const file = path.join(cacheDir, game, String(z), String(x), y + '.png');
    try {
      const buf = await fs.promises.readFile(file);
      return new Response(buf, { headers: { 'content-type': 'image/png', 'cache-control': 'max-age=604800' } });
    } catch {}
    // Une seule requête par tuile, même si Leaflet la demande plusieurs fois
    if (!pending.has(file)) {
      pending.set(file, (async () => {
        const r = await net.fetch(`${SOURCE}/${map.dir}/Tiles/${z}/${x}/${y}.png`);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const buf = Buffer.from(await r.arrayBuffer());
        fs.promises.mkdir(path.dirname(file), { recursive: true })
          .then(() => fs.promises.writeFile(file, buf)).catch(() => {});
        return buf;
      })().finally(() => setTimeout(() => pending.delete(file), 1000)));
    }
    try {
      const buf = await pending.get(file);
      return new Response(buf, { headers: { 'content-type': 'image/png', 'cache-control': 'max-age=604800' } });
    } catch {
      return new Response('', { status: 504 });
    }
  });
}

function cacheSize(cacheDir) {
  let bytes = 0, files = 0;
  const walk = (d) => {
    let list = [];
    try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of list) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { try { bytes += fs.statSync(p).size; files++; } catch {} }
    }
  };
  walk(cacheDir);
  return { bytes, files };
}

function clearCache(cacheDir) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  return cacheSize(cacheDir);
}

module.exports = { MAPS, SCHEME, registerScheme, setup, cacheSize, clearCache };
