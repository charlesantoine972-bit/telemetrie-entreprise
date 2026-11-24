# Protocole TCH Map ↔ application hôte

TCH Map et l'application hôte sont deux programmes séparés. Ils ne partagent aucun code et ne se parlent que par les messages ci-dessous : des objets JSON simples, envoyés par le canal du processus (Electron `utilityProcess` : `postMessage` / `process.parentPort`, ou Node : `child.send`).

## TCH Map → hôte
| Message | Quand | Contenu |
|---|---|---|
| `{ type: 'ready', port, token, url }` | le serveur écoute | `url` = adresse à afficher, de la forme `http://127.0.0.1:<port>/<jeton>/` |

## Hôte → TCH Map
Chaque message remplace le précédent du même type, et il est rejoué à chaque nouvel affichage de la page.

| Message | Contenu |
|---|---|
| `{ type: 'config', game?, follow? }` | `game` : `'ets2'` ou `'ats'` ; `follow` : garder le camion au centre |
| `{ type: 'theme', bg?, land?, border?, text?, muted?, accent?, trail? }` | couleurs `#rrggbb` |
| `{ type: 'cities', ets2: [[id, nom, x, z], …], ats: [...] }` | villes du jeu (coordonnées monde, mètres) |
| `{ type: 'trail', game, points: [[x, z, …] \| null, …] }` | trace parcourue ; `null` = coupure |
| `{ type: 'state', game, connected, paused, x, z, heading, speed, destId }` | état du camion ; `heading` de 0 à 1 (fraction de tour) |

## Adresses servies (toutes sous `/<jeton>/`)
- `/<jeton>/` : la page de carte.
- `/<jeton>/events` : flux d'événements (Server-Sent Events) avec les messages ci-dessus.
- `/<jeton>/data/…` : cartes générées depuis le jeu (dossier passé en premier argument à `server.js`).
- `/<jeton>/…` : fichiers de `viewer/`.

Toute adresse sans le bon jeton, toute méthode autre que GET et tout chemin qui sort des dossiers autorisés reçoivent une erreur.
