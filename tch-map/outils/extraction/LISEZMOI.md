# Sources de l'extraction TCH Map

`tch-map/extraction/extraire.cjs` est compilé à partir de :
- ce dossier (`extraire.ts`, `ouvriers.ts`, `tuiles.ts`, `terre.ts`, `fond-jeu.ts`, `patch-secteurs.mjs`, `dir-archive.ts`, `bindings-shim.js`, `build.mjs`) ;
- [truckermudgeon/maps](https://github.com/truckermudgeon/maps) (GPL-3.0-or-later), commit `43f5222` (« update deps (#160) », 24/11/2026) :
  lecteur des fichiers du jeu (`packages/clis/parser`) et conversion en GeoJSON (`packages/clis/generator/geo-json`) ;
- les bibliothèques geojson-vt (ISC), vt-pbf (MIT), topojson-client (ISC), world-atlas (ISC, données Natural Earth du domaine public), polygon-clipping (MIT) et les dépendances de TruckSim Maps (voir leurs licences).

Toutes les modifications du code de TruckSim Maps sont appliquées à la compilation par `build.mjs` (liste en tête du fichier).

## Recompiler
```
git clone https://github.com/truckermudgeon/maps && cd maps && git checkout 43f5222
npm install --ignore-scripts --engine-strict=false
cd <ce dossier> && npm install && MAPS=<chemin du clone> node build.mjs
```

## Ce que fait l'extraction
`node extraire.cjs <dossier du jeu> <dossier de sortie>` (avec `TCH_LANGUE=fr_fr` par exemple) lit les `.scs` du jeu
**en lecture seule**, puis écrit dans le dossier de sortie : `tuiles.bin` + `tuiles.json` (tuiles vectorielles z4 à z10),
`villes.json` (villes officielles), `info.json` (version du jeu, empreinte des fichiers pour savoir quand refaire l'extraction).
Progression sur la sortie standard : lignes `@TCH {"etape": …}`.
