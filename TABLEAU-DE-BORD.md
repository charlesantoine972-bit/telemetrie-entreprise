# Tableau de bord — Truck & Coach Hub, préparation de la bêta 5

Branche de travail : `claude/beta-5` (créée depuis `beta`). **Ne jamais pousser sur `beta` ni sur `main`** : chaque push qui touche `package.json` publie une version.
Numéros au départ : technique `0.13.36-beta.10` (package.json), affiché « 0.12.0.5 bêta 4 ». Version officielle sur `main` : `0.13.35` (« 0.12.0.5 »). `beta` contient tout `main` (aucune différence de contenu dans l'autre sens).

Mesures du 27 novembre 2026 (tâche 1) :

- `npm ci` : OK. `npm test` : **77 tests, 77 réussis** (76 avant + le nouveau test « contrat du noyau »).
- `npm audit` : **18 failles (1 critique, 13 hautes, 4 moyennes)**, toutes dans Electron 33 et les outils de construction (electron-builder 25). `npm audit --omit=dev` : 0 (les autres paquets livrés, `electron-updater` et `discord-rpc`, sont propres).
- Taille : `app/index.html` 4 568 lignes, `main.js` 764 lignes (72 points d'entrée), `preload.js` 77 fonctions, `src/` 2 600 lignes.

## Résumé

L'appli est **plutôt bien protégée pour une appli de bureau** : fenêtres isolées (`contextIsolation`, `sandbox`, pas de `nodeIntegration`), navigation bloquée, aucune permission web accordée, chemins de profils vérifiés, aucune commande construite à partir de texte, clé Steam chiffrée par Windows, serveur de carte local protégé par un jeton. Aucun secret dans le dépôt.
Les faiblesses viennent surtout de **ce qui entoure ce code** : un Electron qui n'est plus mis à jour, une mise à jour automatique non signée, et un noyau qui fait confiance à tout ce qui lui parle.

**Les 3 points les plus urgents :**

1. **S1 — Electron 33 n'est plus maintenu** : 49 failles connues, dont plusieurs qui touchent directement l'appli (protocole `tchmap://`, iframe de la carte, isolation). → tâche 2.
2. **S2 + S3 — le noyau ne vérifie pas qui l'appelle** : les 72 points d'entrée acceptent toute page qui a le pont, y compris la fenêtre du HUD, qui reçoit les 77 fonctions (suppression de profils comprise) alors qu'elle n'en utilise qu'une. → tâche 3.
3. **G5 — l'historique peut disparaître sans prévenir** : si `donnees.json` est abîmé (coupure de courant), l'appli repart de zéro et écrase le fichier 10 s plus tard. Tout l'historique des trajets est perdu. → réparti entre la tâche 4 (`donnees.json`) et la tâche 5 (`reglages.json`).

**À ajouter au même niveau (second passage de la tâche 1)** : **G19 — la bêta va télécharger l'appli officielle** dès que la version officielle 0.13.36 sortira (repli automatique sur `latest.yml`). À corriger dans la tâche 7, avant toute publication de 0.13.36.

## Sécurité

- [ ] **S1 — Electron 33 plus maintenu** · Urgent
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

- [ ] **S5 — Iframe de la carte (`tchFrame`) peu protégée** · Important
  - Où : `app/index.html:1660` (`sandbox="allow-scripts allow-same-origin allow-popups"`), CSP `frame-src http://127.0.0.1:*` (l.5).
  - Problème : `allow-scripts` + `allow-same-origin` annule presque tout le bac à sable. Ici ce n'est pas dramatique car la carte vient d'une autre origine (`http://127.0.0.1:<port>`) que l'appli (`file://`) : elle n'atteint pas `window.tel`. Mais `allow-popups` lui permet d'ouvrir des fenêtres (envoyées au navigateur, voir S6), et `frame-src` accepte n'importe quel serveur local, pas seulement celui de la carte.
  - Risque concret : avec la faille Electron 33 sur `allow-popups` (S1), une carte piégée pourrait ouvrir des pages ou des programmes externes.
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

- [ ] **S9 — `setSettings` accepte des valeurs non vérifiées** · Important
  - Où : `main.js:666-681`, `src/settings.js:33-46`.
  - Problème : seuls les seuils, le SteamID et l'ID Discord sont vérifiés. `pseudo` (longueur), `vehicleType`, `atelier`, `showSoon`, `autoTelemetry` (vrai/faux), `modules` et `hud` (n'importe quel contenu) sont enregistrés tels quels dans `reglages.json`. `patch = null` provoque une erreur technique.
  - Risque concret : réglages corrompus qui cassent l'interface au démarrage suivant ; texte libre réaffiché ailleurs (voir S4).
  - Correction : vérifier chaque clé (type, liste de valeurs, longueur) dans `validateSettingsPatch`, avec un test. → tâche 5 (paramètres).

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

- [ ] **S16 — Protections internes d'Electron (« fuses ») non réglées** · Plus tard
  - Où : configuration electron-builder (`package.json`, `electron-builder-beta.js`).
  - Problème : les options `RunAsNode`, vérification d'intégrité de l'archive `app.asar`, etc. sont aux valeurs par défaut.
  - Risque concret : un programme déjà présent sur le PC peut plus facilement détourner l'appli.
  - Correction : régler `electronFuses` dans electron-builder 26 (désactiver `RunAsNode`, activer l'intégrité asar). → tâche 2 ou 3.

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

**Points solides (à conserver)** : `contextIsolation`, `sandbox`, `nodeIntegration: false` sur les deux fenêtres (`main.js:155`, `:449`) ; `will-navigate`, `will-redirect`, `will-attach-webview` bloqués (`main.js:411-415`) ; toutes les permissions web refusées (`main.js:714-715`) ; id de profil limité à un dossier hexadécimal, noms de sauvegarde limités (`src/atelier.js:139-144`) ; programmes lancés avec `execFile` et une liste d'arguments (jamais de ligne de commande construite) ; `openLink` par clé, pas par adresse ; serveur de carte sur 127.0.0.1, jeton aléatoire de 48 caractères, chemins vérifiés, CSP stricte (`tch-map/server.js`) ; outil `decrypt_truck` compilé dans la CI depuis un commit précis ; sauvegardes déchiffrées en fichiers temporaires effacés ; aucune clé ni mot de passe dans le dépôt.

## Audit général

- [ ] **G1 — `app/index.html` monolithique** · Important
  - Où : `app/index.html` (4 568 lignes : ~800 de CSS, ~950 de HTML, un seul `<script>` de ~2 800 lignes de 1765 à 4560).
  - Problème : tout est dans un fichier ; chaque modification risque de casser une autre page ; impossible de retirer `'unsafe-inline'` (S4).
  - Risque concret : bugs croisés entre pages, conflits de fusion entre tâches.
  - Correction (sans réécriture, page par page) : 1) sortir le CSS dans `app/styles/*.css` ; 2) sortir les fonctions communes (`$`, `setText`, `store`, échappement…) dans `app/commun.js` ; 3) pour chaque page (Accueil, Carte, News, Atelier, Mods, Accès, Paramètres, HUD, Marketplace…), couper le bloc de script tel quel dans `app/pages/<page>.js`, chargé par `<script src>` dans le même ordre (scripts classiques qui partagent les variables globales : rien à réécrire) ; 4) adapter les tests qui découpent `index.html` par nom de fonction (`tools/verify.test.js`) pour lire les nouveaux fichiers. Le HTML peut rester dans `index.html` au début. → tâche 4.

