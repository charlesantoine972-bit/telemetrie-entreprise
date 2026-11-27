# Étude — Refonte des catégories « Entreprise » et « Général »

> **Remplacé par `REFONTE-INTERFACE.md`** (maquette validée le 27 novembre 2026). Ce fichier garde les vérifications d’origine (sauvegarde, API TruckersMP).

État : étude du 27 novembre 2026 (2 h 30). Aucune ligne de code de l'appli n'est modifiée.
Objet : base propre pour une future étape de refonte. Rien n'est programmé.

---

## 1. VÉRIFICATIONS

### 1.1 Sauvegarde du jeu (game.sii) — CONFIRMÉ

L'appli lit déjà ces données (`src/save-editor.js`, `src/save-tools.js`, utilisées par l'Atelier) :

| Donnée | Champ de la sauvegarde | Déjà lu par |
|---|---|---|
| Nom de la société | `company_name` (profil) | `profileNames()` |
| Argent | `bank.money_account` | `summary()` |
| Prêts | `bank` → prêts (montant, durée, taux) | `bilan()` |
| Expérience | `economy.experience_points` | `summary()` |
| Compétences | `economy` (ADR, distance, lourd, fragile…) | `summary()` |
| Garages | `garage` (ville, statut, places) | `garagesSummary()` |
| Flotte | `trucks`, `vehicle` (usure, carburant, km) | `trucks()`, `bilan()` |
| Chauffeurs embauchés | `drivers` (nombre) | `bilan()` |
| Remorques | `trailers` | `trailers()` |
| Jours de jeu | `economy.game_time` | `bilan()` |

À CONFIRMER : le détail par chauffeur (nom, niveau, gains). Aujourd'hui, seul le nombre est lu.

### 1.2 API publique TruckersMP — CONFIRMÉ (sans clé)

L'appli l'utilise déjà (`src/acces/vtc.js`) : `/v2/player/{steamID64}` → VTC du joueur, puis `/v2/vtc/{id}/member/{memberID}` → rôle.

Disponible en plus, d'après la bibliothèque de référence async-truckersmp :

| Appel | Donne |
|---|---|
| VTC | nom, tag, slogan, logo, bannière, présentation, règles, conditions, nombre de membres, date de création, jeux (ETS2 / ATS), réseaux |
| Membres | pseudo, rôle, date d'arrivée |
| Rôles | liste des rôles |
| Événements | nom, date, serveur, départ, arrivée, DLC requis, bannière, participants (confirmés / incertains) |
| Actualités | titres des actualités de la VTC |

LIMITE : la liste des participants d'un événement n'est donnée qu'en ouvrant cet événement. Le nombre de requêtes est limité par TruckersMP : il faudra garder les réponses en cache.
À CONFIRMER : un essai réel avec ta VTC (format exact des réponses).

### 1.3 Historique (Feuille de route) — CONFIRMÉ

Les trajets, dépenses et pleins sont déjà enregistrés par l'appli.

---

## 2. PAGE ENTREPRISE

### Fonction

Montrer ton entreprise, celle du jeu et celle de ta VTC. Uniquement des données réelles, sans aucun « Bientôt ». Une page par jeu : ETS2 et ATS ont chacun leur sauvegarde, la VTC est commune.

### Maquette

```
┌─ ENTREPRISE · ETS2 ─────────────────────────────────────────────┐
│  [logo]  TRANSPORTS BRION          QG : Toulouse   Niveau 42    │
│          Profil « Charles » · sauvegarde du 26/11 18 h 04        │
├────────────────┬────────────────┬────────────────┬──────────────┤
│ Argent         │ Prêts          │ Garages        │ Flotte       │
│ 1 245 300 €    │ 1 · 80 000 €   │ 6 · 31/40      │ 28 camions   │
├────────────────┴────────────────┴────────────────┴──────────────┤
│ FLOTTE & CHAUFFEURS                                  [Tout voir] │
│  Garage        Camions  Chauffeurs  Usure max                    │
│  Toulouse      6/8      6           12 %                         │
│  Lyon          5/5      5           41 %  ⚠                      │
├──────────────────────────────────────────────────────────────────┤
│ CE MOIS-CI (Feuille de route)                                    │
│  8 420 km · 31 livraisons · 412 000 € de revenus                 │
├──────────────────────────────────────────────────────────────────┤
│ MA VTC · TruckersMP                          Rôle : Chauffeur    │
│  [logo] Les Routiers du Sud [LRS] · 54 membres                   │
│  Prochain convoi : sam. 30/11 21 h · Calais → Duisbourg          │
│                   Simulation 1 · 23 confirmés      [Voir]        │
│  Membres · Règles · Actualités                                   │
└──────────────────────────────────────────────────────────────────┘

Sans VTC liée :  ┌ MA VTC ─ [ Lier ma VTC ] → Paramètres → Compte ┐
Sans sauvegarde : ┌ Choisis un profil dans l'Atelier pour voir ta société ┐
```

