// Notes de version affichées en bas de l'écran d'accueil (la plus récente en premier).
// À chaque nouvelle version : ajouter une entrée en haut de la liste.
// type : 'nouveau' (ajout), 'ameliore' (amélioration), 'corrige' (correction de bug)
window.NOTES_VERSION = [
  { version: '0.12.10', date: '2026-11-18', titre: 'Détection automatique camion / autocar', notes: [
    ['ameliore', 'En jeu, le mode autocar est déterminé par les données de mission autocar du plugin ; en leur absence, le mode camion est utilisé.'],
    ['ameliore', 'Le choix manuel du véhicule est conservé uniquement pour l’aperçu hors jeu.'],
  ]},
  { version: '0.12.9', date: '2026-11-17', titre: 'HUD autocar et mise à jour automatique', notes: [
    ['ameliore', 'Le HUD autocar regroupe les informations de conduite reçues du jeu : heure, vitesse, GPS, temps estimé, compteur, carburant et pause obligatoire.'],
    ['ameliore', 'Les données de ligne, d’arrêts, d’horaire et de satisfaction non fournies par la télémétrie restent indiquées comme indisponibles.'],
    ['corrige', 'Après installation d’une mise à jour, l’application redémarre automatiquement.'],
  ]},
  { version: '0.12.8', date: '2026-11-17', titre: 'Nouveau bandeau dédié aux cars', notes: [
    ['nouveau', 'Interface car dédiée : pastille de ligne rouge, heure du jeu, vitesse, limitation et prochain arrêt, inspirée de la référence visuelle.'],
    ['ameliore', 'Seconde rangée compacte : distance GPS, compteur kilométrique du véhicule, temps jeu et réel estimé, arrivée estimée et carburant.'],
    ['ameliore', 'Le HUD camion conserve ses styles ; le bandeau car utilise sa propre présentation.'],
    ['ameliore', 'Les données de ligne, d’arrêt et d’horaire non disponibles en jeu sont indiquées par un tiret.'],
  ]},
  { version: '0.12.7', date: '2026-11-17', titre: 'HUD compact pour les cars', notes: [
    ['ameliore', 'Le HUD des services car adopte un bandeau compact à deux lignes, inspiré du screenshot fourni.'],
    ['nouveau', 'Le HUD car affiche l’heure du jeu, le GPS du prochain arrêt, son estimation de durée, le compteur et l’autonomie disponible.'],
    ['ameliore', 'L’aperçu hors connexion propose un exemple de service car sans inventer de données de ligne.'],
    ['ameliore', 'Après une mise à jour, l’application se ferme sans se relancer automatiquement.'],
  ]},
  { version: '0.12.6', date: '2026-11-17', titre: 'Cartes DLC, HUD Coaches et réglages', notes: [
    ['nouveau', 'Carte : importe des tuiles locales générées avec TsMap pour les cartes DLC d’ETS2 et d’ATS.'],
    ['ameliore', 'Le HUD détecte automatiquement les missions camion et car et adapte les informations affichées.'],
    ['ameliore', 'Les réglages Plugin du jeu et Profil chauffeur sont regroupés dans une section repliable.'],
  ]},
  { version: '0.12.5', date: '2026-11-17', titre: 'Navigation et intégrations', notes: [
    ['nouveau', 'Le HUD Navigation met en avant la livraison en cours, la marchandise, la distance GPS et les temps estimés.'],
    ['ameliore', 'Le style HUD déjà choisi est conservé après la mise à jour ; Navigation est le choix par défaut des nouvelles installations.'],
    ['nouveau', 'Options → Steam et Discord : profil Steam, jeux ETS2 / ATS et présence Discord facultative.'],
    ['ameliore', 'Les seuils kilométriques sont regroupés et validés avant enregistrement.'],
    ['corrige', 'Le raccourci Profil reste indisponible au lieu d’ouvrir Options tant que la page n’existe pas.'],
  ]},
  { version: '0.12.4', date: '2026-11-17', titre: 'Truck Tools et Coach Tools', notes: [
    ['ameliore', 'L’ancien Atelier est renommé Truck Tools et Coach Tools, avec une présentation dédiée.'],
    ['nouveau', 'Diagnostic des fichiers de jeu et des capacités de télémétrie disponibles.'],
    ['corrige', 'La trace GPS conserve correctement les coordonnées du point d’origine (0, 0).'],
  ]},
  { version: '0.12.3', date: '2026-11-17', titre: 'Notes de version', notes: [
    ['nouveau', 'Les notes de toutes les versions s\'affichent en bas de l\'écran d\'accueil (lien « Notes de version ↓ » sous les cartes).'],
  ]},
  { version: '0.12.2', date: '2026-11-17', titre: 'Nouvelle couleur et outils de sauvegarde', notes: [
    ['ameliore', 'Le jaune et le bleu laissent place à un orange ambre, dans tous les thèmes.'],
    ['nouveau', 'Options → Apparence : choisis ta couleur d\'accent (pastilles, roue de couleurs ou couleur de Windows).'],
    ['ameliore', '« Comme Windows » suit aussi la couleur d\'accent de Windows.'],
    ['nouveau', 'Truck Tools → Sauvegardes : « Analyser » vérifie si les sauvegardes d\'un profil sont corrompues, sans rien modifier.'],
    ['nouveau', 'Truck Tools → Sauvegardes : « Dupliquer » crée une copie de ton profil pour faire des tests sans risque.'],
    ['nouveau', 'Truck Tools → Profil : bilan du profil (compte en banque, prêts, flotte, usure) avec les problèmes à corriger.'],
    ['ameliore', 'Fenêtres de confirmation : la touche Tab passe par tous les champs.'],
  ]},
  { version: '0.12.1', date: '2026-11-17', titre: 'HUD seulement en jeu', notes: [
    ['ameliore', 'Le bandeau en jeu se cache dans le menu pause, en Alt+Tab, sur le bureau et quand le jeu est réduit.'],
    ['ameliore', 'Plugin du jeu mis à jour (1.1.0) : relance le jeu une fois.'],
  ]},
  { version: '0.12.0', date: '2026-11-17', titre: 'Nouvelles icônes', notes: [
    ['ameliore', 'Nouvelles icônes dans le style de Windows 11 : menus, écran d\'accueil, Marketplace et carte.'],
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
    ['nouveau', 'Truck Tools : renommer ton profil et ton entreprise.'],
  ]},
  { version: '0.8.1', date: '2026-11-17', titre: 'Atteindre un niveau', notes: [
    ['nouveau', 'Atelier : boutons « atteindre le niveau » pour le camion et le car.'],
  ]},
  { version: '0.8.0', date: '2026-11-17', titre: 'Apparence', notes: [
    ['nouveau', 'Thèmes De base, Sombre, Clair et Comme Windows.'],
    ['nouveau', 'Couleurs adaptées au daltonisme, taille du texte réglable et contraste renforcé.'],
  ]},
  { version: '0.7.0', date: '2026-11-17', titre: 'Truck Tools et Coach Tools', notes: [
    ['nouveau', 'Truck Tools et Coach Tools : modification du profil, du car, de la carte, du carburant et réparation.'],
    ['ameliore', 'Explications plus claires pour la console de développement.'],
  ]},
  { version: '0.6.1', date: '2026-11-17', titre: 'Fiches produit', notes: [
    ['ameliore', 'Marketplace : « Voir l\'aperçu » ouvre une vraie fiche du mod (aperçu, description, infos) avec un bouton Retour.'],
  ]},
  { version: '0.6.0', date: '2026-11-17', titre: 'Arrivée des Truck Tools', notes: [
    ['nouveau', 'Truck Tools (expérimental, à activer dans Options) : sauvegarder et restaurer tes profils ETS2 / ATS.'],
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
    ['nouveau', 'Raccourci vers HaulMP et bouton Mettre à jour dans Options.'],
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