- [ ] **G2 — Noms globaux en double** · Important
  - Où : `esc` défini deux fois (`app/index.html:2895` dans une fonction, `:3934` au niveau global) ; 5 fonctions d'échappement ; `openMap` remplacée après coup (`:2345`) ; nombreuses variables `let` globales.
  - Problème : une fois découpés en plusieurs fichiers, deux `const` ou `let` du même nom au niveau global font planter tout le chargement (« already been declared »).
  - Risque concret : écran blanc après le découpage.
  - Correction : avant de découper, lister les noms globaux (un petit script), renommer les doublons, regrouper l'échappement dans `commun.js`. → tâche 4.

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

## Plan d'action

1. **Tâche 2 (Electron)** : Electron 45 + electron-builder 26 (S1, S15, G15), réglage des fuses (S16) ; relancer `npm test` et `npm audit`.
2. **Tâche 3 (re-audit sécurité)** : contrôle de l'expéditeur pour les 72 canaux (S2), `preload-hud.js` (S3), liste blanche des liens (S6), iframe sans `allow-popups` et `frame-src` restreint (S5), vérifier que les failles d'Electron 33 ont disparu.
3. **Tâche 4 (découpage)** : inventaire des noms globaux (G2), découpage de `index.html` page par page sans réécriture (G1), une seule fonction d'échappement (S4), découpage de `main.js` par domaine (G3) ; mettre à jour les numéros de ligne du contrat. **En plus** : ne plus jamais écraser un `donnees.json` illisible (G5, partie historique) et écritures atomiques des fichiers du jeu (G12, partie jeu).
4. **Tâche 5 (paramètres)** : validation complète de `setSettings` (S9), avec tests. **En plus** : ne plus jamais écraser un `reglages.json` illisible (G5, partie réglages) et écriture atomique de `reglages.json` (G12, partie réglages).
5. **Atelier** (tâche qui y touche, sinon à planifier) : nombres vérifiés dans `atelier.apply` (S10), jeu vérifié (S11), tests de sauvegarde / restauration / suppression sur dossier temporaire (G13), commandes non bloquantes (G6).
6. **Tâche 7 (version)** : tests des prochains numéros affichés avant de changer le numéro (G10), indicateur bêta écrit par la construction (G11), **canal de mise à jour de la bêta (G19)**.
   Et en passant : S17 avec S10 (Atelier), S18 et S21 avec la tâche 3, G20 et G21 dans la tâche qui touche ces parties.
