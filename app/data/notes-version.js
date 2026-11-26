// Notes de version (la plus récente en premier), affichées dans Options → Mises à jour.
// Règle : une version = au moins un changement visible. Jamais de version « technique » seule.
//
// Rubriques (type de chaque note), affichées dans cet ordre :
//   'nouveau'  : Nouveautés     — ce qui n'existait pas avant
//   'ameliore' : Améliorations  — ce qui existait et marche mieux ou en fait plus
//   'change'   : Changements    — déplacé, renommé ou retiré
//   'corrige'  : Corrections    — un bug réglé
//
// Numérotation : la mise à jour automatique exige un numéro technique x.y.z toujours plus haut
// (package.json). Le numéro affiché est calculé ici :
//   0.12.0 → 0.12.5 = 0.12.0 ; 0.12.6 → 0.12.9 = 0.12.0.1 ; 0.12.10 → 0.12.15 = 0.12.0.2 ;
//   0.13.0 → 0.13.27 = 0.12.0.3 ; 0.13.28 → 0.13.34 = 0.12.0.4 ; ensuite 0.13.35 = 0.12.0.5, 0.13.36 = 0.12.0.6…
// Bêta : « 0.13.(n)-beta.k » est l'essai de la version 0.13.(n-1) → affichée « <version> bêta k ».
// Bêtas de la nouvelle interface regroupées en 4 : les essais techniques 0.13.35-beta.1 à 0.13.36-beta.9
// deviennent 0.12.0.5 bêta 1 (essais 1-2), bêta 2 (3-4), bêta 3 (5) et bêta 4 (6-10) ; ensuite beta.11 = bêta 5…
window.versionAffichee = function (v) {
  const b = /^(\d+)\.(\d+)\.(\d+)-beta\.(\d+)$/.exec(v || '');
  if (b && b[1] === '0' && b[2] === '13' && (b[3] === '35' || b[3] === '36')) {
    const k = Number(b[4]);
    return '0.12.0.5 bêta ' + (k <= 2 ? 1 : k <= 4 ? 2 : k === 5 ? 3 : k <= 10 ? 4 : k - 6);
  }
  if (b) return window.versionAffichee(`${b[1]}.${b[2]}.${Number(b[3]) - 1}`) + ' bêta ' + b[4];
  const m = /^0\.(12|13)\.(\d+)$/.exec(v || '');
  if (!m) return v;
  const n = Number(m[2]);
  if (m[1] === '13') return n <= 27 ? '0.12.0.3' : n <= 34 ? '0.12.0.4' : '0.12.0.' + (n - 30);
  return n <= 5 ? '0.12.0' : n <= 9 ? '0.12.0.1' : n <= 15 ? '0.12.0.2' : v;
};

window.NOTES_RUBRIQUES = [
  ['nouveau', 'Nouveautés'],
  ['ameliore', 'Améliorations'],
  ['change', 'Changements'],
  ['corrige', 'Corrections'],
];

