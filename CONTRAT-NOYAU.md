# Contrat du noyau — pont `window.tel`

Ce document liste **toutes les fonctions** que l'interface peut appeler (le pont `tel`, défini dans `preload.js`), et ce que chacune fait. C'est le **contrat** entre l'interface et le noyau : la version classique (Electron) et la future version Diamond (Tauri / Rust) doivent toutes les deux le respecter, à l'identique. L'interface ne connaît que ce contrat.

**Règles**

- Toute nouvelle fonction du pont est ajoutée ici en même temps que dans le code, avec sa description.
- Une fonction ne change pas de comportement sans que ce document soit mis à jour.
- Le pont ne donne jamais d'accès libre aux fichiers, aux commandes ou aux adresses : chaque fonction fait une seule chose précise.
- Le test « contrat du noyau » (`tools/verify.test.js`) vérifie que chaque fonction de `preload.js` a son point d'entrée dans `main.js` et sa ligne ici, avec le bon canal. `npm test` échoue sinon.

**Total : 77 fonctions** (72 appels, 5 abonnements à des événements), 77 branchées sur un point d'entrée du noyau. **51 marquées ⚠.**

**État :** terminé le 27 novembre 2026 (tâche 1) : les 77 fonctions sont documentées (rôle vérifié dans le code, paramètres, réponse, erreurs). Numéros de ligne valables pour `main.js` de la branche `claude/beta-5` au 27 novembre ; la tâche qui déplace du code les met à jour. Tâche 2 (mise à jour d'Electron) : numéros de `main.js` décalés de +19 à partir de la ligne 118 (clé Steam passée au chiffrement asynchrone) ; comportement des fonctions inchangé.

## Comment lire ce tableau

- **⚠** : la fonction touche aux fichiers du jeu ou de l'utilisateur, lance un programme ou une commande, va sur Internet, ou manipule des données sensibles (clés, droits, identifiants). À relire avec soin à chaque modification.
- **Formes de réponse** :
  - `{ok, data}` : la réponse est `{ ok: true, data: … }`, ou `{ ok: false, error: "message en français" }` en cas d'échec (jamais d'exception). Utilisé par l'Atelier et `mods.analyser`.
  - `{ok, value}` : pareil avec `value` au lieu de `data`. Utilisé par `acces.*` (sauf `acces.info`).
  - **rejet** : en cas d'échec, la promesse est rejetée (l'interface reçoit une erreur « Error invoking remote method… » suivie du message). L'interface doit faire `try / catch`.
- **Jeu** : `'ets2'` ou `'ats'`. **Id de profil** : `'<jeu>/<profiles|steam_profiles>/<dossier en hexadécimal>'` (ex. `ets2/profiles/4A65616E`) ; tout autre format est refusé (« Profil inconnu. »).
- **Sx / Gx** : renvoi vers un point du `TABLEAU-DE-BORD.md` (S = sécurité, G = audit général).

