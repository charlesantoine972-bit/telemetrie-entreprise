// Bandeau car (DLC Coaches) : ligne, heure, vitesse, limitation, prochain arrêt, horaire,
// puis distance, compteur, températures, passagers et carburant.
// Les données viennent de d.coach (calculé dans l'appli à partir du plugin, voir src/coach.js).
// Une information que le jeu ne fournit pas est masquée : rien n'est inventé.
const COACH_PREVIEW = {
  inService: true, lineNumber: '42', lineName: 'Lyon Perrache', nextStop: 'Grenoble – Gare routière',
  stage: { current: 2, count: 5 }, scheduleMarginMinutes: -9, passengers: 31, capacity: 57,
  outsideTemp: null, cabinTemp: null, fuelPct: 78, distanceKm: 12.4, clockSeconds: 38, mandatoryBreak: null
};
const COACH_ICONS = {
  clock: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4.6V8l2.3 1.5"/></svg>',
  pin: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14.5s4.6-4.3 4.6-8a4.6 4.6 0 1 0-9.2 0c0 3.7 4.6 8 4.6 8z"/><circle cx="8" cy="6.4" r="1.7"/></svg>',
  timer: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="9" r="5.4"/><path d="M8 6.2V9l1.8 1.1M6.3 1.8h3.4"/></svg>'
};
function hudCoach(root, d) {
  const live = d.live || {};
  const enabled = d.vehicleType === 'car';
  root.classList.toggle('hud-coach', enabled);
  if (!enabled) return;
  let panel = root.querySelector('.coach-panel');
  if (!panel) {
    panel = document.createElement('div'); panel.className = 'coach-panel';
    panel.setAttribute('aria-label', 'Bandeau car');
    panel.innerHTML = `
      <div class="coach-top">
        <span class="coach-line" data-c="lineNo"></span>
        <span class="coach-line-name" data-c="lineName">—</span>
        <span class="coach-stage" data-c="stage" title="Arrêt en cours / nombre d’arrêts"></span>
        <span class="coach-sep"></span>
        <span class="coach-time"><i class="coach-ico coach-ico-blue">${COACH_ICONS.clock}</i><b data-c="clock">--:--</b></span>
        <span class="coach-sep"></span>
        <span class="coach-speed"><b data-c="speed">0</b> <i data-u="sp" style="font-style:normal">km/h</i></span>
        <span class="coach-limit" data-c="limit">–</span>
        <span class="coach-sep"></span>
        <span class="coach-stop"><i class="coach-ico coach-ico-pin">${COACH_ICONS.pin}</i><b data-c="nextStop">—</b></span>
        <span class="coach-timer" data-c="timerBox"><i class="coach-ico">${COACH_ICONS.timer}</i><b data-c="timer">—</b></span>
      </div>
      <div class="coach-bottom">
        <span data-c="distanceBox">Distance <b data-c="distance">—</b></span>
        <span>Odomètre <b data-c="odometer">—</b></span>
        <span data-c="tempBox">Extérieur / cabine <b data-c="temp">—</b></span>
        <span data-c="paxBox">Passagers <b data-c="pax">—</b></span>
        <span data-c="breakBox">Pause dans <b data-c="break">—</b></span>
        <span class="coach-fuel">Carburant <b data-c="fuel">—</b><span class="coach-fuel-track"><i data-c="fuelBar"></i></span></span>
      </div>`;
    root.append(panel);
  }
  const c = d.coach || (d.coachPreview ? COACH_PREVIEW : {});
  const q = key => panel.querySelector('[data-c="' + key + '"]');
  const set = (key, value) => { q(key).textContent = value; };
  const show = (key, on) => { q(key).hidden = !on; };
  const ok = v => typeof v === 'number' && Number.isFinite(v);
  const n = (v, digits = 0) => v.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const two = v => String(v).padStart(2, '0');

  // Ligne et terminus
  set('lineNo', c.lineNumber || ''); show('lineNo', !!c.lineNumber);
  set('lineName', c.lineName || (c.inService ? 'Service en cours' : 'Hors service'));
  const stage = c.stage && c.stage.count > 1 ? c.stage.current + '/' + c.stage.count : '';
  set('stage', stage); show('stage', !!stage);

  // Heure du jeu (les secondes sont estimées entre deux minutes de jeu)
  set('clock', ok(live.gameTime) && live.gameTime >= 0
    ? two(Math.floor(live.gameTime / 60) % 24) + ':' + two(Math.floor(live.gameTime) % 60) + (ok(c.clockSeconds) ? ':' + two(c.clockSeconds) : '')
    : '--:--');

  // Vitesse et limitation
  const kmh = ok(live.speed) ? Math.round(Math.abs(live.speed) * 3.6) : null;
  const limit = ok(live.speedLimit) && live.speedLimit > 0 ? Math.round(live.speedLimit * 3.6) : null;
  const U = (typeof UNITS!=='undefined'?UNITS:{speed:x=>x*3.6,dist:x=>x,vol:x=>x,sp:'km/h',d:'km',v:'L'});
  set('speed', kmh == null ? '—' : n(Math.round(U.speed(Math.abs(live.speed)))));
  set('limit', limit == null ? '' : String(Math.round(U.speed(live.speedLimit)))); show('limit', limit != null);
  panel.classList.toggle('over-speed', kmh != null && limit != null && kmh > limit);

  // Prochain arrêt, sinon distance GPS
  const gps = ok(live.navDistance) && live.navDistance > 0 ? n(U.dist(live.navDistance / 1000), 1) + ' ' + U.d : null;
  set('nextStop', c.nextStop || (gps ? 'GPS · ' + gps : '—'));
  q('nextStop').title = c.nextStop && gps ? 'Distance GPS : ' + gps : '';

  // Horaire : avance / retard à l'arrêt suivant ; sinon temps de trajet GPS restant
  const box = q('timerBox');
  if (ok(c.scheduleMarginMinutes)) {
    const m = c.scheduleMarginMinutes, a = Math.abs(m);
    const txt = a >= 60 ? Math.floor(a / 60) + ' h ' + two(a % 60) : a + ' min';
    set('timer', (m < 0 ? '−' : '+') + txt);
    box.classList.toggle('late', m < 0); box.classList.toggle('neutral', false);
    box.title = m < 0 ? 'Retard prévu à l’arrivée (heure du jeu)' : 'Avance prévue à l’arrivée (heure du jeu)';
    show('timerBox', true);
  } else {
    const t = TCHMission.calculate(live);
    show('timerBox', t.gameSeconds != null);
    set('timer', t.gameSeconds != null ? TCHMission.duration(t.gameSeconds).replace(/^0 h 0?/, '') + (t.gameSeconds < 3600 ? ' min' : '') : '—');
    box.classList.toggle('late', false); box.classList.toggle('neutral', true);
    box.title = 'Temps GPS restant (heure du jeu)';
  }

  // Ligne du bas
  set('distance', ok(c.distanceKm) ? n(U.dist(c.distanceKm), 1) + ' ' + U.d : '—'); show('distanceBox', ok(c.distanceKm));
  set('odometer', ok(live.odometer) ? n(U.dist(live.odometer), 1) + ' ' + U.d : '—');
  const tOut = ok(c.outsideTemp), tIn = ok(c.cabinTemp);
  set('temp', (tOut ? n(c.outsideTemp, 1) + ' °C' : '—') + ' / ' + (tIn ? n(c.cabinTemp, 1) + ' °C' : '—'));
  show('tempBox', tOut || tIn);
  const pax = ok(c.passengers), cap = ok(c.capacity);
  set('pax', (pax ? n(c.passengers) : '—') + (cap ? '/' + n(c.capacity) : ''));
  show('paxBox', pax || cap);
  // Pause obligatoire : affichée seulement quand elle approche (moins de 2 h de jeu)
  const brk = ok(c.mandatoryBreak) ? c.mandatoryBreak : ok(live.restStop) ? live.restStop : null;
  set('break', brk == null ? '—' : brk <= 0 ? 'maintenant' : TCHMission.duration(brk * 60));
  show('breakBox', brk != null && brk < 120);
  const pct = ok(c.fuelPct) ? c.fuelPct : null;
  set('fuel', pct != null ? n(pct) + ' %' : ok(live.fuel) ? n(U.vol(live.fuel)) + ' ' + U.v : '—');
  q('fuelBar').style.width = (pct == null ? 0 : pct) + '%';
  q('fuelBar').classList.toggle('low', pct != null && pct < 15);
}
