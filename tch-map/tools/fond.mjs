// TCH Map — fabrique le fond de carte (viewer/fond/*.geojson) depuis world-atlas (Natural Earth).
// Copyright (C) 2026 Truck & Coach Hub — TCH Map. GNU General Public License v3 ou ultérieure.
//
// Usage : node tch-map/tools/fond.mjs <dossier world-atlas> <topojson-client.js>
//   (npm pack world-atlas@2 topojson-client@3, puis désarchiver ; utilise land-50m, land-10m et countries-50m)
// Étapes :
//   1. terres et frontières à l'échelle 1:50 000 000 ;
//   2. Groenland retiré (absent d'ETS2) ;
//   3. Antarctique retiré ; polygones qui traversent l'antiméridien recalés (seulement leurs points de l'extrême est) ;
//   4. Islande : côte détaillée (1:10 000 000) recalée sur sa place dans ETS2 (SCS l'a rapprochée du continent et
//      un peu déformée). Plaque mince (thin-plate spline) des vraies positions de ses 14 villes officielles vers leurs
//      positions dans le jeu : chaque ville tombe à sa place, la côte reste lisse.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [atlasDir, topoClient] = process.argv.slice(2);
const tc = createRequire(import.meta.url)(path.resolve(topoClient));
const round = (g) => JSON.parse(JSON.stringify(g, (k, v) => (typeof v === 'number' ? Math.round(v * 1e3) / 1e3 : v)));
const land = JSON.parse(fs.readFileSync(path.join(atlasDir, 'land-50m.json')));
const ctry = JSON.parse(fs.readFileSync(path.join(atlasDir, 'countries-50m.json')));

// Les 14 villes d'Islande du DLC officiel : [vraie position, position sur la carte du jeu] (longitude, latitude).
// Positions dans le jeu : lues dans les fichiers du jeu 1.62 par l'extraction TCH Map (villes.json).
const ICELAND = {
  akureyri: [[-18.09, 65.68], [-19.05858, 65.67586]], blonduos: [[-20.29, 65.66], [-20.73218, 65.65688]],
  borgarnes: [[-21.92, 64.54], [-22.36895, 64.53506]], egilsstadir: [[-14.40, 65.27], [-15.36038, 65.21257]],
  hofn: [[-15.21, 64.25], [-15.99948, 64.23302]], holmavik: [[-21.68, 65.71], [-22.07181, 65.71227]],
  husavik: [[-17.34, 66.04], [-18.25756, 66.23838]], isafjordur: [[-23.13, 66.07], [-24.18269, 66.16932]],
  keflavik: [[-22.56, 64.00], [-23.22265, 63.75991]], olafsvik: [[-23.71, 64.89], [-24.4786, 64.75068]],
  patreksfjordur: [[-23.99, 65.60], [-25.45462, 65.54137]], reykjavik: [[-21.94, 64.15], [-22.10628, 63.98038]],
  selfoss: [[-21.00, 63.93], [-20.8487, 63.78794]], thorshofn: [[-15.33, 66.20], [-15.66428, 66.34413]],
};
const pairs = Object.values(ICELAND);
// Le jeu déforme l'île (la région de Reykjavík est agrandie, comme les grandes villes partout dans ETS2).
// On suit cette déformation avec une plaque mince (thin-plate spline) : elle passe exactement par les 15 villes
// et plie la côte le moins possible entre elles, sans bosses autour de chaque ville.
const K = Math.cos(65 * Math.PI / 180);
const km = ([x, y]) => [(x + 19) * K, y - 65];
const U = (r) => (r > 0 ? r * r * Math.log(r) : 0);
function fitTps(src, dst) {
  const n = src.length, m = n + 3;
  const A = Array.from({ length: m }, () => Array(m).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) A[i][j] = U(Math.hypot(src[i][0] - src[j][0], src[i][1] - src[j][1]));
    A[i][n] = A[n][i] = 1; A[i][n + 1] = A[n + 1][i] = src[i][0]; A[i][n + 2] = A[n + 2][i] = src[i][1];
  }
  const solve = (b) => { // Gauss avec pivot partiel
    const M = A.map((r, i) => [...r, b[i]]);
    for (let i = 0; i < m; i++) {
      let p = i; for (let r = i + 1; r < m; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
      [M[i], M[p]] = [M[p], M[i]];
      for (let r = 0; r < m; r++) if (r !== i) { const f = M[r][i] / M[i][i]; for (let c = i; c <= m; c++) M[r][c] -= f * M[i][c]; }
    }
    return M.map((r, i) => r[m] / r[i]);
  };
  const wx = solve([...dst.map(d => d[0]), 0, 0, 0]), wy = solve([...dst.map(d => d[1]), 0, 0, 0]);
  return ([x, y]) => {
    let gx = wx[n] + wx[n + 1] * x + wx[n + 2] * y, gy = wy[n] + wy[n + 1] * x + wy[n + 2] * y;
    for (let i = 0; i < n; i++) { const u = U(Math.hypot(x - src[i][0], y - src[i][1])); gx += wx[i] * u; gy += wy[i] * u; }
    return [gx, gy];
  };
}
const tps = fitTps(pairs.map(([r]) => km(r)), pairs.map(([, g]) => km(g)));
const toGame = (pt) => { const [x, y] = tps(km(pt)); return [x / K - 19, y + 65]; };
const err = pairs.map(([r, g]) => { const p = toGame(r); return Math.hypot(p[0] - g[0], p[1] - g[1]); });
console.log(`Islande : ${pairs.length} villes, écart moyen ${(err.reduce((a, b) => a + b, 0) / err.length).toFixed(3)}°, max ${Math.max(...err).toFixed(3)}°`);

