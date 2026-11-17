// Notes de version affichées en bas de l'écran d'accueil (la plus récente en premier).
// À chaque nouvelle version : ajouter une entrée en haut de la liste.
// type : 'nouveau' (ajout), 'ameliore' (amélioration), 'corrige' (correction de bug)
window.NOTES_VERSION = [
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
  { version: '0.7.0', date: '2026-11-17', titre: 'Atelier complet', notes: [
    ['nouveau', 'Atelier : modification du profil, du coach, de la carte, du carburant et réparation.'],
    ['ameliore', 'Explications plus claires pour la console de développement.'],
  ]},
  { version: '0.6.1', date: '2026-11-17', titre: 'Fiches produit', notes: [
    ['ameliore', 'Marketplace : « Voir l\'aperçu » ouvre une vraie fiche du mod (aperçu, description, infos) avec un bouton Retour.'],
  ]},
  { version: '0.6.0', date: '2026-11-17', titre: 'Arrivée de l\'Atelier', notes: [
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
