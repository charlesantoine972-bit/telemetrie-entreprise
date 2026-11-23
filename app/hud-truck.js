// Bandeau camion : même présentation que le bandeau car (src : hud-coach.js), contenu inspiré
// des tableaux de bord SimHub et de l'overlay Trucky.
// Ligne 1 : mission, trajet, heure du jeu, rapport, vitesse, limitation, régulateur, mode réel / course.
// Ligne 2 : boîtes activables (Route, Livraison, Marchandise, Carburant, Pause, Véhicule).
// Toutes les valeurs viennent du jeu en direct (d.mission = configuration « job » du SDK, d.live = canaux).
// Une information que le jeu ne fournit pas est masquée : rien n'est inventé.
const TRUCK_HUD_BOXES = [
  ['route', 'Route', 'Distance GPS restante et temps de trajet'],
  ['livraison', 'Livraison', 'Heure limite de livraison et temps restant'],
  ['cargo', 'Marchandise', 'Marchandise, poids et dégâts'],
  ['carburant', 'Carburant', 'Niveau du réservoir et autonomie'],
  ['pause', 'Pause', 'Temps avant la pause obligatoire'],
  ['vehicule', 'Véhicule', 'Dégâts du camion (l’élément le plus abîmé)'],
  ['mode', 'Mode', 'Réel ou course, d’après le seuil de vitesse']
];
const TRUCK_HUD_DEFAULT_BOXES = Object.fromEntries(TRUCK_HUD_BOXES.map(([k]) => [k, true]));
// Exemple affiché dans l'aperçu tant que le jeu n'est pas connecté.
const TRUCK_PREVIEW = {
  mission: { type: 'truck', from: 'Paris', fromCompany: 'Tradeaux', to: 'Prague', toCompany: 'Posped', cargo: 'Pommes', mass: 20000,
    planned: 1040, remainingKm: 521, remainingMin: 440, deadline: 3 * 1440 + 9 * 60, timeLeft: 1135, loaded: true, cargoDamage: 0.004 },
  live: { gear: 12, rpm: 1250, cruise: 85 / 3.6, fuel: 512, fuelRange: 1400, truck: { 'fuel.capacity': 1400 },
    wear: { engine: 0.01, transmission: 0.01, cabin: 0.04, chassis: 0.02, wheels: 0.03 }, mandatoryBreak: 410, gameTime: 2 * 1440 + 14 * 60 + 5 }
};
const TRUCK_ICONS = {
  clock: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4.6V8l2.3 1.5"/></svg>',
  flag: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 14.5v-12M3.5 3h8.2l-1.6 2.6 1.6 2.6H3.5"/></svg>',
  wrench: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.6 2.4a3.2 3.2 0 0 0 4 4l-6.9 6.9a1.4 1.4 0 0 1-2-2z"/></svg>',
  timer: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="9" r="5.4"/><path d="M8 6.2V9l1.8 1.1M6.3 1.8h3.4"/></svg>'
};
const TRUCK_DAYS = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