7. **Charles, hors code** : double authentification GitHub, protection des branches `main` et `beta`, approbation avant publication (S7, S8) ; choisir la licence de l'appli (G17).
8. **Avant les comptes en ligne** : conception du serveur selon S14 (connexion Steam, vérifications côté serveur, jetons chiffrés) et note de confidentialité (S13).

## Règles pour les tâches suivantes

1. Chaque tâche lit **ce fichier** et **`CONTRAT-NOYAU.md`** avant de commencer.
2. Si un point de ce tableau touche ce qu'elle modifie, elle le corrige et coche la case en indiquant la tâche, par exemple : `- [x] **S3 — …** (corrigé par la tâche 3)`.
3. Elle évite de reproduire les erreurs relevées ici (ex. : pas de nouveau `innerHTML` sans échappement, pas de nouvel `ipcMain.handle` sans contrôle de l'expéditeur une fois S2 corrigé, pas d'écriture de fichier non atomique, pas de `execFileSync` dans un point d'entrée).
4. Un nouveau problème découvert est **ajouté ici** (avec le même format et un nouveau numéro S ou G), **sans partir le corriger** s'il sort de son sujet.
5. Toute fonction ajoutée ou modifiée dans le pont `tel` est mise à jour dans `CONTRAT-NOYAU.md` (une ligne par fonction, ⚠ si besoin). Le test « contrat du noyau » échoue sinon.
6. `npm test` doit passer avant chaque commit. **Ne jamais pousser sur `beta` ni sur `main`** (publication automatique) ; travailler sur `claude/beta-5`.
7. Chaque tâche ajoute sa ligne au journal ci-dessous.

## Journal des tâches

- Tâche 1 (audit, sécurité et contrat) : terminée le 27 novembre 2026. Branche `claude/beta-5` créée depuis `beta`, contrat du noyau terminé (77 fonctions, 51 ⚠), test « contrat du noyau » ajouté (77 tests réussis), ce tableau de bord écrit. Aucun code de l'appli modifié.
- Tâche 1, second passage (exécution parallèle de la même tâche, terminée le 27 novembre 2026) : la branche existait déjà, rien n'a été écrasé ; ajout des points S17 à S21 et G19 à G21, vérifiés dans le code (S17 et le `NaN` de S10 testés). `npm test` : 77 réussis.
- Tâche 1 (suite, à la demande de Charles) : G5 et G12 répartis entre la tâche 4 (historique et fichiers du jeu) et la tâche 5 (réglages), le 27 novembre 2026.