// Version officielle
window.NOTES_VERSION = [
  { version: '0.12.0.5', date: '2026-11-24', titre: 'Programme bêta et notes de version plus claires', notes: [
    ['nouveau', 'Programme bêta, dans Options → Interface → Éléments visibles. Désactivé par défaut. Activé, il affiche les notes de la bêta et le lien pour installer Truck & Coach Hub Bêta, une appli séparée qui s’installe à côté de celle-ci. Il n’installe rien et ne change pas ta version.'],
    ['ameliore', 'Notes de version rangées par rubriques : Nouveautés, Améliorations, Changements et Corrections.'],
    ['change', 'Options → Affichage devient Interface, avec une section Éléments visibles : menu réduit, pages en préparation et Programme bêta.'],
    ['change', 'Options → Mises à jour : ta version et le bouton de recherche en haut, les notes à lire en dessous.'],
    ['change', 'Numéros de version simplifiés : toute la nouvelle interface est regroupée dans la 0.12.0.4. Si ton appli affichait 0.12.0.9, c’est normal de voir maintenant 0.12.0.5.'],
  ]},
  { version: '0.12.0.4', date: '2026-11-23', titre: 'Nouvelle interface : Options, menus, navigation et HUD camion', notes: [
    ['nouveau', 'Options rangées en catégories, comme les réglages d’un jeu : Général, Conduite, Jeu & plugin, HUD, Affichage, Accessibilité, Steam & Discord, Truck & Coach Tools, Mises à jour, Aide & infos. Quand tu ouvres Options, le menu latéral affiche Retour puis les catégories.'],
    ['nouveau', 'Menu ☰ en haut à gauche : passe du Hub à la Marketplace ou à Truck & Coach Tools, ou reviens à l’écran d’accueil.'],
    ['nouveau', 'Bandeau camion refait sur le modèle du bandeau car : mission, trajet, heure du jeu, rapport engagé, vitesse, limitation, régulateur, mode et dégâts du camion ; en dessous, route, heure limite de livraison, marchandise, carburant et pause.'],
    ['nouveau', 'Menu latéral réglable : glisse son bord pour l’élargir ou le rétrécir, ou réduis-le aux icônes (nom au survol, pastilles HUD et mise à jour). Double-clic sur le bord : taille normale.'],
    ['nouveau', 'Repères : une barre en haut de chaque page indique où tu es (par exemple Hub › Entreprise) et reste en haut quand tu fais défiler.'],
    ['nouveau', 'Animations : les pages arrivent du côté de leur place dans le menu et un trait marque la page active. Elles se coupent avec Options → Accessibilité → Réduire les animations.'],
    ['nouveau', 'Bouton Options sur l’écran d’accueil.'],
    ['ameliore', 'L’appli s’adapte à la taille de la fenêtre : une seule colonne quand la place manque, menu réduit tout seul sur une petite fenêtre, utilisable dès 720 px de large.'],
    ['ameliore', 'Télémétrie : colonnes alignées dans les onglets Camion et Car. Sans le jeu, la page affiche l’attente, tes kilomètres et un lien vers Options → Jeu & plugin.'],
    ['ameliore', 'Plugin du jeu 1.5.0 : rapport engagé, régime moteur et régulateur. Ferme le jeu avant d’ouvrir l’appli pour qu’elle l’installe.'],
    ['ameliore', 'Après chaque mise à jour, l’écran d’accueil montre une seule fois ce qui a changé.'],
    ['change', 'Page HUD épurée : l’interrupteur et les aperçus des bandeaux camion et car. Tous les réglages sont dans Options → HUD.'],
    ['change', 'Menu latéral réorganisé : ☰ et réduction du menu en haut, l’espace en cours, Options, puis le logo et la version en bas (un clic ramène à l’écran d’accueil).'],
    ['change', 'Notes de version déplacées dans Options → Mises à jour.'],
    ['corrige', 'Bandeau camion, bandeau car et Télémétrie lisent les mêmes données du jeu en direct : ce qui s’affiche est ce qui se passe en jeu.'],
    ['corrige', 'Télémétrie : les onglets Camion et Car restent visibles même quand le jeu n’est pas lancé.'],
    ['corrige', 'Options → Mises à jour affiche le numéro de version de l’appli, et non plus le numéro technique.'],
  ]},
  { version: '0.12.0.3', date: '2026-11-23', titre: 'Télémétrie camion et car, Feuille de route et Truck & Coach Tools', notes: [
    ['nouveau', 'Télémétrie : onglets Camion et Car qui suivent la mission en cours dans le jeu. L’appli s’ouvre toute seule sur la Télémétrie quand le jeu se lance (désactivable dans Options).'],
    ['nouveau', 'Télémétrie camion : la livraison telle que le jeu la donne (villes, entreprises, marchandise, revenu), avancement du trajet, distance GPS restante, heure limite de livraison et temps restant.'],
    ['nouveau', 'Télémétrie car : ligne, départ, arrêts desservis, prochain arrêt et terminus, avance ou retard sur l’horaire, voyageurs à bord, satisfaction (quand le jeu l’envoie), force G en direct, pic et à-coups du service.'],
    ['nouveau', 'Télémétrie : plein (niveau en % et en litres, litres pour faire le plein, autonomie, consommation, alerte réserve) et dégâts en % du véhicule, de la remorque et de la marchandise.'],
    ['nouveau', 'Feuille de route : trajets récents séparés Camion et Car. Clique sur un trajet pour voir son parcours, ses arrêts et l’endroit où il a été abandonné, avec km, dépenses, revenu et solde.'],
    ['nouveau', 'Ma carrière et Feuille de route : total de tes dépenses (péages, ferries, trains, amendes, annulations), même hors mission, en euros (ETS2) et en dollars (ATS) séparément.'],
    ['nouveau', 'Truck Tools en cartes d’outils. Camions : réparer, carburant, kilométrage, plaque, changer de camion, téléportation, moteur et boîte, retirer le badge. Remorques : poids de la cargaison, poids à vide, autoriser partout, réparer, plaque, changer de remorque.'],
    ['nouveau', 'Truck Tools → Profil : villes, concessionnaires, agences, achat des garages libres, copie des réglages entre profils. Jeu : convois à 128 places. Suppression et restauration de sauvegardes et de profils.'],
    ['nouveau', 'Coach Tools en cartes : expérience et compétences car, arrêts de bus, et pour tes cars : réparer, carburant, kilométrage, plaque. Chaque outil agit seulement sur le bon type de véhicule.'],
    ['ameliore', 'Bandeau car redessiné : numéro et nom de ligne, arrêt en cours, heure du jeu à la seconde, vitesse, limitation, prochain arrêt, avance ou retard, passagers, pause obligatoire et carburant. Il s’affiche dès que tu montes dans un car, même sans service.'],
    ['ameliore', 'Truck & Coach Tools : une illustration par outil et une barre flottante commune pour choisir le profil et la sauvegarde.'],
    ['ameliore', 'Plugin du jeu 1.4.0 (SDK 1.16) : pause obligatoire, données de service car, usure du véhicule et de la remorque, accélération et consommation. Ferme le jeu avant d’ouvrir l’appli pour qu’elle l’installe.'],
    ['change', 'Truck Tools et Coach Tools s’appellent maintenant Truck & Coach Tools.'],
    ['change', '« Bandeau / HUD » s’appelle maintenant « HUD ». « Données car reçues du jeu » est dans Options → Informations générales d’utilisation.'],
    ['corrige', 'Un ancien service car resté en mémoire dans le jeu ne remplace plus ta livraison camion, et un camion n’est plus pris pour un car.'],
    ['corrige', 'Les km d’un service car comptent comme « chargés ». Charger une sauvegarde ou se téléporter ne compte plus un faux plein.'],
    ['corrige', 'Bandeau camion « Grand » plus coupé sur les côtés, messages Steam et Discord en français, pause obligatoire due tout de suite affichée « maintenant ».'],
  ]},
  { version: '0.12.0.2', date: '2026-11-18', titre: 'Détection camion / car et Feuille de route', notes: [
    ['nouveau', 'Entreprise → Feuille de route : départ, arrivée, carburant ajouté ou consommé, péages, amendes et ferries pour chaque trajet, et vraies destinations des services car.'],
    ['nouveau', 'Détection du véhicule : le profil de carrière choisi dans Options (camion ou car) décide du HUD et reste actif d’une mission à l’autre ; un service car en cours active le HUD car.'],
    ['ameliore', 'HUD camion et HUD car séparés : chacun a ses réglages et son aperçu, un seul interrupteur les active. La page HUD indique le profil actif.'],
    ['change', 'Styles du HUD simplifiés : Bandeau et Navigation. Le HUD car ne garde que la taille et l’opacité.'],
  ]},
  { version: '0.12.0.1', date: '2026-11-17', titre: 'HUD car, cartes DLC et mise à jour automatique', notes: [
    ['nouveau', 'HUD car : bandeau à deux lignes avec pastille de ligne, heure du jeu, vitesse, limitation, GPS et temps jusqu’au prochain arrêt, compteur, carburant, autonomie et pause obligatoire. Ce que le jeu n’envoie pas est affiché « — ».'],
    ['nouveau', 'Carte : import des tuiles générées avec TsMap pour les cartes DLC d’ETS2 et d’ATS.'],
    ['ameliore', 'Le HUD reconnaît les missions camion et car et adapte ce qu’il affiche.'],
    ['ameliore', 'Après l’installation d’une mise à jour, l’appli redémarre toute seule.'],
    ['change', 'Options : « Plugin du jeu » et « Profil chauffeur » regroupés dans une section repliable.'],
  ]},
  { version: '0.12.0', date: '2026-11-17', titre: 'Truck & Coach Tools, nouvelle couleur et intégrations', notes: [
    ['nouveau', 'Truck Tools : analyse des sauvegardes d’un profil, copie d’un profil pour faire des tests, bilan du profil (banque, prêts, flotte, usure) avec les problèmes à corriger.'],
    ['nouveau', 'HUD Navigation : livraison en cours, marchandise, distance GPS et temps estimés. C’est le style par défaut ; celui que tu avais choisi est conservé.'],
    ['nouveau', 'Options → Steam et Discord : profil Steam, jeux ETS2 / ATS et présence Discord facultative.'],
    ['nouveau', 'Options → Apparence : couleur d’accent au choix (pastilles, roue de couleurs ou couleur de Windows).'],
    ['nouveau', 'Notes de version en bas de l’écran d’accueil, et diagnostic des fichiers du jeu et de la télémétrie.'],
    ['ameliore', 'Le HUD se cache dans le menu pause, en Alt+Tab, sur le bureau et quand le jeu est réduit.'],
    ['ameliore', 'Nouvelles icônes dans le style de Windows 11, seuils kilométriques regroupés et vérifiés, touche Tab qui passe par tous les champs des fenêtres de confirmation.'],
    ['change', 'L’Atelier devient Truck Tools et Coach Tools, avec sa propre présentation.'],
    ['change', 'L’orange ambre remplace le jaune et le bleu comme couleur principale.'],
    ['corrige', 'La trace GPS garde le point d’origine (0, 0) ; le raccourci Profil ne renvoie plus vers Options.'],
  ]},
  { version: '0.11.0', date: '2026-11-17', titre: 'Apparence et accessibilité', notes: [
    ['nouveau', 'Choix du thème : De base, Sombre, Clair ou Comme Windows.'],
    ['nouveau', 'Lecture plus confortable : couleurs adaptées au daltonisme, taille du texte réglable, contraste renforcé.'],
    ['nouveau', 'Toute l’appli utilisable au clavier et avec un lecteur d’écran : focus visible partout, lien « Aller au contenu », fenêtres fermables avec Échap.'],
    ['ameliore', 'Appli conforme aux règles d’accessibilité WCAG 2.1 AA dans tous les thèmes : une seule couleur pour les actions, bordures plus visibles, texte jamais sous 12 px.'],
    ['ameliore', 'Les réglages de Windows sont respectés : mode Contraste élevé et « réduire les animations ».'],
  ]},
  { version: '0.10.0', date: '2026-11-17', titre: 'HUD et carte en direct', notes: [
    ['nouveau', 'HUD : un bandeau par-dessus le jeu avec vitesse, limitation, mode réel ou course et distance restante, et plusieurs styles à tester dans l’aperçu.'],
    ['nouveau', 'Carte en direct sur la vraie carte d’ETS2 et d’ATS : ton camion, ta destination et le tracé de ta session (chargé / à vide).'],
    ['ameliore', 'Les zones de carte déjà vues restent disponibles hors ligne.'],
    ['change', 'Menu allégé (compteurs retirés) ; les pages encore en préparation peuvent être masquées ou affichées.'],
  ]},
  { version: '0.8.0', date: '2026-11-17', titre: 'L’Atelier', notes: [
    ['nouveau', 'Sauvegarde et restauration des profils ETS2 / ATS (outil expérimental, à activer dans Options).'],
    ['nouveau', 'Modification du profil solo : profil, car, carte, carburant et réparation, avec des boutons « atteindre le niveau » pour le camion et le car.'],
    ['nouveau', 'Renommer son profil et son entreprise en jeu.'],
    ['nouveau', 'Activation de la console de développement du jeu, avec une copie de secours et des explications claires.'],
  ]},
  { version: '0.6.0', date: '2026-11-17', titre: 'Marketplace', notes: [
    ['nouveau', 'Marketplace : Découvrir, À la une & news, et les catégories Modules du Hub, Cars & bus et Camions.'],
    ['nouveau', 'Une fiche pour chaque contenu (aperçu, description, infos), avec retour en arrière.'],
    ['nouveau', 'Gestion des contenus installés et de leurs mises à jour (Mes contenus, Mises à jour).'],
    ['nouveau', 'Préparation de ta propre livrée (Créer une livrée).'],
  ]},
  { version: '0.4.0', date: '2026-11-17', titre: 'Truck & Coach Hub', notes: [
    ['nouveau', 'Démarrage depuis la page Accueil : lancer ETS2 ou ATS via Steam, voir l’état du jeu et des mises à jour, suivre le guide.'],
    ['ameliore', 'Ton profil s’affiche en haut à droite de l’écran d’accueil.'],
    ['change', 'L’appli devient Truck & Coach Hub (tes données sont conservées) et s’ouvre sur un écran pour choisir entre le Hub et la Marketplace.'],
    ['change', 'Menu rangé par catégories : Général et Entreprise, avec Ma VTC en onglets (Missions, Convois, Défis & duels, Classement, Chauffeurs live) et le Calendrier, en préparation.'],
    ['change', 'La tablette et le mini-GPS rejoignent les modules complémentaires ; un raccourci vers HaulMP est ajouté dans Options.'],
  ]},
  { version: '0.2.0', date: '2026-11-16', titre: 'Première version', notes: [
    ['nouveau', 'Branchement au jeu : le plugin s’installe tout seul dans ETS2 et ATS.'],
    ['nouveau', 'Suivi de la conduite en direct et compteur des kilomètres chargés et à vide.'],
    ['nouveau', 'Historique des missions, en mode réel ou course.'],
    ['nouveau', 'Mises à jour téléchargées et installées directement dans l’appli.'],
  ]},
];

