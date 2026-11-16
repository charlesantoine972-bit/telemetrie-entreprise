# Télémétrie Entreprise

Application de suivi pour une entreprise virtuelle sur **Euro Truck Simulator 2** : classement des chauffeurs (km chargés / à vide), carte en direct, fiche chauffeur et tablette in-game.

> Version actuelle : **démo**. Toutes les données affichées sont des exemples ; le jeu n'est pas encore connecté.

## Installer

Télécharge le dernier `Telemetrie-Entreprise-Setup-x.y.z.exe` dans la page **Releases** du dépôt, puis lance-le.

## Mises à jour automatiques

L'application vérifie au démarrage, puis toutes les 30 minutes, s'il existe une nouvelle version dans les Releases GitHub. Si c'est le cas, elle la télécharge et propose de redémarrer.

## Publier une nouvelle version

1. Augmenter `version` dans `package.json` (ex. `0.3.0`).
2. Créer et pousser le tag correspondant : `git tag v0.3.0 && git push origin v0.3.0`.
3. GitHub Actions construit l'installeur Windows et le publie dans les Releases.

## Développement

```
npm install
npm start
```
