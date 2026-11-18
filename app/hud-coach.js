// Bandeau car indépendant du style camion. Les champs non documentés de bus_job ne sont pas devinés.
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
      <div class="coach-header">
        <div class="coach-primary-speed"><span class="coach-caption">VITESSE</span><b data-c="speed">—</b></div>
        <div class="coach-header-item"><span class="coach-caption">LIMITATION</span><b data-c="limit">—</b></div>
        <div class="coach-header-item coach-clock"><span class="coach-caption">HEURE DU JEU</span><b data-c="clock">—</b></div>
      </div>
      <div class="coach-navigation">
        <div class="coach-navigation-item"><span class="coach-caption">PROCHAIN POINT GPS</span><b data-c="distance">—</b></div>
        <div class="coach-navigation-item"><span class="coach-caption">TEMPS GPS · JEU</span><b data-c="game">—</b></div>
        <div class="coach-navigation-item"><span class="coach-caption">ARRIVÉE RÉELLE ESTIMÉE</span><b data-c="arrival">—</b></div>
      </div>
      <div class="coach-details">
        <span>Compteur <b data-c="odometer">—</b></span>
        <span>Temps réel ≈ <b data-c="real">—</b></span>
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
  set('clock', valid(live.gameTime) ? String(Math.floor(live.gameTime / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(live.gameTime) % 60).padStart(2, '0') : '—');
  set('speed', typeof live.speed === 'number' && Number.isFinite(live.speed) ? number(Math.abs(live.speed) * 3.6) + ' km/h' : '—');
  set('limit', valid(live.speedLimit) && live.speedLimit > 0 ? number(live.speedLimit * 3.6) + ' km/h' : '—');
  panel.classList.toggle('over-speed', valid(live.speedLimit) && live.speedLimit > 0 && Math.abs(live.speed) > live.speedLimit);
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

