// TCH Map : fond (côtes réelles) recalé sur la géographie du jeu.
// SCS déforme la géographie (régions compressées, villes agrandies) : les côtes réelles ne tombent pas sous les routes.
// On associe chaque ville du jeu à la vraie ville du même nom (Natural Earth, domaine public), puis on
// déforme les côtes réelles (moyenne pondérée des décalages des villes voisines) pour suivre la géographie du jeu.
import fs from 'fs';
import path from 'path';
import * as topojson from 'topojson-client';
import polygonClipping from 'polygon-clipping';

type P = [number, number];
const ressources = () => process.env.TCH_RESSOURCES || path.dirname(process.argv[1]);
const lire = (f: string) => JSON.parse(fs.readFileSync(path.join(ressources(), 'resources', f), 'utf8'));

// Quelques villes du jeu absentes de Natural Earth (vraies positions, longitude / latitude)
const COMPLEMENTS: Record<string, P> = {
  // Islande
  blonduos: [-20.29, 65.66], holmavik: [-21.68, 65.71], husavik: [-17.34, 66.04], olafsvik: [-23.71, 64.89],
  patreksfjord: [-23.99, 65.60], thorshofn: [-15.33, 66.20],
  // Grand Nord et Scandinavie
  honningsvag: [25.97, 70.98], ivalo: [27.54, 68.66], kajaani: [27.73, 64.23], karesuando: [22.48, 68.44], kuusamo: [29.19, 65.97],
  tornio: [24.15, 65.85], haparanda: [24.14, 65.84], arvidsjaur: [19.17, 65.59], andenes: [16.12, 69.32], dombas: [9.12, 62.07],
  kristiansund: [7.73, 63.11], hirtshals: [9.96, 57.59], kapellskar: [19.06, 59.72], sodertalje: [17.63, 59.20], nynashamn: [17.95, 58.90],
  trelleborg: [13.16, 55.38], gedser: [11.93, 54.57], alesund: [6.15, 62.47], svolvaer: [14.57, 68.23],
  // Finlande, pays baltes, Russie
  kotka: [26.94, 60.47], naantali: [22.02, 60.47], loviisa: [26.23, 60.46], olkiluoto: [21.44, 61.24], paldiski: [24.05, 59.36],
  kunda: [26.53, 59.50], liepaja: [21.01, 56.51], valmiera: [25.43, 57.54], utena: [25.60, 55.50], mazeikiai: [22.34, 56.31],
  sosnovy_bor: [29.12, 59.90],
  // Grèce et Balkans
  patras: [21.73, 38.25], rhodes: [28.22, 36.43], chania: [24.02, 35.51], heraklion: [25.14, 35.34], argostoli: [20.49, 38.18],
  trikala: [21.77, 39.56], bihac: [15.87, 44.82], karakaj: [19.12, 44.41], bijelo_polje: [19.75, 43.04], niksic: [18.94, 42.77],
  koper: [13.73, 45.55], novo_mesto: [15.17, 45.80], hunedoara: [22.90, 45.75], cernavoda: [28.03, 44.34], mangalia: [28.58, 43.82],
  veli_tarnovo: [25.63, 43.08], kozloduy: [23.73, 43.78], pirdop: [24.18, 42.70], karlovo: [24.81, 42.64],
  // Iberia
  a_coruna: [-8.41, 43.36], almaraz: [-5.69, 39.80], bailen: [-3.78, 38.09], ciudad_real: [-3.93, 38.99], el_ejido: [-2.81, 36.78],
  lleida: [0.62, 41.62], mengibar: [-3.81, 37.97], navia: [-6.72, 43.54], o_barco: [-6.98, 42.42], olhao: [-7.84, 37.03],
  ponte_de_sor: [-8.01, 39.25], port_sagunt: [-0.22, 39.66], puertollano: [-4.11, 38.69], sines: [-8.87, 37.96], soria: [-2.46, 41.76],
  vandellos: [0.88, 40.95], villarreal: [-0.10, 39.94], teruel: [-1.11, 40.34], corticadas: [-8.20, 38.63],
  // France, Italie, Corse, Royaume-Uni, Allemagne
  roscoff: [-3.98, 48.73], civaux: [0.66, 46.44], bayonne: [-1.47, 43.49], lacq: [-0.62, 43.41], golfech: [0.85, 44.11],
  calvi: [8.76, 42.57], porto_vecchi: [9.28, 41.59], lile_rousse: [8.94, 42.64], bonifacio: [9.16, 41.39],
  cassino: [13.83, 41.49], terni: [12.65, 42.56], suzzara: [10.74, 45.00], sangiovanni: [15.65, 38.21],
  felixstowe: [1.35, 51.96], grimsby: [-0.08, 53.57], travemunde: [10.87, 53.96], werlte: [7.68, 52.85], winsen: [10.21, 53.36],
};

const norm = (s: unknown) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/ß/g, 'ss').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/ı/g, 'i')
  .replace(/þ/g, 'th').replace(/ð/g, 'd').replace(/[^a-z]/g, '');

