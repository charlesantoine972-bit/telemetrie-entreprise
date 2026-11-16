# Télémétrie Entreprise

Application de suivi pour une entreprise virtuelle sur **Euro Truck Simulator 2** : classement des chauffeurs (km chargés / à vide), carte en direct, fiche chauffeur et tablette in-game.

> Version actuelle : **0.4** — menu par catégories (Général / Entreprise / En jeu / Options), page Accueil avec lancement du jeu, télémétrie branchée sur le jeu.
> Les pages « Aperçu » utilisent des données d'exemple ; les pages « Bientôt » décrivent les fonctions à venir.

## Comment ça marche

- `plugin/` : petit plugin du jeu (DLL, SDK officiel SCS). Il envoie les infos du camion à l'application en local (UDP 127.0.0.1:47311), environ 10 fois par seconde. Il n'affiche rien et ne modifie rien dans le jeu.
- L'application installe le plugin automatiquement dans Euro Truck Simulator 2 et American Truck Simulator (toutes les bibliothèques Steam), et le remet si une mise à jour du jeu l'a supprimé.
- Comptage : **chargé** = mission en cours + remorque attelée ; **à vide** = le reste. Les sauts (ferry, train, changement de camion) ne sont pas comptés.
- **Réel / course** : une mission passe en course si plus de 5 % de sa distance est faite au-dessus du seuil (100 km/h camion, 110 km/h car). Modifiable dans Réglages.
- Les données sont enregistrées sur le PC (`%APPDATA%\telemetrie-entreprise\donnees.json`).

Recompiler le plugin (Linux + mingw-w64) : `npm run build-plugin`. Tester sans le jeu : `npm start` puis `npm run simulateur`.

## Installer

Télécharge le dernier `Telemetrie-Entreprise-Setup-x.y.z.exe` dans la page **Releases** du dépôt, puis lance-le.

## Mises à jour automatiques

L'application vérifie au démarrage, puis toutes les 30 minutes, s'il existe une nouvelle version dans les Releases GitHub. Si c'est le cas, elle la télécharge et propose de redémarrer.

## Publier une nouvelle version

1. Augmenter `version` dans `package.json` (ex. `0.3.0`) et pousser sur `main`.
2. GitHub Actions construit l'installeur Windows, crée la version `v0.3.0` et la publie dans les Releases.

## Développement

```
npm install
npm start
```
