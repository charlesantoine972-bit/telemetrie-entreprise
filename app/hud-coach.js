// Bandeau car indépendant du style camion. Les données de service de l'aperçu
// sont explicitement fictives ; aucun nom de champ bus_job non documenté n'est deviné.
function hudCoach(root, d) {
  const live = d.live || {};
  const enabled = d.vehicleType === 'car';
  root.classList.toggle('hud-coach', enabled);
  if (!enabled) return;
  let panel = root.querySelector('.coach-panel');
  if (!panel) {
    panel = document.createElement('div'); panel.className = 'coach-panel';
    panel.setAttribute('aria-label', 'Tableau de conduite autocar');
    panel.innerHTML = `
      <div class="coach-main">
        <div class="coach-route">
          <div class="coach-route-heading"><b class="coach-line" data-c="line" title="Numéro de ligne">—</b><div class="coach-destination"><span class="coach-caption">LIGNE · DESTINATION</span><b data-c="destination">—</b></div></div>
          <div class="coach-route-stops"><span class="coach-caption">ARRÊTS DE LA LIGNE</span><b data-c="stops">—</b></div>
        </div>
        <div class="coach-stop coach-div"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-9 8-14a8 8 0 0 0-16 0c0 5 8 14 8 14z"/><circle cx="12" cy="8" r="2.5"/></svg><div><span class="coach-caption">PROCHAIN ARRÊT</span><b data-c="stop">—</b></div></div>
        <div class="coach-clock coach-div"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/></svg><div><span class="coach-caption">HEURE DU JEU</span><b data-c="clock">—</b></div></div>
        <div class="coach-schedule coach-div" data-c="schedule"><span class="coach-caption">AVANCE / RETARD</span><b data-c="delay">—</b></div>
      </div>
      <div class="coach-details">
        <span>GPS · prochain point <b data-c="distance">—</b></span>
        <span class="coach-speed">Vitesse <b data-c="speed">—</b></span>
        <span>Limitation <b data-c="limit">—</b></span>
        <span>Compteur <b data-c="odometer">—</b></span>
        <span>Temps GPS · jeu <b data-c="game">—</b></span>
        <span>Temps réel ≈ <b data-c="real">—</b></span>
        <span>Arrivée ≈ <b data-c="arrival">—</b></span>
        <span>Satisfaction clients <b data-c="satisfaction">—</b></span>
        <span class="coach-fuel">Carburant <b data-c="fuel">—</b><span class="coach-fuel-track"><i data-c="fuelBar"></i></span></span>
        <span>Autonomie <b data-c="fuelRange">—</b></span>
        <span>Pause obligatoire dans <b data-c="restStop">—</b></span>
      </div>`;
    root.append(panel);
  }
  const q = key => panel.querySelector('[data-c="' + key + '"]');
  const set = (key, value) => { q(key).textContent = value; };
  const valid = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const number = (value, digits = 0) => value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  set('line', '—');
  set('destination', '—');
  set('stop', '—');
  set('stops', '—');
  set('satisfaction', '—');
  q('stops').setAttribute('aria-label', 'Arrêts de ligne indisponibles dans la télémétrie');
  set('clock', valid(live.gameTime) ? String(Math.floor(live.gameTime / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(live.gameTime) % 60).padStart(2, '0') : '—');
  set('speed', typeof live.speed === 'number' && Number.isFinite(live.speed) ? number(Math.abs(live.speed) * 3.6) + ' km/h' : '—');
  set('limit', valid(live.speedLimit) && live.speedLimit > 0 ? number(live.speedLimit * 3.6) + ' km/h' : '—');
  panel.classList.toggle('over-speed', valid(live.speedLimit) && live.speedLimit > 0 && Math.abs(live.speed) > live.speedLimit);
  set('delay', '—');
  q('schedule').classList.toggle('unavailable', true);
  set('distance', valid(live.navDistance) ? number(live.navDistance / 1000, 1) + ' km' : '—');
  set('odometer', valid(live.odometer) ? number(live.odometer, 1) + ' km' : '—');
  const times = TCHMission.calculate(d.live);
  set('game', TCHMission.duration(times.gameSeconds));
  set('real', TCHMission.duration(times.realSeconds));
  set('arrival', times.paused ? 'Pause' : times.arrivalReal == null ? '—' : new Date(times.arrivalReal).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  panel.querySelector('.coach-details').title = 'Temps GPS vers le prochain point de navigation, pas nécessairement la fin de la ligne. Le temps réel dépend de l’échelle du jeu.';
  const capacity = live.truck && live.truck['fuel.capacity'];
  const fuel = valid(live.fuel) ? live.fuel : null;
  const pct = fuel != null && valid(capacity) && capacity > 0 ? Math.max(0, Math.min(100, fuel / capacity * 100)) : null;
  set('fuel', pct != null ? number(pct) + ' %' : fuel != null ? number(fuel) + ' L' : '—');
  set('fuelRange', valid(live.fuelRange) && live.fuelRange > 0 ? number(live.fuelRange, 0) + ' km' : '—');
  set('restStop', valid(live.restStop) && live.restStop > 0 ? TCHMission.duration(live.restStop * 60) : '—');
  q('fuelBar').style.width = (pct == null ? 0 : pct) + '%';
  q('fuelBar').classList.toggle('low', pct != null && pct < 15);
}

