/* Paramètres « Bientôt disponible » : Notifications (dossier Appli).
   Données seulement : la page est construite par bientot.js (appelé depuis app/demarrage.js). */
const PB_PAGE_NOTIFICATIONS = {
  id: 'notifs', dossier: 'appli', apres: 'acces',
  titre: 'Notifications', intro: 'Les alertes que l’appli peut t’envoyer pendant que tu roules ou quand elle est en arrière-plan.',
  icone: ['M6 16V11a6 6 0 1 1 12 0v5l2 2H4z', 'M10 21h4'],
  groupes: [
    { titre: 'Notifications Windows', reglages: [
      { titre: 'Autoriser les notifications', desc: 'Interrupteur général : coupe toutes les notifications de l’appli d’un coup.', ctl: { type: 'switch', on: true } },
      { titre: 'Mise à jour disponible', desc: 'Une notification quand une nouvelle version de l’appli est prête.', ctl: { type: 'switch', on: true } },
      { titre: 'Pause obligatoire', desc: 'Prévient avant la pause obligatoire du jeu.', ctl: [{ type: 'liste', options: ['30 et 10 minutes avant', '10 minutes avant', '5 minutes avant'] }, { type: 'switch' }] },
      { titre: 'Carburant bas', desc: 'Prévient quand le réservoir passe sous le seuil choisi.', ctl: [{ type: 'curseur', min: 5, max: 50, valeur: 15, unite: ' %' }, { type: 'switch' }] },
      { titre: 'Livraison terminée', desc: 'Résumé de la livraison ou du service : km, revenu, dégâts.', ctl: { type: 'switch' } },
      { titre: 'Ne pas déranger pendant la conduite', desc: 'Garde les notifications pour la fin de la mission quand le jeu est au premier plan.', ctl: { type: 'switch', on: true } },
    ] },
    { titre: 'Alertes dans le HUD', reglages: [
      { titre: 'Afficher les alertes dans le bandeau', desc: 'Les mêmes alertes, discrètes, dans le HUD au lieu d’une notification Windows.', ctl: { type: 'switch' } },
      { titre: 'Durée d’affichage', desc: 'Combien de temps une alerte reste visible.', ctl: { type: 'segments', options: ['5 s', '10 s', '20 s'], choix: 1 } },
    ] },
    { titre: 'Sons d’alerte', reglages: [
      { titre: 'Excès de vitesse', desc: 'Un son quand tu dépasses la limitation.', ctl: { type: 'liste', options: ['Désactivé', 'Plus de 5 km/h', 'Plus de 10 km/h'] } },
      { titre: 'Volume des alertes', desc: 'Le volume des sons d’alerte, indépendant du jeu.', ctl: { type: 'curseur', min: 0, max: 100, valeur: 70, unite: ' %' } },
    ] },
  ],
};
