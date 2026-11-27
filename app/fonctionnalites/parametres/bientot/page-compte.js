/* Paramètres « Bientôt disponible » : Compte (groupes ajoutés à la page Compte & accès existante).
   Données seulement : la page est construite par bientot.js (appelé depuis app/demarrage.js).
   Le rang, la clé d'activation et la VTC TruckersMP existent déjà dans la page (aperçu local, fonctionnalites/compte/). */
const PB_AJOUT_COMPTE = {
  page: 'compte',
  apres: '.accnote',          // les groupes se placent juste après l'avertissement de la page
  groupes: [
    { titre: 'Profil', reglages: [
      { titre: 'Avatar', desc: 'L’image affichée à côté de ton pseudo dans l’appli et, plus tard, sur le Discord du projet.', ctl: [{ type: 'avatar' }, { type: 'bouton', label: 'Changer l’avatar' }] },
      { titre: 'Pseudo public', desc: 'Le nom que verront les autres joueurs. Pour l’instant, ton pseudo se règle dans Paramètres du jeu → Conduite.', ctl: { type: 'texte', placeholder: 'ex. James' } },
      { titre: 'Profil visible par les autres', desc: 'Montre ton rang, ta VTC et tes statistiques publiques aux autres joueurs.', ctl: { type: 'switch' } },
      { titre: 'Rang affiché', desc: 'Le rang montré sur ton profil, si tu en as plusieurs.', ctl: { type: 'liste', options: ['Mon rang le plus haut', 'Aucun'] } },
    ] },
    { titre: 'Connexion', reglages: [
      { titre: 'Se connecter avec Steam', desc: 'Ton compte Steam sert à te reconnaître, sans mot de passe à créer. La connexion passera par le site officiel de Steam.', ctl: { type: 'bouton', label: 'Se connecter' } },
      { titre: 'Rester connecté sur ce PC', desc: 'Garde la connexion entre deux lancements de l’appli. La preuve de connexion sera chiffrée par Windows.', ctl: { type: 'switch', on: true } },
      { titre: 'Se déconnecter', desc: 'Ferme la session sur ce PC. Tes trajets et tes réglages restent sur ce PC.', ctl: { type: 'bouton', label: 'Se déconnecter' } },
    ] },
    { titre: 'Clé d’accès et VTC', reglages: [
      { titre: 'Clés d’accès activées', desc: 'La liste des clés que tu as activées (accès testeur, bêta…) et ce qu’elles t’ont donné.', ctl: { type: 'info', texte: 'Aucune' } },
      { titre: 'VTC TruckersMP sur mon profil', desc: 'Affiche ta VTC TruckersMP et ton rôle sur ton profil de l’appli.', ctl: { type: 'switch' } },
      { titre: 'Mettre à jour ma VTC automatiquement', desc: 'Relit ta VTC TruckersMP une fois par jour.', ctl: { type: 'switch' } },
    ] },
  ],
};
