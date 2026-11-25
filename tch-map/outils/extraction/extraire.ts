// TCH Map : lit la carte dans les fichiers du jeu installés et écrit les tuiles vectorielles + la liste des villes.
// Code de lecture et de conversion : truckermudgeon/maps (GPL-3). Usage : node extraire.cjs <dossier du jeu> <dossier de sortie>
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseMapFiles } from '@maps/clis/parser/game-files/map-files-parser';
import { writeArrayFile, readMapData } from '@truckermudgeon/io';
import { convertToMapGeoJson, geoJsonMapDataKeys } from '@maps/clis/generator/geo-json/map';
import { ecrireCarte, gardesVisibles } from './tuiles';

const [gameDir, outDir] = process.argv.slice(2);
const t0 = Date.now();
const etape = (nom: string, extra: object = {}) =>
  process.stdout.write('@TCH ' + JSON.stringify({ etape: nom, s: Math.round((Date.now() - t0) / 1000), mo: Math.round(process.memoryUsage().rss / 1e6), ...extra }) + '\n');

try {
  fs.mkdirSync(outDir, { recursive: true });
  const scs = fs.readdirSync(gameDir).filter(f => f.endsWith('.scs')).map(f => path.join(gameDir, f));
  const empreinte = scs.map(f => { const st = fs.statSync(f); return [path.basename(f), st.size, Math.round(st.mtimeMs)]; });
  etape('lecture');
  let r: any = parseMapFiles(scs, { includeDlc: true, mode: 'all' });
  const map = r.map as 'usa' | 'europe', version = r.version as string;
  etape('conversion', { version });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tchmap-'));
  try {
    for (const k of Object.keys(r.mapData)) writeArrayFile(r.mapData[k], path.join(tmp, `${map}-${k}.json`));
    r = null;
    const data = readMapData(tmp, map, { mapDataKeys: geoJsonMapDataKeys, includeHiddenRoadsAndPrefabs: false } as any);
    const gj = convertToMapGeoJson(data as any, { includeDebug: false, skipCoalescing: false });
    etape('tuiles');
    const res = ecrireCarte(gj, outDir, gardesVisibles(map, scs));
    fs.writeFileSync(path.join(outDir, 'info.json'), JSON.stringify({ jeu: map === 'usa' ? 'ats' : 'ets2', version, date: new Date().toISOString(), empreinte, ...res }));
    etape('fini', res);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
} catch (e: any) {
  etape('erreur', { message: String(e?.message || e) });
  process.exitCode = 1;
}