const terres = round(tc.feature(land, land.objects.land));
const geom = terres.features[0].geometry;
const bbox = (ring) => { const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const isIceland = ([x0, y0, x1, y1]) => x0 > -25.5 && x1 < -12.5 && y0 > 62.8 && y1 < 67.2;
const isGreenland = ([x0, y0, x1]) => x0 > -75 && x1 < -10 && y0 > 58.5;
geom.coordinates = geom.coordinates.filter(poly => { const b = bbox(poly[0]); return !isIceland(b) && !isGreenland(b) && b[3] > -55; }); // sans l'Antarctique
// Islande en version détaillée (1:10 000 000) : fjords et péninsules reconnaissables
const land10 = JSON.parse(fs.readFileSync(path.join(atlasDir, 'land-10m.json')));
const terres10 = round(tc.feature(land10, land10.objects.land)).features[0].geometry.coordinates;
geom.coordinates.push(...terres10.filter(poly => isIceland(bbox(poly[0])) && poly[0].length >= 8));
for (const poly of geom.coordinates) {
  const b = bbox(poly[0]);
  // Seuls les points de l'extrême est (Tchoukotka, îles Fidji…) passent de l'autre côté : jamais l'Europe de l'Ouest
  if (b[2] - b[0] > 180) for (const ring of poly) for (const p of ring) if (p[0] < -150) p[0] += 360;
  if (isIceland(b)) for (const ring of poly) for (const p of ring) { const q = toGame(p); p[0] = Math.round(q[0] * 1e3) / 1e3; p[1] = Math.round(q[1] * 1e3) / 1e3; }
}
const frontieres = round({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: tc.mesh(ctry, ctry.objects.countries, (a, b) => a !== b) }] });
fs.writeFileSync(path.join(here, '..', 'viewer', 'fond', 'terres.geojson'), JSON.stringify(terres));
fs.writeFileSync(path.join(here, '..', 'viewer', 'fond', 'frontieres.geojson'), JSON.stringify(frontieres));
console.log('Fond écrit.');
