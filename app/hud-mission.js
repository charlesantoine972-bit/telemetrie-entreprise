// Extension commune à l'aperçu et à l'overlay : aucune donnée de ligne inventée.
function hudMission(root, d) {
  let panel = root.querySelector('.mission-widgets');
  if (!panel) {
    panel = document.createElement('div'); panel.className = 'mission-widgets';
    for (const [key, label] of [['vehicle', 'Véhicule'], ['odometer', 'Compteur véhicule'], ['fuelRange', 'Autonomie'], ['route', 'Itinéraire de livraison'], ['cargo', 'Marchandise'],
      ['remaining', 'Reste GPS'], ['stops', 'Arrêts'], ['game', 'GPS · jeu'], ['real', 'GPS · réel estimé'],
      ['arrival', 'Arrivée réelle estimée'], ['deadline', 'Délai de livraison · jeu'], ['deadlineReal', 'Délai · réel estimé']]) {
      const item = document.createElement('div'); item.className = 'mission-widget'; item.dataset.mission = key;
      const title = document.createElement('span'); title.textContent = label;
      const value = document.createElement('b'); value.textContent = '—'; item.append(title, value); panel.append(item);
    }
    root.append(panel);
  }
  const set = (key, text, show = true) => { const e = panel.querySelector('[data-mission="' + key + '"]'); e.hidden = !show; e.querySelector('b').textContent = text; };
  const live = d.live, t = TCHMission.calculate(live), fmt = TCHMission.duration;
  const coach = d.vehicleType === 'car';
  const navigation = root.classList.contains('s-navigation');
  root.classList.toggle('is-coach', coach);
  root.classList.toggle('is-truck', !coach);
  const clock = root.querySelector('[data-h="coachClock"]');
  if (clock) {
    const gameMinutes = live && live.gameTime;
    if (typeof gameMinutes === 'number' && Number.isFinite(gameMinutes) && gameMinutes >= 0) {
      const minutes = Math.floor(gameMinutes) % 1440;
      clock.textContent = String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
    } else clock.textContent = '--:--';
  }
  const hasJob = coach ? !!(live && live.busJob) : !!(live && live.job);
  set('vehicle', coach ? 'CAR' : 'CAMION', !navigation);
  const odometer = live && live.odometer;
  set('odometer', typeof odometer === 'number' && Number.isFinite(odometer) && odometer >= 0
    ? odometer.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km' : '—', !navigation || coach);
  const fuelRange = live && live.fuelRange;
  const hasFuelRange = typeof fuelRange === 'number' && Number.isFinite(fuelRange) && fuelRange > 0;
  set('fuelRange', hasFuelRange ? fuelRange.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' km' : '—',
    navigation && coach && hasFuelRange);
  panel.querySelector('[data-mission=odometer]').title = 'Kilométrage total du véhicule transmis par le jeu, y compris avant le lancement de l’application.';
  // Trajet et marchandise : tels que le jeu les donne (mission en direct), sinon l’aperçu de test.
  const job = d.mission && d.mission.type === 'truck' ? d.mission : d.mission ? null : d.job;
  set('route', coach ? 'Service car en cours' : job ? `${job.from || '…'} → ${job.to || '…'}` : 'Hors mission', !coach || hasJob);
  const mass = job && Number.isFinite(job.mass) && job.mass > 0
    ? ` · ${(job.mass / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t` : '';
  set('cargo', job ? `${job.cargo || 'Marchandise'}${mass}` : '—', navigation && !coach && hasJob);
  const distance = live && live.navDistance;
  set('remaining', typeof distance === 'number' && Number.isFinite(distance) && distance > 0
    ? (distance / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' km' : '—', navigation && !!(distance > 0));
  set('stops', '', false);
  set('game', fmt(t.gameSeconds));
  set('real', fmt(t.realSeconds) + (t.paused ? ' · pause' : ''));
  set('arrival', t.arrivalReal == null ? '—' : new Date(t.arrivalReal).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  set('deadline', fmt(t.deadlineGameSeconds), !coach && hasJob);
  set('deadlineReal', t.deadlineRealSeconds == null ? fmt(t.deadlineGameSeconds) : fmt(t.deadlineRealSeconds), !coach && hasJob);
  panel.querySelector('[data-mission=route] span').textContent = coach ? 'Service' : 'Itinéraire de livraison';
  panel.querySelector('[data-mission=game] span').textContent = coach ? 'Prochain arrêt GPS · jeu' : 'Destination GPS · jeu';
  panel.querySelector('[data-mission=real] span').textContent = coach ? 'Temps jusqu’au prochain arrêt' : 'Temps jusqu’à destination';
  panel.querySelector('[data-mission=remaining] span').textContent = coach ? 'Prochain arrêt · GPS' : 'Distance restante · GPS';
  panel.querySelector('[data-mission=deadlineReal] span').textContent = t.deadlineRealSeconds == null
    ? 'Temps avant livraison · jeu' : 'Temps avant livraison · réel estimé';
  panel.title = coach ? 'Affichage car basé sur les données du GPS du jeu. Les horaires et détails de ligne ne sont pas fournis par la télémétrie disponible.'
    : 'Temps réel estimé au facteur local du jeu ; pauses, villes, repos et ferries peuvent changer cette estimation.';
  if (navigation) {
    set('game', '', false);
    set('arrival', '', false);
    set('deadline', '', false);
    set('real', fmt(t.realSeconds) + (t.paused ? ' · pause' : ''), hasJob);
    if (coach) set('route', '', false);
  }
  const kmRow = root.querySelector('[data-h="kKm"]');
  if (kmRow) kmRow.classList.toggle('off', coach || !d.job);
  const todayRow = root.querySelector('[data-h="kToday"]');
  if (todayRow) todayRow.classList.toggle('off', coach);
  if (coach && hasJob) { const m = root.querySelector('[data-h="mode"]'); m.textContent = 'SERVICE CAR'; m.className = 'mode real'; }
}
