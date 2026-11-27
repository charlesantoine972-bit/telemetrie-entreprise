/* Paramètres « Bientôt disponible » : Mises à jour (groupe ajouté à la page Mises à jour existante, dossier Données).
   Données seulement : le groupe est construit par bientot.js (appelé depuis app/demarrage.js).
   La recherche et l'installation des mises à jour existent déjà (fonctionnalites/mises-a-jour/) et ne changent pas. */
const PB_AJOUT_MISES_A_JOUR = {
  page: 'maj',
  apres: '.optgroup',         // après le groupe « Ta version »
  groupes: [
    { titre: 'Préférences de mise à jour', reglages: [
      { titre: 'Canal de mise à jour', desc: 'Officiel : versions stables. Bêta : les nouveautés plus tôt, avec parfois des bugs. Aujourd’hui, la bêta est une appli séparée (Interface → Programme bêta).', ctl: { type: 'liste', options: ['Officiel', 'Bêta'] } },
      { titre: 'Rechercher automatiquement', desc: 'Au démarrage puis toutes les 30 minutes (c’est déjà ce que fait l’appli).', ctl: { type: 'switch', on: true } },
      { titre: 'Télécharger automatiquement', desc: 'Télécharge la mise à jour dès qu’elle est trouvée, sans attendre ton clic.', ctl: { type: 'switch' } },
      { titre: 'Installer à la fermeture de l’appli', desc: 'Installe la mise à jour téléchargée quand tu fermes l’appli, jamais pendant que tu joues.', ctl: { type: 'switch' } },
    ] },
  ],
};
