# Tableau de bord — Truck & Coach Hub, préparation de la bêta 5

Branche de travail : `claude/beta-5` (créée depuis `beta`). **Ne jamais pousser sur `beta` ni sur `main`** : chaque push qui touche `package.json` publie une version.
Numéros au départ : technique `0.13.36-beta.10` (package.json), affiché « 0.12.0.5 bêta 4 ». Version officielle sur `main` : `0.13.35` (« 0.12.0.5 »). `beta` contient tout `main` (aucune différence de contenu dans l'autre sens).

Mesures du 27 novembre 2026 (tâche 1) :

- `npm ci` : OK. `npm test` : **77 tests, 77 réussis** (76 avant + le nouveau test « contrat du noyau »).
- `npm audit` : **18 failles (1 critique, 13 hautes, 4 moyennes)**, toutes dans Electron 33 et les outils de construction (electron-builder 25). `npm audit --omit=dev` : 0 (les autres paquets livrés, `electron-updater` et `discord-rpc`, sont propres).
- Taille : `app/index.html` 4 568 lignes, `main.js` 764 lignes (72 points d'entrée), `preload.js` 77 fonctions, `src/` 2 600 lignes.
- **Tâche 4 (découpage)** : `app/index.html` passe à **1 038 lignes** (HTML des pages seulement) ; le reste est rangé dans `app/commun/`, `app/fonctionnalites/<nom>/` et `app/demarrage.js` (voir `app/LISEZ-MOI.md`). ⚠ Les numéros `app/index.html:…` cités dans ce tableau désignent la version **d'avant** le découpage (commit `9aab414`) : chercher le nom de la fonction pour la retrouver.

## Résumé

L'appli est **plutôt bien protégée pour une appli de bureau** : fenêtres isolées (`contextIsolation`, `sandbox`, pas de `nodeIntegration`), navigation bloquée, aucune permission web accordée, chemins de profils vérifiés, aucune commande construite à partir de texte, clé Steam chiffrée par Windows, serveur de carte local protégé par un jeton. Aucun secret dans le dépôt.
Les faiblesses viennent surtout de **ce qui entoure ce code** : un Electron qui n'est plus mis à jour, une mise à jour automatique non signée, et un noyau qui fait confiance à tout ce qui lui parle.

**Mise à jour du 27 novembre 2026 (tâche 3, re-audit)** : S1 est **réglé** : Electron 45.5.0 (dernière version, maintenue jusqu'en avril 2027) corrige les 46 failles d'Electron 33 relevées par `npm audit`, ainsi que plus d'un an de correctifs de Chromium et de Node.js. `npm audit` : 18 failles → 6 moyennes (outils de construction seulement, rien dans l'appli livrée). Les changements de la tâche 2 n'ont affaibli aucune protection. Voir « Re-audit après mise à jour d'Electron ».

**Les 3 points les plus urgents (après la tâche 3) :**

1. ~~**S1 — Electron 33 n'est plus maintenu**~~ → **réglé** par la tâche 2, vérifié par la tâche 3. Il reste donc :
2. **S2 + S3 (+ S18) — le noyau ne vérifie pas qui l'appelle** : les 72 points d'entrée acceptent toute page qui a le pont, y compris la fenêtre du HUD, qui reçoit les 77 fonctions (suppression de profils comprise) alors qu'elle n'en utilise qu'une. La mise à jour d'Electron rend une attaque plus difficile (failles d'isolation corrigées) mais ne règle pas ce point. → **aucune tâche prévue pour l'instant** (la tâche 3 ne modifie pas le code) : à confier à une tâche dédiée.
3. **G5 — l'historique peut disparaître sans prévenir** : si `donnees.json` est abîmé (coupure de courant), l'appli repart de zéro et écrase le fichier 10 s plus tard. Tout l'historique des trajets est perdu. → réparti entre la tâche 4 (`donnees.json`) et la tâche 5 (`reglages.json`).

**À ajouter au même niveau (second passage de la tâche 1)** : **G19 — la bêta va télécharger l'appli officielle** dès que la version officielle 0.13.36 sortira (repli automatique sur `latest.yml`). À corriger dans la tâche 7, avant toute publication de 0.13.36.

## Sécurité

- [x] **S1 — Electron 33 plus maintenu** · Urgent (réglé par la mise à jour d'Electron (tâche 2) : Electron 45.5.0 ; **vérifié par la tâche 3** : les 46 failles d'Electron 33 ont disparu de `npm audit`, voir « Re-audit après mise à jour d'Electron »)
  - Où : `package.json:75` (`"electron": "^33.2.0"`, installé 33.4.11) ; dernière version 45.5.0.
  - Problème : Electron 33 ne reçoit plus de correctifs. `npm audit` liste 49 failles, dont « protocole personnalisé avec `supportFetchAPI` sans `corsEnabled` : lecture d'autres origines » (c’est exactement `tchmap://`, `src/map.js:51`), « une iframe en bac à sable peut contourner `allow-popups` » (iframe `tchFrame`) et « contournement de l'isolation par `Function.prototype.bind` ».
  - Risque concret : une page piégée (contenu distant, mod, carte) pourrait sortir de son bac à sable et atteindre le pont `tel`.
  - Correction : passer à Electron 45 (et electron-builder 26), puis relancer `npm audit` et tous les tests. → tâche 2.

- [ ] **S2 — Aucun contrôle de l'expéditeur des messages** · Urgent
  - Où : `main.js:466-681` (les 72 `ipcMain.handle`).
  - Problème : aucun point d'entrée ne vérifie que l'appel vient bien de la page `app/index.html` de la fenêtre principale (`event.senderFrame`).
  - Risque concret : si du code étranger s'exécute un jour dans une fenêtre de l'appli (faille XSS, iframe, HUD), il peut tout faire : supprimer des profils, réécrire des sauvegardes, créer des clés.
  - Correction : une petite fonction `handle(canal, fn)` qui refuse tout appel dont `senderFrame` n'est pas le cadre principal d'une page `file://…/app/`, utilisée pour les 72 canaux. → tâche 3.

- [ ] **S3 — Le HUD reçoit tout le pont** · Urgent
  - Où : `main.js:449` (`preload: preload.js` pour `hudWin`).
  - Problème : la fenêtre transparente du HUD n'utilise que `onHud`, mais reçoit les 77 fonctions.
  - Risque concret : une faille dans l'affichage du HUD donnerait accès aux sauvegardes et aux fichiers du jeu.
  - Correction : un `preload-hud.js` qui n'expose que `onHud` (à ajouter au contrat). → tâche 3.

- [ ] **S4 — Scripts « en ligne » autorisés et échappement du HTML dispersé** · Important
  - Où : `app/index.html:5` (CSP `script-src 'self' 'unsafe-inline'`), 88 `innerHTML`, 5 fonctions d'échappement différentes (`escMod` l.2435, `esc` l.2895 et l.3934, `escM` l.3382, `escH` l.4133), dont 4 n'échappent pas l'apostrophe `'`. Quelques textes affichés sans échappement (`g.bin`, `g.message` l.4302-4303).
  - Problème : tant que `'unsafe-inline'` est permis, un nom piégé (profil, mod, VTC TruckersMP, ville d'un mod) mal échappé devient du code exécuté avec tout le pont. Aujourd'hui l'échappement est presque partout présent, mais c'est fragile.
  - Risque concret : un profil ou un mod partagé par quelqu'un d'autre pourrait déclencher des actions dans l'appli.
  - Correction : une seule fonction d'échappement (qui traite aussi `'`) dans un fichier commun ; en découpant `index.html` (tâche 4), sortir le script dans des fichiers `.js`, puis retirer `'unsafe-inline'` de `script-src`.
  - Tâche 4 : le script est sorti dans des fichiers (plus aucun `<script>` ni `<style>` en ligne dans `index.html`, un test le vérifie). **`'unsafe-inline'` doit pourtant rester pour l'instant** : `app/fonctionnalites/outils/outils.js` fabrique des boutons avec `onclick="…"` / `oninput="…"` dans son HTML (une dizaine) ; il faut d'abord les remplacer par des écouteurs. Échappement pas encore regroupé (`esc`, `escM` dans `app/commun/utilitaires.js`, `escMod` dans `mods`, `esc` local dans `hud`, `escH` local dans `feuille-de-route`). Case laissée ouverte.

- [ ] **S5 — Iframe de la carte (`tchFrame`) peu protégée** · Important
  - Où : `app/index.html:1660` (`sandbox="allow-scripts allow-same-origin allow-popups"`), CSP `frame-src http://127.0.0.1:*` (l.5).
  - Problème : `allow-scripts` + `allow-same-origin` annule presque tout le bac à sable. Ici ce n'est pas dramatique car la carte vient d'une autre origine (`http://127.0.0.1:<port>`) que l'appli (`file://`) : elle n'atteint pas `window.tel`. Mais `allow-popups` lui permet d'ouvrir des fenêtres (envoyées au navigateur, voir S6), et `frame-src` accepte n'importe quel serveur local, pas seulement celui de la carte.
  - Risque concret : avec la faille Electron 33 sur `allow-popups` (S1), une carte piégée pourrait ouvrir des pages ou des programmes externes.
  - Tâche 3 : la faille d'Electron qui permettait de contourner `allow-popups` (et celle des fenêtres ouvertes qui perdaient le bac à sable) est **réglée par la mise à jour d'Electron (tâche 2)**. Le risque baisse, mais la correction ci-dessous reste à faire (case ouverte).
  - Correction : retirer `allow-popups` (la carte n'en a pas besoin), garder `allow-same-origin` seulement si la carte en a besoin (requêtes vers son serveur), et restreindre `frame-src` au port réel (CSP envoyée par le noyau via `session.webRequest`).

- [ ] **S6 — Liens externes : toute adresse https est ouverte** · Important
  - Où : `main.js:163` (`setWindowOpenHandler`), `main.js:412` (`will-navigate`).
  - Problème : toute adresse `https://` demandée par une page part dans le navigateur, sans liste de sites autorisés.
  - Risque concret : un contenu piégé peut ouvrir une page d'hameçonnage dans le navigateur de l'utilisateur, avec l'air de venir de l'appli.
  - Correction : liste blanche (steampowered.com, steamcommunity.com, github.com, truckersmp.com, truckyapp.com, trucksbook.eu, haulmp.com…), le reste est refusé.

- [ ] **S7 — Mise à jour automatique non signée** · Important
  - Où : `package.json` (`build.win` sans signature), `main.js:687-704`, `.github/workflows/release.yml`.
  - Problème : l'installeur n'est pas signé. `electron-updater` vérifie seulement l'empreinte sha512 écrite dans `latest.yml` / `beta.yml`, qui est sur la même Release GitHub que l'installeur.
  - Risque concret : quiconque obtient l'accès au compte GitHub (ou à un jeton de publication) peut pousser une « mise à jour » piégée, installée en silence chez tous les utilisateurs.
  - Correction : double authentification obligatoire sur GitHub, protection des branches `main` et `beta` ; à terme un certificat de signature (ou Azure Trusted Signing) + `publisherName` pour que l'appli refuse un installeur non signé par toi.

- [ ] **S8 — Publication automatique à chaque push** · Important
  - Où : `.github/workflows/release.yml:6-9` et `:20-22`.
  - Problème : tout push sur `main` ou `beta` qui touche `package.json` publie une version, sans validation humaine ; les actions (`actions/checkout@v4`, `setup-node@v4`) sont désignées par une étiquette modifiable, pas par une empreinte.
  - Risque concret : une fusion trop rapide (ou une action GitHub compromise) publie directement chez tous les utilisateurs.
  - Correction : règles de protection de branche (PR + tests obligatoires), environnement GitHub « publication » avec approbation, actions épinglées par empreinte SHA.

- [x] **S9 — `setSettings` accepte des valeurs non vérifiées** · Important (corrigé par la tâche 5)
  - Où : `main.js:666-681`, `src/settings.js:33-46`.
  - Problème : seuls les seuils, le SteamID et l'ID Discord sont vérifiés. `pseudo` (longueur), `vehicleType`, `atelier`, `showSoon`, `autoTelemetry` (vrai/faux), `modules` et `hud` (n'importe quel contenu) sont enregistrés tels quels dans `reglages.json`. `patch = null` provoque une erreur technique.
  - Risque concret : réglages corrompus qui cassent l'interface au démarrage suivant ; texte libre réaffiché ailleurs (voir S4).
  - Correction : vérifier chaque clé (type, liste de valeurs, longueur) dans `validateSettingsPatch`, avec un test. → tâche 5 (paramètres).
  - Tâche 5 : fait. `validateSettingsPatch` (`src/settings.js`) refuse tout `patch` qui n'est pas un objet, toute clé inconnue, et vérifie chaque clé : `pseudo` (texte, 32 caractères au plus, sans `<`, `>` ni caractère de contrôle, espaces retirés), `vehicleType` (`camion` / `car`), `atelier` / `showSoon` / `autoTelemetry` (vrai ou faux), `units`, `steamId` / `discordClientId` (texte), `look` (objet ; clés inconnues retirées, valeurs déjà filtrées par `sanitizeLook`), `modules` (`{hud: vrai/faux}`), `hud` (profils `truck` / `bus` : position, style, logo, opacité 20–100, taille 50–200, cases ; clés inconnues retirées). `main.js` n'enregistre que la copie vérifiée. Test « réglages : chaque clé… (S9) ». ⚠ Un ancien pseudo de plus de 32 caractères ou avec `<` / `>` reste affiché, mais il faudra le raccourcir pour enregistrer à nouveau la page Conduite (message clair).

- [ ] **S10 — Éditeur de sauvegarde : nombres non vérifiés** · Important
  - Où : `src/save-editor.js:319-339`, `src/atelier.js:28-31`.
  - Problème : `money`, `xp`, `busXp`, kilomètres, masses ne sont pas contrôlés : une valeur texte devient `NaN` et est écrite telle quelle dans `game.sii`.
  - Risque concret : sauvegarde illisible par le jeu (heureusement une copie « Avant modification » est faite juste avant).
  - Correction : refuser tout ce qui n'est pas un nombre fini dans des bornes raisonnables, avant d'écrire ; ajouter un test.

- [ ] **S11 — Paramètre « jeu » non vérifié dans 4 fonctions de l'Atelier** · Plus tard
  - Où : `src/atelier.js:258-295` (`consoleState`, `setConsole`, `convoyState`, `setConvoy`).
  - Problème : un jeu inconnu provoque une erreur technique en anglais (« Cannot read properties of undefined »). Aucun chemin dangereux n'est construit, c'est seulement peu clair.
  - Risque concret : message incompréhensible pour l'utilisateur.
  - Correction : `if (!GAMES[game]) throw new Error('Jeu inconnu.')` au début de ces fonctions.

- [ ] **S12 — Télémétrie locale sans authentification** · Plus tard
  - Où : `src/telemetry.js:125-136` (UDP `127.0.0.1:47311`).
  - Problème : n'importe quel programme du PC peut envoyer de fausses données de télémétrie.
  - Risque concret : faible (statistiques faussées) tant que la télémétrie ne sert pas à des classements en ligne. À revoir avant tout classement ou récompense.
  - Correction : le jour des classements en ligne, ne jamais faire confiance aux données envoyées par le PC ; vérifications côté serveur.

- [ ] **S13 — Données personnelles stockées en clair** · Plus tard
  - Où : `userData/donnees.json` (trajets avec positions), `reglages.json` (SteamID, pseudo, dossiers), `acces-apercu.json` (rangs, clés). La clé Steam, elle, est bien chiffrée (`safeStorage`, `main.js:98-114`).
  - Problème : normal pour des données de jeu, mais rien ne l'explique à l'utilisateur ; la bêta copie `donnees.json` et `reglages.json` de la version officielle.
  - Risque concret : faible ; à documenter (page « Confidentialité ») avant les comptes en ligne.
  - Correction : une courte note de confidentialité ; chiffrer avec `safeStorage` tout futur jeton de connexion.

- [ ] **S14 — Comptes, rangs et clés : aujourd'hui aucune protection, et ce qu'il faudra pour le vrai** · Important (avant toute mise en ligne)
  - Où : `src/acces/fournisseur.js` (aperçu local), `main.js:502-517`.
  - Problème : l'aperçu local est un brouillon assumé : `acces.previewAs` donne le rang Fondateur à n'importe qui, `acces-apercu.json` se modifie à la main, les clés sont générées et vérifiées sur le PC.
  - Risque concret : si ce code servait un jour à protéger quelque chose (bêta réservée, outils payants), n'importe qui le contournerait en une minute.
  - Correction (à prévoir pour le serveur) : connexion par Steam (OpenID) sur le serveur ; le serveur seul décide des rangs, des permissions et de la validité des clés ; clés stockées hachées côté serveur, limite de tentatives sur `redeem` ; jetons de session courts, renouvelables et révocables, stockés sur le PC avec `safeStorage` (jamais dans `reglages.json` ni dans `localStorage`) ; HTTPS uniquement ; `previewAs` et `reset` supprimés du mode serveur ; chaque action vérifiée côté serveur même si l'interface cache le bouton.

- [ ] **S15 — Failles dans les outils de construction** · Plus tard
  - Où : `package.json` (`electron-builder ^25.1.8`), `package-lock.json`.
  - Problème : `npm audit` signale `tar` (critique), `node-gyp`, `cacache`, `@electron/rebuild`… Ces paquets servent seulement à fabriquer l'installeur, ils ne sont pas livrés.
  - Risque concret : faible pour les utilisateurs ; existe sur la machine de construction (GitHub Actions).
  - Correction : electron-builder 26 avec Electron 45. → tâche 2.
  - Tâche 2 : fait (electron-builder 26.18.0). `npm audit` passe de 18 failles (1 critique, 13 hautes) à **6 moyennes**, toutes dues à `minimatch` (7.0.0 à 11.0.0) dans la chaîne d'outils d'electron-builder 26 (`app-builder-lib`, `dmg-builder`, `@electron/universal`…). `npm audit fix --force` ne propose qu'un retour en arrière d'electron-builder : à laisser jusqu'à une prochaine version d'electron-builder. Case laissée ouverte pour ces 6 failles moyennes.
  - Tâche 3 : confirmé le 27 novembre 2026 (même résultat : 6 moyennes, une seule cause, `minimatch`, « déni de service » GHSA-g3hv-75wg-m249 ; `npm audit --omit=dev` : 0). Risque faible : ces outils ne tournent que pendant la construction de l'installeur.

- [x] **S16 — Protections internes d'Electron (« fuses ») non réglées** · Plus tard (corrigé par la tâche 2 : `build.electronFuses` dans `package.json`, repris par la config bêta ; vérifié par la tâche 3)
  - Où : configuration electron-builder (`package.json`, `electron-builder-beta.js`).
  - Problème : les options `RunAsNode`, vérification d'intégrité de l'archive `app.asar`, etc. sont aux valeurs par défaut.
  - Risque concret : un programme déjà présent sur le PC peut plus facilement détourner l'appli.
  - Correction : régler `electronFuses` dans electron-builder 26 (désactiver `RunAsNode`, activer l'intégrité asar). → tâche 2 ou 3.
  - Tâche 2 : `RunAsNode`, `NODE_OPTIONS` et `--inspect` désactivés ; vérification d'intégrité de `app.asar` et chargement uniquement depuis `app.asar` activés (contrôlé sur l'exécutable Windows produit). **Volontairement laissés** : chiffrement des cookies (réglage sans retour possible) et privilèges supplémentaires de `file://` (l'appli charge `app/index.html` en `file://` ; à couper seulement le jour où l'interface passera par un protocole maison).

*Points S17 à S21 : ajoutés par un second passage de la tâche 1 (même jour), qui ne les trouvait pas plus haut.*

- [ ] **S17 — Un `$` dans un nom de profil ou d'entreprise est mal écrit dans la sauvegarde** · Important
  - Où : `src/save-editor.js:148` (`SaveEditor.set`) et `src/save-tools.js:30` (`set`).
  - Problème : la valeur est collée dans le texte de remplacement de `replace()`, où `$&`, `$1`… ont un sens spécial. Testé : le nom `Jo$&co` devient `Jo profile_name: "Old"co`.
  - Risque concret : nom de profil ou d'entreprise abîmé dans `profile.sii` (une copie de secours existe).
  - Correction : remplacer avec une fonction (`(_, debut) => debut + valeur`) au lieu d'un texte. À corriger avec S10.

- [ ] **S18 — La navigation accepte n'importe quel fichier `file://` du PC** · Important
  - Où : `main.js:412-413` (`lockDown` ne bloque que ce qui ne commence pas par `file://`).
  - Problème : contrairement à ce que laissent penser les « points solides » ci-dessous, une page `file:///…` prise n'importe où sur le disque (un `.html` téléchargé) est acceptée dans la fenêtre, et reçoit alors le pont `tel` (le preload s'y charge).
  - Risque concret : un lien piégé (après une faille S4) vers un fichier HTML du disque prendrait le contrôle de l'appli.
  - Correction : n'accepter que le chemin exact de `app/index.html` (et `app/hud.html` pour le HUD). → tâche 3, avec S2.

- [ ] **S19 — Le plugin du jeu est un binaire que la CI ne reconstruit pas** · Important
  - Où : `resources/plugin/telemetrie_entreprise.dll` (sources dans `plugin/`, script `build-plugin`), `.github/workflows/release.yml`.
  - Problème : la DLL chargée **dans le jeu** est déposée telle quelle dans le dépôt ; contrairement à `decrypt_truck.exe`, la CI ne la refabrique pas depuis les sources.
  - Risque concret : impossible de prouver que la DLL livrée correspond au code ; une DLL remplacée par erreur ou malveillance partirait chez tous les joueurs, dans le processus du jeu.
  - Correction : construire la DLL dans le workflow, ou au minimum noter son empreinte SHA-256 dans un test.

- [ ] **S20 — `integrations.json` abîmé = clé Steam impossible à effacer** · Plus tard
  - Où : `main.js:98-122` et `:523`.
  - Problème : le fichier est lu sans protection ; s'il est abîmé, `integrationStatus`, `steamProfile` et `clearSteamApiKey` échouent à chaque fois.
  - Risque concret : bloqué dans Steam & Discord, sans moyen de remettre la clé depuis l'appli.
  - Correction : lecture protégée ; fichier illisible = pas de clé, et on peut la ressaisir.

- [ ] **S21 — Publication sans `npm test`** · Important
  - Où : `.github/workflows/release.yml:25-35` (`npm ci` puis directement `npm run release`).
  - Problème : complète S8 : même avec une PR, le workflow de publication ne relance pas les tests.
  - Risque concret : une version qui casse les tests part quand même chez les joueurs.
  - Correction : ajouter `- run: npm test` juste après `npm ci` (modification à faire sur `claude/beta-5`, jamais en poussant sur `beta`/`main`).

*Point S22 : ajouté par la tâche 3 (re-audit après la mise à jour d'Electron).*

- [ ] **S22 — Clé Steam : le rechiffrement automatique peut la faire « revenir » ou abîmer `integrations.json`** · Plus tard
  - Où : `main.js:121` (`readSteamApiKey` rappelle `writeSteamApiKey` quand Electron demande un rechiffrement ou après relecture d'une ancienne clé) et `main.js:124-133` (`writeSteamApiKey`) ; nouveau depuis la tâche 2.
  - Problème : avant, la clé n'était écrite que quand Charles la saisissait. Maintenant, une simple lecture du profil Steam peut aussi réécrire le fichier, en arrière-plan. Si on clique « Effacer la clé » pendant ce court instant, la clé est réécrite juste après (elle revient). L'écriture n'est pas atomique (voir G12) et une erreur est ignorée en silence.
  - Risque concret : faible (la fenêtre de temps est très courte et le rechiffrement n'arrive en principe qu'une fois, au premier lancement de la bêta 5). Mais une clé effacée qui réapparaît est un mauvais signal pour l'utilisateur ; et une coupure pendant l'écriture rend `integrations.json` illisible (blocage décrit en S20).
  - Correction : écriture `.tmp` puis renommage ; ne rechiffrer que si le fichier contient toujours la même clé chiffrée qu'au moment de la lecture. À faire avec S20.

**Points solides (à conserver)** : `contextIsolation`, `sandbox`, `nodeIntegration: false` sur les deux fenêtres (`main.js:155`, `:449`) ; `will-navigate`, `will-redirect`, `will-attach-webview` bloqués (`main.js:411-415`) ; toutes les permissions web refusées (`main.js:714-715`) ; id de profil limité à un dossier hexadécimal, noms de sauvegarde limités (`src/atelier.js:139-144`) ; programmes lancés avec `execFile` et une liste d'arguments (jamais de ligne de commande construite) ; `openLink` par clé, pas par adresse ; serveur de carte sur 127.0.0.1, jeton aléatoire de 48 caractères, chemins vérifiés, CSP stricte (`tch-map/server.js`) ; outil `decrypt_truck` compilé dans la CI depuis un commit précis ; sauvegardes déchiffrées en fichiers temporaires effacés ; aucune clé ni mot de passe dans le dépôt.

## Audit général

- [x] **G1 — `app/index.html` monolithique** · Important (découpé par la tâche 4 : 4 568 → 1 038 lignes ; voir « Découpage de l'interface (tâche 4) » pour ce qui reste)
  - Où : `app/index.html` (4 568 lignes : ~800 de CSS, ~950 de HTML, un seul `<script>` de ~2 800 lignes de 1765 à 4560).
  - Problème : tout est dans un fichier ; chaque modification risque de casser une autre page ; impossible de retirer `'unsafe-inline'` (S4).
  - Risque concret : bugs croisés entre pages, conflits de fusion entre tâches.
  - Correction (sans réécriture, page par page) : 1) sortir le CSS dans `app/styles/*.css` ; 2) sortir les fonctions communes (`$`, `setText`, `store`, échappement…) dans `app/commun.js` ; 3) pour chaque page (Accueil, Carte, News, Atelier, Mods, Accès, Paramètres, HUD, Marketplace…), couper le bloc de script tel quel dans `app/pages/<page>.js`, chargé par `<script src>` dans le même ordre (scripts classiques qui partagent les variables globales : rien à réécrire) ; 4) adapter les tests qui découpent `index.html` par nom de fonction (`tools/verify.test.js`) pour lire les nouveaux fichiers. Le HTML peut rester dans `index.html` au début. → tâche 4.

- [ ] **G2 — Noms globaux en double** · Important
  - Où : `esc` défini deux fois (`app/index.html:2895` dans une fonction, `:3934` au niveau global) ; 5 fonctions d'échappement ; `openMap` remplacée après coup (`:2345`) ; nombreuses variables `let` globales.
  - Problème : une fois découpés en plusieurs fichiers, deux `const` ou `let` du même nom au niveau global font planter tout le chargement (« already been declared »).
  - Risque concret : écran blanc après le découpage.
  - Correction : avant de découper, lister les noms globaux (un petit script), renommer les doublons, regrouper l'échappement dans `commun.js`. → tâche 4.
  - Tâche 4 : inventaire fait (300 noms globaux) : **aucun doublon au niveau global** (le second `esc` est local à une fonction du HUD, `openMap` / `openOptCat` / `setRail` / `syncMapEngine` sont volontairement « enveloppées » et ces enveloppes sont restées dans l'ordre dans `app/demarrage.js`). Le découpage n'a donc rien renommé. Reste : regrouper l'échappement (S4). Case laissée ouverte pour ce dernier point.

- [ ] **G3 — `main.js` regroupe tout le noyau** · Important
  - Où : `main.js` (72 points d'entrée + carte + mods + HUD + mises à jour, 764 lignes).
  - Problème : difficile à relire, impossible à tester sans lancer Electron.
  - Risque concret : bugs non détectés dans les fonctions qui modifient les fichiers.
  - Correction : un fichier par domaine dans `src/ipc/` (`reglages.js`, `atelier.js`, `acces.js`, `carte.js`, `mises-a-jour.js`, `integrations.js`), chacun avec `register(ipc, contexte)` ; mêmes noms de canaux (le contrat ne change pas). → tâche 4.

- [ ] **G4 — Pas de filet d'erreurs dans le processus principal** · Important
  - Où : `main.js` (aucun `process.on('uncaughtException' | 'unhandledRejection')`, aucun `render-process-gone`) ; `main.js:305` écrit `courant.txt` sans `try` dans un gestionnaire d'événement.
  - Problème : une erreur imprévue affiche une boîte d'erreur Windows ou arrête l'appli ; si l'interface plante, la fenêtre reste blanche.
  - Risque concret : appli fermée en pleine partie, sans trace pour comprendre.
  - Correction : journal d'erreurs dans `userData/journal.txt`, rechargement de la fenêtre si l'interface plante, `try` autour des écritures dans les gestionnaires.

- [ ] **G5 — Historique perdu si le fichier est abîmé** · Urgent
  - Où : `src/telemetry.js:106-113` (`load()` renvoie un historique vide en cas d'erreur), sauvegarde toutes les 10 s (`:137`) ; même logique pour `reglages.json` (`main.js:76-83`).
  - Problème : un `donnees.json` illisible (coupure de courant, disque plein) est remplacé par un historique vide au prochain enregistrement.
  - Risque concret : l'utilisateur perd tous ses trajets et statistiques, sans avertissement.
  - Correction : si le fichier est illisible, le renommer en `donnees.corrompu-<date>.json` avant de continuer, garder une copie `.bak` de la veille, et prévenir l'utilisateur.
  - Répartition : **tâche 4** pour `donnees.json` (`src/telemetry.js`, historique des trajets) ; **tâche 5** pour `reglages.json` (`main.js:76-94`, chargement et écriture des réglages). Chaque tâche coche sa partie ; la case se coche quand les deux sont faites.
  - [x] Partie réglages (faite par la tâche 5) : `lireReglages` (`src/settings.js`) ne réécrit jamais un `reglages.json` illisible : il est renommé en `reglages.corrompu-<date>.json`, puis l'appli reprend la copie de secours `reglages.bak.json` (refaite au plus une fois par jour, à partir d'un fichier lisible) ou, à défaut, les réglages par défaut ; une fenêtre « Réglages récupérés » prévient l'utilisateur au démarrage. Testé sur un dossier temporaire.
  - [ ] Partie historique (`donnees.json`) : **pas faite** (la tâche 4 ne devait rien changer au comportement) ; reste à confier. Case principale laissée ouverte.

- [ ] **G6 — Commandes qui bloquent l'appli** · Important
  - Où : `src/plugin-installer.js:20` (`execFileSync('reg')`, appelé par `findGames` à chaque statut de carte, scan, lancement), `src/atelier.js:108` (`execFileSync('tasklist')`, 2 fois par `atelier.status`), `src/save-editor.js:40` (déchiffrement synchrone, une fois par sauvegarde dans `atelier.slots`).
  - Problème : pendant ces commandes, le processus principal est bloqué : l'interface et le HUD se figent.
  - Risque concret : saccades, appli « qui ne répond pas » sur un PC lent ou avec beaucoup de sauvegardes.
  - Correction : garder le chemin de Steam en mémoire, utiliser les versions asynchrones (`execFile`, `readAsync`).

- [ ] **G7 — Abonnements sans désabonnement** · Plus tard
  - Où : `preload.js:13, 42, 50` (`onSettingsChanged`, `onSystemAccent`, `onHud`).
  - Problème : chaque appel ajoute un écouteur qu'on ne peut plus retirer (aujourd'hui chacun n'est appelé qu'une fois, donc pas de fuite réelle).
  - Risque concret : fuite de mémoire si une page découpée (G1) s'abonne à chaque affichage.
  - Correction : renvoyer une fonction de désabonnement, comme `mods.onProgression` (et le noter dans le contrat).

- [ ] **G8 — Processus enfants de la carte : deux détails** · Plus tard
  - Où : `main.js:282-298` (tampon `buf` sans limite si le programme écrit sans retour à la ligne), `main.js:195` / `:300`.
  - Problème : les processus sont bien arrêtés à la fermeture (`before-quit`) et après 3 min sans progrès ; seuls restent ces petits cas.
  - Risque concret : faible (mémoire qui grossit si l'extraction écrit un très long texte).
  - Correction : limiter la taille du tampon ; `try` autour de l'écriture de `courant.txt` (voir G4).

- [ ] **G9 — Bêta et officielle ouvertes en même temps** · Important
  - Où : `src/telemetry.js:125` (même port UDP 47311 pour les deux, `reuseAddr`), `src/plugin-installer.js:7` (même nom de DLL), `main.js:28-47`.
  - Problème : les deux applis installent leur DLL sous le même nom dans le jeu (chacune remplace celle de l'autre à son démarrage) et écoutent le même port : sous Windows, un seul des deux reçoit probablement la télémétrie. Elles modifient aussi les mêmes profils et le même `config.cfg`. Les données de l'appli, elles, sont bien séparées (la bêta copie `donnees.json` et `reglages.json` une seule fois, au premier lancement). **À vérifier sur un PC.**
  - Risque concret : télémétrie qui « disparaît » dans une des deux applis ; plugin d'une version plus ancienne dans le jeu.
  - Correction : prévenir dans l'appli si l'autre version tourne déjà, ou donner à la bêta son propre port et son propre nom de DLL.

- [ ] **G10 — Double numérotation fragile** · Important
  - Où : `app/data/notes-version.js:17-30` (`versionAffichee`, cas particuliers écrits à la main pour `0.13.35` et `0.13.36`), `tools/release-titles.js`.
  - Problème : la mise à jour automatique compare le numéro technique (correct tant qu'il augmente toujours : `0.13.36-beta.11` > `beta.10`), mais le numéro affiché est calculé par une règle pleine d'exceptions. Prochaine bêta : `0.13.36-beta.11` → « 0.12.0.5 bêta 5 » (OK). La bêta ne voit jamais les versions officielles (canal `beta` séparé, voulu).
  - Risque concret : un numéro affiché faux ou qui recule, et des titres de Releases incohérents.
  - Correction : ajouter au test « notes de version » les prochains numéros attendus (`0.13.36-beta.11` → « 0.12.0.5 bêta 5 », `0.13.36` → « 0.12.0.6 ») avant de changer le numéro ; à terme, une table explicite numéro technique → numéro affiché. → tâche 7.

- [ ] **G11 — La bêta se reconnaît à son numéro** · Important
  - Où : `main.js:27` (`IS_BETA = /-beta/.test(version)`).
  - Problème : si une bêta est un jour publiée avec un numéro sans `-beta`, elle utilise le dossier de données et le canal de mise à jour de la version officielle.
  - Risque concret : la bêta écrase les données de la version officielle ou se met à jour vers elle.
  - Correction : faire écrire un indicateur par `electron-builder-beta.js` (`extraMetadata`) et le tester ; garder le test du numéro en secours. → tâche 7.

- [ ] **G12 — Écritures de fichiers du jeu non atomiques** · Important
  - Où : `src/save-editor.js:389-391`, `src/atelier.js:263-295` (`config.cfg`), `main.js:91-94` (`reglages.json`).
  - Problème : le fichier est réécrit directement ; une coupure au mauvais moment le laisse à moitié écrit. (`donnees.json` et `acces-apercu.json` utilisent déjà la bonne méthode : fichier `.tmp` puis renommage.)
  - Risque concret : sauvegarde ou réglages abîmés (une copie existe pour les sauvegardes).
  - Correction : écrire dans `.tmp` puis renommer, partout. Répartition : **tâche 4** pour les fichiers du jeu (`save-editor.js`, `atelier.js`) ; **tâche 5** pour `reglages.json`.
  - [x] Partie réglages (faite par la tâche 5) : `saveSettings` passe par `ecrireReglages` (`.tmp` puis renommage), testé.
  - [ ] Partie fichiers du jeu : **pas faite** (tâche 4 sans changement de comportement) ; reste à confier. Case principale laissée ouverte.

- [ ] **G13 — Tests manquants** · Important
  - Où : `tools/verify.test.js`, `tests/`.
  - Problème : rien ne teste la sauvegarde / restauration / suppression de profils (`src/atelier.js`), ni les points d'entrée de `main.js`, ni `setSettings` en entier, ni l'interface au-delà de la syntaxe.
  - Risque concret : un bug qui supprime un profil passerait les tests.
  - Correction : tests de l'Atelier sur un faux dossier « Documents » temporaire ; tests des points d'entrée une fois `main.js` découpé (G3).

- [ ] **G14 — Performances** · Plus tard
  - Où : `app/index.html:4474` (`snapshot` toutes les 250 ms, avec 50 missions à chaque fois), `:4416` (état des mises à jour toutes les 1,5 s), `src/map.js:101-114` (taille du cache calculée en parcourant tout le dossier).
  - Problème : beaucoup de données recopiées en boucle pour rien.
  - Risque concret : appli plus gourmande pendant le jeu.
  - Correction : séparer l'historique (envoyé seulement quand il change) du direct ; envoyer l'état des mises à jour par événement.

- [ ] **G15 — Dépendances** · Plus tard
  - Où : `package.json`.
  - Problème : Electron 33 (→ 45), electron-builder 25 (→ 26), `discord-rpc` 4.0.1 n'est plus maintenu depuis 2020.
  - Risque concret : voir S1, S15 ; `discord-rpc` pourrait cesser de marcher avec Discord.
  - Correction : mises à jour à la tâche 2 ; surveiller une alternative à `discord-rpc`.
  - Tâche 2 : Electron 45.5.0, electron-builder 26.18.0 et electron-updater 6.8.11 faits. Reste `discord-rpc` (case laissée ouverte).

- [ ] **G16 — `openLink('mods')` ouvre toujours ETS2** · Plus tard
  - Où : `main.js:659-662`.
  - Problème : le dossier des mods est celui d'Euro Truck Simulator 2, même quand on joue à ATS.
  - Risque concret : confusion pour les joueurs d'ATS.
  - Correction : recevoir le jeu, ou utiliser `mods.ouvrir({game})` qui le gère déjà.

- [ ] **G17 — Licences** · Important
  - Où : `tch-map/` et `tch-mods/` (GPL-3), racine du dépôt (pas de `LICENSE`, pas de champ `license` dans `package.json`), `THIRD_PARTY_NOTICES.txt`.
  - Problème : la carte et l'analyse des mods sont sous GPL-3 et livrées dans le même installeur. La séparation en programmes indépendants qui échangent des messages est la bonne approche (« agrégat »), à condition de : fournir leur code source complet (dépôt public ou lien dans l'appli), livrer leurs fichiers `LICENSE` (déjà le cas via `files`), ne jamais importer leur code dans l'appli (le test « TCH Map séparée » le vérifie). L'appli elle-même n'a pas de licence déclarée.
  - Risque concret : non-respect de la GPL si le dépôt devient privé ; flou juridique sur l'appli.
  - Correction : choisir et déclarer la licence de l'appli ; vérifier que `THIRD_PARTY_NOTICES.txt` cite MapLibre, world-atlas / Natural Earth, villes (MIT), discord-rpc ; lien « code source de TCH Map » dans À propos (déjà présent dans les Paramètres).

- [ ] **G18 — Deux copies de profil dans la même seconde** · Plus tard
  - Où : `src/atelier.js:156-165` (nom de copie à la seconde près).
  - Problème : deux copies dans la même seconde vont dans le même dossier et se mélangent.
  - Risque concret : rare (ex. copie manuelle puis modification immédiate).
  - Correction : ajouter un suffixe si le dossier existe déjà.

*Points G19 à G21 : ajoutés par un second passage de la tâche 1 (même jour).*

- [ ] **G19 — Mise à jour : la bêta va télécharger l'appli officielle** · Urgent
  - Où : `main.js:691` (`allowPrerelease = true`, `channel = 'beta'`) ; comportement d'electron-updater 6 (`node_modules/electron-updater/out/providers/GitHubProvider.js`, repli sur `latest.yml`).
  - Problème : la bêta prend la Release **la plus récente** de GitHub, officielle comprise. Si elle n'a pas de `beta.yml`, electron-updater se rabat sur `latest.yml`. Aujourd'hui l'officielle `0.13.35` est plus basse que `0.13.36-beta.10`, donc rien ne se passe. Mais la prochaine officielle, `0.13.36` (« 0.12.0.6 »), sera **plus haute** que toutes les `0.13.36-beta.*`.
  - Risque concret : dès la sortie de 0.13.36, chaque testeur reçoit « mise à jour disponible » et installe l'appli **officielle** (autre identifiant) à côté ; la bêta reste en 0.13.36-beta.x et redemande la mise à jour sans fin.
  - Correction : dans `update-available`, la bêta ignore toute version sans `-beta` (et l'officielle toute version avec) ; ou passer la bêta à `0.13.37-beta.*` avant de publier `0.13.36`. Ajouter un test. → tâche 7, **avant toute publication de 0.13.36**.

- [ ] **G20 — Analyse des mods : pas de délai maximum, pas arrêtée à la fermeture** · Plus tard
  - Où : `main.js:343-404` (`modsAnalyse`) et `main.js:757-762` (`before-quit` arrête la carte mais pas l'analyse).
  - Problème : si `tch-mods/analyse.js` se bloque, l'appel `mods.analyser` ne répond jamais et toute nouvelle analyse est refusée (« déjà en cours ») jusqu'au redémarrage.
  - Risque concret : bouton d'analyse inutilisable ; processus qui reste en mémoire.
  - Correction : délai maximum (ex. 5 min) puis arrêt ; `modsAnalyse.proc.kill()` dans `before-quit`.

- [ ] **G21 — `acces.info()` ne suit pas l'enveloppe `{ ok, value }`** · Plus tard
  - Où : `main.js:506` (le commentaire de `preload.js:21` annonce `{ ok, value }` pour toutes les fonctions `acces`).
  - Problème : incohérence du contrat.
  - Risque concret : faible (erreur d'interface plus tard, ou dans la version Diamond).
  - Correction : aligner, et mettre à jour `CONTRAT-NOYAU.md`.

- [ ] **G22 — Analyse des mods : le processus ne se ferme pas après son rapport (vu sous Linux)** · Important (à vérifier sous Windows)
  - Où : `main.js:362-424` (`modsAnalyse.lancer` attend l'événement `exit` pour répondre), `tch-mods/analyse.js:197-205`.
  - Problème : trouvé par la tâche 2 en testant l'appli. Sous Linux, `analyse.js` lancé par `utilityProcess.fork` écrit bien son rapport (`@TCH {"etape":"fini",…}`, en 10 ms) mais le processus reste ouvert ; comme l'appli ne répond qu'à sa fermeture, `mods.analyser` ne répond jamais. **Même comportement en Electron 33** (ce n'est pas causé par la mise à jour). Lancé avec Node seul, il se ferme normalement.
  - Risque concret : si c'est pareil sous Windows, le bouton d'analyse des mods tourne sans fin, et toute nouvelle analyse est refusée (« déjà en cours ») jusqu'au redémarrage.
  - Correction : répondre dès la réception de l'étape `fini` (ou `erreur`) puis arrêter le processus (`p.kill()`) ; ou terminer `analyse.js` par `process.exit()`. À faire avec G20.

## Mise à jour d'Electron (tâche 2, 27 novembre 2026)

**Versions**

| | Avant | Après |
|---|---|---|
| Electron | 33.4.11 (`^33.2.0`, plus maintenu) | **45.5.0** (`^45.5.0`) |
| electron-builder | 25.1.8 | **26.18.0** |
| electron-updater | 6.3.9 (`^6.3.9`) | **6.8.11** (reste dans `dependencies`, donc livré dans l'appli) |

Vérifié sur electronjs.org le 27 novembre 2026 : versions maintenues **43, 44 et 45** ; 45.5.0 est la dernière stable (Chromium 156, Node 24.22.3). La 46 n'existe qu'en alpha (`46.0.0-alpha.14`). La série 43 s'arrête en janvier 2027 : prévoir de passer en 46 ou 47 dans l'année qui vient (rythme Electron : une version majeure toutes les 8 semaines, 3 maintenues).

**Changements de code**

- `main.js` (clé Steam) : `safeStorage` passe aux fonctions **asynchrones** (`isAsyncEncryptionAvailable`, `encryptStringAsync`, `decryptStringAsync`), car les synchrones sont dépréciées en 45 et **supprimées en 46**. Secours : une clé enregistrée par une version précédente qui ne se relirait pas avec la nouvelle méthode est relue avec l'ancienne (tant qu'Electron 45 la fournit), puis rechiffrée aussitôt. Même chose si Electron demande un rechiffrement (`shouldReEncrypt`). Les points d'entrée `steam:key:set` et `steam:profile` attendent ces fonctions (ce sont déjà des promesses pour l'interface : rien ne change pour elle).
- `package.json` : versions ci-dessus ; « fuses » réglés (voir S16) ; script `start` = `install-electron && electron .`. **Depuis Electron 42, `npm ci` ne télécharge plus le programme Electron** : `npm start` le télécharge maintenant la première fois. La construction (electron-builder) télécharge son propre Electron, rien à changer dans `release.yml`.
- `CONTRAT-NOYAU.md` : numéros de ligne de `main.js` mis à jour (+19 après la ligne 117). **Attention** : les numéros `main.js:…` de ce tableau de bord, écrits par la tâche 1, n'ont pas été recalculés : ajouter 19 à ceux au-delà de la ligne 117.

**Changements d'Electron 34 à 45 relus, sans adaptation nécessaire**

- Preloads en bac à sable (45) : `preload.js` n'utilise que `contextBridge` et `ipcRenderer` (pas de `Buffer`, `events`, `timers`, `url`) : compatible.
- Archives asar (45, descripteurs de fichiers réservés à `fs`) : la carte et l'analyse des mods ne lisent les fichiers qu'avec les fonctions normales de `fs` ; `tuiles.bin` est dans le dossier de données, pas dans l'archive ; l'extraction est hors archive (`asarUnpack`). Testé : le serveur de la carte, lancé depuis `app.asar` d'une version empaquetée, répond.
- `window.open` (39, 45) : tout est refusé par `setWindowOpenHandler`, inchangé. Permissions (`display-capture`, 45) : tout est déjà refusé.
- Presse-papiers (40, 44) : l'interface utilise `navigator.clipboard`, pas le module `clipboard`.
- Windows 32 bits plus fourni depuis la 44 : l'appli est construite en x64 seulement.
- Réglages de sécurité inchangés : `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` sur les deux fenêtres.

**Vérifications faites (Linux)**

- `npm test` : 77 réussis avant, **77 réussis après**.
- Appli lancée depuis les sources (xvfb) : aucune erreur JavaScript ; seul avertissement, celui de l'iframe de la carte (déjà noté en S5).
- Version empaquetée (fuses actifs, code lu dans `app.asar`) : démarre, la carte démarre et répond, aucune erreur dans la page.
- Chiffrement asynchrone : aller-retour réussi (sous Linux, l'ancien mode synchrone n'était même pas disponible, donc la relecture d'une ancienne clé n'a pas pu être testée ici).
- Construction bêta `electron-builder --config electron-builder-beta.js --win nsis --x64 --publish never` : l'appli Windows est bien empaquetée (`win-unpacked`, `app-update.yml` sur le canal `beta` en pré-version, fuses appliqués), mais l'installeur NSIS n'a pas pu être fabriqué ici (il demande Wine sous Linux, et Wine plante dans ce conteneur). Sous Windows (GitHub Actions ou chez Charles), cette étape n'a pas besoin de Wine.
- `npm audit` : 6 failles moyennes (outils de construction, voir S15) ; `npm audit --omit=dev` : 0.

**À tester par Charles sous Windows** (avant de publier la bêta 5)

1. Construire sans publier : `npm ci`, puis `npx electron-builder --config electron-builder-beta.js --win nsis --x64 --publish never` → un fichier `dist/Truck-and-Coach-Hub-Beta-Setup-….exe` doit apparaître. Installer et lancer.
2. **Clé Steam** (le seul vrai changement de code) : dans Paramètres → Steam & Discord, avec une clé déjà enregistrée par la bêta 4, vérifier que le profil Steam s'affiche toujours (relecture de l'ancienne clé). Puis effacer la clé, la ressaisir, et revérifier.
3. Carte : ouverture, extraction de la carte d'un jeu, affichage des tuiles.
4. Mods : lancer l'analyse et vérifier qu'elle se termine (voir G22).
5. HUD par-dessus le jeu, télémétrie, Atelier (liste des sauvegardes, résumé), choix d'un dossier de jeu (la fenêtre de choix de dossier peut s'ouvrir sur un autre dossier par défaut qu'avant : Electron 43 a changé ce point).
6. Mise à jour automatique : vérifier que la recherche de mise à jour ne donne pas d'erreur (electron-updater 6.8).
7. Antivirus / SmartScreen : l'exécutable est toujours non signé (S7), rien de nouveau, mais signaler si Windows Defender réagit différemment.

## Re-audit après mise à jour d'Electron (tâche 3, 27 novembre 2026)

Comparaison entre `beta` (avant) et `claude/beta-5` (après la tâche 2). Aucun code de l'appli modifié par cette tâche. Mesures refaites : `npm ci` OK, `npm test` **77 / 77 réussis**, `npm audit` relancé, et `npm audit` rejoué sur le `package-lock.json` de `beta` pour avoir la liste exacte des failles d'avant.

**Verdict : la mise à jour d'Electron est bonne pour la sécurité : elle supprime toutes les failles connues d'Electron 33, n'affaiblit aucune protection de l'appli, et n'ajoute qu'un petit point sans gravité (S22) ; les vraies faiblesses qui restent (S2, S3, S18, S5, S6) sont dans le code de l'appli, pas dans Electron.**

**Avant / après**

| | Avant (`beta`) | Après (`claude/beta-5`) |
|---|---|---|
| Version | Electron 33.4.11 (Chromium 130, Node.js 20), **plus maintenue** | Electron **45.5.0** (Chromium 156, Node.js 24.22), sortie le 24 novembre 2026, **dernière version stable** |
| Failles d'Electron connues (`npm audit`) | **46** (12 hautes, 25 moyennes, 9 faibles) | **0** (toutes corrigées au plus tard en 42.11.16 / 43.0.0) |
| Failles de Chromium et Node.js | environ 2 ans de retard de correctifs | à jour au 24 novembre 2026 |
| `npm audit` (tout) | 18 paquets touchés : 1 critique, 13 hautes, 4 moyennes | **6 moyennes**, une seule cause (`minimatch`, outils de construction) |
| `npm audit --omit=dev` (ce qui est livré) | 0 | 0 |
| Points du tableau cochés | — | S1 (réglé, vérifié), S16 (fuses, vérifié) ; S5 : risque réduit, case ouverte |
| Nouveaux points | — | **S22** (Plus tard) |

**Ce que la mise à jour corrige, par grandes familles** (source : avis de sécurité officiels d'Electron listés par `npm audit` / GitHub Advisories, versions corrigées entre 35.7.5 et 42.11.16)

- **Isolation et bac à sable (≈ 12 failles, dont 6 hautes)** : contournement de l'isolation par `Function.prototype.bind`, `contextBridge` qui suivait des « setters » piégés, iframe en bac à sable qui pouvait contourner `allow-popups` ou lancer des programmes externes, fenêtres ouvertes qui perdaient le bac à sable, Node.js activable dans des « workers » malgré les réglages. **C'est la famille qui touchait le plus l'appli** (iframe de la carte, pont `tel`).
- **Lecture d'autres origines et protocoles maison (5, dont 2 hautes)** : protocole avec `supportFetchAPI` sans `corsEnabled` (le cas exact de `tchmap://`, `src/map.js:51`), gestionnaires `file:` et `http:` lisibles d'une autre origine, redirection HTTP suivie jusqu'à un fichier local, injection d'en-têtes, cookies `SameSite` non appliqués.
- **Mémoire (10, dont 3 hautes)** : « use-after-free » et lectures hors limites (plantages, voire exécution de code) dans le plein écran, la boîte d'enregistrement, PowerMonitor sous Windows, le rendu hors écran.
- **Permissions (6)** : demandes attribuées à la mauvaise origine (iframe, USB, HID, verrouillage du pointeur, `openExternal`). Peu d'effet ici : l'appli refuse déjà toutes les permissions.
- **Intégration au système et outils (≈ 10)** : contournement de la vérification d'intégrité `app.asar` (corrigé en 35.7.5 ; combiné aux fuses de S16, la protection fonctionne enfin), injection dans le registre Windows (`setAsDefaultProtocolClient`), chemin non protégé par des guillemets (`setLoginItemSettings`), `shell.openPath` trompé par un caractère nul, DevTools, et des failles propres à macOS (sans effet ici).
- **Divers (3)** : extensions Chrome, certificats eMudhra compromis retirés.
- **Chromium 130 → 156** : plus d'un an de correctifs du navigateur intégré, dont plusieurs failles **exploitées pour de vrai** en 2025 (moteur JavaScript V8, sortie du bac à sable via Mojo, carte graphique ANGLE, fuite de données entre sites). **Node.js 20 → 24** : Node 20 n'est plus maintenu depuis avril 2026 ; correctifs réseau (HTTP, TLS) et du modèle de permissions.

**Changements de code de la tâche 2 : rien d'affaibli** (`git diff beta..claude/beta-5` : `main.js`, `package.json`, `package-lock.json`, test du contrat, documents)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` : **inchangés** sur la fenêtre principale (`main.js:174`) et le HUD (`main.js:468`). Aucun `webSecurity: false` ajouté.
- CSP de `app/index.html` et `app/hud.html` : **inchangées** (toujours `'unsafe-inline'`, voir S4 ; `frame-src` large, voir S5).
- IPC : aucun canal ajouté ni retiré (le test « contrat du noyau » passe) ; seuls `steam:key:set` et `steam:profile` deviennent asynchrones. `preload.js` : **inchangé**.
- Processus enfants (`utilityProcess.fork` pour la carte, l'extraction et l'analyse des mods) : **inchangés**.
- Navigation, `setWindowOpenHandler`, permissions : **inchangés**.
- **Renforcé** : fuses (S16) : `RunAsNode`, `NODE_OPTIONS`, `--inspect` coupés, intégrité de `app.asar` vérifiée. Restent volontairement actifs : privilèges supplémentaires de `file://` (lié à S18) et chiffrement des cookies non activé (l'appli ne garde pas de cookie important).
- Clé Steam (`safeStorage` asynchrone) : toujours chiffrée par Windows, jamais écrite en clair ; le secours qui relit une ancienne clé est correct. **Seul nouveau point** : la lecture peut maintenant réécrire le fichier → S22 (Plus tard).
- `npm start` télécharge Electron au premier lancement (`install-electron`) : la somme de contrôle est vérifiée avec la liste fournie dans le paquet `electron` (`checksums.json`). Ne concerne que la machine de développement.
- `electron-updater` 6.8.11 : aucune faille connue ; il ne vérifie toujours que l'empreinte sha512, pas de signature (S7 inchangé).

**La nouvelle version est-elle maintenue ?** Oui. D'après le calendrier officiel (releases.electronjs.org/schedule, lu le 27 novembre 2026) : versions maintenues **43, 44 et 45** ; Electron 45 est maintenu jusqu'au **27 avril 2027** (date provisoire), la 42 ne l'est plus depuis le 20 octobre 2026. 45.5.0 est la dernière version publiée (`npm`, 24 novembre 2026). Electron 46 est prévue le 5 janvier 2027 : prévoir de passer en 46 ou 47 avant fin avril 2027, et suivre les versions 45.x en attendant (une par semaine environ). À noter pour la 46 : les fonctions synchrones de `safeStorage` y disparaissent, donc le secours de relecture d'une clé de la bêta 4 ne marchera plus (une clé jamais relue sous la bêta 5 sera à ressaisir).

**Ce qui reste ouvert après la mise à jour** (pas lié à Electron) : S2, S3, S18 (contrôle de qui appelle le noyau), S5 et S6 (iframe de la carte, liens), S4 (`'unsafe-inline'`), S7, S8, S21 (publication), S15 (6 failles moyennes des outils de construction), et le nouveau S22.

## Découpage de l'interface (tâche 4, 27 novembre 2026)

**Règle** (écrite aussi dans `app/LISEZ-MOI.md`) : une fonctionnalité = un dossier ; tout nouveau code va dans le dossier de sa fonctionnalité, jamais dans `index.html`.

**Résultat** : `app/index.html` 4 568 → **1 038 lignes** (en-tête, liste des fichiers chargés, HTML des pages rangé par commentaires). Aucun outil de compilation, CSP inchangée.

- `app/commun/` : 14 feuilles de style (dont `theme-actuel.css`, les couleurs actuelles) + `utilitaires.js` et `navigation.js`.
- `app/fonctionnalites/` : 17 dossiers : `choix-du-jeu`, `accueil`, `hub`, `telemetrie`, `feuille-de-route`, `hud`, `carte`, `parametres`, `compte`, `news`, `atelier`, `sauvegardes`, `mods`, `outils`, `marketplace`, `mises-a-jour`, `notes-version`.
- `app/demarrage.js` (≈ 500 lignes) : tout ce qui s'exécute au chargement, **dans l'ordre d'origine**, chaque bloc étiqueté par fonctionnalité.

**Comment c'est resté sans risque** : chaque morceau a été coupé tel quel par un petit programme (aucune ligne réécrite). Les styles gardent leur ordre exact. Les fichiers des fonctionnalités ne contiennent que des fonctions et des valeurs fixes (rien ne s'exécute à leur chargement) ; tout ce qui s'exécute est resté ensemble, dans l'ordre, dans `demarrage.js`. Six lignes du type `const openOptCatBase = openOptCat;` (qui photographient une fonction au moment où elles passent) sont restées dans `demarrage.js` pour cette raison.

**Vérifications** : `npm test` **78 / 78** (77 + le nouveau test « interface découpée » ; les tests qui lisaient `index.html` lisent maintenant l'ensemble des fichiers de l'interface, sans rien vérifier de moins) ; 18 captures avant / après **identiques** (seules l'horloge et la carte simulée, qui bougent toutes seules, diffèrent de quelques pixels, exactement comme entre deux lancements de l'appli d'avant) ; les 300 noms globaux ont le même contenu avant / après ; le HTML affiché est le même ; aucune nouvelle erreur dans la console. Version empaquetée (`electron-builder --config electron-builder-beta.js --publish never`, Windows `dir` et Linux `dir`) : les nouveaux dossiers sont bien dans `app.asar` (`files: app/**/*`), et la version Linux empaquetée démarre normalement.

**Ce qui reste à découper**

- [ ] `app/demarrage.js` : répartir le démarrage dans les dossiers, fonctionnalité par fonctionnalité (une fonction `demarrer<Nom>()` par dossier, appelée dans le même ordre), en revérifiant les captures à chaque fois. Attention aux fonctions « enveloppées » (`openOptCat` trois fois, `setRail`, `openMap`, `syncMapEngine`) dont l'ordre compte.
- [ ] HTML des pages (≈ 940 lignes dans `index.html`) : à sortir seulement le jour où il y aura une façon sûre de le charger (outil de compilation ou protocole maison).
- [ ] Feuilles de style mélangées : deux règles des Paramètres dans `outils.css`, le bandeau d'accueil du Hub dans `commun/structure.css`, les notes de version dans `choix-du-jeu.css`.
- [ ] Gestionnaires `onclick="…"` de `outils.js`, puis retrait de `'unsafe-inline'` (S4) ; une seule fonction d'échappement (S4, G2).
- [ ] `main.js` par domaine (G3) : pas commencé.

## Paramètres prévus (tâche 5, 27 novembre 2026)

Pages de paramètres **prévues mais pas encore actives** : on voit les vrais contrôles (interrupteurs, listes, champs, curseurs, touches), tous **désactivés**, avec la mention « Bientôt disponible » (page, groupe et résultat de recherche). Elles ne changent rien et n'appellent jamais le noyau (`window.tel`).

- **Où** : `app/fonctionnalites/parametres/bientot/` : un fichier de données par page (`page-*.js`), `bientot.js` (fabrique les pages au démarrage, sans `innerHTML`), `bientot.css` (couleurs du thème actuel uniquement, aucune couleur en dur). Appelé par une ligne de `app/demarrage.js` (`construirePagesBientot()`), **avant** la recopie du menu dans la barre. `index.html` ne gagne que les balises de chargement ; les anciens blocs HTML Notifications et Données & confidentialité en sont retirés (reconstruits avec de vrais contrôles).
- **Pages** (dossier du mode Paramètres entre parenthèses) : Notifications, Raccourcis clavier, Langue & région, Audio (Appli) ; Données & confidentialité, Gestion (Données) ; Avancé (Aide). **Groupes ajoutés** à des pages existantes : Compte & accès (Profil, Connexion, Clé d'accès et VTC) et Mises à jour (Préférences : canal, recherche / téléchargement / installation automatiques).
- **Visibilité** : comme les autres pages en préparation, elles suivent Interface → Éléments visibles → Pages en préparation. Pages masquées : la recherche les trouve quand même, avec « Bientôt disponible (active « Pages en préparation » pour la voir) », et mène à cet interrupteur. Si on masque les pages en préparation pendant qu'on en regarde une, l'appli revient à Général (avant : seulement pour Compte).
- **Mode développeur** (Avancé) : caché par défaut ; 7 clics rapprochés sur le numéro de version l'affichent (souvenu sur ce PC), un bouton « Masquer » le recache. Il ne contient que des réglages désactivés et **ne désactive jamais une protection de sécurité** (écrit sur la page et vérifié par un test).
- **Recherche** : les réglages cachés (ex. mode développeur pas débloqué, groupes Rangs / Clés créées masqués) ne sortent plus dans les résultats.
- **Vérifications** : `npm test` 81 / 81 (3 tests ajoutés : S9, G5/G12, pages prévues) ; interface ouverte dans Chromium (pages affichées, recherche, mode développeur, pages en préparation masquées) : aucune erreur nouvelle. Appli Electron pas relancée ici (le programme Electron n'est pas téléchargé par `npm ci`).
- **À tester par Charles** : Settings → chaque dossier avec « Pages en préparation » activé ; 7 clics sur le numéro de version dans Aide → Avancé ; enregistrer la page Conduite et les réglages du HUD (la vérification des réglages est plus stricte) ; si possible, abîmer `reglages.json` de la bêta (appli fermée, effacer la fin du fichier) puis relancer : la fenêtre « Réglages récupérés » doit apparaître et le fichier abîmé rester à côté.

## Plan d'action

1. **Tâche 2 (Electron)** : Electron 45 + electron-builder 26 (S1, S15, G15), réglage des fuses (S16) ; relancer `npm test` et `npm audit`.
2. **Tâche 3 (re-audit sécurité)** — **fait** (voir « Re-audit après mise à jour d'Electron ») : failles d'Electron 33 disparues, S1 vérifié, nouveau point S22. ⚠ Ses consignes lui interdisent de modifier le code : elle ne fera que vérifier. Les corrections ci-après (S2, S3, S5, S6) **n'ont donc pas encore de tâche** ; Charles doit les confier à une tâche dédiée (avant la PR de la bêta 5 ou juste après). À faire : contrôle de l'expéditeur pour les 72 canaux (S2), `preload-hud.js` (S3), liste blanche des liens (S6), iframe sans `allow-popups` et `frame-src` restreint (S5), vérifier que les failles d'Electron 33 ont disparu.
3. **Tâche 4 (découpage)** : inventaire des noms globaux (G2), découpage de `index.html` page par page sans réécriture (G1), une seule fonction d'échappement (S4), découpage de `main.js` par domaine (G3) ; mettre à jour les numéros de ligne du contrat. **En plus** : ne plus jamais écraser un `donnees.json` illisible (G5, partie historique) et écritures atomiques des fichiers du jeu (G12, partie jeu).
   - **Fait par la tâche 4** : G1 et l'inventaire de G2. Le contrat (`CONTRAT-NOYAU.md`) ne cite aucune ligne de `index.html` : rien à mettre à jour.
   - **Pas fait** (les consignes de la tâche 4 interdisaient tout changement de comportement : « déménagement, pas rénovation ») : une seule fonction d'échappement (S4), découpage de `main.js` (G3), `donnees.json` illisible (G5, partie historique), écritures atomiques des fichiers du jeu (G12, partie jeu). **À confier à une autre tâche** (G5 est Urgent).
4. **Tâche 5 (paramètres)** : validation complète de `setSettings` (S9), avec tests. **En plus** : ne plus jamais écraser un `reglages.json` illisible (G5, partie réglages) et écriture atomique de `reglages.json` (G12, partie réglages).
   - **Fait par la tâche 5** : S9, G5 (partie réglages), G12 (partie réglages), et les pages de paramètres « Bientôt disponible » (voir « Paramètres prévus (tâche 5) »).
5. **Atelier** (tâche qui y touche, sinon à planifier) : nombres vérifiés dans `atelier.apply` (S10), jeu vérifié (S11), tests de sauvegarde / restauration / suppression sur dossier temporaire (G13), commandes non bloquantes (G6).
6. **Tâche 7 (version)** : tests des prochains numéros affichés avant de changer le numéro (G10), indicateur bêta écrit par la construction (G11), **canal de mise à jour de la bêta (G19)**.
   Et en passant : S17 avec S10 (Atelier), S18 et S21 avec la tâche 3, G20 et G21 dans la tâche qui touche ces parties.
7. **Charles, hors code** : double authentification GitHub, protection des branches `main` et `beta`, approbation avant publication (S7, S8) ; choisir la licence de l'appli (G17).
8. **Avant les comptes en ligne** : conception du serveur selon S14 (connexion Steam, vérifications côté serveur, jetons chiffrés) et note de confidentialité (S13).

## Travaux en parallèle (hors de la chaîne)

Ces travaux tournent à côté de la chaîne de la bêta 5, sur **leur propre branche**. Les tâches de la chaîne ne les fusionnent pas et ne poussent pas sur leur branche, mais doivent en tenir compte pour ne pas créer de conflits.

### Refonte de l'interface : ce qui est fait et ce qui reste à faire

- **Branche** : `claude/refonte-interface`, créée depuis `beta`, non fusionnée. Compte rendu complet : `REFONTE-PREPARATIF.md` sur cette branche (commit `1ac3b8a`).
- **Font foi** : `REFERENTIEL-UI.md` (il prime en cas d'écart), puis `REFONTE-INTERFACE.md` (§ 4 : contenu des pages ; § 5 : ordre des 10 étapes) ; maquette validée (Général et Entreprise).
- **Rappel** : la page d'aperçu montre le menu et un échantillon d'éléments, **pas les visuels des pages**. Le pont `tel` ne change pas.

Cocher chaque case quand c'est fait, en indiquant qui l'a fait (ex. « fait par la tâche 4 »). Ordre : d'abord pendant la bêta 5, puis après.

**Déjà fait**

- [x] **Préparatif de la refonte** (fait par la tâche auxiliaire, 27 novembre 2026)
  - Fichiers créés : `app/commun/tokens.css` (seul fichier autorisé à contenir des couleurs), `app/commun/typographie.css` (Mona Sans), `app/commun/menu.css`, `app/polices/mona-sans/`, `app/apercu-refonte.html`, `tools/contrastes.mjs`, 2 tests à la fin de `tools/verify.test.js`.
  - Résultat : 78 tests sur 78, appli lancée sans erreur, 194 paires de couleurs lisibles (5 couleurs du guide corrigées, `--info` et `--accent-strong` ajoutées, `--race` devient un alias de `--danger`).

**Pendant la bêta 5 (tâches de la chaîne)**

- [x] **Ne pas reprendre les noms de fichiers de la refonte** · Qui : tâche 4 · Quand : ce soir (fait par la tâche 4 : aucun de ces noms dans `app/commun/`, ils sont signalés comme réservés dans `app/LISEZ-MOI.md`)
  - Comment : ne pas créer dans `app/commun/` de fichiers nommés `tokens.css`, `typographie.css`, `menu.css` ou `composants.css`.
- [x] **Regrouper les couleurs actuelles à un seul endroit** · Qui : tâche 4 · Quand : ce soir (fait par la tâche 4 : `app/commun/theme-actuel.css`, valeurs inchangées, chargé en premier ; noms `applyLook`, `applyAccent` et attributs `data-*` inchangés. Seule couleur de thème restée ailleurs : `[data-theme="clair"] .hero` dans `fonctionnalites/outils/outils.css`, qui n'est pas une variable)
  - Comment : mettre toutes les variables `:root`, `[data-theme]`, `[data-vision]`, `[data-contrast]` dans un seul fichier au nom différent (ex. `app/commun/theme-actuel.css`), sans en changer la valeur ; ne renommer ni `applyLook`, ni `applyAccent`, ni les attributs `data-theme`, `data-vision`, `data-contrast`, `data-motion`. La refonte remplacera ce fichier d'un bloc.
- [x] **Garder les images des pages actuelles** · Qui : tâche 4 · Quand : ce soir (fait par la tâche 4 : 18 captures dans `docs/captures/beta-5/`, signalées dans `app/LISEZ-MOI.md`)
  - Comment : enregistrer les captures de référence dans le dépôt (`docs/captures/beta-5/`, une image par page, nommée comme la page) et le signaler dans `app/LISEZ-MOI.md`, avec une ligne disant que la refonte ajoutera ses fichiers dans `app/commun/`.
- [ ] **Limiter les conflits dans les tests** · Qui : toutes les tâches · Quand : à chaque modification de `tools/verify.test.js`
  - Comment : ajouter les nouveaux tests à leur place logique, pas à la toute fin (la refonte y a mis les siens).
- [ ] **Ne pas mélanger la refonte à la bêta 5** · Qui : tâche 7 · Quand : à l'ouverture de la PR
  - Comment : ne pas fusionner `claude/refonte-interface` ; écrire une ligne dans la PR qui dit qu'elle existe et sera branchée après.

**Décisions de Charles (27 novembre 2026)**

- [x] **Pages déjà faites dans cette bêta : on les garde telles quelles** (décidé par Charles)
  - Pages concernées : Games (choix du jeu), Map, News, Settings (Paramètres) et Support.
  - Ce que ça veut dire : leur contenu, leur disposition et leur fonctionnement ne changent pas. La refonte ne leur applique **que le nouveau style** (couleurs, police, espacements des tokens). Aucune maquette à faire pour elles.
- [x] **Les 3 pages manquantes de l'espace Entreprise sont à implémenter** (décidé par Charles)
  - Pages concernées : Flotte & chauffeurs, Garages, Finances (le guide les marque « maquette à faire »).
  - Ce que ça veut dire : elles doivent être **construites et branchées pour de vrai**, sans maquette préalable : même style que les autres pages Entreprise de la maquette, vraies données de la sauvegarde, puis réglages avec Charles.
- [x] **Marketplace et Truck & Coach Tools : nouveau style seulement** (décidé par Charles)
  - Pages concernées : la Marketplace, et tout l'espace Truck & Coach Tools (Truck & Road Trip Tools sur ATS) : profils et sauvegardes, éditeur, Mods, console, convoi…
  - Ce que ça veut dire : comme Games, Map, News, Settings et Support, leur contenu et leur fonctionnement ne changent pas ; seul le style change.

**Avant de brancher (toi, Charles)**

- [ ] **Lancer les tâches de branchement** · Qui : Charles · Quand : une fois la bêta 5 fusionnée dans `beta`
  - Comment : programmer une petite tâche par étape ci-dessous, dans l'ordre, chacune sur la branche `claude/refonte-interface` (jamais sur `beta` ni `main`), avec la consigne de lire ce tableau de bord, `REFERENTIEL-UI.md`, `REFONTE-INTERFACE.md` et `REFONTE-PREPARATIF.md`, puis de cocher sa case ici. La première tâche ajoute les décisions ci-dessus dans `REFONTE-INTERFACE.md`.

**Après la bêta 5 : branchement (une petite tâche par case, dans l'ordre)**

- [ ] **0. Remettre la branche à jour** · Qui : 1re tâche de branchement
  - Comment : rebaser `claude/refonte-interface` sur la nouvelle `beta` ; régler les conflits éventuels dans `tools/verify.test.js` en gardant tous les tests ; `npm test` doit passer.
- [ ] **1. Couleurs (tokens)** · Qui : tâche de branchement
  - Comment : charger `commun/tokens.css` avant tout autre style ; supprimer le fichier des couleurs actuelles créé par la tâche 4 ; remplacer `--race` par `--danger` ; supprimer le thème « De base » et faire de « Système » le thème par défaut ; vérifier que `applyAccent` marche toujours ; poser `data-contrast="normal"` quand l'utilisateur désactive le contraste renforcé.
- [ ] **2. Police** · Qui : tâche de branchement
  - Comment : charger `commun/typographie.css`, appliquer `class="tch-typo"` au `<body>`, remplacer les graisses 800 / 900 par 700 au plus et les tailles en dur par les variables `--fs-*`.
- [ ] **3. Menu** · Qui : tâche de branchement
  - Comment : charger `commun/menu.css`, reprendre la structure du menu de `apercu-refonte.html` dans le dossier du menu, rebrancher burger, réduire, puce du jeu, maison et bandeau de mise à jour ; « Ma VTC » reste masquée ; appliquer les décisions sur les autres pages.
- [ ] **4 à 10. Pages, dans l'ordre du guide** (§ 5) · Qui : une tâche par page
  - Comment : Feuille de route (fusion de Ma carrière), Calendrier, Télémétrie, Accueil et HUD, Vue d'ensemble, puis Flotte / Garages / Finances et Ma VTC (après un essai réel de l'API TruckersMP). Chaque page dans son dossier, comparée à la maquette ; toute nouvelle fonction du pont déclarée dans `CONTRAT-NOYAU.md`.
  - Flotte / Garages / Finances : **à implémenter**, pas de maquette (décision de Charles) ; même style que la Vue d'ensemble, données réelles de la sauvegarde (vérifier d'abord quels champs existent, ex. détail des chauffeurs), puis réglages avec Charles.
- [ ] **Passage au nouveau style des pages gardées** · Qui : tâche de branchement, après l'étape 3
  - Comment : Games, Map, News, Settings, Support, Marketplace, Truck & Coach Tools : remplacer couleurs, tailles et graisses en dur par les tokens et la typographie ; **ne rien changer d'autre** (contenu, disposition, fonctionnement). Comparer avec les captures de `docs/captures/beta-5/` : seule l'apparence doit changer.
- [ ] **11. Nettoyage** · Qui : dernière tâche de branchement
  - Comment : remplacer le test « fichiers non branchés » par « aucune couleur en dur hors `tokens.css` » ; déplacer les échantillons de l'aperçu dans `app/commun/composants.css` ; supprimer `app/apercu-refonte.html`.
- [ ] **12. Contrôle de sécurité** · Qui : une tâche de vérification (comme la tâche 8)
  - Comment : vérifier que l'aperçu n'est plus livré dans l'installeur, que la police est chargée en local, et que la CSP n'a pas été affaiblie.

**Vérifications sur un vrai PC (toi, Charles)**

- [ ] **Narrateur Windows** sur le menu, surtout en mode réduit · Quand : après l'étape 3
  - Comment : Windows + Ctrl + Entrée, parcourir le menu au clavier (Tab), vérifier que chaque bouton est annoncé par son nom.
- [ ] **Contraste élevé Windows** · Quand : après l'étape 1
  - Comment : Paramètres Windows → Accessibilité → Thèmes de contraste, en activer un et vérifier que tout reste lisible.
- [ ] **Mise à l'échelle 150 % et fenêtre étroite** · Quand : après l'étape 3
  - Comment : Paramètres Windows → Affichage → Échelle 150 %, puis réduire la fenêtre au minimum : rien ne doit se chevaucher.

## Notes de version (changelog) : consignes

Décision de Charles (27 novembre 2026). Toute tâche qui change un numéro de version, écrit une note de version ou prépare une publication **suit cette partie**, pour la version classique (bêta et officielle) comme pour Diamond.

### Règles communes (bêta, officielle, Diamond)

- **Une version = au moins un changement visible.** Jamais de version « technique » seule.
- **Quatre rubriques, dans cet ordre** : `nouveau` (Nouveautés), `ameliore` (Améliorations), `change` (Changements : déplacé, renommé ou retiré), `corrige` (Corrections).
- **Écrit pour le joueur** : français simple, tutoiement (« ton camion »), une idée par ligne, une ou deux phrases courtes. Pas de nom de fichier, de fonction ni de jargon (IPC, preload, token…). On dit ce que ça change pour lui, pas comment c'est codé.
- **Le travail invisible tient en une ligne au plus** (ex. « Moteur de l'appli mis à jour : plus sûr et plus stable »). Découpage du code, tests, audits : pas de ligne à eux seuls.
- **Seulement ce qui est fait et vérifié.** On écrit d'après le Journal des tâches : une tâche absente ou marquée « annulée » n'apparaît pas. Rien d'annoncé « bientôt » comme s'il existait ; une page en préparation est dite « en préparation » avec le moyen de l'afficher.
- **Sécurité** : on dit que la sécurité est renforcée, sans décrire une faille qui n'est pas encore corrigée.
- **Pas de doublon** : une même amélioration n'apparaît qu'une fois, dans la bonne rubrique.
- **Un test vérifie chaque note** (numéro affiché, rubriques valides, date) dans `tools/verify.test.js`.

### Bêta (version classique)

- **Où** : en tête de `NOTES_BETA` dans `app/data/notes-version.js` ; `package.json` → `version` (`0.13.36-beta.N`) et `build.releaseInfo.releaseName` (numéro affiché, ex. « 0.12.0.5 bêta 5 ») ; le numéro affiché est calculé par `versionAffichee`.
- **Qui** : seulement la tâche qui change le numéro de version (pour la bêta 5 : la tâche 7). Les autres tâches n'écrivent pas de note ; elles décrivent ce qu'elles ont fait dans le Journal des tâches.
- **Taille** : une bêta = un gros lot = **une seule note de 5 à 8 lignes**, avec un titre court qui résume le lot.
- **Publication** : la fusion de la PR vers `beta` publie la bêta. Jamais de push direct sur `beta`.

### Version officielle (version classique)

- **Où** : en tête de `NOTES_VERSION` dans `app/data/notes-version.js`, `package.json` sur `main`, titre de la Release (corrigé par `tools/release-titles.js`).
- **Numéro** : modèle Apple. La version officielle porte le numéro de la bêta qu'elle termine (ex. bêta « 0.12.0.5 bêta 5 » → officielle « 0.12.0.5 », technique `0.13.36`).
- **Contenu** : un **résumé de toutes les bêtas** depuis la dernière officielle, **réécrit, pas recopié** : **6 à 10 lignes**, regroupées par rubrique. On enlève ce qui a été retiré ou annulé entre deux bêtas, et les étapes intermédiaires (« nouvelle carte en aperçu » puis « vraie carte » → seulement « vraie carte »).
- **Quand** : la tâche qui prépare la dernière bêta (tâche 7 pour la bêta 5) écrit ce résumé **en brouillon** dans la partie « Brouillon de la prochaine note officielle » ci-dessous et dans la description de la PR. Il n'entre dans `NOTES_VERSION` qu'au moment de préparer la publication officielle (PR vers `main`), pour que l'appli n'affiche pas une version qui n'existe pas encore.
- **Publication** : seule la fusion vers `main` publie, sur décision de Charles.

### Diamond (version Tauri / Rust, en préparation)

- **Appli séparée** : ses notes ne vont **jamais** dans `NOTES_BETA` ni `NOTES_VERSION`, et la version classique ne parle pas de Diamond dans ses notes (sauf le jour où Diamond la remplace).
- **Où** : un fichier à elle, `diamond/NOTES-VERSION.md` sur la branche `diamond` (plus tard, l'équivalent dans le dossier de la fonctionnalité « notes de version » de Diamond), avec les mêmes quatre rubriques.
- **Numéro** : sa propre numérotation, choisie à l'étape 1 et notée dans `diamond/README.md` (proposé : « Diamond 0.1 » pour l'étape 1, puis 0.2, 0.3… à chaque étape hebdomadaire). Jamais le même numéro que la version classique.
- **Contenu** : une note par étape (une étape par semaine) : quelle fonctionnalité est arrivée dans Diamond, **ce qui manque encore par rapport à la version classique**, et les gains mesurés (mémoire, démarrage) s'il y en a.
- **Publication** : pas de Release tant que Diamond est un prototype (seulement un artefact de construction) ; quand Diamond aura un canal à lui, ces mêmes règles s'appliqueront.
- **Première étape** : la tâche « Diamond bêta : prototype Tauri (étape 1) » (vendredi 4 décembre 2026) crée ce fichier avec sa première note.

### Brouillon de la prochaine note officielle (0.12.0.5)

À compléter par la tâche 7 d'après le Journal des tâches (ne garder que ce qui est fait). Base proposée :

- **Nouveau** — L'appli s'ouvre sur le choix du jeu (ETS2 ou ATS), avec une barre Game, News, Map, Settings et Support.
- **Nouveau** — Carte lue directement dans tes fichiers du jeu, DLC compris, préparée toute seule en arrière-plan.
- **Nouveau** — Paramètres propres à chaque jeu, mode Paramètres en dossiers et recherche dans les réglages.
- **Nouveau** — Page News (actualités Steam) et analyse des mods dans Truck & Coach Tools.
- **Nouveau** — ATS : unités américaines et Truck & Road Trip Tools.
- **Amélioré** — Moteur de l'appli à jour, sécurité renforcée, historique protégé.
- **Changé** — Anciennes pages VTC retirées ; Marketplace accessible depuis la barre de gauche (en préparation).

## Règles pour les tâches suivantes

1. Chaque tâche lit **ce fichier** et **`CONTRAT-NOYAU.md`** avant de commencer.
2. Si un point de ce tableau touche ce qu'elle modifie, elle le corrige et coche la case en indiquant la tâche, par exemple : `- [x] **S3 — …** (corrigé par la tâche 3)`.
3. Elle évite de reproduire les erreurs relevées ici (ex. : pas de nouveau `innerHTML` sans échappement, pas de nouvel `ipcMain.handle` sans contrôle de l'expéditeur une fois S2 corrigé, pas d'écriture de fichier non atomique, pas de `execFileSync` dans un point d'entrée).
4. Un nouveau problème découvert est **ajouté ici** (avec le même format et un nouveau numéro S ou G), **sans partir le corriger** s'il sort de son sujet.
5. Toute fonction ajoutée ou modifiée dans le pont `tel` est mise à jour dans `CONTRAT-NOYAU.md` (une ligne par fonction, ⚠ si besoin). Le test « contrat du noyau » échoue sinon.
6. `npm test` doit passer avant chaque commit. **Ne jamais pousser sur `beta` ni sur `main`** (publication automatique) ; travailler sur `claude/beta-5`.
7. Chaque tâche ajoute sa ligne au journal ci-dessous.
8. Chaque tâche lit aussi la partie « Travaux en parallèle » et respecte ses points de vigilance ; elle ne fusionne aucune de ces branches.
9. Toute tâche qui change un numéro de version, écrit une note de version ou prépare une publication (bêta, officielle ou Diamond) suit la partie « Notes de version (changelog) : consignes ».

## Journal des tâches

- Tâche 1 (audit, sécurité et contrat) : terminée le 27 novembre 2026. Branche `claude/beta-5` créée depuis `beta`, contrat du noyau terminé (77 fonctions, 51 ⚠), test « contrat du noyau » ajouté (77 tests réussis), ce tableau de bord écrit. Aucun code de l'appli modifié.
- Tâche 1, second passage (exécution parallèle de la même tâche, terminée le 27 novembre 2026) : la branche existait déjà, rien n'a été écrasé ; ajout des points S17 à S21 et G19 à G21, vérifiés dans le code (S17 et le `NaN` de S10 testés). `npm test` : 77 réussis.
- Tâche 1 (suite, à la demande de Charles) : G5 et G12 répartis entre la tâche 4 (historique et fichiers du jeu) et la tâche 5 (réglages), le 27 novembre 2026.
- Tâche 1 (suite, à la demande de Charles) : ajout de la partie « Travaux en parallèle » (préparatif de la refonte de l'interface, branche `claude/refonte-interface`), le 27 novembre 2026.
- Tâche 1 (suite) : « Travaux en parallèle » mis à jour avec les résultats réels du préparatif de la refonte (commit `1ac3b8a`), le 27 novembre 2026.
- Tâche 1 (suite, à la demande de Charles) : partie « Refonte de l'interface » transformée en liste à cocher (qui, quand, comment), le 27 novembre 2026.
- Tâche 1 (suite) : décisions de Charles ajoutées à la refonte (pages Games, Map, News, Settings, Support : style seulement ; Flotte, Garages, Finances : mises en place sans maquette, réglées ensuite), le 27 novembre 2026.
- Tâche 2 (Electron) : terminée le 27 novembre 2026. Electron 33.4.11 → **45.5.0**, electron-builder 25.1.8 → 26.18.0, electron-updater 6.3.9 → 6.8.11 (dans `dependencies`). Clé Steam passée à `safeStorage` asynchrone, fuses réglés (S16), contrat mis à jour (numéros de ligne). `npm test` : 77 réussis. Appli et version empaquetée démarrées sous Linux sans erreur ; installeur Windows à vérifier sous Windows. Nouveau point G22 (analyse des mods, déjà présent en Electron 33). S1 et S16 cochés.
- Tâche 1 (suite) : décisions de Charles complétées (3 pages Entreprise à implémenter ; Marketplace et Truck & Coach Tools : style seulement) ; signalé que la tâche 3 ne corrige pas S2, S3, S5, S6 (lecture seule), le 27 novembre 2026.
- Tâche 1 (suite, à la demande de Charles) : ajout des consignes de notes de version (bêta, officielle, Diamond) et du brouillon de la note officielle 0.12.0.5, le 27 novembre 2026.
- Tâche 3 (re-audit après Electron) : terminée le 27 novembre 2026. Comparaison `beta` / `claude/beta-5` : les 46 failles d'Electron 33 ont disparu, Electron 45.5.0 est la dernière version et elle est maintenue (jusqu'en avril 2027) ; aucune protection affaiblie par la tâche 2. `npm test` : 77 réussis ; `npm audit` : 6 moyennes (outils de construction), `--omit=dev` : 0. S1 et S16 vérifiés, note ajoutée à S5 et S15, nouveau point S22. Aucun code de l'appli modifié.
- Tâche 4 (découpage) : terminée le 27 novembre 2026. `app/index.html` : **4 568 → 1 038 lignes**. Dossiers créés : `app/commun/` (14 CSS, `utilitaires.js`, `navigation.js`), `app/fonctionnalites/` (`choix-du-jeu`, `accueil`, `hub`, `telemetrie`, `feuille-de-route`, `hud`, `carte`, `parametres`, `compte`, `news`, `atelier`, `sauvegardes`, `mods`, `outils`, `marketplace`, `mises-a-jour`, `notes-version`), `app/demarrage.js`, `app/LISEZ-MOI.md`, `docs/captures/beta-5/` (18 captures de référence). Aucun changement de comportement ni d'apparence (captures identiques). `npm test` : 78 réussis (nouveau test « interface découpée »). G1 coché ; non faits et à confier : S4 (échappement, `'unsafe-inline'`), G3, G5 (historique), G12 (fichiers du jeu).
- Tâche 2 (Electron), nouveau lancement le 27 novembre 2026 : déjà faite, rien refait. Contrôle : Electron 45.5.0 est toujours la dernière version stable (46 seulement en alpha), electron-builder 26.18.0 et electron-updater 6.8.11 toujours à jour ; `npm ci` + `npm test` : 78 réussis. Aucun code modifié.
- Tâche 5 (paramètres) : terminée le 27 novembre 2026. Pages « Bientôt disponible » ajoutées (dossier `app/fonctionnalites/parametres/bientot/`) : **Notifications**, **Raccourcis clavier**, **Langue & région**, **Audio**, **Données & confidentialité**, **Gestion**, **Avancé** (avec mode développeur caché, 7 clics sur le numéro de version) ; groupes ajoutés à **Compte & accès** (Profil, Connexion, Clé d'accès et VTC) et **Mises à jour** (Préférences). Tous trouvables par la recherche avec la mention « Bientôt disponible ». S9 coché ; G5 et G12 : partie réglages faite (cases principales ouvertes pour l'historique et les fichiers du jeu). `CONTRAT-NOYAU.md` : ligne `setSettings` et numéros de ligne de `main.js` mis à jour. `npm test` : 81 réussis. Numéro de version, notes de version, pages VTC / Conducteur / Infos VTC, Marketplace et Electron : pas touchés.
- Étape 0 (préparation du passage unique bêta 5) : terminée le 27 novembre 2026. `npm ci` + `npm test` : 81 réussis. Captures « avant » ajoutées dans `docs/captures/beta-5/` (`*-avant.png` : choix du jeu, Accueil, Télémétrie, Feuille de route, Ma carrière, Carte, HUD, Paramètres, Ma VTC).
- Étape A (retrait des anciennes pages VTC, ex-tâches 6a, 6b, 6c) : terminée le 27 novembre 2026. `IDEES.md` créé (Ma VTC et ses onglets, Calendrier, Infos VTC : contenu prévu, origine, doublons, conclusion). Supprimés : entrées Ma VTC, Calendrier et Infos VTC du menu, sections `v-vtc`, `v-soon`, `v-classement`, `v-carte` (carte simulée), `v-profil` (fiche chauffeur d'exemple), dossier `fonctionnalites/hub/` (données d'exemple, onglets VTC, `renderVtcBars` / `openVtcTab`), table `SOON` et ses icônes, cas particuliers de `go()` et liste des vues masquées dans `applySoon`. Gardés : la vraie carte (TCH Map), le bloc « Ma VTC » de Compte & accès, l'aperçu de la tablette (déplacé dans `fonctionnalites/marketplace/tablette.js`, utilisé par la fiche du module). Texte de « Pages en préparation » mis à jour. Plus aucune référence à ces pages dans `app/` et `tools/`. `npm test` : 81 réussis ; appli démarrée sans erreur (seules erreurs : images `assets/games/*.jpg` absentes du dépôt, déjà le cas avant).
- Étape B (refonte 1/4, ex-R1 : fondations et menu) : terminée le 27 novembre 2026 (**partiel** pour le remplacement des valeurs en dur hors `app/commun/`, voir « À finir »). `REFERENTIEL-UI.md` et `REFONTE-INTERFACE.md` copiés à la racine. `app/commun/tokens.css` + `typographie.css` branchés en premier (repris de `claude/refonte-interface`, complétés : alias `--c-hub`/`--c-market`/`--c-atelier` = accent, `--accent-soft`, décor du panneau de limitation, voile, ombres, roue de couleurs), `theme-actuel.css` supprimé, thème « De base » retiré (anciens réglages ramenés à « Système », qui devient le thème par défaut ; accent orange par défaut, accent Windows seulement sur choix). Police Mona Sans locale (`app/polices/mona-sans/`, OFL, incluse par `app/**/*`), CSP inchangée. `app/commun/*.css` : plus aucune couleur, taille ni graisse en dur (test). Graisses 800/900 → 700 dans toute l'interface (sauf HUD en jeu). `tools/contrastes.mjs` + test (154 paires, 8 thèmes, OK). Menu : « En jeu » (Accueil, Carte, HUD) + une entrée **Entreprise** qui ouvre l'**espace Entreprise** (même mécanique que l'espace Paramètres : le menu est remplacé, Retour + Alt + ←, titre « Entreprise ») avec Vue d'ensemble, Feuille de route, Flotte & chauffeurs, Garages, Finances, Télémétrie. Bord du menu : `NAV_SNAP` supprimé, logique pure `commun/menu-largeur.js` (suit la souris jusqu'à 200 px, annonce « Relâche pour replier », repli au relâchement, hystérésis de 24 px, `pointercancel` / `lostpointercapture`), testée. `menu.css` de la refonte non repris (écrit pour une autre structure HTML : le menu existant a été restylé avec les tokens). `npm test` : 85 réussis ; appli démarrée sans erreur.
- Étape C (refonte 2/4, ex-R2 : Feuille de route) : terminée le 27 novembre 2026. Quatre onglets (`role="tablist"`, flèches, Début / Fin) : **Trajets** (mission en cours, dépenses, pleins, historique **Tous** / Camion / Car avec détail au clic, et « Depuis le début » = totaux de l'ancienne page **Ma carrière**, retirée ; champ « Mode » réel / course ajouté au détail : aucun champ perdu), **Calendrier** (grille du mois, km et livraisons ou voyageurs par jour, trajets du jour choisi ; repères icône + texte : ⚑ convoi exceptionnel (champ `special` du jeu), ◆ nouvelle ville, ↻ ligne répétée, ★ record du mois ; matières dangereuses **non affichées** : le jeu ne transmet pas l'information), **Rapport de la semaine** et **Rapport du mois** (km, livraisons, voyageurs, carburant, consommation, excès de vitesse = trajets en mode course, dégâts, revenus / dépenses par monnaie, écart en % avec la période précédente si elle a des données, détail jour par jour / semaine par semaine, « Copier le rapport » pour Discord). ⚠ Ces rapports **n'existaient pas** dans la Télémétrie (rien à déplacer) : ils ont été créés à partir du journal. Nouvelle fonction du pont **`journal()`** (lecture seule, déclarée dans `CONTRAT-NOYAU.md`, 78 fonctions). `npm test` : 86 réussis.
