// TCH Map : terres du jeu, calculées à partir de son contenu (routes, carrefours, zones, villes).
// Les côtes réelles ne correspondent pas à celles du jeu (SCS a déformé et redessiné l'Europe) : on trace donc la
// silhouette du monde du jeu lui-même. Grille fine → tout ce qui est à moins de RAYON du contenu du jeu est « terre »
// → contour lissé (lignes de niveau d'une carte des distances) → polygones avec leurs trous (mers fermées, lacs).
// Ainsi aucune route ne peut se trouver dans l'eau.

type Pos = [number, number];

// fond : terres réelles (déjà recalées sur la carte du jeu) qui donnent la forme générale ; le contenu du jeu la complète.
export function terreDuJeu(features: any[], opts: { cellKm?: number; rayonKm?: number; limiteKm?: number; fond?: any[] } = {}) {
  const cellKm = opts.cellKm ?? 1.2, rayonKm = opts.rayonKm ?? 3.5;
  // Les terres réelles ne sont gardées qu'à moins de limiteKm du contenu du jeu : bords naturels, jamais de coupure droite
  const limiteKm = opts.fond && opts.fond.length ? (opts.limiteKm ?? 150) : 0;
  // Étendue des données
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const parcourir = (g: any, fn: (p: Pos) => void) => {
    const w = (a: any) => { if (typeof a[0] === 'number') fn(a); else for (const b of a) w(b); };
    w(g.coordinates);
  };
  for (const f of features) parcourir(f.geometry, ([x, y]) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; });
  if (!isFinite(x0)) return [];
  const marge = (Math.max(rayonKm * 3, limiteKm + rayonKm * 3)) / 111;
  x0 -= marge * 2; x1 += marge * 2; y0 -= marge; y1 += marge;
  const lat0 = (y0 + y1) / 2, kx = Math.cos((lat0 * Math.PI) / 180) * 111.32, ky = 110.57;
  // Grille en kilomètres (projection équirectangulaire locale), cellules de cellKm
  const W = Math.ceil(((x1 - x0) * kx) / cellKm) + 1, H = Math.ceil(((y1 - y0) * ky) / cellKm) + 1;
  const gx = (x: number) => ((x - x0) * kx) / cellKm, gy = (y: number) => ((y - y0) * ky) / cellKm;
  const lng = (i: number) => x0 + (i * cellKm) / kx, lat = (j: number) => y0 + (j * cellKm) / ky;
  const INF = 1e9;
  const d = new Float32Array(W * H).fill(INF);
  const marquer = (i: number, j: number) => { const a = Math.round(i), b = Math.round(j); if (a >= 0 && b >= 0 && a < W && b < H) d[b * W + a] = 0; };
  const segment = (p: Pos, q: Pos) => {
    const ax = gx(p[0]), ay = gy(p[1]), bx = gx(q[0]), by = gy(q[1]);
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 2));
    for (let k = 0; k <= n; k++) marquer(ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n);
  };
  for (const f of features) {
    const g = f.geometry;
    if (g.type === 'Point') marquer(gx(g.coordinates[0]), gy(g.coordinates[1]));
    else if (g.type === 'LineString') for (let i = 1; i < g.coordinates.length; i++) segment(g.coordinates[i - 1], g.coordinates[i]);
    else if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      for (const poly of polys) for (const ring of poly) for (let i = 1; i < ring.length; i++) segment(ring[i - 1], ring[i]);
    }
  }
  // Terres réelles recalées : remplissage par lignes (règle pair-impair) dans la grille
  const terreReelle = new Uint8Array(W * H);
  for (const f of opts.fond || []) {
    const g = f.geometry; if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) {
      const aretes: number[][] = [];
      let bj0 = Infinity, bj1 = -Infinity;
      for (const ring of poly) for (let i = 1; i < ring.length; i++) {
        const ax = gx(ring[i - 1][0]), ay = gy(ring[i - 1][1]), bx = gx(ring[i][0]), by = gy(ring[i][1]);
        if (ay === by) continue;
        aretes.push([ax, ay, bx, by]); bj0 = Math.min(bj0, ay, by); bj1 = Math.max(bj1, ay, by);
      }
      for (let j = Math.max(0, Math.ceil(bj0)); j <= Math.min(H - 1, Math.floor(bj1)); j++) {
        const xs: number[] = [];
        for (const [ax, ay, bx, by] of aretes) if ((ay <= j) !== (by <= j)) xs.push(ax + ((j - ay) * (bx - ax)) / (by - ay));
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.max(0, Math.ceil(xs[k])); i <= Math.min(W - 1, Math.floor(xs[k + 1])); i++) terreReelle[j * W + i] ^= 1;
      }
    }
  }
  // Carte des distances (chanfrein 3-4, en cellules)
  const a1 = 1, a2 = Math.SQRT2;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i; let v = d[k];
    if (i > 0) v = Math.min(v, d[k - 1] + a1);
    if (j > 0) { v = Math.min(v, d[k - W] + a1); if (i > 0) v = Math.min(v, d[k - W - 1] + a2); if (i < W - 1) v = Math.min(v, d[k - W + 1] + a2); }
    d[k] = v;
  }
  for (let j = H - 1; j >= 0; j--) for (let i = W - 1; i >= 0; i--) {
    const k = j * W + i; let v = d[k];
    if (i < W - 1) v = Math.min(v, d[k + 1] + a1);
    if (j < H - 1) { v = Math.min(v, d[k + W] + a1); if (i < W - 1) v = Math.min(v, d[k + W + 1] + a2); if (i > 0) v = Math.min(v, d[k + W - 1] + a2); }
    d[k] = v;
  }
  const niveau = rayonKm / cellKm;
  // Terre = terres réelles OU à moins de rayonKm du contenu du jeu
  const limite = limiteKm / cellKm;
  for (let k = 0; k < d.length; k++) if (terreReelle[k] && d[k] <= limite) d[k] = 0;
  // Lignes de niveau (marching squares) : segments orientés, terre à gauche
  const val = (i: number, j: number) => (i < 0 || j < 0 || i >= W || j >= H ? INF : d[j * W + i]);
  const inter = (va: number, vb: number) => (va === vb ? 0.5 : Math.min(1, Math.max(0, (niveau - va) / (vb - va))));
  const suivant = new Map<string, Pos[]>();
  const cle = (p: Pos) => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;
  const ajouter = (p: Pos, q: Pos) => { suivant.set(cle(p), [p, q]); };
  for (let j = -1; j < H; j++) for (let i = -1; i < W; i++) {
    const tl = val(i, j + 1), tr = val(i + 1, j + 1), br = val(i + 1, j), bl = val(i, j);
    const c = (tl <= niveau ? 8 : 0) | (tr <= niveau ? 4 : 0) | (br <= niveau ? 2 : 0) | (bl <= niveau ? 1 : 0);
    if (c === 0 || c === 15) continue;
    const T: Pos = [i + inter(tl, tr), j + 1], R: Pos = [i + 1, j + inter(br, tr)], B: Pos = [i + inter(bl, br), j], L: Pos = [i, j + inter(bl, tl)];
    switch (c) {
      case 1: ajouter(B, L); break;
      case 2: ajouter(R, B); break;
      case 3: ajouter(R, L); break;
      case 4: ajouter(T, R); break;
      case 5: ajouter(T, L); ajouter(B, R); break;
      case 6: ajouter(T, B); break;
      case 7: ajouter(T, L); break;
      case 8: ajouter(L, T); break;
      case 9: ajouter(B, T); break;
      case 10: ajouter(L, B); ajouter(R, T); break;
      case 11: ajouter(R, T); break;
      case 12: ajouter(L, R); break;
      case 13: ajouter(B, R); break;
      case 14: ajouter(L, B); break;
    }
  }
  // Assemblage des anneaux
  const anneaux: Pos[][] = [];
  for (const [k0, s0] of suivant) {
    if (!suivant.has(k0)) continue;
    const ring: Pos[] = [s0[0]];
    let k = k0, garde = 0;
    while (suivant.has(k) && garde++ < 5e6) {
      const [, q] = suivant.get(k)!; suivant.delete(k);
      ring.push(q); k = cle(q);
    }
    if (ring.length >= 4) anneaux.push(ring);
  }
  // Simplification (Douglas-Peucker, ~0,4 cellule) puis conversion en longitude / latitude
  const simplifier = (pts: Pos[], tol: number): Pos[] => {
    if (pts.length < 4) return pts;
    const garder = new Uint8Array(pts.length); garder[0] = garder[pts.length - 1] = 1;
    // Anneau fermé : on le coupe d'abord en deux au point le plus éloigné du départ
    let loin = 0, dl = -1;
    for (let i = 1; i < pts.length - 1; i++) { const dd = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (dd > dl) { dl = dd; loin = i; } }
    garder[loin] = 1;
    const pile: [number, number][] = [[0, loin], [loin, pts.length - 1]];
    while (pile.length) {
      const [a, b] = pile.pop()!; let m = -1, dm = tol;
      const [ax, ay] = pts[a], [bx, by] = pts[b], L = Math.hypot(bx - ax, by - ay) || 1e-9;
      for (let i = a + 1; i < b; i++) { const dd = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L; if (dd > dm) { dm = dd; m = i; } }
      if (m >= 0) { garder[m] = 1; pile.push([a, m], [m, b]); }
    }
    return pts.filter((_, i) => garder[i]);
  };
  const aire = (r: Pos[]) => { let s = 0; for (let i = 1; i < r.length; i++) s += r[i - 1][0] * r[i][1] - r[i][0] * r[i - 1][1]; return s / 2; };
  const exterieurs: { r: Pos[]; bb: number[]; trous: Pos[][] }[] = [], trous: Pos[][] = [];
  // Sens des contours : celui de la plus grande terre (un continent est toujours un contour extérieur)
  let sens = 1, plusGrande = 0;
  for (const r of anneaux) { const a = aire(r); if (Math.abs(a) > plusGrande) { plusGrande = Math.abs(a); sens = Math.sign(a) || 1; } }
  for (const r0 of anneaux) {
    const r = simplifier(r0, 0.4);
    if (r.length < 4) continue;
    const a = aire(r) * sens;
    if (Math.abs(a) < 1.5) continue; // miettes
    let geo = r.map(([i, j]) => [Math.round(lng(i) * 1e5) / 1e5, Math.round(lat(j) * 1e5) / 1e5] as Pos);
    if (sens < 0) geo = geo.reverse(); // extérieurs dans le sens trigonométrique, trous dans l'autre (GeoJSON)
    if (a > 0) { const xs = geo.map(p => p[0]), ys = geo.map(p => p[1]); exterieurs.push({ r: geo, bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], trous: [] }); }
    else trous.push(geo);
  }
  // Chaque trou va dans la plus petite terre qui le contient
  const dedans = (p: Pos, r: Pos[]) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { if ((r[i][1] > p[1]) !== (r[j][1] > p[1]) && p[0] < ((r[j][0] - r[i][0]) * (p[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; } return c; };
  const surface = (e: { bb: number[] }) => (e.bb[2] - e.bb[0]) * (e.bb[3] - e.bb[1]);
  const tries = [...exterieurs].sort((a, b) => surface(a) - surface(b));
  for (const t of trous) {
    const p = t[0];
    const e = tries.find(e => p[0] >= e.bb[0] && p[0] <= e.bb[2] && p[1] >= e.bb[1] && p[1] <= e.bb[3] && dedans(p, e.r));
    if (e) e.trous.push(t);
  }
  return exterieurs.map(e => ({ type: 'Feature', properties: { t: 'l' }, geometry: { type: 'Polygon', coordinates: [e.r, ...e.trous] } }));
}