## Général : état, plugin, paramètres, actualités

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `snapshot()` | appel | `snapshot` | `main.js:502` | État en direct de la télémétrie (jeu connecté, camion, mission, compteurs, historique récent). Appelé toutes les 250 ms par l'interface. | rien | `{connected, socketError, live, job, mission, clockSeconds, thresholds, vehicleType, coach, gforce, session, totals, today, jobs (50 max, sans tracé), lastEvent}` | aucune en pratique (lecture mémoire). Lourd à 4 appels / s → G14 |
| `pluginStatus()` | appel | `plugin:status` | `main.js:504` | Dernier résultat connu de l'installation du plugin dans chaque jeu trouvé (ne relance rien). | rien | liste `[{id, name, dir, bin, status: 'ok'\|'error', message}]` ; vide hors Windows | aucune |
| ⚠ `installPlugin()` | appel | `plugin:install` | `main.js:505` | Copie la DLL du plugin dans `bin/win_x64/plugins` de chaque jeu trouvé (Steam + dossiers choisis), si elle est absente ou différente. | rien | même liste que `pluginStatus()` | pas de rejet : un échec par jeu est dans `status: 'error'` + message (jeu ouvert, droits) |
| ⚠ `chooseGameFolder()` | appel | `plugin:choose` | `main.js:506` | Ouvre la fenêtre Windows de choix de dossier ; si c'est un dossier de jeu, l'ajoute aux réglages et installe le plugin. | rien (dossier choisi par l'utilisateur) | `{ok: true, status}` ou `{ok: false, status, error?}` (annulé, « Ce dossier ne contient pas le jeu. ») | rejet si les réglages ne peuvent pas être écrits |
| `getSettings()` | appel | `settings:get` | `main.js:518` | Renvoie tous les réglages (copie de `reglages.json` en mémoire). | rien | objet complet : `look, hud, modules, games, activeGame, units, steamId, pseudo, discordClientId, customGamePaths, mapTilesets, …` | aucune |
| ⚠ `setSettings(patch)` | appel | `settings:set` | `main.js:687` | Modifie une partie des réglages (seulement les champs envoyés), les enregistre et met à jour le HUD / Discord si besoin. | objet avec une partie de : `vehicleType ('camion'|'car'), limitTruck, limitCar (60–150 entiers), racePct (0–100), pseudo (texte ≤ 32), look, atelier, showSoon, autoTelemetry (vrai/faux), hud ({truck?, bus?}), steamId (17 chiffres), discordClientId (17–20 chiffres), modules ({hud: vrai/faux}), units ('metric'|'imperial')` | les réglages complets | rejet (message en français, rien n'est enregistré) si une clé est inconnue ou si une valeur est invalide : chaque clé est vérifiée (type, liste de valeurs, longueur ; `pseudo` 32 caractères au plus, profils du HUD nettoyés), `patch` non objet refusé (tâche 5, S9) ; rejet aussi si l'écriture échoue (écriture atomique `.tmp` puis renommage, G12) |
| `setGame(game)` | appel | `settings:game` | `main.js:520` | Change le jeu actif : range les réglages de jeu actuels et charge ceux de l'autre jeu. | jeu | les réglages complets (inchangés si jeu invalide ou déjà actif) | rejet si l'écriture échoue |
| `setGameKey(game, key, value)` | appel | `settings:gameKey` | `main.js:521` | Modifie un réglage d'un jeu sans en changer (aujourd'hui seulement `atelier`, outils activés ou non). | jeu, `key = 'atelier'`, `value` (converti en vrai/faux) | les réglages complets (inchangés si clé refusée) | rejet si l'écriture échoue |
| `copyGameSettings(from, to)` | appel | `settings:copyGame` | `main.js:522` | Copie les réglages de jeu d'un jeu vers l'autre (sauf les unités). | deux jeux différents | les réglages complets (inchangés si invalide) | rejet si l'écriture échoue |
| `onSettingsChanged(cb)` | événement | `settings:changed` | `main.js:761 (envoi)` | Prévient l'interface quand le noyau change lui-même les réglages (jeu détecté en cours de partie). | `cb(réglages)` | rien (pas de fonction pour se désabonner → G7) | aucune |
| ⚠ `steamNews(game)` | appel | `news:steam` | `main.js:540` | Annonces officielles Steam du jeu (API publique Steam, HTTPS), nettoyées en texte simple, gardées 30 min. | jeu | `{ok: true, items: [{game, title, text, url (https), date}]}` ou `{ok: false, error}` | jamais de rejet ; réseau absent → `{ok: false}` |

## Analyse des mods (programme séparé tch-mods, GPL-3)

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| ⚠ `mods.analyser(g)` | appel | `mods:analyser` | `main.js:616` | Lit les mods actifs de chaque profil, déchiffre la sauvegarde la plus récente des 3 profils récents dans un dossier temporaire (effacé à la fin) et lance `tch-mods/analyse.js` dans un processus séparé. Lecture seule. | jeu (autre valeur → ETS2) | `{ok, data}` ; `data` = rapport `{mods: [{nom, cle, fichiers, taille, statut: 'vert'\|'orange'\|'rouge', actif, indispensable, source, workshopId, manifest, raisons, requisPar}], manquants, besoins, …}` | `{ok: false, error}` : analyse déjà en cours, programme arrêté. Déchiffrement synchrone → G6 |
| ⚠ `mods.ouvrir(q)` | appel | `mods:ouvrir` | `main.js:617` | Ouvre la page Steam Workshop d'un mod (identifiant numérique seulement) ou affiche le fichier du mod dans l'Explorateur (nom de fichier réduit à son nom simple). | `{game, workshopId?, fichier?}` | valeur brute de Windows (`''` si ouvert, sinon message), ou rien | rejet si le navigateur ne s'ouvre pas |
| `mods.onProgression(cb)` | événement | `mods:progression` | `main.js:367 (envoi)` | Étapes de l'analyse en cours. | `cb({game, etape})` | une fonction pour se désabonner | aucune |

## Nouvelle carte TCH Map (programme séparé, GPL-3)

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| ⚠ `tchMap.start()` | appel | `tchmap:start` | `main.js:606` | Lance (une seule fois) `tch-map/server.js` dans un processus séparé : petit serveur web sur 127.0.0.1, port au hasard, adresse protégée par un jeton secret. Lui envoie les villes. | rien | `{ok: true, url: 'http://127.0.0.1:<port>/<jeton>/'}` ou `{ok: false, error}` | « La carte ne répond pas. » après 15 s ; « Adresse de carte invalide. » |
| `tchMap.visible(on, opts)` | appel | `tchmap:visible` | `main.js:607` | Démarre ou arrête l'envoi en direct (position, mission toutes les 250 ms, tracé toutes les 5 s) vers la carte, seulement quand la page Carte est affichée. | `on` (vrai/faux), `opts = {game?: jeu, follow?: vrai/faux}` | `true` | aucune (sans effet si la carte n'est pas lancée) |
| `tchMap.theme(t)` | appel | `tchmap:theme` | `main.js:608` | Passe les couleurs du thème à la carte. | `{bg, land, border, text, muted, accent, trail}` en `#hex` ; le reste est ignoré | `true` | aucune |
| ⚠ `tchMap.jeuStatut(g)` | appel | `tchmap:jeuStatut` | `main.js:609` | Dit si la carte du jeu (tirée des fichiers du jeu) est à faire, à jour, périmée (jeu ou DLC changés) ou en préparation. Lit la liste des `.scs` du jeu et interroge le registre Windows (chemin de Steam). | jeu (autre valeur → ETS2) | `{game, etat: 'a-faire'\|'a-jour'\|'perimee'\|'en-cours'\|'sans-jeu', version?, date?, villes?, etape?, s?, …}` | aucune. Commande `reg` synchrone → G6 |
| ⚠ `tchMap.preparer(g)` | appel | `tchmap:preparer` | `main.js:610` | Lance l'extraction de la carte depuis les fichiers du jeu (lecture seule des `.scs`) dans un processus séparé ; résultat dans `userData/TCH Map/<jeu>/<date>/` ; réessaie seul en « mode simple » en cas d'échec. | jeu | `{ok: true}` ou `{ok: false, error}` (déjà en cours, jeu introuvable) | rejet si le dossier de sortie ne peut pas être créé ; la suite arrive par `tchMap.onProgression` |
| `tchMap.annuler()` | appel | `tchmap:annuler` | `main.js:611` | Arrête la préparation en cours (sans nouvel essai). | rien | `true` | aucune |
| `tchMap.onProgression(cb)` | événement | `tchmap:progression` | `main.js:272 (envoi)` | Avancement de la préparation de la carte du jeu. | `cb({game, etape, s, mo, fait, total, auto, version, message?})` ; `etape = 'fini'` ou `'erreur'` à la fin | une fonction pour se désabonner | aucune |