export function fondDuJeu(villes: { token: string; name: string; nameLocalized?: string; ll: P }[], usa: boolean) {
  const lat0 = usa ? 39 : 52, K = Math.cos(lat0 * Math.PI / 180);
  const km = (p: P): P => [p[0] * 111.32 * K, p[1] * 110.57];
  const unkm = (p: P): P => [p[0] / (111.32 * K), p[1] / 110.57];
  const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  // 1) Points de repère : ville du jeu ↔ vraie ville du même nom la plus proche (< 350 km)
  const lieux = (lire('ne_10m_populated_places_simple.geojson').features as any[]).map(f => f.properties);
  const index = new Map<string, any[]>();
  for (const p of lieux) for (const champ of ['name', 'nameascii', 'namealt', 'namepar', 'ls_name', 'meganame'])
    for (const v of String(p[champ] || '').split(/[|,]/)) { const k = norm(v); if (k.length < 3) continue; if (!index.has(k)) index.set(k, []); index.get(k)!.push(p); }
  let reperes: { id: string; r: P; g: P }[] = [];
  for (const v of villes) {
    const g = km(v.ll);
    let best: P | null = COMPLEMENTS[v.token] ? km(COMPLEMENTS[v.token]) : null, bd = best ? dist(best, g) : 1e9;
    for (const k of [v.token, v.name, v.nameLocalized, v.token.replace(/_/g, ' ')])
      for (const p of index.get(norm(k)) || []) { const r = km([p.longitude, p.latitude]); const d = dist(r, g); if (d < bd) { bd = d; best = r; } }
    if (best && bd < 350) reperes.push({ id: v.token, r: best, g });
  }
  // 2) Écarter les homonymes : déplacement trop différent de celui des 6 voisins
  const dep = (p: { r: P; g: P }): P => [p.g[0] - p.r[0], p.g[1] - p.r[1]];
  const ecartes = new Set<string>();
  for (const p of reperes) {
    const v = reperes.filter(q => q !== p).sort((a, b) => dist(a.r, p.r) - dist(b.r, p.r)).slice(0, 6).map(dep);
    if (v.length < 3) continue;
    const med = [0, 1].map(i => v.map(x => x[i]).sort((a, b) => a - b)[Math.floor(v.length / 2)]);
    const d = dep(p);
    if (Math.hypot(d[0] - med[0], d[1] - med[1]) > 60) ecartes.add(p.id);
  }
  reperes = reperes.filter(p => !ecartes.has(p.id));
  if (reperes.length < 10) return { terres: [], reperes: reperes.length };

  // 3) Déformation douce : chaque point prend la moyenne des décalages (jeu − réalité) des villes voisines, pondérée
  //    par une gaussienne (rayon ~120 km). Stable partout : loin de toute ville, on garde le décalage des plus proches
  //    (une plaque mince, exacte aux villes, s'emballe loin d'elles : côtes du Grand Nord projetées n'importe où).
  const src = reperes.map(p => p.r), dx = reperes.map(p => p.g[0] - p.r[0]), dy = reperes.map(p => p.g[1] - p.r[1]);
  const SIG2 = 120 * 120;
  const deformer = (q: P): P => {
    const [x, y] = km(q);
    let r2min = Infinity;
    const r2 = new Float64Array(src.length);
    for (let i = 0; i < src.length; i++) { const a = x - src[i][0], b = y - src[i][1]; r2[i] = a * a + b * b; if (r2[i] < r2min) r2min = r2[i]; }
    let sw = 0, sx = 0, sy = 0;
    for (let i = 0; i < src.length; i++) { const w = Math.exp(-(r2[i] - r2min) / SIG2); sw += w; sx += w * dx[i]; sy += w * dy[i]; }
    return unkm([x + sx / sw, y + sy / sw]);
  };

  // 4) Côtes de la région du jeu (découpées proprement), puis déformées
  // Cadre large et fixe (le tri fin se fait ensuite : terres gardées à moins de 150 km du contenu du jeu)
  const boite: P[] = usa ? [[-135, 15], [-55, 60]] : [[-32, 25], [62, 76]];
  const [[x0, y0], [x1, y1]] = boite;
  const land = lire('land-10m.json');
  const terresBrutes = (topojson.feature(land, land.objects.land) as any).features[0].geometry.coordinates as P[][][];
  // Polygones qui traversent la ligne de changement de date (Eurasie par la Tchoukotka) : on ramène leurs points de
  // l'extrême est de l'autre côté, sinon leur contour fait l'aller-retour du monde (bandes droites sur toute la carte)
  for (const poly of terresBrutes) {
    let a = 1e9, b = -1e9;
    for (const [x] of poly[0]) { if (x < a) a = x; if (x > b) b = x; }
    if (b - a > 180) for (const ring of poly) for (const p of ring) if (p[0] < -150) p[0] += 360;
  }
  const rect: P[][] = [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];
  const dans = (poly: P[][]) => { const r = poly[0]; let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const [x, y] of r) { if (x < a) a = x; if (x > b) b = x; if (y < c) c = y; if (y > d) d = y; } return b > x0 && a < x1 && d > y0 && c < y1; };
  const terres: any[] = [];
  for (const poly of terresBrutes.filter(dans)) {
    let morceaux: any;
    try { morceaux = polygonClipping.intersection(poly as any, rect as any); } catch { continue; }
    for (const mp of morceaux) terres.push({ type: 'Feature', properties: { t: 'l' }, geometry: { type: 'Polygon', coordinates: mp.map((r: P[]) => r.map(deformer)) } });
  }
  return { terres, reperes: reperes.length };
}
