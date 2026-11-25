// TCH Map — fabrique le fond de carte (viewer/fond/*.geojson) depuis world-atlas (Natural Earth).
// Copyright (C) 2026 Truck & Coach Hub — TCH Map. GNU General Public License v3 ou ultérieure.
//
// Usage : node tch-map/tools/fond.mjs <dossier world-atlas> <topojson-client.js>
//   (npm pack world-atlas@2 topojson-client@3, puis désarchiver ; utilise land-50m, land-10m et countries-50m)
// Étapes :
//   1. terres et frontières à l'échelle 1:50 000 000 (Islande en 1:10 000 000) ;
//   2. Groenland et Antarctique retirés ; polygones qui traversent l'antiméridien recalés (points de l'extrême est) ;
//   3. version ETS2 (terres-ets2 / frontieres-ets2) : SCS a déformé l'Europe pour son jeu (villes jusqu'à ~70 km de leur
//      vraie place, Islande déplacée). Le fond est déformé de la même façon : plaque mince (thin-plate spline) lissée,
//      des vraies positions de ~300 villes vers leurs positions dans le jeu (reperes-ets2.json). Hors de la zone du jeu,
//      la déformation s'efface progressivement. ATS garde le fond réel (terres / frontieres).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [atlasDir, topoClient] = process.argv.slice(2);
const tc = createRequire(import.meta.url)(path.resolve(topoClient));
const round = (g) => JSON.parse(JSON.stringify(g, (k, v) => (typeof v === 'number' ? Math.round(v * 1e3) / 1e3 : v)));
const clone = (o) => JSON.parse(JSON.stringify(o));
const land = JSON.parse(fs.readFileSync(path.join(atlasDir, 'land-50m.json')));
const ctry = JSON.parse(fs.readFileSync(path.join(atlasDir, 'countries-50m.json')));
const reperes = JSON.parse(fs.readFileSync(path.join(here, 'reperes-ets2.json'), 'utf8')).villes;

// ---------- Plaque mince lissée, en kilomètres autour de 15° E, 50° N ----------
const K = Math.cos(50 * Math.PI / 180) * 111.32, KY = 110.57;
const km = ([x, y]) => [(x - 15) * K, (y - 50) * KY];
const deg = ([x, y]) => [x / K + 15, y / KY + 50];
const U = (r) => (r > 0 ? r * r * Math.log(r) : 0);
function fitTps(src, dst, lambda) {
  const n = src.length, m = n + 3;
  const A = Array.from({ length: m }, () => new Float64Array(m));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) A[i][j] = U(Math.hypot(src[i][0] - src[j][0], src[i][1] - src[j][1]));
    A[i][i] += lambda; // lissage : la côte ne se tord pas pour suivre une ville mal placée
    A[i][n] = A[n][i] = 1; A[i][n + 1] = A[n + 1][i] = src[i][0]; A[i][n + 2] = A[n + 2][i] = src[i][1];
  }
  const solve = (b) => {
    const M = A.map((r, i) => { const x = new Float64Array(m + 1); x.set(r); x[m] = b[i]; return x; });
    for (let i = 0; i < m; i++) {
      let p = i; for (let r = i + 1; r < m; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
      [M[i], M[p]] = [M[p], M[i]];
      for (let r = 0; r < m; r++) if (r !== i) { const f = M[r][i] / M[i][i]; if (f) for (let c = i; c <= m; c++) M[r][c] -= f * M[i][c]; }
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
const tps = fitTps(reperes.map(r => km(r[1])), reperes.map(r => km(r[2])), 40);
// Zone du jeu (avec marge) : déformation complète dedans, effacée en 12° autour
const ZONE = [-27, 33, 48, 73];
const poids = ([x, y]) => {
  const dx = Math.max(ZONE[0] - x, 0, x - ZONE[2]), dy = Math.max(ZONE[1] - y, 0, y - ZONE[3]);
  return Math.max(0, 1 - Math.hypot(dx, dy) / 12);
};
const versJeu = (p) => {
  const w = poids(p); if (!w) return p;
  const q = deg(tps(km(p)));
  return [p[0] + (q[0] - p[0]) * w, p[1] + (q[1] - p[1]) * w];
};
const err = reperes.map(r => { const q = versJeu(r[1]); const k = Math.cos(r[2][1] * Math.PI / 180); return Math.hypot((q[0] - r[2][0]) * k, q[1] - r[2][1]) * 111.32; }).sort((a, b) => a - b);
console.log(`Recalage ETS2 : ${reperes.length} villes, écart restant médian ${err[err.length >> 1].toFixed(1)} km, 90 % sous ${err[Math.floor(err.length * .9)].toFixed(1)} km, max ${err.at(-1).toFixed(1)} km`);

// ---------- Terres et frontières réelles ----------
const terres = round(tc.feature(land, land.objects.land));
const geom = terres.features[0].geometry;
const bbox = (ring) => { const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const isIceland = ([x0, y0, x1, y1]) => x0 > -25.5 && x1 < -12.5 && y0 > 62.8 && y1 < 67.2;
const isGreenland = ([x0, y0, x1]) => x0 > -75 && x1 < -10 && y0 > 58.5;
geom.coordinates = geom.coordinates.filter(poly => { const b = bbox(poly[0]); return !isIceland(b) && !isGreenland(b) && b[3] > -55; });
const land10 = JSON.parse(fs.readFileSync(path.join(atlasDir, 'land-10m.json')));
geom.coordinates.push(...round(tc.feature(land10, land10.objects.land)).features[0].geometry.coordinates.filter(poly => isIceland(bbox(poly[0])) && poly[0].length >= 8));
for (const poly of geom.coordinates) {
  const b = bbox(poly[0]);
  // Seuls les points de l'extrême est (Tchoukotka, îles Fidji…) passent de l'autre côté : jamais l'Europe de l'Ouest
  if (b[2] - b[0] > 180) for (const ring of poly) for (const p of ring) if (p[0] < -150) p[0] += 360;
}
const frontieres = round({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: tc.mesh(ctry, ctry.objects.countries, (a, b) => a !== b) }] });

// ---------- Version déformée pour ETS2 ----------
const deformer = (fc) => {
  const c = clone(fc);
  const pt = (p) => { const q = versJeu(p); p[0] = Math.round(q[0] * 1e3) / 1e3; p[1] = Math.round(q[1] * 1e3) / 1e3; };
  const walk = (a) => { if (typeof a[0] === 'number') pt(a); else a.forEach(walk); };
  for (const f of c.features) walk(f.geometry.coordinates);
  return c;
};
const out = (n, o) => fs.writeFileSync(path.join(here, '..', 'viewer', 'fond', n), JSON.stringify(o));
out('terres.geojson', terres);
out('frontieres.geojson', frontieres);
out('terres-ets2.geojson', deformer(terres));
out('frontieres-ets2.geojson', deformer(frontieres));
console.log('Fond écrit.');
