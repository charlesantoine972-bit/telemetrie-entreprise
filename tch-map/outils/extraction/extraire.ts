// TCH Map : lit la carte dans les fichiers du jeu installés et écrit les tuiles vectorielles + la liste des villes.
// Code de lecture et de conversion : truckermudgeon/maps (GPL-3). Usage : node extraire.cjs <dossier du jeu> <dossier de sortie>
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseMapFiles } from '@maps/clis/parser/game-files/map-files-parser';
import { readMapData } from '@truckermudgeon/io';
import { convertToMapGeoJson, geoJsonMapDataKeys } from '@maps/clis/generator/geo-json/map';
import { ecrireCarte, gardesVisibles } from './tuiles';
import { estOuvrier, lancerOuvrier, creerOuvriers, nombreOuvriers } from './ouvriers';

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
  (globalThis as any).__tchOuvriers = (modeles: string[]) => creerOuvriers(modeles);
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
    data = null;
    etape('tuiles');
    const res = ecrireCarte(gj, outDir, gardesVisibles(map, scs));
    fs.writeFileSync(path.join(outDir, 'info.json'), JSON.stringify({ jeu: map === 'usa' ? 'ats' : 'ets2', version, date: new Date().toISOString(), empreinte, ...res }));
    etape('fini', res);
  }
} catch (e: any) {
  etape('erreur', { message: String(e?.message || e) });
  process.exitCode = 1;
}
}

if (estOuvrier) lancerOuvrier();
else principal();
