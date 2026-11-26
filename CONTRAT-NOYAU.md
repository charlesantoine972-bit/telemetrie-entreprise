# Contrat du noyau — pont `window.tel`

Ce document liste **toutes les fonctions** que l'interface peut appeler (le pont `tel`, défini dans `preload.js`), et ce que chacune fait. C'est le **contrat** entre l'interface et le noyau : la version classique (Electron) et la future version Diamond (Tauri / Rust) doivent toutes les deux le respecter, à l'identique. L'interface ne connaît que ce contrat.

**Règles**

- Toute nouvelle fonction du pont est ajoutée ici en même temps que dans le code, avec sa description.
- Une fonction ne change pas de comportement sans que ce document soit mis à jour.
- Le pont ne donne jamais d'accès libre aux fichiers, aux commandes ou aux adresses : chaque fonction fait une seule chose précise.

**Total : 77 fonctions** (72 appels, 5 abonnements à des événements), 77 branchées sur un point d'entrée du noyau.

**État :** première partie rédigée le 26 novembre 2026 : liste complète des fonctions et des canaux (générée depuis le code) et rôle de la section Général, déduit des noms : **à vérifier** dans le code. Les colonnes *Reçoit / Renvoie / Erreurs* et les autres sections sont à compléter par la tâche 1 du 27 novembre, en lisant chaque point d'entrée dans `main.js`.


## Général, paramètres, intégrations, mises à jour, jeu et HUD

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `snapshot()` | appel | `snapshot` | `main.js:481` | Renvoie l'état instantané de l'appli (jeu détecté, télémétrie, plugin) pour remplir l'écran. | à compléter | à compléter | à compléter |
| `pluginStatus()` | appel | `plugin:status` | `main.js:483` | Indique si le plugin de télémétrie est installé dans le jeu. | à compléter | à compléter | à compléter |
| `installPlugin()` | appel | `plugin:install` | `main.js:484` | Installe le plugin de télémétrie dans le dossier du jeu. | à compléter | à compléter | à compléter |
| `chooseGameFolder()` | appel | `plugin:choose` | `main.js:485` | Ouvre une fenêtre pour choisir à la main le dossier du jeu. | à compléter | à compléter | à compléter |
| `getSettings()` | appel | `settings:get` | `main.js:497` | Renvoie tous les paramètres de l'appli. | à compléter | à compléter | à compléter |
| `setSettings(patch)` | appel | `settings:set` | `main.js:666` | Modifie une partie des paramètres (seulement les champs envoyés). | à compléter | à compléter | à compléter |
| `setGame(game)` | appel | `settings:game` | `main.js:499` | Choisit le jeu actif (ETS2 ou ATS) et charge ses paramètres. | à compléter | à compléter | à compléter |
| `setGameKey(game, key, value)` | appel | `settings:gameKey` | `main.js:500` | Modifie un réglage propre à un jeu (ETS2 ou ATS). | à compléter | à compléter | à compléter |
| `copyGameSettings(from, to)` | appel | `settings:copyGame` | `main.js:501` | Copie les réglages d'un jeu vers l'autre. | à compléter | à compléter | à compléter |
| `onSettingsChanged(cb)` | événement | `settings:changed` | `main.js:742 (envoi)` | Prévient l'interface quand les paramètres changent. | à compléter | à compléter | à compléter |
| `steamNews(game)` | appel | `news:steam` | `main.js:519` | Renvoie les dernières actualités Steam du jeu demandé. | à compléter | à compléter | à compléter |

## Analyse des mods (programme séparé)

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `mods.analyser(g)` | appel | `mods:analyser` | `main.js:595` | à compléter | à compléter | à compléter | à compléter |
| `mods.ouvrir(q)` | appel | `mods:ouvrir` | `main.js:596` | à compléter | à compléter | à compléter | à compléter |
| `mods.onProgression(cb)` | événement | `mods:progression` | `main.js:348 (envoi)` | à compléter | à compléter | à compléter | à compléter |

## Nouvelle carte TCH Map (programme séparé, GPL-3)

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `tchMap.start()` | appel | `tchmap:start` | `main.js:585` | à compléter | à compléter | à compléter | à compléter |
| `tchMap.visible(on, opts)` | appel | `tchmap:visible` | `main.js:586` | à compléter | à compléter | à compléter | à compléter |
| `tchMap.theme(t)` | appel | `tchmap:theme` | `main.js:587` | à compléter | à compléter | à compléter | à compléter |
| `tchMap.jeuStatut(g)` | appel | `tchmap:jeuStatut` | `main.js:588` | à compléter | à compléter | à compléter | à compléter |
| `tchMap.preparer(g)` | appel | `tchmap:preparer` | `main.js:589` | à compléter | à compléter | à compléter | à compléter |
| `tchMap.annuler()` | appel | `tchmap:annuler` | `main.js:590` | à compléter | à compléter | à compléter | à compléter |
| `tchMap.onProgression(cb)` | événement | `tchmap:progression` | `main.js:253 (envoi)` | à compléter | à compléter | à compléter | à compléter |

