# Télémétrie Entreprise

Application de suivi pour une entreprise virtuelle sur **Euro Truck Simulator 2** : classement des chauffeurs (km chargés / à vide), carte en direct, fiche chauffeur et tablette in-game.

> Version actuelle : **démo**. Toutes les données affichées sont des exemples ; le jeu n'est pas encore connecté.

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
