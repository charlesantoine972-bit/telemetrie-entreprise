/* Paramètres « Bientôt disponible » : Avancé (dossier Aide).
   Données seulement : la page est construite par bientot.js (appelé depuis app/demarrage.js).
   Le groupe « Mode développeur » est caché : il s'affiche après 7 clics sur le numéro de version (voir bientot.js).
   Règle : le mode développeur ne désactive JAMAIS une protection de sécurité (isolation des fenêtres,
   bac à sable, contrôle des liens, vérification des mises à jour). Aucun de ses réglages ne doit y toucher. */
const PB_PAGE_AVANCE = {
  id: 'avance', dossier: 'aide', apres: 'aide',
  titre: 'Avancé', intro: 'Journaux, diagnostic et réglages pour aider à trouver un problème. Tu n’en as pas besoin pour jouer.',
  icone: ['M4 17l5-5-5-5', 'M12 19h8'],
  groupes: [
    { titre: 'Journaux', reglages: [
      { titre: 'Enregistrer un journal', desc: 'Garde une trace de ce que fait l’appli, pour comprendre un problème.', ctl: { type: 'switch', on: true } },
      { titre: 'Niveau de détail', desc: 'Normal suffit presque toujours.', ctl: { type: 'segments', options: ['Erreurs', 'Normal', 'Détaillé'], choix: 1 } },
      { titre: 'Durée de conservation', desc: 'Les journaux plus anciens sont effacés.', ctl: { type: 'liste', options: ['7 jours', '30 jours', '90 jours'] } },
      { titre: 'Ouvrir le dossier des journaux', desc: 'Pour les joindre à un message au support.', ctl: { type: 'bouton', label: 'Ouvrir le dossier' } },
    ] },
    { titre: 'Diagnostic', reglages: [
      { titre: 'Créer un rapport de diagnostic', desc: 'Un fichier avec la version de l’appli, de Windows, l’état du plugin et les derniers journaux. Ta clé Steam n’y est jamais.', ctl: { type: 'bouton', label: 'Créer le rapport' } },
      { titre: 'Inclure tes réglages', desc: 'Ajoute tes réglages au rapport (sans clé ni identifiant).', ctl: { type: 'switch' } },
      { titre: 'Tester la connexion au jeu', desc: 'Vérifie que le plugin envoie bien les données à l’appli.', ctl: { type: 'bouton', label: 'Tester' } },
    ] },
    { titre: 'À propos de cette version', reglages: [
      { titre: 'Numéro de version', desc: 'La version installée de Truck & Coach Hub.', ctl: { type: 'version' } },
    ] },
    { titre: 'Mode développeur', id: 'pbDevGroupe', cache: true,
      note: 'Le mode développeur ne désactive jamais une protection de sécurité : isolation des fenêtres, bac à sable, contrôle des liens et vérification des mises à jour restent toujours actifs.',
      reglages: [
        { titre: 'Afficher les identifiants internes', desc: 'Montre le nom technique de chaque réglage et de chaque page, pour les rapports de bug.', ctl: { type: 'switch' } },
        { titre: 'Journal très détaillé', desc: 'Enregistre aussi chaque message reçu du jeu (fichiers plus gros).', ctl: { type: 'switch' } },
        { titre: 'Données de démonstration', desc: 'Remplit la Télémétrie et le HUD avec un trajet simulé, sans lancer le jeu.', ctl: { type: 'switch' } },
        { titre: 'Recharger l’interface', desc: 'Recharge la fenêtre sans fermer l’appli.', ctl: { type: 'bouton', label: 'Recharger' } },
        { titre: 'Masquer le mode développeur', desc: 'Cache à nouveau ce groupe. Il revient après 7 clics sur le numéro de version.', ctl: { type: 'bouton', label: 'Masquer', actif: true, id: 'pbDevMasquer' } },
      ] },
  ],
};
