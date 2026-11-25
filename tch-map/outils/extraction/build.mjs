// TCH Map — compile l'extraction (extraction/extraire.cjs) à partir de TruckSim Maps (truckermudgeon/maps, GPL-3).
// Usage : MAPS=<clone de truckermudgeon/maps au commit indiqué dans LISEZMOI.md, dépendances installées> node build.mjs
// Modifications appliquées au code de TruckSim Maps (toutes ici, rien n'est modifié dans le clone) :
//   - modules natifs (cityhash, gdeflate) remplacés par du JavaScript pur ;
//   - lecture des secteurs en deux passes (seulement les nœuds utiles : ~2,6 Go de mémoire au lieu de 8+) ;
//   - pas d'icônes ni de modèles 3D (.pmg) : inutiles pour la carte ;
//   - langue des noms au choix (TCH_LANGUE, par défaut fr_fr) ;
//   - archives « dossier » acceptées (essais) ;
//   - lecture des secteurs en parallèle (ouvriers.ts), données passées en mémoire à la conversion ;
//   - borne nord du Royaume-Uni élargie (nord de l'Écosse) dans la projection.
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { patchSecteurs } from './patch-secteurs.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const MAPS = path.resolve(process.env.MAPS || path.join(ici, 'maps'));
const GF = path.join(MAPS, 'packages/clis/parser/game-files');
const remplacer = (s, a, b, quoi) => { if (!s.includes(a)) throw new Error('motif introuvable : ' + quoi); return s.replace(a, b); };

await esbuild.build({
  entryPoints: [path.join(ici, 'extraire.ts')], bundle: true, platform: 'node', format: 'cjs', target: 'node20',
  outfile: path.join(ici, '../../extraction/extraire.cjs'), logLevel: 'warning', legalComments: 'inline',
  banner: { js: '// TCH Map — extraction de la carte. Code compilé depuis tch-map/outils/extraction et truckermudgeon/maps (GPL-3).' },
  alias: { '@maps': path.join(MAPS, 'packages') },
  nodePaths: [path.join(MAPS, 'node_modules'), path.join(ici, 'node_modules')],
  plugins: [{ name: 'tch', setup(b) {
    b.onLoad({ filter: /map-files-parser\.ts$/ }, async (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      s = remplacer(s, 'parseIconMatFiles(map, entries),\n        l10n', 'new Map(),\n        l10n', 'icônes');
      s = remplacer(s, "const l10n = assertExists(parseLocaleFiles(entries).get('en_us'));",
        "const __loc = parseLocaleFiles(entries); const l10n = assertExists(__loc.get(process.env.TCH_LANGUE || 'fr_fr') ?? __loc.get('en_us'));", 'langue');
      s = patchSecteurs(s);
      s = remplacer(s, 'return new ScsArchive(p, scsSource);', "return (require('fs').statSync(p).isDirectory() ? new DirArchive(p, scsSource) : new ScsArchive(p, scsSource)) as any;", 'archives');
      s = `import { DirArchive } from ${JSON.stringify(path.join(ici, 'dir-archive'))};\n` + s;
      return { contents: s, loader: 'ts', resolveDir: GF };
    });
    b.onLoad({ filter: /scs-archive\.ts$/ }, async (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      s = remplacer(s, 'const require = createRequire(import.meta.url);', `import __bindings from ${JSON.stringify(path.join(ici, 'bindings-shim.js'))};`, 'require natif');
      return { contents: s.replaceAll("require('bindings')", '__bindings'), loader: 'ts', resolveDir: GF };
    });
    b.onLoad({ filter: /def-parser\.ts$/ }, async (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      s = remplacer(s, "if (ppd.mapPoints.some(p => p.type === 'polygon')) {", 'if (false) {', 'pmg prefabs');
      s = remplacer(s, 'if (!isProbablyBuildingModel) {', 'if (true) {', 'pmg bâtiments');
      return { contents: s, loader: 'ts', resolveDir: GF };
    });
    b.onLoad({ filter: /populated-places\.ts$/ }, async (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      s = remplacer(s, 'const __filename = url.fileURLToPath(import.meta.url);\nconst __dirname = path.dirname(__filename);',
        "const __dirname = path.join(process.env.TCH_RESSOURCES || require('path').dirname(process.argv[1]), 'x');", 'ressources');
      return { contents: s, loader: 'ts', resolveDir: path.join(MAPS, 'packages/clis/generator/geo-json') };
    });
    b.onLoad({ filter: /libs[\\/]io[\\/]mapped-data\.ts$/ }, async (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      // Données passées en mémoire (pas d'aller-retour JSON sur le disque) : même traitement ensuite
      s = remplacer(s, 'const results: unknown = JSON.parse(source.readUtf8(filename), reviver);',
        'const __mem = (source as any).memoire; const results: unknown = __mem ? __mem(filename) : JSON.parse(source.readUtf8(filename), reviver);', 'lecture mémoire');
      s = remplacer(s, "if (basename.endsWith('nodes')) {\n    for (const t of filtered) {", "if (basename.endsWith('nodes') && !(source as any).memoire) {\n    for (const t of filtered) {", 'nœuds mémoire');
      return { contents: s, loader: 'ts', resolveDir: path.dirname(a.path) };
    });
    b.onLoad({ filter: /libs[\\/]map[\\/]projections\.ts$/ }, async (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      // Royaume-Uni : la borne nord excluait tout le nord de l'Écosse (secteur -15, Aberdeen) ; l'Islande commence au secteur -24
      if (!s.includes('sy >= -14')) throw new Error('motif introuvable : borne Royaume-Uni');
      s = s.replaceAll('sy >= -14', 'sy >= -20');
      return { contents: s, loader: 'ts', resolveDir: path.dirname(a.path) };
    });
    b.onLoad({ filter: /combined-entries\.ts$/ }, async (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      s = remplacer(s, 'return entries.length ? entries.at(-1) : undefined;',
        "const __e = entries.length ? entries.at(-1) : undefined; if (__e && process.env.TCH_TRACE) require('fs').appendFileSync(process.env.TCH_TRACE, JSON.stringify([__e.scsSource, key]) + '\\n'); return __e;", 'trace');
      return { contents: s, loader: 'ts', resolveDir: GF };
    });
  } }],
});
console.log('extraction/extraire.cjs :', fs.statSync(path.join(ici, '../../extraction/extraire.cjs')).size, 'octets');
