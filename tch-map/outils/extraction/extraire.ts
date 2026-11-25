// TCH Map : lit la carte dans les fichiers du jeu installés et écrit les tuiles vectorielles + la liste des villes.
// Code de lecture et de conversion : truckermudgeon/maps (GPL-3). Usage : node extraire.cjs <dossier du jeu> <dossier de sortie>
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseMapFiles } from '@maps/clis/parser/game-files/map-files-parser';
import { readMapData } from '@truckermudgeon/io';
import { convertToMapGeoJson, geoJsonMapDataKeys } from '@maps/clis/generator/geo-json/map';
import { ecrireCarte, gardesVisibles } from './tuiles';
import { fondDuJeu } from './fond-jeu';
import { fromEts2CoordsToWgs84, fromAtsCoordsToWgs84 } from '@truckermudgeon/map/projections';
import { estOuvrier, lancerOuvrier, creerOuvriers, nombreOuvriers, decoderSecteur } from './ouvriers';

// Comme TruckSim Maps (libs/io/write.ts) : les identifiants (BigInt) s'écrivent en hexadécimal
(BigInt.prototype as any).toJSON = function () { return this.toString(16); };

const [gameDir, outDir] = process.argv.slice(2);
const t0 = Date.now();
const etape = (nom: string, extra: object = {}) =>
  process.stdout.write('@TCH ' + JSON.stringify({ etape: nom, s: Math.round((Date.now() - t0) / 1000), mo: Math.round(process.memoryUsage().rss / 1e6), ...extra }) + '\n');

async function principal() {
try {
  // Priorité basse : le jeu et l'appli restent fluides pendant la préparation
  try { os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch {}
  let dernier = -1;
  (globalThis as any).__tchOuvriers = (modeles: string[]) => creerOuvriers(modeles, decoderSecteur);
  (globalThis as any).__tchProgression = (fait: number, total: number) => {
    const pct = Math.floor((fait / total) * 100);
    if (pct !== dernier) { dernier = pct; etape('lecture', { fait, total }); }
  };
  fs.mkdirSync(outDir, { recursive: true });
  const scs = fs.readdirSync(gameDir).filter(f => f.endsWith('.scs')).map(f => path.join(gameDir, f));
  const empreinte = scs.map(f => { const st = fs.statSync(f); return [path.basename(f), st.size, Math.round(st.mtimeMs)]; });
  etape('lecture', { fait: 0, total: 0, ouvriers: nombreOuvriers() });
  let r: any = await parseMapFiles(scs, { includeDlc: true, mode: 'all' });
  const map = r.map as 'usa' | 'europe', version = r.version as string;
  etape('conversion', { version });
  {
    // Conversion directement en mémoire (sans passer par des fichiers JSON)
    const donnees = r.mapData as Record<string, unknown[]>;
    r = null;
    const source = {
      has: (n: string) => n.startsWith(map + '-') && (n.slice(map.length + 1, -5) in donnees),
      readUtf8: () => { throw new Error('lecture mémoire uniquement'); },
      describe: () => 'mémoire',
      memoire: (n: string) => donnees[n.slice(map.length + 1, -5)],
    };
    let data: any = readMapData(source as any, map, { mapDataKeys: geoJsonMapDataKeys, includeHiddenRoadsAndPrefabs: false } as any);
    for (const k of Object.keys(donnees)) delete donnees[k];
    const gj = convertToMapGeoJson(data, { includeDebug: false, skipCoalescing: false });
    // Fond recalé sur le jeu (côtes et frontières réelles déformées pour passer par les villes du jeu)
    etape('fond');
    const proj = map === 'usa' ? fromAtsCoordsToWgs84 : fromEts2CoordsToWgs84;
    const villes = [...(data.cities as Map<string, any>).values()].map((c: any) => ({ token: c.token, name: c.name, nameLocalized: c.nameLocalized, ll: proj([c.x, c.y]) as [number, number] }));
    data = null;
    // 1) Côtes réelles recalées sur TON jeu (toutes tes DLC, ETS2 comme ATS) ; 2) à défaut, fond fourni avec TCH Map
    let fond: any[] = [], reperes = 0;
    try { const r2 = fondDuJeu(villes, map === 'usa'); fond = r2.terres; reperes = r2.reperes; } catch (e: any) { process.stderr.write('[TCH Map] fond non recalé : ' + (e && e.message) + '\n'); }
    if (process.env.TCH_DEBUG) fs.writeFileSync(path.join(outDir, 'fond-debug.geojson'), JSON.stringify({ type: 'FeatureCollection', features: fond }));
    if (!fond.length) {
      try {
        const f = process.env.TCH_FOND || path.join(path.dirname(process.argv[1]), '..', 'viewer', 'fond', map === 'usa' ? 'terres.geojson' : 'terres-ets2.geojson');
        fond = JSON.parse(fs.readFileSync(f, 'utf8')).features;
      } catch {}
    }
    etape('tuiles');
    const res = { ...ecrireCarte(gj, outDir, gardesVisibles(map, scs), fond), reperes };
    fs.writeFileSync(path.join(outDir, 'info.json'), JSON.stringify({ jeu: map === 'usa' ? 'ats' : 'ets2', version, date: new Date().toISOString(), empreinte, ...res }));
    etape('fini', res);
  }
  terminer(0);
} catch (e: any) {
  etape('erreur', { message: String(e?.message || e) });
  terminer(1);
}
}
// Fin explicite (un processus utilitaire d'Electron ne s'arrête pas toujours seul) après l'écriture des messages
function terminer(code: number) { process.stdout.write('', () => process.exit(code)); }

if (estOuvrier) lancerOuvrier();
else principal();
