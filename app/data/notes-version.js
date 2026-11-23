// Notes de version affichées en bas de l'écran d'accueil (la plus récente en premier).
// À chaque nouvelle version : ajouter une entrée en haut de la liste (numéro affiché 0.12.0.x).
// type : 'nouveau' (ajout), 'ameliore' (amélioration), 'corrige' (correction de bug)
//
// Numérotation : la mise à jour automatique exige un numéro technique x.y.z toujours plus haut
// (package.json). Les versions techniques 0.12.0 → 0.13.27 sont regroupées et affichées
// 0.12.0, 0.12.0.1, 0.12.0.2 et 0.12.0.3.
window.versionAffichee = function (v) {
  const m = /^0\.(12|13)\.(\d+)$/.exec(v || '');
  if (!m) return v;
  const n = Number(m[2]);
  // 0.13.20 → 0.13.27 = 0.12.0.3, puis une version affichée par version technique : 0.13.28 = 0.12.0.4, 0.13.29 = 0.12.0.5…
  if (m[1] === '13') return n <= 27 ? '0.12.0.3' : '0.12.0.' + (n - 24);
  return n <= 5 ? '0.12.0' : n <= 9 ? '0.12.0.1' : n <= 15 ? '0.12.0.2' : v;
};
window.NOTES_VERSION = [
  { version: '0.12.0.4', date: '2026-11-23', titre: 'Numéro de version dans les Options', notes: [
    ['corrige', 'Options → Mises à jour affiche le bon numéro de version (0.12.0.x) au lieu du numéro technique.'],
  ]},
  { version: '0.12.0.3', date: '2026-11-23', titre: 'Télémétrie camion et car, Feuille de route et Truck Tools complet', notes: [
    ['nouveau', 'Télémétrie : onglets Camion et Car qui suivent la mission en cours dans le jeu. L’appli s’ouvre toute seule sur la Télémétrie quand le jeu se lance (désactivable dans Options).'],
    ['nouveau', 'Télémétrie camion : la livraison telle que le jeu la donne (villes, entreprises, marchandise, revenu), avancement du trajet, distance GPS restante, heure limite de livraison et temps restant.'],
    ['nouveau', 'Télémétrie car : ligne, départ, arrêts desservis, prochain arrêt et terminus, avance ou retard sur l’horaire, voyageurs à bord, satisfaction (quand le jeu l’envoie), force G en direct, pic et à-coups du service.'],
    ['nouveau', 'Télémétrie : plein (niveau en % et en litres, litres pour faire le plein, autonomie, consommation, alerte réserve) et dégâts en % du véhicule, de la remorque et de la marchandise.'],
    ['nouveau', 'Feuille de route : trajets récents séparés Camion et Car. Clique sur un trajet pour voir son parcours, ses arrêts et l’endroit où il a été abandonné, avec km, dépenses, revenu et solde.'],
    ['nouveau', 'Ma carrière et Feuille de route : total de tes dépenses (péages, ferries, trains, amendes, annulations), même hors mission, en euros (ETS2) et en dollars (ATS) séparément.'],
    ['nouveau', 'Bandeau car redessiné : numéro et nom de ligne, arrêt en cours, heure du jeu à la seconde, vitesse, limitation, prochain arrêt, avance ou retard, passagers, pause obligatoire et carburant. Il s’affiche dès que tu montes dans un car, même sans service.'],
    ['nouveau', 'Truck Tools en cartes d’outils. Camions : réparer, carburant, kilométrage, plaque, changer de camion, téléportation, moteur et boîte, retirer le badge. Remorques : poids de la cargaison, poids à vide, autoriser partout, réparer, plaque, changer de remorque.'],
    ['nouveau', 'Truck Tools → Profil : villes, concessionnaires, agences, achat des garages libres, copie des réglages entre profils. Jeu : convois à 128 places. Suppression et restauration de sauvegardes et de profils.'],
    ['nouveau', 'Coach Tools en cartes : expérience et compétences car, arrêts de bus, et pour tes cars : réparer, carburant, kilométrage, plaque. Chaque outil agit seulement sur le bon type de véhicule.'],
    ['ameliore', 'Truck & Coach Tools : une illustration par outil et une barre flottante commune pour choisir le profil et la sauvegarde.'],
    ['ameliore', 'Plugin du jeu 1.4.0 (SDK 1.16) : pause obligatoire, données de service car, usure du véhicule et de la remorque, accélération et consommation. Ferme le jeu avant d’ouvrir l’appli pour qu’elle l’installe.'],
    ['ameliore', '« Bandeau / HUD » s’appelle maintenant « HUD ». « Données car reçues du jeu » est dans Options → Informations générales d’utilisation.'],
    ['corrige', 'Un ancien service car resté en mémoire dans le jeu ne remplace plus ta livraison camion, et un camion n’est plus pris pour un car.'],
    ['corrige', 'Les km d’un service car comptent comme « chargés ». Charger une sauvegarde ou se téléporter ne compte plus un faux plein.'],
    ['corrige', 'Bandeau camion « Grand » plus coupé sur les côtés, messages Steam et Discord en français, pause obligatoire due tout de suite affichée « maintenant ».'],
  ]},
  { version: '0.12.0.2', date: '2026-11-18', titre: 'Détection camion / car et Feuille de route', notes: [
    ['nouveau', 'Entreprise → Feuille de route : départ, arrivée, carburant ajouté ou consommé, péages, amendes et ferries pour chaque trajet, et vraies destinations des services car.'],
    ['nouveau', 'Détection du véhicule : le profil de carrière choisi dans Options (camion ou car) décide du HUD et reste actif d’une mission à l’autre ; un service car en cours active le HUD car.'],
    ['ameliore', 'HUD camion et HUD car séparés : chacun a ses réglages et son aperçu, un seul interrupteur les active. La page HUD indique le profil actif.'],
    ['ameliore', 'Styles du HUD simplifiés : Bandeau et Navigation. Le HUD car ne garde que la taille et l’opacité.'],
  ]},
  { version: '0.12.0.1', date: '2026-11-17', titre: 'HUD car, cartes DLC et mise à jour automatique', notes: [
    ['nouveau', 'HUD car : bandeau à deux lignes avec pastille de ligne, heure du jeu, vitesse, limitation, GPS et temps jusqu’au prochain arrêt, compteur, carburant, autonomie et pause obligatoire. Ce que le jeu n’envoie pas est affiché « — ».'],
    ['nouveau', 'Carte : import des tuiles générées avec TsMap pour les cartes DLC d’ETS2 et d’ATS.'],
    ['ameliore', 'Le HUD reconnaît les missions camion et car et adapte ce qu’il affiche.'],
    ['ameliore', 'Options : « Plugin du jeu » et « Profil chauffeur » regroupés dans une section repliable.'],
    ['ameliore', 'Après l’installation d’une mise à jour, l’appli redémarre toute seule.'],
  ]},
  { version: '0.12.0', date: '2026-11-17', titre: 'Truck & Coach Tools, nouvelle couleur et intégrations', notes: [
    ['ameliore', 'L’Atelier devient Truck Tools et Coach Tools, avec sa propre présentation.'],
    ['nouveau', 'Truck Tools : analyser les sauvegardes d’un profil, dupliquer un profil pour faire des tests, bilan du profil (banque, prêts, flotte, usure) avec les problèmes à corriger.'],
    ['nouveau', 'HUD Navigation : livraison en cours, marchandise, distance GPS et temps estimés. C’est le style par défaut ; celui que tu avais choisi est conservé.'],
    ['ameliore', 'Le HUD se cache dans le menu pause, en Alt+Tab, sur le bureau et quand le jeu est réduit.'],
    ['nouveau', 'Options → Steam et Discord : profil Steam, jeux ETS2 / ATS et présence Discord facultative.'],
    ['nouveau', 'Options → Apparence : couleur d’accent au choix (pastilles, roue de couleurs ou couleur de Windows). L’orange ambre remplace le jaune et le bleu.'],
    ['nouveau', 'Notes de version en bas de l’écran d’accueil, et diagnostic des fichiers du jeu et de la télémétrie.'],
    ['ameliore', 'Nouvelles icônes dans le style de Windows 11, seuils kilométriques regroupés et vérifiés, touche Tab qui passe par tous les champs des fenêtres de confirmation.'],
    ['corrige', 'La trace GPS garde le point d’origine (0, 0) ; le raccourci Profil ne renvoie plus vers Options.'],
  ]},
  { version: '0.11.0', date: '2026-11-17', titre: 'Accessibilité', notes: [
    ['ameliore', 'Toute l\'appli respecte les règles d\'accessibilité WCAG 2.1 AA, dans tous les thèmes et les modes daltonisme.'],
    ['ameliore', 'Une seule couleur pour les actions (boutons, sélection, interrupteurs) : plus lisible.'],
    ['ameliore', 'Bordures plus visibles et texte jamais plus petit que 12 px.'],
    ['nouveau', 'Navigation complète au clavier : lien « Aller au contenu », focus visible partout, fenêtres de confirmation fermables avec Échap.'],
    ['nouveau', 'Meilleure prise en charge des lecteurs d\'écran.'],
    ['nouveau', 'Le mode Contraste élevé et le réglage « réduire les animations » de Windows sont respectés.'],
  ]},
  { version: '0.10.0', date: '2026-11-17', titre: 'Carte en direct', notes: [
    ['nouveau', 'Page Carte : la vraie carte d\'ETS2 et d\'ATS, avec ton camion en direct, ta destination et le tracé de ta session (chargé / à vide).'],
    ['nouveau', 'Les zones de carte déjà vues restent disponibles hors ligne.'],
    ['ameliore', 'Menu plus épuré : les compteurs à côté des catégories ont été retirés.'],
  ]},
  { version: '0.9.1', date: '2026-11-17', titre: 'Styles du HUD', notes: [
    ['nouveau', 'Plusieurs styles pour le bandeau en jeu (HUD), à tester directement dans l\'aperçu.'],
    ['nouveau', 'Option pour masquer ou afficher les pages encore en préparation.'],
  ]},
  { version: '0.9.0', date: '2026-11-17', titre: 'HUD en jeu', notes: [
    ['nouveau', 'Le bandeau en jeu (HUD) fonctionne : vitesse, limitation, mode réel ou course, distance restante.'],
    ['nouveau', 'Marketplace : page « À la une & news ».'],
    ['nouveau', 'Marketplace : nouvelle catégorie Camions.'],
  ]},
  { version: '0.8.2', date: '2026-11-17', titre: 'Renommer son profil', notes: [
    ['nouveau', 'Atelier : renommer ton profil et ton entreprise.'],
  ]},
  { version: '0.8.1', date: '2026-11-17', titre: 'Atteindre un niveau', notes: [
    ['nouveau', 'Atelier : boutons « atteindre le niveau » pour le camion et le car.'],
  ]},
  { version: '0.8.0', date: '2026-11-17', titre: 'Apparence', notes: [
    ['nouveau', 'Thèmes De base, Sombre, Clair et Comme Windows.'],
    ['nouveau', 'Couleurs adaptées au daltonisme, taille du texte réglable et contraste renforcé.'],
  ]},
  { version: '0.7.0', date: '2026-11-17', titre: 'Atelier camion et car', notes: [
    ['nouveau', 'Atelier : modification du profil, du car, de la carte, du carburant et réparation.'],
    ['ameliore', 'Explications plus claires pour la console de développement.'],
  ]},
  { version: '0.6.1', date: '2026-11-17', titre: 'Fiches produit', notes: [
    ['ameliore', 'Marketplace : « Voir l\'aperçu » ouvre une vraie fiche du mod (aperçu, description, infos) avec un bouton Retour.'],
  ]},
  { version: '0.6.0', date: '2026-11-17', titre: 'Arrivée de l’Atelier', notes: [
    ['nouveau', 'Atelier (expérimental, à activer dans Options) : sauvegarder et restaurer tes profils ETS2 / ATS.'],
    ['nouveau', 'Activation de la console de développement du jeu, avec copie de secours.'],
    ['nouveau', 'Marketplace : page Créer une livrée.'],
  ]},
  { version: '0.5.2', date: '2026-11-17', titre: 'Ma VTC et Calendrier', notes: [
    ['nouveau', 'Ma VTC en onglets : Missions, Convois, Défis & duels, Classement, Chauffeurs live.'],
    ['nouveau', 'Nouvelle page Calendrier.'],
    ['ameliore', 'Ton profil s\'affiche en haut à droite de l\'écran d\'accueil.'],
    ['ameliore', 'Marketplace allégée : Modules du Hub et Cars & bus.'],
  ]},
  { version: '0.5.1', date: '2026-11-17', titre: 'Menu Entreprise', notes: [
    ['ameliore', 'Menu Entreprise allégé : Missions, Convois et Défis regroupés dans Ma VTC.'],
  ]},
  { version: '0.5.0', date: '2026-11-17', titre: 'Truck & Coach Hub', notes: [
    ['nouveau', 'Nouveau nom : Truck & Coach Hub (tes données sont conservées).'],
    ['nouveau', 'Écran d\'accueil pour choisir entre la Marketplace et le Hub.'],
    ['nouveau', 'Marketplace : Découvrir, Mes contenus, Mises à jour.'],
    ['nouveau', 'Mises à jour téléchargées et installées directement dans l\'appli.'],
    ['nouveau', 'Thème clair.'],
  ]},
  { version: '0.4.2', date: '2026-11-17', titre: 'Raccourcis', notes: [
    ['nouveau', 'Options : raccourci vers HaulMP et bouton « Mettre à jour ».'],
  ]},
  { version: '0.4.1', date: '2026-11-17', titre: 'Modules complémentaires', notes: [
    ['ameliore', 'Tablette et mini-GPS rangés dans les modules complémentaires.'],
  ]},
  { version: '0.4.0', date: '2026-11-17', titre: 'Page Accueil', notes: [
    ['nouveau', 'Page Accueil : lancer ETS2 ou ATS via Steam, état du jeu et des mises à jour, guide.'],
    ['nouveau', 'Menu rangé par catégories.'],
  ]},
  { version: '0.3.0', date: '2026-11-16', titre: 'Branchement au jeu', notes: [
    ['nouveau', 'Plugin du jeu installé automatiquement dans ETS2 et ATS.'],
    ['nouveau', 'Télémétrie en direct et comptage des km chargés / à vide.'],
    ['nouveau', 'Historique de tes missions, en mode réel ou course.'],
  ]},
  { version: '0.2.0', date: '2026-11-16', titre: 'Première version', notes: [
    ['nouveau', 'Première version de l\'application, avec mises à jour automatiques.'],
  ]},
];