## Compte, rangs et clés (aperçu local, AUCUNE protection réelle)

Tout est rangé dans `acces-apercu.json` sur le PC : n'importe qui peut modifier ce fichier. Sert à préparer l'interface ; le futur serveur devra refaire toutes les vérifications → S14.

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `acces.info()` | appel | `acces:info` | `main.js:527` | Liste des permissions possibles et leur libellé. | rien | `{permissions: [[id, libellé], …]}` (sans enveloppe `ok`, voir G21) | aucune |
| ⚠ `acces.session()` | appel | `acces:session` | `main.js:528` | Qui je suis : rang et permissions (aperçu). | rien | `{ok, value}` ; `value = {mode: 'apercu', steamId, rankId, rank, perms, extraPerms}` | `{ok: false, error}` |
| `acces.ranks()` | appel | `acces:ranks` | `main.js:529` | Tous les rangs (rangs de base + rangs créés), du plus haut au plus bas. | rien | `{ok, value: [rang]}` ; rang = `{id, name, color, level, system, perms, scope?}` | `{ok: false, error}` |
| ⚠ `acces.saveRank(r)` | appel | `acces:saveRank` | `main.js:530` | Crée ou modifie un rang (permission `acces.rangs`, niveau plus bas que le sien, pas de permission qu'on n'a pas). | `{id?, name (2–24), color '#rrggbb', level (1–99), perms: [], scope: 'app'\|'vtc'}` | `{ok, value: rang}` | `{ok: false, error}` (nom, couleur, niveau, droits) |
| ⚠ `acces.deleteRank(id)` | appel | `acces:deleteRank` | `main.js:531` | Supprime un rang créé ; ses clés sont désactivées. | id du rang | `{ok, value: true}` | `{ok: false, error: 'Tu ne peux pas supprimer ce rang.'}` |
| ⚠ `acces.keys()` | appel | `acces:keys` | `main.js:532` | Liste des clés d'activation créées (permission `acces.cles`). | rien | `{ok, value: [{key, grant, createdAt, uses, revoked}]}` | `{ok: false, error: 'Ton rang ne le permet pas.'}` |
| ⚠ `acces.createKeys(n, grant)` | appel | `acces:createKeys` | `main.js:533` | Crée des clés `TCH-XXXX-XXXX-XXXX-C` qui donnent un rang et/ou des permissions. | `n` (1–50), `grant = {rank?, perms: [], expiresAt?, maxUses (1–1000)}` | `{ok, value: [clé]}` | `{ok: false, error}` (droits, rang trop haut, valeurs) |
| ⚠ `acces.revokeKey(k)` | appel | `acces:revokeKey` | `main.js:534` | Désactive une clé. | texte de la clé | `{ok, value: true}` | `{ok: false, error: 'Clé inconnue.'}` |
| ⚠ `acces.redeem(k)` | appel | `acces:redeem` | `main.js:535` | Utilise une clé : vérifie le format (caractère de contrôle), l'existence, l'expiration, le nombre d'utilisations ; ne fait jamais descendre de rang. | texte de la clé (minuscules, espaces et O/0, I/1 tolérés) | `{ok, value: {rank, perms}}` | `{ok: false, error}` (mal écrite, inconnue, désactivée, expirée, déjà utilisée) |
| ⚠ `acces.previewAs(id)` | appel | `acces:previewAs` | `main.js:536` | Aperçu : se met dans la peau de n'importe quel rang, Fondateur compris, pour voir l'interface. | id du rang (inconnu → Membre) | `{ok, value: session}` | `{ok: false, error}` ; ne doit jamais exister côté serveur → S14 |
| ⚠ `acces.reset()` | appel | `acces:reset` | `main.js:537` | Efface tout l'aperçu local (rangs, clés, rang actuel → Fondateur). | rien | `{ok, value: true}` | `{ok: false, error}` |
| ⚠ `acces.vtc()` | appel | `acces:vtc` | `main.js:538` | Lit la VTC du joueur sur l'API publique TruckersMP (HTTPS) à partir du SteamID des réglages. | rien | `{ok, value: {found, vtc: {platform, vtcId, name, tag, memberId, player, role} \| null, reason?}}` | `{ok: false, error}` (SteamID absent, TruckersMP indisponible) |

