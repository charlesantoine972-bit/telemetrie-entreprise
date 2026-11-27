/* Paramètres « Bientôt disponible » : Audio (dossier Appli).
   Données seulement : la page est construite par bientot.js (appelé depuis app/demarrage.js). */
const PB_PAGE_AUDIO = {
  id: 'audio', dossier: 'appli', apres: 'langue',
  titre: 'Audio', intro: 'Les sons de l’appli : alertes, notifications et annonces. Le son du jeu ne change pas.',
  icone: ['M4 9h4l5-4v14l-5-4H4z', 'M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12'],
  groupes: [
    { titre: 'Sons de l’appli', reglages: [
      { titre: 'Activer les sons', desc: 'Interrupteur général des sons de l’appli.', ctl: { type: 'switch' } },
      { titre: 'Volume général', desc: 'Indépendant du volume du jeu.', ctl: { type: 'curseur', min: 0, max: 100, valeur: 80, unite: ' %' } },
      { titre: 'Son des notifications', desc: 'Le petit son joué avec une notification.', ctl: { type: 'liste', options: ['Klaxon court', 'Carillon', 'Bip', 'Aucun'] } },
      { titre: 'Écouter', desc: 'Joue le son choisi.', ctl: { type: 'bouton', label: 'Écouter' } },
    ] },
    { titre: 'Annonces vocales', reglages: [
      { titre: 'Lire les alertes à voix haute', desc: 'Pause, carburant, livraison : annoncés par la voix de Windows.', ctl: { type: 'switch' } },
      { titre: 'Voix', desc: 'Une des voix installées dans Windows.', ctl: { type: 'liste', options: ['Voix de Windows par défaut'] } },
    ] },
    { titre: 'Sortie', reglages: [
      { titre: 'Périphérique audio', desc: 'Haut-parleurs, casque…', ctl: { type: 'liste', options: ['Périphérique par défaut'] } },
      { titre: 'Baisser les sons quand le jeu est au premier plan', desc: 'Pour ne pas couvrir le moteur et la radio du jeu.', ctl: { type: 'switch', on: true } },
    ] },
  ],
};
