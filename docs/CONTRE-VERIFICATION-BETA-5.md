# Contre-vérification de sécurité — bêta 5 (ex-tâche 8)

Date : 27 novembre 2026. Comparaison `origin/beta...claude/beta-5` (130 fichiers). Faite en deux parties :
1. un **agent séparé**, qui n'avait pas vu le travail, en lecture seule (rien modifié, poussé ni commenté) ;
2. mes propres contrôles : relecture du diff (`main.js`, `preload.js`, `src/`, `.github/`, `package.json`), `npm audit --omit=dev`, contrôle § 6 de la refonte.

## Résumé par gravité

| Gravité | N° | Constat | Nouveau ? | Ce qui a été fait |
|---|---|---|---|---|
| Critique | — | aucun | — | — |
| Haut | — | aucun | — | — (aucune désactivation nécessaire) |
| Moyen | M1 | Pont IPC : aucun contrôle de l'expéditeur (S2), le HUD reçoit tout le pont (S3), navigation vers tout `file://` acceptée (S18) | déjà dans `beta` | noté (à traiter plus tard) |
| Moyen | M2 | Mise à jour automatique non signée (S7) | déjà dans `beta` | noté |
| Moyen | M3 | Workflow de publication : pas de `npm test`, actions non épinglées par empreinte, `contents: write` global (S8, S21) | déjà dans `beta` | noté |
| Faible | F1 | CSP `script-src 'unsafe-inline'` (inchangée), `onclick` en ligne dans `outils.js`, script en ligne dans `hud.html` (S4) | déjà | noté |
| Faible | F2 | Iframe de la carte : `allow-popups`, `frame-src http://127.0.0.1:*` (S5) | déjà | noté |
| Faible | F3 | `shell.openExternal` accepte toute adresse `https://` (S6) | déjà | noté |
| Faible | F4 | Rechiffrement de la clé Steam : écriture non atomique de `integrations.json`, erreur ignorée (S22) | nouveau (tâche 2) | noté |
| Faible | F5 | Écriture « atomique » de `reglages.json` sans `fsync`, nom `.tmp` fixe | nouveau (tâche 5) | noté |
| Faible | F6 | Nouveau canal `journal` (lecture seule, au contrat) aussi exposé à la fenêtre du HUD | nouveau (étape C) | noté (réglé avec S3) |
| Faible | F7 | `npm audit` : 6 moyennes (`minimatch`, outils de construction seulement) ; `--omit=dev` : 0 | 18 → 6 | noté |
| Faible | F8 | `register-scheme` (dépendance optionnelle de discord-rpc) résolu en `git+ssh` sans `integrity` | déjà | noté |
| Info | F9 | Electron 45.5.0 : dans la fenêtre de maintenance (3 dernières majeures) d'après le calendrier connu | mise à jour | — |

**Aucun problème Haut ou Critique : rien n'a été désactivé.** Aucune porte dérobée, aucun envoi de données vers une adresse inconnue, aucun `eval` / `new Function`, aucun secret, aucune dépendance inattendue (les 33 nouveaux paquets viennent d'Electron 45 et d'electron-builder 26), police chargée en local, CSP inchangée, `contextIsolation`, `sandbox`, pas de `nodeIntegration`, permissions web refusées.

## Détail

### M1 — Pont IPC (S2, S3, S18)
`main.js` : les `ipcMain.handle` ne vérifient pas `event.senderFrame` ; `hudWin` charge `preload.js` complet ; `will-navigate` accepte tout `file://`. Il faudrait d'abord une faille XSS (aucune trouvée dans le nouveau code : les textes venant de la sauvegarde, de la télémétrie et du journal passent par `escM` / `entEsc`). Correction : fonction `handle()` qui contrôle l'expéditeur, `preload-hud.js` limité à `onHud`, navigation limitée aux deux pages.

### M2 — Mise à jour non signée (S7)
`electron-updater` 6.8.11 ne vérifie que l'empreinte sha512 publiée sur la même Release. Correction : signature de code + `publisherName`, double authentification GitHub, branches protégées.

### M3 — Workflow `release.yml` (S8, S21)
Pas de `npm test` avant `npm run release`, `actions/checkout@v4` / `setup-node@v4` par étiquette, `permissions: contents: write` au niveau global. Pas de `pull_request_target`. Correction : `npm test`, actions épinglées par SHA, environnement « publication » avec approbation.

### F1 à F8
Voir le tableau ; corrections proposées : écouteurs à la place des `onclick` puis retrait de `'unsafe-inline'` (F1), retrait de `allow-popups` et `frame-src` au port réel (F2), liste blanche de domaines (F3), écriture `.tmp` + renommage + lecture protégée pour `integrations.json` (F4), `fsyncSync` avant renommage (F5), pont réduit pour le HUD (F6), attendre une version d'electron-builder corrigée (F7), `overrides` pour exclure `register-scheme` (F8).

## Points « corrigé » du tableau de bord, contre-vérifiés
S1 (Electron 45.5.0) : **vrai**. S9 (réglages vérifiés) : **vrai**. S16 (fuses) : **vrai dans la configuration** (exécutable Windows non inspecté). G1 (découpage) : **vrai**. G5 / G12 partie réglages : **vrai** (G12 : sans `fsync`, voir F5). Points laissés ouverts (S2 à S8, S18, S21, S22) : toujours présents, comme annoncé.

## Mes propres contrôles
- `npm audit --omit=dev` : 0 vulnérabilité. `npm audit` : 6 moyennes (F7).
- Relecture du diff du noyau : seul ajout au pont = `journal()` (lecture seule, déclaré au contrat, testé) ; le reste du diff noyau vient des tâches 2 et 5 (Electron, clé Steam asynchrone, réglages vérifiés et protégés).
- Contrôle § 6 de la refonte : pas de problème de sécurité ; écarts d'apparence notés dans `TABLEAU-DE-BORD.md` (« Bêta 5 : à finir »).
