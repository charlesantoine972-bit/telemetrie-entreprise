# Refonte de l'interface — Guide de mise en œuvre

**Statut :** maquette validée par Charles le 27 novembre 2026.
**Maquette :** https://claude.ai/artifact/Br8AW1sFEyMfEcDy1YCktp (canevas « Refonte Général et Entreprise – maquette »). Les valeurs entre crochets y sont des emplacements, pas des données.
**Règle absolue :** `REFERENTIEL-UI.md` fait foi, entièrement. Ce guide ne fait que l'appliquer à l'appli. En cas de doute ou d'écart entre ce guide, la maquette ou le code actuel et le référentiel, **c'est le référentiel qui s'applique**.
**Prérequis :** bêta 5 fusionnée (découpage en dossiers, Electron à jour, anciennes pages VTC retirées).

---

## 1. Principes

1. **Données réelles uniquement.** Sources : sauvegarde du jeu (lecture seule), télémétrie, Feuille de route, API TruckersMP. Jamais de valeurs inventées ni de « Bientôt » dans une page visible.
2. **Une seule interface.** Ce qui marche est visible. Ce qui n'est pas vérifié est masqué derrière « Pages en préparation », jamais affiché à moitié.
3. **Une page = une question.** Pas deux pages qui montrent les mêmes chiffres.
4. **Chaque information a une place fixe.** Le jeu remplit les blocs, il n'en ajoute pas (pas de mise en page qui saute quand le jeu démarre).
5. **Un dossier par fonctionnalité** (`app/fonctionnalites/<nom>/`), styles et valeurs dans les tokens (§ 2), jamais de couleur ou de graisse codée en dur dans un composant.

---

## 2. Design tokens

### 2.1 Couleurs — fond neutre façon Windows