## Compte, rangs et clés (aperçu local)

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `acces.info()` | appel | `acces:info` | `main.js:506` | à compléter | à compléter | à compléter | à compléter |
| `acces.session()` | appel | `acces:session` | `main.js:507` | à compléter | à compléter | à compléter | à compléter |
| `acces.ranks()` | appel | `acces:ranks` | `main.js:508` | à compléter | à compléter | à compléter | à compléter |
| `acces.saveRank(r)` | appel | `acces:saveRank` | `main.js:509` | à compléter | à compléter | à compléter | à compléter |
| `acces.deleteRank(id)` | appel | `acces:deleteRank` | `main.js:510` | à compléter | à compléter | à compléter | à compléter |
| `acces.keys()` | appel | `acces:keys` | `main.js:511` | à compléter | à compléter | à compléter | à compléter |
| `acces.createKeys(n, grant)` | appel | `acces:createKeys` | `main.js:512` | à compléter | à compléter | à compléter | à compléter |
| `acces.revokeKey(k)` | appel | `acces:revokeKey` | `main.js:513` | à compléter | à compléter | à compléter | à compléter |
| `acces.redeem(k)` | appel | `acces:redeem` | `main.js:514` | à compléter | à compléter | à compléter | à compléter |
| `acces.previewAs(id)` | appel | `acces:previewAs` | `main.js:515` | à compléter | à compléter | à compléter | à compléter |
| `acces.reset()` | appel | `acces:reset` | `main.js:516` | à compléter | à compléter | à compléter | à compléter |
| `acces.vtc()` | appel | `acces:vtc` | `main.js:517` | à compléter | à compléter | à compléter | à compléter |

## Général, paramètres, intégrations, mises à jour, jeu et HUD

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `integrationStatus()` | appel | `integration:status` | `main.js:522` | Renvoie l'état des intégrations (Steam, Discord). | à compléter | à compléter | à compléter |
| `setSteamApiKey(key)` | appel | `steam:key:set` | `main.js:526` | Enregistre la clé d'API Steam (chiffrée sur le PC). | à compléter | à compléter | à compléter |
| `clearSteamApiKey()` | appel | `steam:key:clear` | `main.js:531` | Supprime la clé d'API Steam enregistrée. | à compléter | à compléter | à compléter |
| `steamProfile()` | appel | `steam:profile` | `main.js:532` | Renvoie le profil Steam de l'utilisateur. | à compléter | à compléter | à compléter |
| `testDiscordPresence(clientId)` | appel | `discord:test` | `main.js:537` | Teste l'affichage du statut Discord (Rich Presence). | à compléter | à compléter | à compléter |
| `systemAccent()` | appel | `system:accent` | `main.js:539` | Renvoie la couleur d'accentuation de Windows. | à compléter | à compléter | à compléter |
| `onSystemAccent(cb)` | événement | `system:accent` | `main.js:752 (envoi)` | Prévient l'interface quand la couleur d'accentuation de Windows change. | à compléter | à compléter | à compléter |
| `updateStatus()` | appel | `update:status` | `main.js:626` | Renvoie l'état de la mise à jour automatique. | à compléter | à compléter | à compléter |
| `checkUpdate()` | appel | `update:check` | `main.js:627` | Cherche une nouvelle version. | à compléter | à compléter | à compléter |
| `downloadUpdate()` | appel | `update:download` | `main.js:634` | Télécharge la nouvelle version. | à compléter | à compléter | à compléter |
| `installUpdate()` | appel | `update:install` | `main.js:643` | Installe la nouvelle version et redémarre l'appli. | à compléter | à compléter | à compléter |
| `launchGame(game)` | appel | `game:launch` | `main.js:650` | Lance le jeu demandé (via Steam). | à compléter | à compléter | à compléter |
| `openLink(key)` | appel | `link:open` | `main.js:657` | Ouvre un lien externe connu, désigné par une clé (pas une adresse libre). | à compléter | à compléter | à compléter |
| `testHud()` | appel | `hud:test` | `main.js:482` | Affiche le HUD avec des données de test. | à compléter | à compléter | à compléter |
| `onHud(cb)` | événement | `hud` | `main.js:460 (envoi)` | Envoie en continu les données du HUD à l'interface. | à compléter | à compléter | à compléter |
| `gameContent()` | appel | `game:content` | `main.js:467` | Renvoie le contenu du jeu détecté (DLC, cartes…). | à compléter | à compléter | à compléter |
| `telemetryCapabilities()` | appel | `telemetry:capabilities` | `main.js:471` | Indique quelles données de télémétrie sont disponibles. | à compléter | à compléter | à compléter |

