/* Paramètres « Bientôt disponible » : Raccourcis clavier (dossier Appli).
   Données seulement : la page est construite par bientot.js (appelé depuis app/demarrage.js). */
const PB_PAGE_RACCOURCIS = {
  id: 'raccourcis', dossier: 'appli', apres: 'notifs',
  titre: 'Raccourcis clavier', intro: 'Des touches pour aller plus vite dans l’appli, et quelques-unes qui marchent même pendant que tu joues.',
  icone: ['M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M7 9h.01M11 9h.01M15 9h.01M7 13h.01M17 13h.01M8 16h8'],
  groupes: [
    { titre: 'Dans l’appli', reglages: [
      { titre: 'Rechercher un réglage', desc: 'Place le curseur dans la recherche des paramètres.', ctl: { type: 'touche', valeur: 'Ctrl + F' } },
      { titre: 'Quitter les paramètres', desc: 'Revient à la page d’où tu viens (déjà actif).', ctl: { type: 'touche', valeur: 'Échap' } },
      { titre: 'Changer de jeu', desc: 'Revient au choix ETS2 / ATS.', ctl: { type: 'touche', valeur: 'Ctrl + G' } },
      { titre: 'Ouvrir la carte', desc: 'Va directement à la carte.', ctl: { type: 'touche', valeur: 'Ctrl + M' } },
    ] },
    { titre: 'Pendant le jeu', reglages: [
      { titre: 'Activer les raccourcis en jeu', desc: 'Les touches ci-dessous marchent même quand le jeu est au premier plan.', ctl: { type: 'switch' } },
      { titre: 'Afficher / masquer le HUD', desc: 'Le bandeau par-dessus le jeu.', ctl: { type: 'touche', valeur: 'Ctrl + Alt + H' } },
      { titre: 'Bandeau suivant', desc: 'Passe d’un affichage du bandeau à l’autre.', ctl: { type: 'touche', valeur: 'Ctrl + Alt + B' } },
    ] },
    { titre: 'Remise à zéro', reglages: [
      { titre: 'Raccourcis par défaut', desc: 'Remet toutes les touches ci-dessus comme au départ.', ctl: { type: 'bouton', label: 'Réinitialiser' } },
    ] },
  ],
};
