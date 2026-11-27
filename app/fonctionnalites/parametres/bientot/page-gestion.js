/* Paramètres « Bientôt disponible » : Gestion (dossier Données).
   Données seulement : la page est construite par bientot.js (appelé depuis app/demarrage.js). */
const PB_PAGE_GESTION = {
  id: 'gestion', dossier: 'donnees', apres: 'donnees',
  titre: 'Gestion', intro: 'Profils de jeu, copies de sauvegardes, place prise sur le disque, cache de la carte et remise à zéro.',
  icone: ['M4 7h16M4 12h16M4 17h16', 'M8 5v4M15 10v4M10 15v4'],
  groupes: [
    { titre: 'Profils de jeu', reglages: [
      { titre: 'Profil ETS2 suivi', desc: 'Le profil du jeu utilisé pour les statistiques et Truck & Coach Tools.', ctl: { type: 'liste', options: ['Détecté automatiquement'] } },
      { titre: 'Profil ATS suivi', desc: 'La même chose pour American Truck Simulator.', ctl: { type: 'liste', options: ['Détecté automatiquement'] } },
      { titre: 'Profils Steam Cloud', desc: 'Inclure les profils synchronisés par Steam.', ctl: { type: 'switch', on: true } },
    ] },
    { titre: 'Sauvegardes de profils', reglages: [
      { titre: 'Copie avant chaque modification', desc: 'Toujours activée dans Truck & Coach Tools : une copie est faite avant de toucher à ton profil.', ctl: { type: 'switch', on: true } },
      { titre: 'Copies gardées par profil', desc: 'Les plus anciennes sont effacées au-delà de ce nombre.', ctl: { type: 'liste', options: ['5', '10', '20', 'Toutes'], choix: 1 } },
      { titre: 'Dossier des copies', desc: 'L’endroit où les copies sont rangées.', ctl: { type: 'bouton', label: 'Changer de dossier…' } },
    ] },
    { titre: 'Stockage', reglages: [
      { titre: 'Place utilisée par l’appli', desc: 'Réglages, historique, copies de profils et cache de la carte.', ctl: { type: 'info', texte: '— Mo' } },
      { titre: 'Nettoyer les fichiers temporaires', desc: 'Supprime les fichiers laissés par une analyse ou une extraction interrompue.', ctl: { type: 'bouton', label: 'Nettoyer' } },
    ] },
    { titre: 'Cache de la carte', reglages: [
      { titre: 'Taille du cache', desc: 'La carte préparée à partir de tes fichiers du jeu.', ctl: { type: 'info', texte: '— Mo' } },
      { titre: 'Préparer la carte au démarrage', desc: 'Prépare la carte en arrière-plan quand un nouveau DLC ou une mise à jour du jeu est détecté.', ctl: { type: 'switch', on: true } },
      { titre: 'Vider le cache de la carte', desc: 'La carte sera préparée à nouveau à la prochaine ouverture.', ctl: { type: 'bouton', label: 'Vider le cache', danger: true } },
    ] },
    { titre: 'Réinitialisation', reglages: [
      { titre: 'Réinitialiser les paramètres de l’appli', desc: 'Apparence, notifications, raccourcis… Tes trajets ne sont pas touchés.', ctl: { type: 'bouton', label: 'Réinitialiser', danger: true } },
      { titre: 'Réinitialiser les paramètres d’un jeu', desc: 'Conduite, HUD et unités d’un seul jeu.', ctl: [{ type: 'liste', options: ['ETS2', 'ATS'] }, { type: 'bouton', label: 'Réinitialiser', danger: true }] },
    ] },
  ],
};
