# Interface de Truck & Coach Hub : où est le code ?

L'interface (la fenêtre principale) était un seul fichier `index.html` de 4 568 lignes. Depuis la tâche 4 de la bêta 5, elle est **rangée par fonctionnalité**. Ce fichier explique où chercher et où écrire.

## La règle

**Une fonctionnalité = un dossier.** Tout nouveau code (JavaScript ou CSS) va dans le dossier de sa fonctionnalité, **jamais dans `index.html`**. Ce qui sert à plusieurs fonctionnalités va dans `commun/`.

- Nouvelle fonctionnalité → nouveau dossier `fonctionnalites/<nom>/` avec `<nom>.js` et `<nom>.css`, puis une balise `<link>` et une balise `<script src>` dans `index.html` (au bon endroit, voir « L'ordre compte »). Le test « interface découpée » vérifie que chaque dossier est bien chargé.
- `index.html` ne contient plus que l'en-tête, la liste des fichiers chargés et le **HTML des pages** (rangé avec des commentaires `<!-- ===== Fonctionnalité : … ===== -->`). Aucun bloc `<style>` ni `<script>` en ligne : un test le refuse.
- L'interface ne parle au reste de l'appli que par `window.tel` (voir `preload.js` et `CONTRAT-NOYAU.md` à la racine). Pas de changement ici.
- Pas d'outil de compilation : ce sont des fichiers ordinaires, chargés tels quels par Electron.

## L'arborescence

```
app/
├── index.html             HTML de toutes les pages + liste des fichiers chargés
├── demarrage.js           ce qui s'exécute au chargement, dans l'ordre d'origine (voir plus bas)
├── LISEZ-MOI.md           ce fichier
├── commun/                ce qui sert partout
│   ├── theme-actuel.css   couleurs actuelles (thèmes, vision des couleurs, contraste) : la refonte le remplacera d'un bloc
│   ├── accessibilite.css, structure.css, controles.css, navigation.css, barre-globale.css,
│   │   menu-lateral.css, reperes.css, responsive.css, menu-retractable.css, elements.css,
│   │   mise-en-page.css, divers.css, boutons-et-champs.css
│   ├── utilitaires.js     formats, mémoire locale (store), setText, échappement (esc, escM), annonces, fenêtre de confirmation (ask)
│   └── navigation.js      espaces, barre globale, menu latéral, changement de page (go), repères, pages en préparation
└── fonctionnalites/
    ├── choix-du-jeu/      écran de lancement (choix ETS2 / ATS), encart « Nouveautés »
    ├── accueil/           page Accueil du Hub (bouton « Lancer le jeu »)
    ├── hub/               classement, fiche chauffeur, Ma VTC, tablette, carte simulée (pages en préparation)
    ├── telemetrie/        télémétrie en direct (camion / car)
    ├── feuille-de-route/  Feuille de route et Mes trajets
    ├── hud/               page HUD de l'appli (aperçus, réglages, test)
    ├── carte/             carte (TCH Map, préparation de la carte du jeu, carte Leaflet)
    ├── parametres/        Paramètres (catégories, général / jeu, dossiers, recherche, plugin, programme bêta) ; apparence.js : thème et couleurs
    │   └── bientot/       pages de paramètres prévues « Bientôt disponible » (un fichier page-*.js par page, bientot.js les fabrique au démarrage)
    ├── compte/            Compte & accès (aperçu local)
    ├── news/              page News
    ├── atelier/           Truck & Coach Tools : nom de l'espace, interrupteurs par jeu, console du jeu
    ├── sauvegardes/       Truck & Coach Tools → Sauvegardes (profils, copies, analyse)
    ├── mods/              Truck & Coach Tools → Mods & sauvegarde
    ├── outils/            Truck & Coach Tools : éditeur de sauvegardes, cartes d'outils
    ├── marketplace/       Marketplace (masquée dans la bêta)
    ├── mises-a-jour/      mises à jour de l'appli
    └── notes-version/     notes de version et numéro affiché
```

Fichiers déjà à part avant le découpage, **laissés à leur place** : `hud-*.js`, `hud-*.css`, `units.js`, `mission-time.js` (partagés avec la fenêtre du HUD `hud.html`, qui les charge aussi), `game-content-ui.js`, `data/` (villes, notes de version, illustrations), `vendor/` (Leaflet), `assets/`.

Les pages **Support** n'ont pas de dossier : elles n'ont ni style ni fonction à elles (leurs boutons sont branchés dans `demarrage.js`).

## Comment c'est chargé (et pourquoi l'ordre compte)

1. **Les styles** (`<link>` dans `<head>`) sont dans l'ordre exact de l'ancien bloc de styles. En CSS, à force égale, **la règle écrite plus bas l'emporte** : ne change pas l'ordre des `<link>` sans vérifier l'apparence. C'est pour ça que certains dossiers ont deux feuilles (ex. `choix-du-jeu.css` et `page-game.css`) chargées à des endroits différents.
2. **Les scripts des fonctionnalités** (`commun/*.js` puis `fonctionnalites/*/*.js`) ne contiennent **que des déclarations** : des fonctions et des valeurs fixes (textes, tableaux, icônes). Ils ne font rien au chargement ; leur ordre entre eux importe donc peu.
3. **`demarrage.js`** vient ensuite : c'est **tout ce qui s'exécute au chargement** (état initial lu dans la mémoire locale, branchement des boutons, premiers affichages, abonnements aux événements du noyau), **dans l'ordre exact de l'ancien script**. Chaque bloc y porte le nom de sa fonctionnalité.
4. `game-content-ui.js` passe en dernier, comme avant.

Tous ces scripts sont des scripts « classiques » qui partagent les mêmes noms globaux : une fonction déclarée dans `fonctionnalites/carte/carte.js` est utilisable partout. **Deux déclarations `let` / `const` du même nom dans deux fichiers font planter tout le chargement** (écran blanc) : choisis des noms propres à ta fonctionnalité.

## Ce qui reste à découper

- **`demarrage.js` (environ 500 lignes)** : ces lignes sont restées ensemble exprès. Les répartir dans les dossiers changerait l'ordre dans lequel elles s'exécutent, et l'ancien script en dépend (ex. `openOptCat` est « enveloppé » trois fois de suite par les Paramètres, le Compte et le mode dossiers ; des réponses du noyau peuvent arriver entre deux fichiers). Pour les sortir proprement, il faudra, fonctionnalité par fonctionnalité, regrouper son démarrage dans une fonction `demarrer<Nom>()` appelée depuis `demarrage.js`, et vérifier à chaque fois avec les captures.
- **Le HTML des pages** reste dans `index.html` (environ 940 lignes) : sans outil de compilation, le sortir demanderait de le charger après coup, ce qui changerait le moment où les pages existent. Il est rangé par commentaires.
- **Quelques feuilles de style mélangées** : `outils.css` contient aussi deux règles des Paramètres (`.optrow`, `.cvdlegend`) ; `structure.css` contient le bandeau d'accueil du Hub ; `choix-du-jeu.css` contient aussi les notes de version. Les déplacer changerait l'ordre des règles : à faire en vérifiant l'apparence.
- **Échappement** : plusieurs fonctions d'échappement existent encore (`esc`, `escM` dans `commun/utilitaires.js`, `escMod` dans `mods`, un `esc` local dans `hud`, `escH` local dans `feuille-de-route`) ; à réunir en une seule qui traite aussi l'apostrophe (point S4 du tableau de bord).
- **Gestionnaires « en ligne »** : `fonctionnalites/outils/outils.js` fabrique des boutons avec `onclick="…"` dans le HTML ; tant qu'ils existent, la règle de sécurité (CSP) doit garder `'unsafe-inline'` pour les scripts (point S4).

## Images de référence

Les captures des pages **avant le découpage** sont dans `docs/captures/beta-5/` (une image par page, nommée comme la page). Le découpage a été vérifié en reprenant les mêmes captures après : identiques, sauf l'horloge et la carte simulée qui bougent toutes seules. Elles serviront aussi à la refonte pour vérifier que seule l'apparence change.

## La refonte de l'interface

La refonte (branche `claude/refonte-interface`, pas encore fusionnée) **ajoutera ses fichiers dans `app/commun/`** : `tokens.css`, `typographie.css`, `menu.css`, puis `composants.css`. Ces noms sont réservés : ne pas les utiliser ici. Elle remplacera `commun/theme-actuel.css` d'un bloc.
