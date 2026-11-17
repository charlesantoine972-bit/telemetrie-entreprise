// Extension commune à l'aperçu et à l'overlay : aucune donnée de ligne inventée.
function hudMission(root, d) {
  let panel = root.querySelector('.mission-widgets');
  if (!panel) {
    panel = document.createElement('div'); panel.className = 'mission-widgets';
    for (const [key, label] of [['vehicle', 'Véhicule'], ['odometer', 'Compteur véhicule'], ['route', 'Trajet'], ['stops', 'Arrêts'],
      ['game', 'GPS · jeu'], ['real', 'GPS · réel estimé'], ['arrival', 'Arrivée réelle estimée'], ['deadline', 'Délai de livraison · jeu'], ['deadlineReal', 'Délai · réel estimé']]) {
      const item = document.createElement('div'); item.className = 'mission-widget'; item.dataset.mission = key;
      const title = document.createElement('span'); title.textContent = label;
      const value = document.createElement('b'); value.textContent = '—'; item.append(title, value); panel.append(item);
    }
    root.append(panel);
  }
  const set = (key, text, show = true) => { const e = panel.querySelector('[data-mission="' + key + '"]'); e.hidden = !show; e.querySelector('b').textContent = text; };
  const live = d.live, t = TCHMission.calculate(live), fmt = TCHMission.duration;
  const coach = !!(live && live.busJob) || d.vehicleType === 'car';
  root.classList.toggle('is-coach', coach);
  const hasJob = !!(live && (live.job || live.busJob));
  set('vehicle', coach ? 'CAR' : 'CAMION');
  const odometer = live && live.odometer;
  set('odometer', typeof odometer === 'number' && Number.isFinite(odometer) && odometer >= 0
    ? odometer.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km' : '—');
  panel.querySelector('[data-mission=odometer]').title = 'Kilométrage total du véhicule transmis par le jeu, y compris avant le lancement de l’application.';
  const job = d.job;
  set('route', job && !coach ? `${job.from || '…'} → ${job.to || '…'}` : coach ? 'Ligne non disponible' : 'Hors mission');
  set('stops', 'Arrêts non disponibles', coach);
  set('game', fmt(t.gameSeconds));
  set('real', fmt(t.realSeconds) + (t.paused ? ' · pause' : ''));
  set('arrival', t.arrivalReal == null ? '—' : new Date(t.arrivalReal).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  set('deadline', fmt(t.deadlineGameSeconds), !coach && hasJob);
  set('deadlineReal', fmt(t.deadlineRealSeconds), !coach && hasJob);
  panel.querySelector('[data-mission=game] span').textContent = coach ? 'Prochain arrêt GPS · jeu' : 'Destination GPS · jeu';
  panel.querySelector('[data-mission=real] span').textContent = coach ? 'Arrêt GPS · réel estimé' : 'Destination · réel estimé';
  panel.title = coach ? 'Le GPS peut viser le prochain arrêt, pas la fin de la ligne. Horaires complets à vérifier en jeu.'
    : 'Temps réel estimé au facteur local du jeu ; pauses, villes, repos et ferries peuvent changer cette estimation.';
  if (coach && hasJob) { const m = root.querySelector('[data-h="mode"]'); m.textContent = 'SERVICE CAR'; m.className = 'mode real'; }
}
