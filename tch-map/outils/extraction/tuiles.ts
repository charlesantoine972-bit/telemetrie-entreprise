// TCH Map : transforme le GeoJSON de la carte en tuiles vectorielles (un seul fichier + index), en JavaScript pur.
import fs from 'fs';
import path from 'path';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import { terreDuJeu } from './terre';
import { Ets2DlcGuards, Ets2ScsSourceToDlcGuard, AtsDlcGuards, AtsScsSourceToDlcGuard } from '@truckermudgeon/map/constants';

// Tuiles dès le zoom 2 : la carte reste visible quand on dézoome (FORMAT : à changer si le contenu des tuiles change)
const ZMIN = 2, ZMAX = 10;
export const FORMAT = 3; // = CARTE_FORMAT dans main.js de l'appli hôte

// Variantes de carte visibles : celles dont toutes les DLC requises sont installées.
export function gardesVisibles(map: 'usa' | 'europe', fichiersScs: string[]): Set<number> {
  const src = map === 'usa' ? AtsScsSourceToDlcGuard : Ets2ScsSourceToDlcGuard;
  const gardes = (map === 'usa' ? AtsDlcGuards : Ets2DlcGuards) as Record<number, ReadonlySet<unknown>>;
  const possedees = new Set<unknown>();
  for (const f of fichiersScs) {
    const g = (src as Record<string, number>)[path.basename(f)];
    if (g != null) for (const d of gardes[g] ?? []) possedees.add(d);
  }
  const ok = new Set<number>();
  for (const [g, req] of Object.entries(gardes)) if ([...req].every(d => possedees.has(d))) ok.add(Number(g));
  return ok;
}

export function ecrireCarte(gj: any, outDir: string, gardes: Set<number>, fond: any[] = []) {
  const feats: any[] = [];
  const contenu: any[] = []; // ce qui doit être sur la terre ferme
  const villes: any[] = [];
  for (const f of gj.features) {
    const p = f.properties;
    if (p.dlcGuard != null && !gardes.has(p.dlcGuard)) continue;
    switch (p.type) {
      case 'mapArea':
      case 'prefab':
        contenu.push(f);
        feats.push({ type: 'Feature', geometry: f.geometry, properties: { t: p.type === 'prefab' ? 'p' : 'a', c: p.color ?? 0, z: p.zIndex ?? 0 } });
        break;
      case 'road':
        if (p.hidden || p.roadType === 'train' || p.roadType === 'tram') break;
        contenu.push(f);
        feats.push({ type: 'Feature', geometry: f.geometry, properties: { t: 'r', r: p.roadType, s: p.secret ? 1 : 0 } });
        break;
      case 'ferry':
      case 'train':
        feats.push({ type: 'Feature', geometry: f.geometry, properties: { t: p.type === 'ferry' ? 'f' : 'tr' } });
        break;
      case 'city':
        contenu.push(f);
        villes.push({ n: p.name, r: p.scaleRank, c: p.capital ? 1 : 0, p: f.geometry.coordinates.map((v: number) => Math.round(v * 1e5) / 1e5) });
        break;
    }
  }
  // Terres : terres réelles recalées + tout le contenu du jeu (aucune route dans l'eau), dessinées sous le reste
  feats.unshift(...terreDuJeu(contenu, { fond }));
  contenu.length = 0;
  gj.features = []; // libère le GeoJSON complet : seules les entités gardées restent
  const index = geojsonvt({ type: 'FeatureCollection', features: feats } as any, { maxZoom: ZMAX, indexMaxZoom: 5, indexMaxPoints: 100000, tolerance: 3, buffer: 64 });
  feats.length = 0;
  const tuiles: Record<string, [number, number]> = {};
  const bin = fs.openSync(path.join(outDir, 'tuiles.bin.tmp'), 'w');
  let pos = 0;
  const descendre = (z: number, x: number, y: number) => {
    const t = index.getTile(z, x, y);
    if (!t || !t.features.length) return;
    if (z >= ZMIN) {
      const buf = Buffer.from(vtpbf.fromGeojsonVt({ jeu: t }, { version: 2 }));
      fs.writeSync(bin, buf);
      tuiles[`${z}/${x}/${y}`] = [pos, buf.length];
      pos += buf.length;
    }
    if (z < ZMAX) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) descendre(z + 1, x * 2 + dx, y * 2 + dy);
  };
  descendre(0, 0, 0);
  fs.closeSync(bin);
  fs.renameSync(path.join(outDir, 'tuiles.bin.tmp'), path.join(outDir, 'tuiles.bin'));
  fs.writeFileSync(path.join(outDir, 'tuiles.json'), JSON.stringify({ zmin: ZMIN, zmax: ZMAX, tuiles }));
  fs.writeFileSync(path.join(outDir, 'villes.json'), JSON.stringify(villes));
  return { format: FORMAT, zmin: ZMIN, zmax: ZMAX, tuiles: Object.keys(tuiles).length, octets: pos, villes: villes.length };
}
