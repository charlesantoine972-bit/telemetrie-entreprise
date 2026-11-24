# TCH Map

**TCH Map** est le programme de carte de Truck & Coach Hub. C'est un **logiciel libre sous licence GNU GPL v3 ou ultérieure** (voir `LICENSE`).

Truck & Coach Hub, lui, n'est pas libre : les deux sont des **programmes séparés**. Hub lance TCH Map en arrière-plan, affiche sa page dans un cadre et lui envoie de simples messages JSON (voir `PROTOCOLE.md`). Hub ne contient aucun code de TCH Map, et TCH Map ne contient aucun code de Hub.

## Ce que fait TCH Map
- Sert une carte (MapLibre GL) **sur ce PC uniquement** : adresse `127.0.0.1`, port choisi au hasard, jeton secret dans chaque adresse.
- Convertit les coordonnées du jeu (ETS2, ATS) en vraies longitudes et latitudes (projection de SCS, d'après TruckSim Maps).
- Affiche le camion en direct, la trace parcourue (routes « explorées »), les villes (visitées ou pas encore) et la destination.
- Fond géographique réel (Natural Earth), recalé sur le jeu : l'Islande est déplacée comme dans ETS2, et le Groenland, absent du jeu, est retiré.
- Routes du jeu : chargées depuis `data/<jeu>/routes.geojson` quand elles ont été générées depuis les fichiers du jeu (étape suivante).

## Fichiers
- `server.js` : serveur local + relais des messages de l'hôte vers la page (flux `events`).
- `viewer/` : la page de carte (`index.html`, `carte.js`, `carte.css`, `projection.js`).
- `viewer/vendor/` : MapLibre GL JS 6.19.0 (BSD-3-Clause, voir `LICENSE-maplibre.txt`).
- `viewer/fond/` : terres et frontières, d'après world-atlas (ISC) / Natural Earth (domaine public).

## Crédits
- **TruckSim Maps**, par truckermudgeon : <https://github.com/truckermudgeon/maps> (GPL-3.0-or-later). La projection ETS2 / ATS (`viewer/projection.js`) en est adaptée, y compris la correction de l'Islande (novembre 2026).
- **MapLibre GL JS** (BSD-3-Clause), **world-atlas** (ISC), **Natural Earth** (domaine public).
- Données du jeu : © SCS Software.

## Code source
Ce dossier est le code source complet de TCH Map. Toute version livrée avec Truck & Coach Hub doit correspondre à ce code publié, modifications comprises.
