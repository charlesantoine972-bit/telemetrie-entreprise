# Truck & Coach Hub

## Mise à jour 0.12.4 : vérifications des jeux et HUD (17 novembre 2026)

La version **0.12.4** est préparée pour publication. La Release et l'installateur seront générés par GitHub Actions après intégration sur `main`.

- Dans **Carte → Fichiers du jeu et DLC → Vérifier les jeux**, l'application recherche ETS2 et ATS dans Steam, dans les dossiers choisis et dans les chemins du dernier journal. Elle lit les en-têtes des archives `.scs`, leur taille et date, ainsi que le journal du jeu, sans modifier ces fichiers. Une archive présente n'est pas une preuve d'achat ni d'activation. Le journal décrit la dernière session, pas nécessairement la session actuelle. Les mods Workshop ne sont pas inventoriés.
- Les tuiles historiques restent le fond de carte. **La génération automatique des routes depuis les DLC/mods n'est pas implémentée dans cette étape de vérification.** Un lecteur de secteurs compatible avec la version du jeu et l'ordre des mods sera nécessaire ; la signature d'inventaire permet de repérer un changement de fichiers.
- Le HUD conserve les styles existants et ajoute **Navigation**. Il affiche le temps GPS en jeu, son estimation réelle, l'heure d'arrivée réelle estimée et, pour les missions camion, le délai de livraison en jeu/réel. Le calcul utilise `local.scale` reçu du plugin, sans supposer un facteur fixe. Les pauses suppriment l'heure d'arrivée estimée ; les traversées, repos et changements d'échelle peuvent modifier les estimations. Le HUD réel reste masqué en pause, comme auparavant.
- **Coaches : structure de vérification uniquement pour la ligne et les arrêts.** Le plugin reçoit `bus_job` et conserve tous les attributs indexés. Le SDK officiel 1.16 consulté reconnaît cette configuration mais n'en documente pas les attributs. Les champs absents ne sont pas remplacés par des données fictives. Le GPS peut viser le prochain arrêt : il ne prouve pas la durée jusqu'à la fin de la ligne. Le diagnostic indique les noms des champs reçus afin de préparer leur interprétation après le test en jeu.
- Le plugin embarqué est compilé en version **1.2.0**. Aucun fichier de l'installation ETS2 n'a été remplacé pendant cette préparation. Au lancement normal de l'application, son mécanisme d'installation existant tentera de mettre ce plugin à jour : fermer le jeu avant le premier lancement de test.

### Vérifier et tester

Le HUD affiche aussi **Compteur véhicule** : il s'agit directement de `truck.odometer` (kilomètres) transmis par le SDK, et non d'une estimation vitesse × durée ou du total accumulé par l'application. Il reflète le véhicule actuellement conduit, y compris son historique antérieur au lancement de l'application. Sans donnée disponible, il affiche « — ». Les distances de mission et du jour restent des compteurs distincts. Le jeu doit être connecté : aucune sauvegarde hors ligne n'est lue pour ce compteur.

`npm test` vérifie les calculs, les cas d'indisponibilité et la lecture non destructive d'archives de test. `npm run verify-games` réalise le diagnostic seul, sans démarrer Electron ni installer de plugin. On peut fournir un dossier Documents, puis des dossiers de jeux : `node tools/verify-game-content.js "D:/Documents" "D:/Steam/steamapps/common/Euro Truck Simulator 2"`.

Pour tester l'interface : `npm start`, puis **Bandeau / HUD**, choisir **Camion** ou **Car / Coaches** dans l'aperçu. Essayer **Navigation** et **En bas**. Le bouton véhicule de l'aperçu n'affecte pas les réglages en jeu. Le simulateur fournit des données fictives avec une échelle de 19 uniquement pour les tests.

Validation locale : ETS2 détecté, 107 archives DLC présentes ; ATS absent. Test d'affichage Electron réalisé sur les cinq styles pour les deux véhicules. **Aucun trajet réel ni arrêt Coaches validé en jeu**, aucun installateur publié. Le chargement natif de la DLL et ses deux points d'entrée SDK ont été vérifiés sous Windows.

Compilation Windows alternative : `powershell -File plugin/build-windows.ps1 -Zig CHEMIN/zig.exe` (testée avec Zig 0.13.0 portable). La compilation Linux existante reste disponible.

Références : [SDK officiel SCS](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry), [refonte du Route Advisor](https://blog.scssoft.com/2026/02/euro-truck-simulator-2-158-update.html).

Application de suivi pour une entreprise virtuelle sur **Euro Truck Simulator 2** : classement des chauffeurs (km chargés / à vide), carte en direct, fiche chauffeur et tablette in-game.

> Version préparée : **0.12.4** — carte en direct (ETS2 / ATS), HUD configurable, prise en charge des carrières camion et car, outils Truck Tools et Coach Tools.
> Les pages « Aperçu » utilisent des données d'exemple ; les pages « Bientôt » décrivent les fonctions à venir.

## Comment ça marche

- `plugin/` : petit plugin du jeu (DLL, SDK officiel SCS). Il envoie les infos du camion à l'application en local (UDP 127.0.0.1:47311), environ 10 fois par seconde. Il n'affiche rien et ne modifie rien dans le jeu.
- L'application installe le plugin automatiquement dans Euro Truck Simulator 2 et American Truck Simulator (toutes les bibliothèques Steam), et le remet si une mise à jour du jeu l'a supprimé.
- Comptage : **chargé** = mission en cours + remorque attelée ; **à vide** = le reste. Les sauts (ferry, train, changement de camion) ne sont pas comptés.
- **Réel / course** : une mission passe en course si plus de 5 % de sa distance est faite au-dessus du seuil (100 km/h camion, 110 km/h car). Modifiable dans Réglages.
- **Carte** : il n'existe pas d'API officielle de SCS pour la carte. La position du camion vient du plugin (coordonnées monde x / z) et le fond de carte vient des tuiles générées depuis les fichiers du jeu par TsMap ([SCS_Map_Tiles](https://github.com/Unicor-p/SCS_Map_Tiles), ETS2 1.49 / ATS 1.48). Les tuiles sont téléchargées à la demande puis gardées sur le PC (`Carte (cache)` dans le dossier de données) : une zone déjà vue reste visible sans Internet. Les régions sorties après ces versions (Grèce, Nordic Horizons, etc.) n'ont pas encore de tuiles.
- Les données sont enregistrées sur le PC (`%APPDATA%\telemetrie-entreprise\donnees.json`).

Recompiler le plugin (Linux + mingw-w64) : `npm run build-plugin`. Tester sans le jeu : `npm start` puis `npm run simulateur`.

## Installer

Télécharge le dernier `Telemetrie-Entreprise-Setup-x.y.z.exe` dans la page **Releases** du dépôt, puis lance-le.

## Mises à jour automatiques

L'application vérifie au démarrage, puis toutes les 30 minutes, s'il existe une nouvelle version dans les Releases GitHub. Le bouton « Mettre à jour » la télécharge (barre de progression dans l'appli), l'installe sans assistant Windows et relance l'appli.

## Publier une nouvelle version

1. Augmenter `version` dans `package.json` (ex. `0.3.0`) et pousser sur `main`.
2. GitHub Actions construit l'installeur Windows, crée la version `v0.3.0` et la publie dans les Releases.

## Développement

```
npm install
npm start
```