Les fonds personnalisés (bleu nuit, teintes d'espace) sont supprimés. Base : le thème « Sombre » actuel.

| Token | Sombre | Clair | Usage |
|---|---|---|---|
| `--bg` | `#202020` | `#F3F3F3` | Fond de page |
| `--nav` | `#1C1C1C` | `#EBEBEB` | Menu latéral |
| `--panel` | `#2B2B2B` | `#FFFFFF` | Cartes, panneaux |
| `--hover` | `#2D2D2D` | `#E5E5E5` | Survol, entrée active |
| `--line` | `#3D3D3D` | `#DCDCDC` | Bordures, séparateurs |
| `--text` | `#FFFFFF` | `#000000` | Texte principal |
| `--soft` | `#E0E0E0` | `#1F1F1F` | Texte courant, entrées du menu |
| `--muted` | `#ABABAB` | `#5C5C5C` | Étiquettes, légendes |
| `--accent` | `#FF8A3D` | `#B34700` | **Action uniquement** |
| `--on-accent` | `#000000` | `#FFFFFF` | Texte sur l'accent |

Thème par défaut : **« Système »** (suit le mode clair / sombre de Windows). Ajouter le **contraste élevé** de Windows (`forced-colors` / `prefers-contrast`). Les couleurs « vision » existantes sont conservées.

**Règle des couleurs :**
- **Accent orange** : boutons principaux, entrée active du menu (barre de 3 px à gauche), onglet actif (barre de 3 px en bas), interrupteurs, titre d'espace (« HUB »). Jamais pour du texte courant.
- **Couleurs d'état** (OK, attention, danger) : seulement en petit (pastille, mot), jamais deux sur un même bandeau sans raison, toujours avec un texte ou une icône (jamais la couleur seule).
- **Couleurs de données** (chargé / à vide) : carte et graphiques uniquement.
- Le rouge du panneau de limitation est le seul rouge décoratif autorisé.

Contrastes à vérifier par calcul (WCAG 2.2 AA : 4,5:1 texte, 3:1 grands textes et composants), dans chaque état.

### 2.2 Typographie — Mona Sans

- Police : **Mona Sans** (OFL 1.1), fichiers dans `app/polices/mona-sans/` (branche `claude/police-mona-sans`), déclarée par `@font-face` locale. Pile de secours : `'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif`.
- Aucune graisse au-dessus de **700**. Les 800 / 900 actuels disparaissent.
- Chiffres : `font-variant-numeric: tabular-nums` dans la télémétrie, les tableaux et les rapports.

Échelle du référentiel (§ 5), appliquée telle quelle :

| Rôle | Taille | Graisse | Couleur |
|---|---|---|---|
| Titre principal (titre de page) | 32 px | 600 | `--text` |
| Titre de section | 24 px | 600 | `--text` |
| Sous-section (titre de panneau) | 20 px | 500–600 | `--text` |
| Texte principal | 16 px | 400 | `--soft` |
| Texte secondaire (entrées du menu, tableaux) | 14 px | 400 | `--soft` |
| Métadonnées, légendes, catégories du menu | 12 px | 400 (catégories : 600) | `--muted` |
| Entrée active du menu | 14 px | 500 | `--text` + barre accent |
| Grand chiffre (vitesse) | 48 px | 600 | `--text` |

Règle : la hiérarchie se fait par la **taille et la couleur** ; graisses 400 / 500 / 600 (700 au maximum). Une catégorie est plus petite et plus grise que ses pages, mais plus grasse. Majuscules limitées (§ 5 du référentiel) : le titre d'espace « HUB » est la seule exception.

La maquette utilise encore 28 / 14 px : ses tailles sont à aligner sur ce tableau à l'étape 1.

### 2.3 Espacements et formes

- Grille de 4 / 8 px : 4, 8, 12, 16, 24, 32, 48.
- Marges de page 32 px ; écart entre blocs 16–24 px ; intérieur des panneaux 16 × 20 px.
- Rayons : 4 px (boutons, entrées), 8 px (panneaux).
- Cibles cliquables : 36–44 px de haut (24 × 24 px minimum).

---

## 3. Menu latéral (Hub)

```
[≡ Changer d'espace]              [Réduire le menu]
[ETS2  Euro Truck Simulator 2   Changer]
HUB
En jeu
  Accueil
  Carte
  HUD
Entreprise
  Vue d'ensemble
  Feuille de route
  Flotte & chauffeurs
  Garages
  Finances
  Télémétrie
  Ma VTC            ← masquée tant que la liaison TruckersMP n'est pas testée
─────────────
⚙ Paramètres
[T&C] Truck & Coach Hub · [version]  ⌂   ← retour au choix du jeu
```

- Éléments repris de la bêta 4 : bouton d'espace (burger), menu rétractable (mode réduit), puce du jeu, titre d'espace, bandeau de mise à jour, Paramètres, pied avec logo, version et maison.
- Un seul niveau de navigation. Pas de sous-espace qui transforme le menu.
- Supprimés : la catégorie « Général », la catégorie « Carrière », Ma carrière (fusionnée dans la Feuille de route), les anciennes pages VTC (voir `IDEES.md`).
- En mode réduit : icônes seules, avec infobulle et nom accessible.

---

## 4. Pages

### En jeu

**Accueil** — résumé, rien d'autre.
- Puces d'état : jeu, plugin, HUD.
- « En cours » : trajet, cargaison, distance restante ; boutons Carte et Télémétrie.
- « Dernier trajet » (lien Feuille de route) et « Mon entreprise » (lien Vue d'ensemble).
- Hors jeu : « En cours » est remplacé par le dernier trajet et un rappel de lancer le jeu.

**Carte** — inchangée dans cette refonte (calage prévu à part, tâche du 11 décembre).

**HUD** — page de la bêta 4 au nouveau style.
- En tête : « Afficher le bandeau en jeu », véhicule détecté, « Réglages du HUD », interrupteur.
- Aperçus : bandeau camion, bandeau car, chacun avec « Tester ».

### Entreprise

**Vue d'ensemble** — sauvegarde du profil choisi (lecture seule).
- En-tête : société, QG, niveau, profil, date de la sauvegarde.
- 4 chiffres : argent, prêts, garages, flotte.
- Flotte & chauffeurs par garage, alerte d'usure > 30 %.
- Ce mois-ci (depuis la Feuille de route), Ma VTC (si liée).
- Sans sauvegarde : « Choisis un profil dans l'Atelier ».

**Feuille de route** — l'historique. 4 onglets :
1. **Trajets** : trajet en cours (dépenses, pleins) et historique Tous / Camion / Car ; un clic ouvre le détail.
2. **Calendrier** : grille du mois ; par jour km, livraisons ou voyageurs ; repères avec icône + texte : ⚑ convoi exceptionnel / charge lourde, ☢ matières dangereuses, ◆ nouvelle ville, ↻ ligne répétée, ★ record du mois ; un jour choisi affiche ses trajets.
3. **Rapport de la semaine** : km, carburant, livraisons, consommation, excès de vitesse, dégâts ; détail jour par jour ; « Copier le rapport » (texte prêt pour le Discord de la VTC).
4. **Rapport du mois** : mêmes chiffres, écart avec le mois précédent, détail semaine par semaine.

Première version du calendrier avec ce qui est déjà enregistré (dates, villes, km, livraisons, lignes). À vérifier avant les repères : masse et type de cargaison, nombre de voyageurs par service.

**Flotte & chauffeurs, Garages, Finances** — pages de détail de la Vue d'ensemble (sauvegarde, lecture seule). Maquette à faire ; vérifier d'abord le détail des chauffeurs (aujourd'hui seul leur nombre est lu).

**Télémétrie** — le direct uniquement (les rapports sont dans la Feuille de route). Sélecteur Camion / Car à bascule automatique. Trois états :
- **En attente du jeu** : les 3 étapes (plugin, lancer le jeu, prendre la route). Aucune case vide.
- **Camion en jeu** : Conduite (vitesse 48 px, limitation, Réel / Course) · Plein (niveau, autonomie, pour le plein, consommation) · Mission en cours (trajet, cargaison, 6 valeurs sur 3 colonnes) · Aujourd'hui (chargé, à vide, pause obligatoire, heure du jeu).
- **Car en jeu** : Conduite et Plein identiques · Service en cours (ligne, prochain arrêt, temps, horaire, revenu) · Voyageurs (nombre, satisfaction, force G, pic, à-coups) · Aujourd'hui.

Champs repris de la page actuelle (`v-telemetrie`) : aucun n'est perdu, ils sont regroupés.

**Ma VTC** — API publique TruckersMP : identité de la VTC, ton rôle, membres, événements, actualités. Cache de 15 minutes, dernières données affichées avec leur date hors ligne. Sans VTC liée : bouton « Lier ma VTC » vers Paramètres → Compte. Masquée tant qu'un essai réel n'est pas fait.

---

## 5. Ordre de mise en œuvre (une étape = une petite tâche)

| # | Étape | Contenu |
|---|---|---|
| 1 | Tokens | Couleurs neutres, thème Système, contraste élevé, échelle typographique en variables CSS |
| 2 | Police | Brancher Mona Sans (`@font-face` locale), retirer les graisses 800 / 900 |
| 3 | Menu | Nouveau menu (§ 3), en gardant burger, mode réduit, puce du jeu, titre d'espace, pied |
| 4 | Feuille de route | Fusion Ma carrière, onglets Trajets / Rapports |
| 5 | Calendrier | Première version (données déjà enregistrées) |
| 6 | Télémétrie | Trois états, direct uniquement |
| 7 | Accueil et HUD | Au nouveau style |
| 8 | Vue d'ensemble | Sauvegarde : société, chiffres, flotte |
| 9 | Flotte, Garages, Finances | Après vérification des champs de la sauvegarde |
| 10 | Ma VTC | Après un essai réel de l'API TruckersMP |

Chaque étape : lire ce guide, `REFERENTIEL-UI.md`, `TABLEAU-DE-BORD.md` et `CONTRAT-NOYAU.md` ; mettre le code dans le dossier de la fonctionnalité ; déclarer toute nouvelle fonction du pont dans le contrat ; ajouter les tests ; vérifier les contrastes par calcul ; comparer avec la maquette.

## 6. Contrôle avant fusion

- [ ] Aucune couleur, taille ou graisse codée en dur (tokens uniquement).
- [ ] Aucune graisse > 700, aucune valeur inventée, aucun « Bientôt » visible.
- [ ] Contrastes calculés (AA) en sombre, clair et contraste élevé.
- [ ] Navigation complète au clavier, focus visible, noms accessibles sur les boutons à icône.
- [ ] Fenêtre redimensionnée (petite largeur, 4K, mise à l'échelle 150 %) sans chevauchement.
- [ ] États vides et « en attente du jeu » prévus pour chaque page.
- [ ] Aucune fonctionnalité existante perdue (liste des champs de la page avant / après).