## Ancienne carte et cache

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `map.info()` | appel | `map:info` | `main.js:542` | à compléter | à compléter | à compléter | à compléter |
| `map.selectTileset(game)` | appel | `map:selectTileset` | `main.js:543` | à compléter | à compléter | à compléter | à compléter |
| `map.useLegacy(game)` | appel | `map:useLegacy` | `main.js:567` | à compléter | à compléter | à compléter | à compléter |
| `map.history()` | appel | `map:history` | `main.js:583` | à compléter | à compléter | à compléter | à compléter |
| `map.cache()` | appel | `map:cache` | `main.js:591` | à compléter | à compléter | à compléter | à compléter |
| `map.clearCache()` | appel | `map:clearCache` | `main.js:592` | à compléter | à compléter | à compléter | à compléter |

## Atelier : profils, sauvegardes, éditeur, console, caméras, convoi

| Fonction | Type | Canal | Point d'entrée | Rôle | Reçoit | Renvoie | Erreurs |
|---|---|---|---|---|---|---|---|
| `atelier.status()` | appel | `atelier:status` | `main.js:605` | à compléter | à compléter | à compléter | à compléter |
| `atelier.profiles()` | appel | `atelier:profiles` | `main.js:606` | à compléter | à compléter | à compléter | à compléter |
| `atelier.duplicate(id, name)` | appel | `atelier:duplicate` | `main.js:607` | à compléter | à compléter | à compléter | à compléter |
| `atelier.analyze(id)` | appel | `atelier:analyze` | `main.js:608` | à compléter | à compléter | à compléter | à compléter |
| `atelier.backup(id)` | appel | `atelier:backup` | `main.js:609` | à compléter | à compléter | à compléter | à compléter |
| `atelier.restore(id, name)` | appel | `atelier:restore` | `main.js:610` | à compléter | à compléter | à compléter | à compléter |
| `atelier.deleteBackup(id, name)` | appel | `atelier:deleteBackup` | `main.js:611` | à compléter | à compléter | à compléter | à compléter |
| `atelier.deleteProfile(id)` | appel | `atelier:deleteProfile` | `main.js:612` | à compléter | à compléter | à compléter | à compléter |
| `atelier.deletedProfiles()` | appel | `atelier:deletedProfiles` | `main.js:613` | à compléter | à compléter | à compléter | à compléter |
| `atelier.purgeDeleted(id)` | appel | `atelier:purgeDeleted` | `main.js:614` | à compléter | à compléter | à compléter | à compléter |
| `atelier.openBackups()` | appel | `atelier:openBackups` | `main.js:615` | à compléter | à compléter | à compléter | à compléter |
| `atelier.consoleState(game)` | appel | `atelier:console` | `main.js:616` | à compléter | à compléter | à compléter | à compléter |
| `atelier.editorInfo()` | appel | `atelier:editorInfo` | `main.js:617` | à compléter | à compléter | à compléter | à compléter |
| `atelier.slots(id)` | appel | `atelier:slots` | `main.js:618` | à compléter | à compléter | à compléter | à compléter |
| `atelier.summary(id, slot)` | appel | `atelier:summary` | `main.js:619` | à compléter | à compléter | à compléter | à compléter |
| `atelier.apply(id, slot, edits)` | appel | `atelier:apply` | `main.js:620` | à compléter | à compléter | à compléter | à compléter |
| `atelier.setConsole(game, on)` | appel | `atelier:setConsole` | `main.js:625` | à compléter | à compléter | à compléter | à compléter |
| `atelier.cams(game)` | appel | `atelier:cams` | `main.js:621` | à compléter | à compléter | à compléter | à compléter |
| `atelier.copyConfig(from, to, files)` | appel | `atelier:copyConfig` | `main.js:622` | à compléter | à compléter | à compléter | à compléter |
| `atelier.convoy(game)` | appel | `atelier:convoy` | `main.js:623` | à compléter | à compléter | à compléter | à compléter |
| `atelier.setConvoy(game, big)` | appel | `atelier:setConvoy` | `main.js:624` | à compléter | à compléter | à compléter | à compléter |

## Test du contrat (à ajouter par la tâche 1)

Un test dans `tools/verify.test.js` doit vérifier que chaque canal de `preload.js` a bien un point d'entrée `ipcMain.handle` (ou un envoi) dans le noyau, et que chaque fonction du pont figure dans ce document. Ainsi, le contrat ne peut plus se désynchroniser du code.
