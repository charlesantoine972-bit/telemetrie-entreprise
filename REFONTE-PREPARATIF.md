# Refonte de l'interface — fichiers préparés (non branchés)

**Branche :** `claude/refonte-interface` (créée depuis `beta`). **À brancher après la bêta 5.**
**Fait foi :** `REFERENTIEL-UI.md`, puis `REFONTE-INTERFACE.md` (copiés ici depuis `claude/etude-entreprise`).
**Maquette :** https://claude.ai/artifact/Br8AW1sFEyMfEcDy1YCktp

Aucun fichier existant de l'appli n'a été modifié (`app/index.html`, `main.js`, `preload.js` intacts). Seul `tools/verify.test.js` reçoit deux tests en plus, à la fin.

## 1. Ce qui est prêt

| Fichier | Contenu |
|---|---|
| `app/commun/tokens.css` | Toutes les couleurs (sombre, clair, Système, contraste renforcé, contraste élevé Windows, vision des couleurs), espacements, rayons, cibles, durées d'animation. **Seul fichier avec des couleurs en dur.** |
| `app/commun/typographie.css` | `@font-face` locale de Mona Sans, pile de secours, variables et classes de l'échelle 32 / 24 / 20 / 16 / 14 / 12 (+ 48 pour le grand chiffre), graisses 400 / 500 / 600 / 700, `tabular-nums`. Tailles en `rem` (suivent l'agrandissement du texte). |
| `app/commun/menu.css` | Menu latéral (§ 3 du guide) : catégories 12 px 600 gris, entrées 14 px 400, entrée active 500 + barre accent de 3 px, mode réduit (icônes seules, libellé gardé pour les lecteurs d'écran, infobulle), focus visible, contraste élevé Windows. |
| `app/apercu-refonte.html` | Page d'aperçu autonome, **non chargée par l'appli** : menu complet + titres, textes, panneau, boutons, onglets (flèches du clavier), états ; boutons pour tester Système / Sombre / Clair / Contraste renforcé et Réduire. Aucun appel réseau, même Content-Security-Policy que l'appli. |
| `app/polices/mona-sans/` | Police (depuis `claude/police-mona-sans`), licence OFL incluse. |
| `tools/contrastes.mjs` | Calcule les ratios WCAG de chaque paire texte / fond dans 8 combinaisons de thèmes ; échoue sous 4,5:1 (texte) ou 3:1 (composants, grand texte). Vérifie aussi que le bloc « Système clair » est identique au bloc « Clair ». `node tools/contrastes.mjs --md` imprime la table. |
| `tools/verify.test.js` | 2 tests ajoutés : contrastes ; fichiers non branchés, sans couleur en dur hors tokens, sans graisse > 700, sans appel réseau, police présente. |

Vérifications faites : `npm test` 78 / 78 ; appli lancée 25 s sans erreur ; aperçu rendu dans Chromium en sombre, clair, contraste renforcé, menu réduit (focus clavier visible) et contraste élevé Windows simulé, police Mona Sans bien chargée, aucune erreur de console.

## 2. Contrastes calculés

Seuils (référentiel § 10.1) : **texte 4,5:1**, **composants / grand texte 3:1**. Les 194 paires passent.

| Combinaison | Paires | Ratio le plus faible |
|---|---|---|
| Sombre | 43 | 3,99:1 (composant, seuil 3) |
| Clair | 43 | 3,61:1 (composant, seuil 3) |
| Sombre + contraste renforcé | 10 | 8,57:1 |
| Clair + contraste renforcé | 10 | 9,30:1 |
| Sombre + vision rouge-vert | 12 | 4,76:1 |
| Clair + vision rouge-vert | 12 | 4,43:1 (composant, seuil 3) |
| Sombre + vision bleu-jaune | 12 | 4,86:1 |
| Clair + vision bleu-jaune | 12 | 4,10:1 (composant, seuil 3) |

Contraste élevé de Windows (`forced-colors`) : couleurs imposées par Windows, non calculables ici ; vérifié visuellement.

### Sombre

| Premier plan | Fond | Usage | Ratio | Seuil | |
|---|---|---|---|---|---|
| `--text` #FFFFFF | `--bg` #202020 | texte | 16.29:1 | 4.5:1 | ✓ |
| `--text` #FFFFFF | `--nav` #1C1C1C | texte | 17.04:1 | 4.5:1 | ✓ |
| `--text` #FFFFFF | `--panel` #2B2B2B | texte | 14.16:1 | 4.5:1 | ✓ |
| `--text` #FFFFFF | `--hover` #2D2D2D | texte | 13.77:1 | 4.5:1 | ✓ |
| `--text` #FFFFFF | `--active` #343434 | texte | 12.45:1 | 4.5:1 | ✓ |
| `--soft` #E0E0E0 | `--bg` #202020 | texte | 12.34:1 | 4.5:1 | ✓ |
| `--soft` #E0E0E0 | `--nav` #1C1C1C | texte | 12.91:1 | 4.5:1 | ✓ |
| `--soft` #E0E0E0 | `--panel` #2B2B2B | texte | 10.73:1 | 4.5:1 | ✓ |
| `--soft` #E0E0E0 | `--hover` #2D2D2D | texte | 10.43:1 | 4.5:1 | ✓ |
| `--soft` #E0E0E0 | `--active` #343434 | texte | 9.43:1 | 4.5:1 | ✓ |
| `--muted` #ABABAB | `--bg` #202020 | texte | 7.10:1 | 4.5:1 | ✓ |
| `--muted` #ABABAB | `--nav` #1C1C1C | texte | 7.42:1 | 4.5:1 | ✓ |
| `--muted` #ABABAB | `--panel` #2B2B2B | texte | 6.17:1 | 4.5:1 | ✓ |
| `--muted` #ABABAB | `--hover` #2D2D2D | texte | 6.00:1 | 4.5:1 | ✓ |
| `--muted` #ABABAB | `--active` #343434 | texte | 5.42:1 | 4.5:1 | ✓ |
| `--accent` #FF8A3D | `--bg` #202020 | texte | 6.95:1 | 4.5:1 | ✓ |
| `--accent` #FF8A3D | `--nav` #1C1C1C | texte | 7.27:1 | 4.5:1 | ✓ |
| `--accent` #FF8A3D | `--panel` #2B2B2B | texte | 6.04:1 | 4.5:1 | ✓ |
| `--on-accent` #000000 | `--accent` #FF8A3D | texte | 8.95:1 | 4.5:1 | ✓ |
| `--on-accent` #000000 | `--accent-strong` #FFA466 | texte | 10.75:1 | 4.5:1 | ✓ |
| `--ok` #6FD8C4 | `--bg` #202020 | texte | 9.54:1 | 4.5:1 | ✓ |
| `--ok` #6FD8C4 | `--panel` #2B2B2B | texte | 8.29:1 | 4.5:1 | ✓ |
| `--warn` #E8D27A | `--bg` #202020 | texte | 10.81:1 | 4.5:1 | ✓ |
| `--warn` #E8D27A | `--panel` #2B2B2B | texte | 9.39:1 | 4.5:1 | ✓ |
| `--danger` #E07878 | `--bg` #202020 | texte | 5.53:1 | 4.5:1 | ✓ |
| `--danger` #E07878 | `--panel` #2B2B2B | texte | 4.81:1 | 4.5:1 | ✓ |
| `--info` #7FB2E5 | `--bg` #202020 | texte | 7.29:1 | 4.5:1 | ✓ |
| `--info` #7FB2E5 | `--panel` #2B2B2B | texte | 6.34:1 | 4.5:1 | ✓ |
| `--accent` #FF8A3D | `--bg` #202020 | ui | 6.95:1 | 3:1 | ✓ |
| `--accent` #FF8A3D | `--nav` #1C1C1C | ui | 7.27:1 | 3:1 | ✓ |
| `--accent` #FF8A3D | `--panel` #2B2B2B | ui | 6.04:1 | 3:1 | ✓ |
| `--accent` #FF8A3D | `--hover` #2D2D2D | ui | 5.87:1 | 3:1 | ✓ |
| `--accent` #FF8A3D | `--active` #343434 | ui | 5.31:1 | 3:1 | ✓ |
| `--ctl` #8A8A8A | `--bg` #202020 | ui | 4.72:1 | 3:1 | ✓ |
| `--ctl` #8A8A8A | `--nav` #1C1C1C | ui | 4.94:1 | 3:1 | ✓ |
| `--ctl` #8A8A8A | `--panel` #2B2B2B | ui | 4.10:1 | 3:1 | ✓ |
| `--ctl` #8A8A8A | `--hover` #2D2D2D | ui | 3.99:1 | 3:1 | ✓ |
| `--loaded` #E7B655 | `--bg` #202020 | ui | 8.71:1 | 3:1 | ✓ |
| `--loaded` #E7B655 | `--panel` #2B2B2B | ui | 7.57:1 | 3:1 | ✓ |
| `--loaded` #E7B655 | `--map` #191919 | ui | 9.39:1 | 3:1 | ✓ |
| `--empty` #6A9CD0 | `--bg` #202020 | ui | 5.65:1 | 3:1 | ✓ |
| `--empty` #6A9CD0 | `--panel` #2B2B2B | ui | 4.91:1 | 3:1 | ✓ |
| `--empty` #6A9CD0 | `--map` #191919 | ui | 6.09:1 | 3:1 | ✓ |

### Clair

| Premier plan | Fond | Usage | Ratio | Seuil | |
|---|---|---|---|---|---|
| `--text` #000000 | `--bg` #F3F3F3 | texte | 18.93:1 | 4.5:1 | ✓ |
| `--text` #000000 | `--nav` #EBEBEB | texte | 17.62:1 | 4.5:1 | ✓ |
| `--text` #000000 | `--panel` #FFFFFF | texte | 21.00:1 | 4.5:1 | ✓ |
| `--text` #000000 | `--hover` #E5E5E5 | texte | 16.67:1 | 4.5:1 | ✓ |
| `--text` #000000 | `--active` #DDDDDD | texte | 15.46:1 | 4.5:1 | ✓ |
| `--soft` #1F1F1F | `--bg` #F3F3F3 | texte | 14.85:1 | 4.5:1 | ✓ |
| `--soft` #1F1F1F | `--nav` #EBEBEB | texte | 13.83:1 | 4.5:1 | ✓ |
| `--soft` #1F1F1F | `--panel` #FFFFFF | texte | 16.48:1 | 4.5:1 | ✓ |
| `--soft` #1F1F1F | `--hover` #E5E5E5 | texte | 13.08:1 | 4.5:1 | ✓ |
| `--soft` #1F1F1F | `--active` #DDDDDD | texte | 12.14:1 | 4.5:1 | ✓ |
| `--muted` #5C5C5C | `--bg` #F3F3F3 | texte | 6.03:1 | 4.5:1 | ✓ |
| `--muted` #5C5C5C | `--nav` #EBEBEB | texte | 5.61:1 | 4.5:1 | ✓ |
| `--muted` #5C5C5C | `--panel` #FFFFFF | texte | 6.69:1 | 4.5:1 | ✓ |
| `--muted` #5C5C5C | `--hover` #E5E5E5 | texte | 5.31:1 | 4.5:1 | ✓ |
| `--muted` #5C5C5C | `--active` #DDDDDD | texte | 4.92:1 | 4.5:1 | ✓ |
| `--accent` #B34700 | `--bg` #F3F3F3 | texte | 4.96:1 | 4.5:1 | ✓ |
| `--accent` #B34700 | `--nav` #EBEBEB | texte | 4.61:1 | 4.5:1 | ✓ |
| `--accent` #B34700 | `--panel` #FFFFFF | texte | 5.50:1 | 4.5:1 | ✓ |
| `--on-accent` #FFFFFF | `--accent` #B34700 | texte | 5.50:1 | 4.5:1 | ✓ |
| `--on-accent` #FFFFFF | `--accent-strong` #8A3600 | texte | 8.05:1 | 4.5:1 | ✓ |
| `--ok` #2B766A | `--bg` #F3F3F3 | texte | 4.85:1 | 4.5:1 | ✓ |
| `--ok` #2B766A | `--panel` #FFFFFF | texte | 5.38:1 | 4.5:1 | ✓ |
| `--warn` #6E5A00 | `--bg` #F3F3F3 | texte | 6.06:1 | 4.5:1 | ✓ |
| `--warn` #6E5A00 | `--panel` #FFFFFF | texte | 6.72:1 | 4.5:1 | ✓ |
| `--danger` #8A2E2E | `--bg` #F3F3F3 | texte | 7.54:1 | 4.5:1 | ✓ |
| `--danger` #8A2E2E | `--panel` #FFFFFF | texte | 8.36:1 | 4.5:1 | ✓ |
| `--info` #1F5F99 | `--bg` #F3F3F3 | texte | 6.00:1 | 4.5:1 | ✓ |
| `--info` #1F5F99 | `--panel` #FFFFFF | texte | 6.66:1 | 4.5:1 | ✓ |
| `--accent` #B34700 | `--bg` #F3F3F3 | ui | 4.96:1 | 3:1 | ✓ |
| `--accent` #B34700 | `--nav` #EBEBEB | ui | 4.61:1 | 3:1 | ✓ |
| `--accent` #B34700 | `--panel` #FFFFFF | ui | 5.50:1 | 3:1 | ✓ |
| `--accent` #B34700 | `--hover` #E5E5E5 | ui | 4.37:1 | 3:1 | ✓ |
| `--accent` #B34700 | `--active` #DDDDDD | ui | 4.05:1 | 3:1 | ✓ |
| `--ctl` #767676 | `--bg` #F3F3F3 | ui | 4.09:1 | 3:1 | ✓ |
| `--ctl` #767676 | `--nav` #EBEBEB | ui | 3.81:1 | 3:1 | ✓ |
| `--ctl` #767676 | `--panel` #FFFFFF | ui | 4.54:1 | 3:1 | ✓ |
| `--ctl` #767676 | `--hover` #E5E5E5 | ui | 3.61:1 | 3:1 | ✓ |
| `--loaded` #9B6B3B | `--bg` #F3F3F3 | ui | 4.15:1 | 3:1 | ✓ |
| `--loaded` #9B6B3B | `--panel` #FFFFFF | ui | 4.61:1 | 3:1 | ✓ |
| `--loaded` #9B6B3B | `--map` #E8E8E8 | ui | 3.76:1 | 3:1 | ✓ |
| `--empty` #2A5A8A | `--bg` #F3F3F3 | ui | 6.46:1 | 3:1 | ✓ |
| `--empty` #2A5A8A | `--panel` #FFFFFF | ui | 7.17:1 | 3:1 | ✓ |
| `--empty` #2A5A8A | `--map` #E8E8E8 | ui | 5.85:1 | 3:1 | ✓ |

## 3. Écarts entre le guide et le référentiel, et réglages

| Écart | Réglage (le référentiel prime) |
|---|---|
| `--race` sombre `#DC6E6E` (rouge d'état) : 4,38:1 sur panneau | → `--danger` `#E07878` (4,81:1). `--race` devient un alias de `--danger`. |
| `--ok` clair `#2E7D70` : 4,42:1 sur fond | → `#2B766A` (4,85:1). |
| Vision rouge-vert, `--ok` sombre `#5586E7` : 4,01:1 sur panneau | → `#6B97EC` (4,90:1). |
| Vision bleu-jaune, rouge sombre `#E25336` : 3,72:1 sur panneau | → `#EF7255` (4,86:1). |
| `--ctl` clair `#858585` (contour des contrôles) : 2,93:1 sur survol | → `#767676` (≥ 3:1 sur toutes les surfaces). |
| Le guide ne donne pas de couleur « information » (référentiel § 6 l'exige) | Ajout de `--info` : `#7FB2E5` / `#1F5F99`. |
| Le guide ne donne pas d'état « survol » du bouton principal (référentiel § 7) | `--accent-strong` : `#FFA466` / `#8A3600`, texte `--on-accent` ≥ 4,5:1. |
| Le guide ne dit rien des animations (référentiel § 12) | `--dur-fast` / `--dur` passent à 0 avec `prefers-reduced-motion` ou `data-motion="reduit"`. |
| Tailles du guide en px | Écrites en `rem` (mêmes valeurs à 100 %) pour suivre l'agrandissement du texte (référentiel § 10.2). |
| Accent clair `#B34700` sur `--hover` : 4,37:1 | Pas de changement : l'accent n'est jamais du texte sur une surface de survol (l'entrée active utilise `--text` + barre). Comme composant (barre, focus), il passe (≥ 3:1). À respecter lors du branchement. |

## 4. Marche à suivre pour brancher (après la bêta 5)

Prérequis : bêta 5 fusionnée dans `beta`, avec le découpage `app/fonctionnalites/<nom>/` et `app/commun/`.

1. **Rebaser** cette branche sur la nouvelle `beta`. Si le découpage a déjà créé `app/commun/`, les trois fichiers s'y ajoutent sans conflit (noms nouveaux) ; sinon, les garder où ils sont.
2. **Tokens (étape 1 du guide)** : dans `app/index.html`, charger `commun/tokens.css` **avant** tout autre style, puis supprimer du bloc `<style>` les anciennes variables `:root`, `[data-theme=…]`, `[data-vision=…]`, `[data-contrast=…]`. Garder le script `applyLook` : il pose déjà `data-theme` (sombre / clair, y compris pour « Système »), `data-vision`, `data-contrast`, `data-motion`. Remplacer les usages de `--race` par `--danger` (l'alias reste en attendant). Supprimer le thème « De base » (bleu nuit) et faire de « Système » le thème par défaut. Vérifier que `applyAccent` (accent personnalisé ou Windows) recalcule toujours ses couleurs : il lit `--bg` et `--panel`, qui restent des valeurs hexadécimales.
3. **Police (étape 2)** : charger `commun/typographie.css`, mettre `class="tch-typo"` sur `<body>` (ou `font-family: var(--font)`), remplacer toutes les graisses 800 / 900 par `var(--fw-gras)` au plus, puis les tailles en dur par les variables `--fs-*`.
4. **Menu (étape 3)** : charger `commun/menu.css` et reprendre la structure HTML du `<nav class="menu">` de `apercu-refonte.html` dans le dossier de la fonctionnalité du menu, en rebranchant les actions existantes (burger, réduire, puce du jeu, maison, bandeau de mise à jour). « Ma VTC » reste masquée.
5. Déplacer les échantillons de composants de l'aperçu (`.panneau`, `.btn`, `.onglet`, `.etat`) dans `app/commun/` (par ex. `composants.css`) quand les pages passent au nouveau style.
6. Mettre à jour le test « fichiers non branchés » de `tools/verify.test.js` (il échouera volontairement dès que `index.html` chargera la refonte) : le remplacer par « aucune couleur en dur hors `tokens.css` ».
7. À chaque étape : `npm test` (contrastes compris), comparer avec la maquette, vérifier clavier et contraste élevé, puis supprimer `app/apercu-refonte.html` quand tout est branché.

## 5. Restant à vérifier (référentiel § 16)

- Lecteur d'écran réel (Narrateur Windows) sur le menu, surtout en mode réduit.
- Contraste élevé Windows sur une vraie machine (ici : simulation Chromium).
- Mise à l'échelle 150 % et fenêtre étroite une fois le menu branché.
- Si Windows demande « plus de contraste » (`prefers-contrast: more`), le contraste renforcé s'applique tant que l'appli n'a pas posé `data-contrast` : prévoir, au branchement, de poser `data-contrast="normal"` si l'utilisateur le désactive explicitement.