## Intégrations, mises à jour, jeu et HUD

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `integrationStatus()` | appel | `integration:status` | `main.js:543` | Dit si une clé Steam est enregistrée (sans la révéler) et quel ID Discord est utilisé. | rien | `{steamKeyConfigured, discordClientId}` | rejet si `integrations.json` est illisible |
| ⚠ `setSteamApiKey(key)` | appel | `steam:key:set` | `main.js:547` | Enregistre la clé Steam Web API, chiffrée par Windows (`safeStorage`, fonctions asynchrones depuis la tâche 2) dans `integrations.json`. | 32 caractères hexadécimaux | `{configured: true}` | rejet : format faux, chiffrement du système indisponible |
| ⚠ `clearSteamApiKey()` | appel | `steam:key:clear` | `main.js:552` | Supprime la clé Steam enregistrée (et le fichier s'il devient vide). | rien | `{configured: false}` | rejet si le fichier est illisible |
| ⚠ `steamProfile()` | appel | `steam:profile` | `main.js:553` | Lit le profil Steam public (pseudo, avatar, heures sur ETS2 / ATS) avec la clé et le SteamID enregistrés (HTTPS, 10 s max). | rien | `{name, profileUrl, avatarUrl, games: [{id, name, owned, playtimeHours}]}` | rejet : pas de clé, SteamID invalide, profil privé, délai dépassé |
| ⚠ `testDiscordPresence(clientId)` | appel | `discord:test` | `main.js:558` | Se connecte à Discord sur ce PC avec l'ID d'application donné et affiche un statut de test. | ID Discord (17–20 chiffres) | `{ok: true}` ou `{ok: false, error}` (Discord fermé, ID invalide) | pas de rejet. Change l'ID utilisé sans l'enregistrer (rétabli au prochain démarrage) |
| `systemAccent()` | appel | `system:accent` | `main.js:560` | Couleur d'accentuation de Windows. | rien | `'#RRGGBB'` ou `null` | aucune |
| `onSystemAccent(cb)` | événement | `system:accent` | `main.js:771 (envoi)` | Prévient quand la couleur d'accentuation de Windows change (Windows seulement). | `cb('#RRGGBB' \| null)` | rien (pas de désabonnement → G7) | aucune |
| `updateStatus()` | appel | `update:status` | `main.js:647` | État de la mise à jour automatique. | rien | `{state: 'dev'\|'idle'\|'checking'\|'none'\|'available'\|'downloading'\|'ready'\|'error'\|'failed', version, progress?, notes?, current}` | aucune |
| ⚠ `checkUpdate()` | appel | `update:check` | `main.js:648` | Cherche une nouvelle version sur GitHub Releases (canal `beta` pour la bêta). | rien | même forme que `updateStatus()` | pas de rejet : échec → `state: 'error'` (le message d'erreur est perdu) |
| ⚠ `downloadUpdate()` | appel | `update:download` | `main.js:655` | Télécharge l'installeur de la nouvelle version (vérifié par empreinte sha512, pas par signature → S7). | rien | `true` si lancé, `false` sinon | échec → `state: 'failed'` |
| ⚠ `installUpdate()` | appel | `update:install` | `main.js:664` | Arrête la télémétrie, puis 1,2 s après installe en silence et relance l'appli. | rien | `true` si programmé, `false` si rien n'est prêt | aucune |
| ⚠ `launchGame(game)` | appel | `game:launch` | `main.js:671` | Vérifie / installe le plugin puis lance le jeu par Steam (`steam://rungameid/…`). | jeu | `{ok: true, status}` ou `{ok: false, error, status?}` | pas de rejet (« Jeu inconnu. », « Steam ne s'est pas ouvert. ») |
| ⚠ `openLink(key)` | appel | `link:open` | `main.js:678` | Ouvre un lien connu dans le navigateur, désigné par une clé (jamais une adresse libre), ou le dossier des mods. | `'truckersmp'\|'trucky'\|'trucksbook'\|'haulmp'\|'github'\|'mods'` | `true` si ouvert, `false` sinon | rejet si le navigateur ne s'ouvre pas. `'mods'` ouvre toujours le dossier d'ETS2, même sur ATS → G16 |
| `testHud()` | appel | `hud:test` | `main.js:503` | Affiche le HUD 10 s avec des données de démonstration. | rien | `true` | aucune |
| `onHud(cb)` | événement | `hud` | `main.js:479 (envoi)` | Données du HUD toutes les 200 ms quand il est visible. Réservé à la fenêtre `hud.html`. | `cb({…snapshot, options, units, game, show})` | rien (pas de désabonnement → G7) | aucune |
| ⚠ `gameContent()` | appel | `game:content` | `main.js:488` | Inventaire du jeu installé : archives `.scs` (DLC), mods, version lue dans `game.log.txt`. Un seul scan à la fois. | rien | `{checkedAt, games: {ets2, ats}}` ; chaque jeu = `{id, name, installed, dir, files, mods, modsError, log, version, fingerprint, …}` | rejet en cas d'erreur de lecture inattendue |
| `telemetryCapabilities()` | appel | `telemetry:capabilities` | `main.js:492` | Diagnostic : ce que le plugin envoie vraiment (champs car, camion, pause obligatoire…). | rien | `{connected, plugin, localScale, busJob, busFields, vehicleType, coachVehicle, vehicleId, vehicleName, busJobFields, truckFields, otherConfigs, mandatoryBreak, coach}` | aucune |

## Ancienne carte et cache

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `map.info()` | appel | `map:info` | `main.js:563` | Réglages de l'ancienne carte (tuiles TsMap) pour chaque jeu. | rien | `{ets2: {dir, x1, x2, y1, y2, tileSize, minZoom, maxZoom, version, localGenerated}, ats: {…}}` | aucune |
| ⚠ `map.selectTileset(game)` | appel | `map:selectTileset` | `main.js:564` | Fait choisir un dossier exporté par TsMap, le vérifie (`TileMapInfo.json`, première tuile) et l'enregistre. Les tuiles sont ensuite lues par le protocole `tchmap://`. | jeu | `{canceled: true}` ou `{canceled: false, info, selected}` | rejet : jeu inconnu, dossier invalide, réglages non enregistrés (l'ancien choix est remis) |
| `map.useLegacy(game)` | appel | `map:useLegacy` | `main.js:588` | Revient aux tuiles téléchargées (oublie le dossier TsMap choisi). | jeu | même forme que `map.info()` | rejet : jeu inconnu, réglages non enregistrés |
| `map.history()` | appel | `map:history` | `main.js:604` | Tracé de la session et des 40 dernières missions, pour la carte. | rien | `{game, trail, current, jobs: [{from, to, game, status, ended, distance, mode, path}], live}` | aucune |
| `map.cache()` | appel | `map:cache` | `main.js:612` | Taille du cache des tuiles téléchargées. | rien | `{bytes, files}` | aucune (parcours synchrone de tout le cache → G14) |
| ⚠ `map.clearCache()` | appel | `map:clearCache` | `main.js:613` | Supprime le dossier `userData/Carte (cache)` (chemin fixe). | rien | `{bytes, files}` après suppression | rejet si la suppression échoue |

## Atelier : profils, sauvegardes, éditeur, console, caméras, convoi

Toutes ces fonctions répondent `{ok, data}` (jamais de rejet). Les modifications refusent de s'exécuter si le jeu est ouvert, et font une copie de secours avant d'écrire.

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| ⚠ `atelier.status()` | appel | `atelier:status` | `main.js:626` | Pour chaque jeu : dossier « Documents » présent, jeu en cours d'exécution (commande Windows `tasklist`). | rien | `data = {ets2: {installed, running}, ats: {…}}` | `{ok: false, error}`. `tasklist` synchrone, 2 fois → G6 |
| ⚠ `atelier.profiles()` | appel | `atelier:profiles` | `main.js:627` | Liste les profils des deux jeux (`profiles` et `steam_profiles`), avec leur vrai nom et les copies faites par le Hub. | rien | `data = [{id, game, gameName, kind, folder, name, cloud, modified, backups: [{name, label}]}]`, du plus récent au plus ancien | `{ok: false, error}` |
| ⚠ `atelier.duplicate(id, name)` | appel | `atelier:duplicate` | `main.js:628` | Copie un profil sous un nouveau nom (toujours dans `profiles`, jamais dans le Steam Cloud). | id de profil, nom (1–30 caractères, sans caractère de contrôle) | `data = {id, name}` | jeu ouvert, profil introuvable, nom déjà pris, « Copie annulée : … » (la copie ratée est effacée) |
| ⚠ `atelier.analyze(id)` | appel | `atelier:analyze` | `main.js:629` | Vérifie si `profile.sii` et chaque sauvegarde sont corrompus (lecture seule ; lance l'outil de déchiffrement `decrypt_truck`). | id de profil | `data = {id, running, tool, profile, slots: [{slot, label, modified, status, files}], ok, warn, bad, at}` | profil introuvable |
| ⚠ `atelier.backup(id)` | appel | `atelier:backup` | `main.js:630` | Copie tout le dossier du profil dans `userData/Sauvegardes de profils/…/<date>`. | id de profil | `data = 'AAAA-MM-JJ_HH-MM-SS'` (nom de la copie) | profil introuvable. Deux copies dans la même seconde se mélangent → G18 |
| ⚠ `atelier.restore(id, name)` | appel | `atelier:restore` | `main.js:631` | Remet une copie à la place du profil (le profil actuel est d'abord copié « Avant restauration »). Supprime puis recopie le dossier du profil. | id de profil, nom de copie (chiffres, `_`, `-`) | `data = true` | jeu ouvert, copie inconnue ou introuvable |
| ⚠ `atelier.deleteBackup(id, name)` | appel | `atelier:deleteBackup` | `main.js:632` | Supprime une copie faite par le Hub (ne touche pas au jeu). | id de profil, nom de copie | `data = true` | copie inconnue ou introuvable |
| ⚠ `atelier.deleteProfile(id)` | appel | `atelier:deleteProfile` | `main.js:633` | Supprime un profil du jeu après une copie « Avant suppression » (récupérable dans « Profils supprimés »). Refuse les profils Steam Cloud. | id de profil | `data = {backupName}` | jeu ouvert, profil Steam Cloud, profil introuvable |
| ⚠ `atelier.deletedProfiles()` | appel | `atelier:deletedProfiles` | `main.js:634` | Profils qui n'existent plus dans le jeu mais dont le Hub garde des copies. | rien | `data = [{id, game, gameName, kind, folder, name, cloud, backups}]` | `{ok: false, error}` |
| ⚠ `atelier.purgeDeleted(id)` | appel | `atelier:purgeDeleted` | `main.js:635` | Efface définitivement toutes les copies d'un profil déjà supprimé. | id de profil | `data = true` | profil encore présent, aucune copie |
| ⚠ `atelier.openBackups()` | appel | `atelier:openBackups` | `main.js:636` | Ouvre le dossier des copies du Hub dans l'Explorateur (le crée si besoin). | rien | `data = true` | `{ok: false, error}` |
| ⚠ `atelier.consoleState(game)` | appel | `atelier:console` | `main.js:637` | Lit dans `config.cfg` si la console de développement est activée. | jeu | `data = {found, enabled}` | jeu invalide → message technique anglais → S11 |
| `atelier.editorInfo()` | appel | `atelier:editorInfo` | `main.js:638` | L'outil de déchiffrement est-il là, et liste des compétences camion / car modifiables. | rien | `data = {available, truckSkills, coachSkills}` | aucune |
| ⚠ `atelier.slots(id)` | appel | `atelier:slots` | `main.js:639` | Liste les sauvegardes d'un profil avec leur nom (déchiffre chaque `info.sii`). | id de profil | `data = [{slot, label, name, modified}]` | profil inconnu. Déchiffrement synchrone, un par sauvegarde → G6 |
| ⚠ `atelier.summary(id, slot)` | appel | `atelier:summary` | `main.js:640` | Bilan d'une sauvegarde (argent, XP, compétences, villes, flotte, usure, alertes, outils disponibles). Lecture seule. | id de profil, nom de sauvegarde (lettres, chiffres, `_`, `-`) | `data = {profileName, companyName, bilan, tools, money, xp, busXp, skills, coachSkills, visitedCities, totalCities, …}` | sauvegarde inconnue, déchiffrement impossible |
| ⚠ `atelier.apply(id, slot, edits)` | appel | `atelier:apply` | `main.js:641` | Modifie une sauvegarde (argent, XP, compétences, villes, réparations, carburant, plaques, camion, garages, téléportation…) après une copie « Avant modification ». Réécrit `game.sii`, `info.sii` et `profile.sii` en texte clair. | id, sauvegarde, `edits` = objet avec seulement les clés autorisées (`profileName, companyName, money, xp, busXp, skills, coachSkills, visitAllCities, discoverBusStops, repairAll, refuelAll` + clés des outils) | `data = {report: [liste des changements], backupName}` | jeu ouvert, sauvegarde non modifiable, aucune modification, résultat invalide. Nombres non vérifiés (`NaN` possible) → S10 ; écriture non atomique → G12 ; un `$` dans un nom est mal écrit → S17 |
| ⚠ `atelier.setConsole(game, on)` | appel | `atelier:setConsole` | `main.js:646` | Active / désactive la console de développement dans `config.cfg` (copie `config.cfg.avant-truck-coach-hub` avant). | jeu, vrai/faux | `data = {found, enabled}` | jeu ouvert, `config.cfg` absent, jeu invalide → S11 |
| ⚠ `atelier.cams(game)` | appel | `atelier:cams` | `main.js:642` | Positions enregistrées en jeu avec Alt+F12 (`cams.txt`), pour la téléportation. | jeu | `data = {found, positions, modified}` | « Jeu inconnu. » |
| ⚠ `atelier.copyConfig(from, to, files)` | appel | `atelier:copyConfig` | `main.js:643` | Copie des fichiers de réglages d'un profil à un autre (même entre ETS2 et ATS), après une copie du profil cible. | deux id de profil, `files` ⊂ `['controls', 'config', 'local']` (vide = tous) | `data = {copied: [noms de fichiers]}` | jeu ouvert, mêmes profils, aucun fichier |
| ⚠ `atelier.convoy(game)` | appel | `atelier:convoy` | `main.js:644` | Lit le nombre de places en convoi (`g_max_convoy_size` dans `config.cfg`). | jeu | `data = {found, size}` | jeu invalide → S11 |
| ⚠ `atelier.setConvoy(game, big)` | appel | `atelier:setConvoy` | `main.js:645` | Règle le convoi à 128 places (`big` vrai) ou 8 (copie de `config.cfg` avant). | jeu, vrai/faux | `data = {found, size}` | jeu ouvert, `config.cfg` absent, jeu invalide → S11 |
