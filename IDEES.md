# Idées gardées — Truck & Coach Hub

Ce fichier garde les idées des pages **retirées** de l'appli, pour ne rien perdre. Rien ici n'est dans l'appli.

## Pages VTC retirées dans la bêta 5 (décision de Charles, 27 novembre 2026)

Les anciennes pages VTC étaient des maquettes : soit une page « Bientôt » sans contenu, soit des **données d'exemple** (chauffeurs, classement, carte simulée). Elles ont été **supprimées** (pas seulement masquées) dans la bêta 5, étape A.

Origine : ajoutées les 16 et 17 novembre 2026, commits `f93c840`, `585accb`, `b746a69` et `f66b9ba` (référencés par Charles ; ces commits ne sont plus présents dans l'historique actuel du dépôt, qui a été réécrit depuis). Dernier état avant retrait : commit `ecca089` de la branche `claude/beta-5` (fichiers `app/fonctionnalites/hub/hub.js`, `app/commun/navigation.js`, sections `v-vtc`, `v-soon`, `v-classement`, `v-carte`, `v-profil` de `app/index.html`).

**Conclusion commune** : tout est **à reprendre de zéro dans l'espace Entreprise**, après :
1. une étude des autres applis de VTC (TruckersMP, Trucky, TrucksBook, Hub de VTC existants) ;
2. une maquette validée par Charles ;
3. une **vraie source de données** (API publique TruckersMP ou Trucky), essayée pour de vrai. Aucune donnée d'exemple ne doit revenir dans l'appli.

### Ma VTC

- **Vue d'ensemble** (texte de la page « Bientôt ») : « La vue d'ensemble de ton entreprise. » Kilomètres et livraisons de toute l'entreprise ; chauffeurs en ligne ; objectif collectif du mois ; événement du jour. Prévu avec la partie en ligne.
- **Missions partagées** : envoyer une mission à un chauffeur ; boucles et circuits en plusieurs étapes ; feuille de route en PDF.
- **Convois & événements** : calendrier du mois ; détail d'un convoi (rendez-vous, départ, trajet) ; inscription / désinscription en un clic ; rappel avant le départ.
- **Défis & duels** : objectifs personnels (semaine / mois) ; duels entre chauffeurs (distance, gains, livraisons) ; défis entreprise contre entreprise ; célébrations des paliers atteints.
- **Classement** (données d'exemple) : classement des chauffeurs par km total, km chargés, km à vide ou livraisons, sur la semaine, le mois ou depuis le début ; total de l'entreprise avec la part chargé / à vide ; « Comment on compte » (chargé = mission en cours et remorque attelée ; à vide = pas de mission ou en route vers la remorque ; ferry et train non comptés) ; un clic ouvrait une **fiche chauffeur** (km du mois, livraisons, revenus, carburant, consommation, dégâts, heures, derniers trajets).
- **Chauffeurs live** (« Carte en direct », simulée) : carte stylisée avec les chauffeurs en route, couleur chargé / à vide, liste « En route maintenant » (trajet, cargaison, vitesse, distance restante).
- **À repenser** : doublon avec la **Feuille de route** (classement et fiche chauffeur = mêmes chiffres que ses rapports, mais pour plusieurs chauffeurs), avec la **Carte** (TCH Map, qui montre déjà ton camion en direct) et avec **Flotte & chauffeurs** de l'espace Entreprise (chauffeurs du jeu). Le classement et la carte des collègues n'ont de sens qu'avec une source en ligne réelle (TruckersMP / Trucky).

### Calendrier (ancienne page vide)

- Texte prévu : « Le calendrier de ton entreprise : convois, événements et rendez-vous du mois. » Vue du mois avec tous les événements ; détail d'un événement (rendez-vous, départ, trajet, mods requis) ; inscription en un clic ; rappel avant le départ.
- **À repenser** : doublon avec « Convois & événements » ci-dessus, et avec le nouveau **Calendrier de la Feuille de route** (bêta 5), qui montre tes propres trajets jour par jour. Un futur calendrier VTC devra être un filtre « événements de ma VTC » du même calendrier, pas une page à part.

### Infos VTC

- Texte prévu : « La présentation de ton entreprise. » Histoire et règles de l'entreprise ; conseils et FAQ ; liste des membres.
- **À repenser** : doublon avec la page publique de la VTC sur TruckersMP (qui a déjà présentation, règles et membres). Plutôt afficher ces informations depuis l'API TruckersMP dans « Ma VTC » que de les ressaisir.

### Ce qui reste dans l'appli

- La **vraie carte** (Carte / TCH Map) n'est pas concernée.
- Le bloc **« Ma VTC » de Paramètres → Compte & accès** (liaison TruckersMP, accès `acces:vtc`) est gardé : il servira à la future page.
