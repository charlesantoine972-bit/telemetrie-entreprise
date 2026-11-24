// TCH Map — fabrique le fond de carte (viewer/fond/*.geojson) depuis world-atlas (Natural Earth).
// Copyright (C) 2026 Truck & Coach Hub — TCH Map. GNU General Public License v3 ou ultérieure.
//
// Usage : node tch-map/tools/fond.mjs <dossier world-atlas> <topojson-client.js>
//   (npm pack world-atlas@2 topojson-client@3, puis désarchiver)
// Étapes :
//   1. terres et frontières à l'échelle 1:50 000 000 ;
//   2. Groenland retiré (absent d'ETS2) ;
//   3. polygones qui traversent l'antiméridien recalés (sinon bande parasite sur toute la carte) ;
//   4. Islande recalée sur sa place dans ETS2 : SCS l'a rapprochée du continent et un peu déformée.
//      Transformation affine (moindres carrés) des vraies positions de ses 15 villes vers leurs positions dans le jeu,
//      puis correction ville par ville : chaque ville tombe exactement sur la côte, comme dans le jeu.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { toLngLat } from '../viewer/projection.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const [atlasDir, topoClient] = process.argv.slice(2);
const tc = createRequire(import.meta.url)(path.resolve(topoClient));
const round = (g) => JSON.parse(JSON.stringify(g, (k, v) => (typeof v === 'number' ? Math.round(v * 1e3) / 1e3 : v)));
const land = JSON.parse(fs.readFileSync(path.join(atlasDir, 'land-50m.json')));
const ctry = JSON.parse(fs.readFileSync(path.join(atlasDir, 'countries-50m.json')));

// Vraies positions (longitude, latitude) des villes d'Islande présentes dans ETS2
const ICELAND = {
  akranes: [-22.08, 64.32], akureyri: [-18.09, 65.68], blonduos: [-20.29, 65.66], bolungarvik: [-23.25, 66.15],
  borgarnes: [-21.92, 64.54], hofn: [-15.21, 64.25], holmavik: [-21.68, 65.71], isafjordur: [-23.13, 66.07],
  keflavik: [-22.61, 63.99], krafla: [-16.78, 65.71], reydar: [-14.22, 65.03], reykjavik: [-21.94, 64.15],
  selfoss: [-21.0, 63.93], seydis: [-14.01, 65.26], vik: [-19.01, 63.42],
};
const villes = fs.readFileSync(path.join(here, '..', '..', 'app', 'data', 'villes.js'), 'utf8');
const V = JSON.parse(villes.slice(villes.indexOf('{'), villes.lastIndexOf('}') + 1)).ets2;

// Moindres carrés : [gx, gy] = [a·x + b·y + c, d·x + e·y + f]
function fitAffine(pairs) {
  const solve3 = (A, b) => { // élimination de Gauss 3×3
    const M = A.map((r, i) => [...r, b[i]]);
    for (let i = 0; i < 3; i++) {
      let p = i; for (let r = i + 1; r < 3; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
      [M[i], M[p]] = [M[p], M[i]];
      for (let r = 0; r < 3; r++) if (r !== i) { const f = M[r][i] / M[i][i]; for (let c = i; c < 4; c++) M[r][c] -= f * M[i][c]; }
    }
    return M.map((r, i) => r[3] / r[i]);
  };
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
  for (const [[x, y], [gx, gy]] of pairs) {
    const v = [x, y, 1];
    for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) S[i][j] += v[i] * v[j]; bx[i] += v[i] * gx; by[i] += v[i] * gy; }
  }
  const [a, b, c] = solve3(S, bx), [d, e, f] = solve3(S, by);
  return ([x, y]) => [a * x + b * y + c, d * x + e * y + f];
}
const pairs = Object.entries(ICELAND).map(([id, real]) => { const c = V.find(v => v[0] === id); return c && [real, toLngLat('ets2', c[2], c[3])]; }).filter(Boolean);
const affine = fitAffine(pairs);
// Le jeu déforme un peu l'île : après l'affine, on corrige le reste ville par ville (pondération 1/d²),
// pour que chaque ville tombe exactement à sa place et que la côte suive.
const resid = pairs.map(([r, g]) => { const p = affine(r); return [r, [g[0] - p[0], g[1] - p[1]]]; });
const toGame = (pt) => {
  const p = affine(pt); let wx = 0, wy = 0, ws = 0;
  for (const [r, [dx, dy]] of resid) { const d2 = (pt[0] - r[0]) ** 2 + (pt[1] - r[1]) ** 2; if (d2 < 1e-12) return [p[0] + dx, p[1] + dy]; const w = 1 / d2; wx += w * dx; wy += w * dy; ws += w; }
  return [p[0] + wx / ws, p[1] + wy / ws];
};
const err = pairs.map(([r, g]) => { const p = toGame(r); return Math.hypot(p[0] - g[0], p[1] - g[1]); });
console.log(`Islande : ${pairs.length} villes, écart moyen ${(err.reduce((a, b) => a + b, 0) / err.length).toFixed(3)}°, max ${Math.max(...err).toFixed(3)}°`);

const terres = round(tc.feature(land, land.objects.land));
const geom = terres.features[0].geometry;
const bbox = (ring) => { const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const isIceland = ([x0, y0, x1, y1]) => x0 > -25.5 && x1 < -12.5 && y0 > 62.8 && y1 < 67.2;
const isGreenland = ([x0, y0, x1]) => x0 > -75 && x1 < -10 && y0 > 58.5;
geom.coordinates = geom.coordinates.filter(poly => { const b = bbox(poly[0]); return isIceland(b) || !isGreenland(b); });
for (const poly of geom.coordinates) {
  const b = bbox(poly[0]);
  if (b[2] - b[0] > 180) for (const ring of poly) for (const p of ring) if (p[0] < 0) p[0] += 360;
  if (isIceland(b)) for (const ring of poly) for (const p of ring) { const q = toGame(p); p[0] = Math.round(q[0] * 1e3) / 1e3; p[1] = Math.round(q[1] * 1e3) / 1e3; }
}
const frontieres = round({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: tc.mesh(ctry, ctry.objects.countries, (a, b) => a !== b) }] });
fs.writeFileSync(path.join(here, '..', 'viewer', 'fond', 'terres.geojson'), JSON.stringify(terres));
fs.writeFileSync(path.join(here, '..', 'viewer', 'fond', 'frontieres.geojson'), JSON.stringify(frontieres));
console.log('Fond écrit.');