### Sections

1. **En-tête** : nom de la société, QG, niveau, profil et date de la sauvegarde.
2. **Chiffres clés** : argent, prêts, garages, flotte.
3. **Flotte & chauffeurs** : par garage, avec une alerte d'usure au-dessus de 30 %.
4. **Ce mois-ci** : totaux tirés de la Feuille de route.
5. **Ma VTC** : identité, ton rôle, prochain convoi, liens vers les membres, les règles et les actualités.

### Règles

- Lecture seule. Aucune écriture dans la sauvegarde depuis cette page : les modifications restent dans l'Atelier.
- La VTC se lie à un seul endroit, Paramètres → Compte.
- Réponses TruckersMP gardées en cache 15 minutes ; mode hors ligne : dernières données connues, avec leur date.
- Aucune donnée inventée. Bloc vide = message clair et action à faire.

---

## 3. CATÉGORIE « GÉNÉRAL »

### Constat

Contenu actuel : Accueil, Télémétrie, Ma carrière, Carte. Le menu Entreprise contient : Feuille de route, HUD.
- « Général » ne dit pas ce qu'il contient.
- Ma carrière et Feuille de route font doublon (historique des trajets).
- Le HUD et la Feuille de route ne concernent pas l'entreprise.

### Nouveau rangement

| Catégorie | Pages | Question |
|---|---|---|
| **En jeu** | Accueil, Télémétrie, Carte, HUD | Que se passe-t-il maintenant ? |
| **Carrière** | Mes trajets (Ma carrière + Feuille de route) | Qu'ai-je fait ? |
| **Entreprise** | Entreprise (section 2) | Qui est ma société / ma VTC ? |

### Maquette du menu

```
EN JEU
  Accueil
  Télémétrie
  Carte
  HUD            [● actif]
CARRIÈRE
  Mes trajets
ENTREPRISE
  Entreprise
```

### Maquette de l'Accueil

```
┌─ ACCUEIL · ETS2 ────────────────────────────────────────────────┐
│ Jeu : ● lancé     Plugin : ● OK     HUD : ● actif               │
├──────────────────────────────────────────────────────────────────┤
│ EN COURS   Lyon → Milan · Électronique 18 t · 412 km restants    │
│            [Carte]  [Télémétrie]                                 │
├──────────────────────────────────────────────────────────────────┤
│ DERNIER TRAJET   Paris → Lyon · 465 km · 38 200 € · Réel ✓       │
│                                              [Mes trajets]       │
├──────────────────────────────────────────────────────────────────┤
│ MA SOCIÉTÉ   1 245 300 € · 28 camions        [Entreprise]        │
│ MA VTC       Prochain convoi sam. 21 h       [Entreprise]        │
└──────────────────────────────────────────────────────────────────┘
```

### Page « Mes trajets » (fusion)

1. Totaux (semaine, mois, total) : déjà dans Ma carrière.
2. Trajet en cours : dépenses et pleins, déjà dans Feuille de route.
3. Liste des trajets, camion et car, avec le détail de chacun : fusion des deux tableaux, sans doublon.

---

## 4. MISE EN ŒUVRE (proposée, non programmée)

| Étape | Contenu | Taille |
|---|---|---|
| 1 | Essai réel de l'API TruckersMP avec ta VTC, lecture du détail des chauffeurs dans la sauvegarde | Petite |
| 2 | Maquette visuelle validée par Charles (à partir de ce document) | Petite |
| 3 | Nouveau menu (En jeu / Carrière / Entreprise) et fusion Mes trajets | Moyenne |
| 4 | Accueil en résumé | Petite |
| 5 | Page Entreprise : société, flotte, chiffres du mois | Moyenne |
| 6 | Page Entreprise : bloc Ma VTC (TruckersMP, cache) | Moyenne |

Chaque étape : un dossier par fonctionnalité (`app/fonctionnalites/entreprise/`, `.../trajets/`), le contrat du noyau mis à jour pour toute nouvelle fonction du pont, et les tests.

Prérequis : bêta 5 fusionnée (découpage en dossiers, retrait des anciennes pages VTC).

Sources : bibliothèque async-truckersmp (champs de l'API TruckersMP) ; code du dépôt (`src/acces/vtc.js`, `src/save-editor.js`, `src/save-tools.js`).