function hudTruck(root, d) {
  const enabled = d.vehicleType !== 'car';
  root.classList.toggle('hud-truck', enabled);
  if (!enabled) return;
  let panel = root.querySelector('.truck-panel');
  if (!panel) {
    panel = document.createElement('div'); panel.className = 'truck-panel';
    panel.setAttribute('aria-label', 'Bandeau camion');
    panel.innerHTML = `
      <div class="truck-top">
        <span class="truck-tag" data-t="tag">SANS MISSION</span>
        <span class="truck-route" data-t="route" hidden></span>
        <span class="coach-sep"></span>
        <span class="coach-time"><i class="coach-ico coach-ico-blue">${TRUCK_ICONS.clock}</i><b data-t="clock">--:--</b></span>
        <span class="coach-sep"></span>
        <span class="truck-gear" data-t="gear" title="Rapport engagé" hidden></span>
        <span class="coach-speed"><b data-t="speed">0</b> km/h</span>
        <span class="coach-limit" data-t="limit">–</span>
        <span class="truck-cruise" data-t="cruise" title="Régulateur de vitesse" hidden></span>
        <span class="truck-mode" data-t="mode" hidden></span>
        <span class="truck-wear" data-t="b-vehicule" title="Dégâts du camion : l’élément le plus abîmé"><i class="coach-ico">${TRUCK_ICONS.wrench}</i><b data-t="wear">—</b></span>
      </div>
      <div class="coach-bottom truck-bottom" data-t="bottom">
        <span data-t="b-route">Reste <b data-t="left">—</b><em data-t="eta"></em></span>
        <span data-t="b-livraison"><i class="coach-ico">${TRUCK_ICONS.flag}</i><b data-t="deadline">—</b><em class="truck-late" data-t="timeLeft"></em></span>
        <span data-t="b-cargo"><b data-t="cargo">—</b><em data-t="cargoDmg"></em></span>
        <span data-t="b-carburant" class="coach-fuel">Carburant <b data-t="fuel">—</b><span class="coach-fuel-track"><i data-t="fuelBar"></i></span></span>
        <span data-t="b-pause"><i class="coach-ico">${TRUCK_ICONS.timer}</i>Pause <b data-t="break">—</b></span>
      </div>`;
    root.append(panel);
  }
  const preview = !!d.truckPreview;
  const live = preview ? Object.assign({}, TRUCK_PREVIEW.live, d.live || {}) : (d.live || {});
  const m = preview ? Object.assign({}, TRUCK_PREVIEW.mission, d.mission || {}) : (d.mission && d.mission.type === 'truck' ? d.mission : null);
  const boxes = Object.assign({}, TRUCK_HUD_DEFAULT_BOXES, (d.options || {}).boxes || {});
  const q = key => panel.querySelector('[data-t="' + key + '"]');
  const set = (key, value) => { const el = q(key); if (el.textContent !== value) el.textContent = value; };
  const show = (key, on) => { q(key).hidden = !on; };
  const ok = v => typeof v === 'number' && Number.isFinite(v);
  const n = (v, digits = 0) => v.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const two = v => String(v).padStart(2, '0');
  const dur = min => { const a = Math.round(Math.abs(min)); return a >= 1440 ? Math.floor(a / 1440) + ' j ' + Math.floor(a % 1440 / 60) + ' h' : a >= 60 ? Math.floor(a / 60) + ' h ' + two(a % 60) : a + ' min'; };

  // Ligne 1 : mission et trajet
  const tag = q('tag');
  tag.className = 'truck-tag' + (m ? (m.loaded ? ' on' : ' empty') : '');
  set('tag', m ? (m.loaded ? 'LIVRAISON' : 'VERS LE CHARGEMENT') : 'SANS MISSION');
  set('route', m ? `${m.from || '—'} → ${m.to || '—'}` : ''); show('route', !!m);
  q('route').title = m ? [m.fromCompany, m.toCompany].filter(Boolean).join(' → ') : '';
  set('clock', ok(live.gameTime) && live.gameTime >= 0
    ? two(Math.floor(live.gameTime / 60) % 24) + ':' + two(Math.floor(live.gameTime) % 60) + (ok(d.clockSeconds) ? ':' + two(d.clockSeconds) : '')
    : '--:--');
  const g = ok(live.gear) ? live.gear : null;
  set('gear', g == null ? '' : g === 0 ? 'N' : g < 0 ? 'R' + (-g) : String(g)); show('gear', g != null);
  const kmh = ok(live.speed) ? Math.round(Math.abs(live.speed) * 3.6) : null;
  const limit = ok(live.speedLimit) && live.speedLimit > 0 ? Math.round(live.speedLimit * 3.6) : null;
  set('speed', kmh == null ? '—' : n(kmh));
  set('limit', limit == null ? '' : String(limit)); show('limit', limit != null);
  panel.classList.toggle('over-speed', kmh != null && limit != null && kmh > limit);
  const cc = ok(live.cruise) && live.cruise > 0.5 ? Math.round(live.cruise * 3.6) : null;
  set('cruise', cc == null ? '' : 'CC ' + cc); show('cruise', cc != null);
  // Mode réel / course : compteurs de l'appli, seulement pour la mission affichée
  const tj = preview ? (d.job || { mode: 'réel', overPct: 0 }) : (m && m.tracked ? d.job : null);
  const modeEl = q('mode');
  modeEl.className = 'truck-mode' + (tj && tj.mode === 'course' ? ' race' : '');
  set('mode', tj ? (tj.mode === 'course' ? 'COURSE · ' + n(tj.overPct, 0) + ' %' : 'RÉEL') : '');
  show('mode', boxes.mode && !!tj);

  // Ligne 2 : boîtes
  const box = (key, on) => show('b-' + key, !!boxes[key] && on);
  const left = m && ok(m.remainingKm) ? m.remainingKm : ok(live.navDistance) && live.navDistance > 0 ? live.navDistance / 1000 : null;
  const leftMin = m && ok(m.remainingMin) ? m.remainingMin : ok(live.navTime) && live.navTime > 0 ? live.navTime / 60 : null;
  set('left', left == null ? '—' : n(left, left < 10 ? 1 : 0) + ' km');
  set('eta', leftMin == null ? '' : ' · ' + dur(leftMin));
  box('route', left != null);
  const dl = m && ok(m.deadline) && m.deadline > 0 ? m.deadline : null;
  set('deadline', dl == null ? '—' : `${TRUCK_DAYS[Math.floor(dl / 1440) % 7]} ${two(Math.floor(dl / 60) % 24)}:${two(dl % 60)}`);
  const tl = m && ok(m.timeLeft) ? m.timeLeft : null;
  set('timeLeft', tl == null ? '' : tl >= 0 ? ' · ' + dur(tl) : ' · ' + dur(tl) + ' de retard');
  q('b-livraison').classList.toggle('late', tl != null && tl < 0);
  q('b-livraison').title = 'Livrer avant cette heure (heure du jeu)';
  box('livraison', dl != null);
  set('cargo', m && m.cargo ? m.cargo + (ok(m.mass) && m.mass > 0 ? ' · ' + n(m.mass / 1000, 1) + ' t' : '') : '—');
  const cd = m && ok(m.cargoDamage) ? m.cargoDamage : null;
  set('cargoDmg', cd != null && cd >= 0.001 ? ' · ' + n(cd * 100, cd < 0.1 ? 1 : 0) + ' %' : '');
  q('b-cargo').classList.toggle('warn', cd != null && cd >= 0.05);
  box('cargo', !!(m && m.cargo));
  const cap = live.truck && Number(live.truck['fuel.capacity']) > 0 ? Number(live.truck['fuel.capacity']) : null;
  const pct = cap && ok(live.fuel) ? Math.max(0, Math.min(100, live.fuel / cap * 100)) : null;
  set('fuel', pct != null ? n(pct) + ' %' : ok(live.fuel) && live.fuel > 0 ? n(live.fuel) + ' L' : '—');
  q('fuelBar').style.width = (pct == null ? 0 : pct) + '%';
  q('fuelBar').classList.toggle('low', !!live.fuelWarning || (pct != null && pct < 15));
  q('b-carburant').title = ok(live.fuelRange) && live.fuelRange > 0 ? 'Autonomie : ' + n(live.fuelRange) + ' km' : '';
  box('carburant', pct != null || (ok(live.fuel) && live.fuel > 0));
  const brk = ok(live.mandatoryBreak) ? live.mandatoryBreak : ok(live.restStop) ? live.restStop : null;
  set('break', brk == null ? '—' : brk <= 0 ? 'maintenant' : dur(brk));
  q('b-pause').classList.toggle('late', brk != null && brk <= 30);
  box('pause', brk != null);
  const w = live.wear && typeof live.wear === 'object' ? ['engine', 'transmission', 'cabin', 'chassis', 'wheels'].map(k => live.wear[k]).filter(v => ok(v) && v >= 0) : [];
  const worst = w.length ? Math.max(...w) : null;
  set('wear', worst == null ? '—' : n(worst * 100, worst < 0.1 ? 1 : 0) + ' %');
  q('b-vehicule').classList.toggle('warn', worst != null && worst >= 0.1);
  q('b-vehicule').classList.toggle('late', worst != null && worst >= 0.3);
  box('vehicule', worst != null);
  // Pas de ligne vide : si aucune boîte n'est visible, la ligne 2 disparaît
  const visible = [...q('bottom').children].filter(el => !el.hidden);
  visible.forEach((el, i) => el.classList.toggle('first', i === 0));
  show('bottom', visible.length > 0);
  panel.classList.toggle('no-bottom', !visible.length);
}
if (typeof module === 'object' && module.exports) module.exports = { hudTruck, TRUCK_HUD_BOXES, TRUCK_HUD_DEFAULT_BOXES };
