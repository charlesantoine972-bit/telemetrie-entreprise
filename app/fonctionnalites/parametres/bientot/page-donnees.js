/* Paramètres « Bientôt disponible » : Données & confidentialité (dossier Données).
   Données seulement : la page est construite par bientot.js (appelé depuis app/demarrage.js). */
const PB_PAGE_DONNEES = {
  id: 'donnees', dossier: 'donnees', apres: 'integrations',
  titre: 'Données & confidentialité', intro: 'Ce que l’appli garde sur ce PC, et comment le sauvegarder, le déplacer ou l’effacer.',
  icone: ['M5 6a7 3 0 1 0 14 0a7 3 0 1 0-14 0', 'M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6'],
  groupes: [
    { titre: 'Ce qui est stocké sur ce PC', reglages: [
      { titre: 'Tes réglages', desc: 'Pseudo, SteamID, dossiers des jeux, apparence, réglages de chaque jeu (fichier reglages.json).', ctl: { type: 'info', texte: 'Sur ce PC' } },
      { titre: 'Ton historique de trajets', desc: 'Missions, distances, revenus, positions sur la carte (fichier donnees.json). Sert à la Feuille de route et aux statistiques.', ctl: { type: 'info', texte: 'Sur ce PC' } },
      { titre: 'Ta clé API Steam', desc: 'Chiffrée par Windows : elle n’est lisible que sur ce PC, avec ta session.', ctl: { type: 'info', texte: 'Chiffrée' } },
      { titre: 'Copies de tes profils du jeu', desc: 'Faites avant chaque modification dans Truck & Coach Tools.', ctl: { type: 'info', texte: 'Sur ce PC' } },
      { titre: 'Ouvrir le dossier des données', desc: 'Le dossier où l’appli range tout ce qui précède.', ctl: { type: 'bouton', label: 'Ouvrir le dossier' } },
    ] },
    { titre: 'Exporter et importer', reglages: [
      { titre: 'Exporter mes données', desc: 'Un fichier avec tes réglages et ton historique, pour changer de PC ou passer de la bêta à la version officielle. La clé Steam n’est jamais exportée.', ctl: [{ type: 'liste', options: ['Réglages et historique', 'Réglages seulement', 'Historique seulement'] }, { type: 'bouton', label: 'Exporter…' }] },
      { titre: 'Importer des données', desc: 'Reprend un fichier exporté. Ce que tu as déjà est gardé en copie avant.', ctl: { type: 'bouton', label: 'Importer…' } },
    ] },
    { titre: 'Sauvegardes de tes données', reglages: [
      { titre: 'Sauvegarde automatique', desc: 'Une copie de tes réglages et de ton historique, à côté des originaux.', ctl: [{ type: 'liste', options: ['Chaque jour', 'Chaque semaine', 'Jamais'] }, { type: 'switch', on: true }] },
      { titre: 'Copies gardées', desc: 'Les plus anciennes sont effacées au-delà de ce nombre.', ctl: { type: 'liste', options: ['3', '7', '14', '30'], choix: 1 } },
      { titre: 'Restaurer une sauvegarde', desc: 'Revient à une copie précédente. Ce que tu as maintenant est gardé en copie avant.', ctl: { type: 'bouton', label: 'Choisir une copie…' } },
    ] },
    { titre: 'Effacer', reglages: [
      { titre: 'Effacer l’historique des trajets', desc: 'Supprime la Feuille de route et les totaux. Tes profils du jeu ne sont pas touchés.', ctl: { type: 'bouton', label: 'Effacer l’historique', danger: true } },
      { titre: 'Effacer mes liens Steam et Discord', desc: 'Retire ton SteamID, ta clé API Steam et l’ID Discord.', ctl: { type: 'bouton', label: 'Effacer les liens', danger: true } },
      { titre: 'Tout effacer', desc: 'Remet l’appli comme au premier lancement. Une confirmation sera demandée.', ctl: { type: 'bouton', label: 'Tout effacer…', danger: true } },
    ] },
    { titre: 'Télémétrie anonyme', reglages: [
      { titre: 'Statistiques d’utilisation anonymes', desc: 'Aiderait à savoir quelles pages servent le plus. Aujourd’hui, l’appli n’envoie aucune statistique : rien ne part de ton PC.', ctl: { type: 'switch' } },
      { titre: 'Rapports de plantage', desc: 'Enverrait un rapport sans donnée personnelle quand l’appli plante, après ton accord.', ctl: { type: 'switch' } },
      { titre: 'Voir ce qui serait envoyé', desc: 'Le contenu exact, avant tout envoi.', ctl: { type: 'bouton', label: 'Voir' } },
    ] },
  ],
};
