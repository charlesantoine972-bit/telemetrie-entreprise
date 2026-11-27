/* Paramètres « Bientôt disponible » : Langue & région (dossier Appli).
   Données seulement : la page est construite par bientot.js (appelé depuis app/demarrage.js). */
const PB_PAGE_LANGUE = {
  id: 'langue', dossier: 'appli', apres: 'raccourcis',
  titre: 'Langue & région', intro: 'La langue de l’appli et la façon d’écrire les dates, les nombres et l’argent. Les unités (km ou miles) se règlent pour chaque jeu, dans Conduite.',
  icone: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9s1.3-6.3 3.8-9'],
  groupes: [
    { titre: 'Langue', reglages: [
      { titre: 'Langue de l’appli', desc: 'Pour l’instant, l’appli n’existe qu’en français.', ctl: { type: 'liste', options: ['Français', 'English', 'Deutsch', 'Español', 'Italiano', 'Polski', 'Português'] } },
      { titre: 'Noms des villes et des marchandises', desc: 'Comme dans le jeu, ou dans la langue de l’appli.', ctl: { type: 'segments', options: ['Comme le jeu', 'Langue de l’appli'] } },
    ] },
    { titre: 'Formats', reglages: [
      { titre: 'Format de la date', desc: 'Dans la Feuille de route, le Calendrier et les notes.', ctl: { type: 'liste', options: ['27/11/2026', '27 nov. 2026', '2026-11-27', '11/27/2026'] } },
      { titre: 'Format des nombres', desc: 'Séparateur des milliers et des décimales.', ctl: { type: 'liste', options: ['1 234,5', '1,234.5', '1.234,5'] } },
      { titre: 'Heure', desc: 'Sur 24 heures ou 12 heures.', ctl: { type: 'segments', options: ['24 h', '12 h'] } },
      { titre: 'Premier jour de la semaine', desc: 'Pour le Calendrier.', ctl: { type: 'liste', options: ['Lundi', 'Dimanche'] } },
    ] },
    { titre: 'Argent', reglages: [
      { titre: 'Monnaie affichée', desc: 'Celle du jeu (€ pour ETS2, $ pour ATS) ou toujours la même.', ctl: { type: 'liste', options: ['Celle du jeu', '€ (euro)', '$ (dollar)', '£ (livre)'] } },
    ] },
  ],
};