// Version bêta (Truck & Coach Hub Bêta) : chaque bêta est l'essai de la prochaine version officielle.
// Une bêta = un gros lot. Les petits correctifs entre deux lots complètent la note de la bêta en cours
// au lieu d'en créer une nouvelle.
window.NOTES_BETA = [
  { version: '0.12.0.5 bêta 4', date: '2026-11-26', titre: 'La vraie carte du jeu et l’analyse des mods', notes: [
    ['nouveau', 'Carte lue directement dans tes fichiers du jeu, avec toutes tes DLC (Iberia, Balkans, Grèce, Nordic Horizons, Islande…) : routes, carrefours, ferries et villes à leur place exacte, dans un style proche de la carte du jeu.'],
    ['nouveau', 'La carte se prépare toute seule en arrière-plan, une fois par version du jeu ou quand tes DLC changent. Un petit indicateur en bas à droite montre l’avancement.'],
    ['nouveau', 'Truck & Coach Tools → Mods : repère les mods obsolètes, abîmés ou en double, et ceux dont ta sauvegarde a besoin. Lecture seule, rien n’est modifié.'],
    ['ameliore', 'Préparation de la carte plus rapide et plus légère, avec une priorité basse pour que le jeu reste fluide.'],
    ['corrige', 'Carte : plus de routes dans l’eau, plus de bandes sur le fond, et routes visibles en vue d’ensemble.'],
  ]},
  { version: '0.12.0.5 bêta 3', date: '2026-11-24', titre: 'Nouvelle carte, recherche dans les paramètres et sécurité', notes: [
    ['nouveau', 'Aperçu de la nouvelle carte : nette à tous les zooms, avec ton camion en direct, ta trace et les villes visitées. Un bouton permet de revenir à l’ancienne.'],
    ['nouveau', 'Mode Paramètres : la barre de gauche se transforme en dossiers de réglages (Compte, Appli, Jeu, Liens, Données, Aide).'],
    ['nouveau', 'Recherche dans les paramètres : tape un mot (HUD, Discord, thème…) pour trouver le réglage.'],
    ['nouveau', 'En préparation : Compte & accès (rangs, clés, VTC) et Notifications, visibles avec Interface → Pages en préparation.'],
    ['ameliore', 'Sécurité : aucune permission web (caméra, micro…) n’est accordée, et les suppressions de profils sont mieux vérifiées.'],
  ]},
  { version: '0.12.0.5 bêta 2', date: '2026-11-24', titre: 'Paramètres par jeu, page News et ATS', notes: [
    ['nouveau', 'Paramètres généraux, et paramètres propres à ETS2 et à ATS, chargés tout seuls quand le jeu est lancé. Bouton « Copier depuis l’autre jeu ».'],
    ['nouveau', 'Page News : les actualités Steam d’ETS2 et d’ATS, et les nouveautés de l’appli.'],
    ['nouveau', 'ATS : unités américaines (miles, mph, gallons), « Car » devient « Road Trip » et les outils s’appellent Truck & Road Trip Tools.'],
    ['change', 'Chaque jeu a sa carte et ses outils, avec un interrupteur par jeu dans Interface → Éléments visibles.'],
    ['change', 'La Marketplace est cachée en attendant d’être prête.'],
  ]},
  { version: '0.12.0.5 bêta 1', date: '2026-11-24', titre: 'Première bêta : choix du jeu à l’ouverture', notes: [
    ['nouveau', 'Truck & Coach Hub Bêta : une appli séparée, avec son installateur, son raccourci et ses propres mises à jour. Elle reprend une copie de tes données ; la version officielle n’est pas modifiée.'],
    ['nouveau', 'L’appli s’ouvre sur le choix du jeu, ETS2 ou ATS, avec l’état du jeu et du plugin.'],
    ['nouveau', 'Barre de gauche sur l’accueil : Game, News, Map, Settings et Support.'],
  ]},
];
