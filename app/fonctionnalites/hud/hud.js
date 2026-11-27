/* Page HUD : activation, aperçus, réglages, test, diagnostic.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

function syncHudDot(){ const on = document.getElementById('hudOnNav').checked, d = document.getElementById('hudNavDot'); d.classList.toggle('on', on); d.closest('.navbtn').dataset.state = on ? 'HUD activé' : 'HUD désactivé'; }
/* ---------- Bandeau / HUD ---------- */
const HUD_PROFILE_DEFAULTS = {
  truck: { style: 'navigation', position: 'haut', logo: true, opacity: 82, scale: 100, boxes: { ...TRUCK_HUD_DEFAULT_BOXES } },
  bus: { style: 'navigation', position: 'haut', logo: true, opacity: 82, scale: 100 }
};
let hudSt = { on: false, truck: { ...HUD_PROFILE_DEFAULTS.truck }, bus: { ...HUD_PROFILE_DEFAULTS.bus } };
let hudDemo = null;
const hudStatic = { live: { speed: 88 / 3.6, speedLimit: 90 / 3.6, odometer: 154320.5, fuelRange: 420, navDistance: 214000, navTime: 10800, localScale: 19, gameTime: 1400, job: { 'delivery.time': 1460 } }, job: { from: 'Paris', to: 'Lyon', cargo: 'Électronique', mass: 18000, loaded: 38.4, mode: 'réel', overPct: 1.2 }, today: { loaded: 126, empty: 18 }, thresholds: { limit: 100, pct: 5 } };
function hudPreview(d, profile){
  if (!profile) { for (const kind of ['truck', 'bus']) hudPreview(d, kind); return; }
  let source = d || hudStatic;
  const isBus = profile === 'bus';
  const sourceIsBus = source.vehicleType === 'car';
  if (source.connected && sourceIsBus !== isBus) source = hudStatic;
  const live = Object.assign({}, source.live || {});
  const data = Object.assign({}, source, { live, options: hudSt[profile], vehicleType: isBus ? 'car' : 'camion' });
  if (isBus) {
    live.busJob = live.busJob || {};
    data.job = null;
    data.coachPreview = !source.connected;
    if (!source.connected) Object.assign(live, { fuel: 300, truck: { 'fuel.capacity': 300 }, ...live });
  } else {
    delete live.busJob;
    data.coachPreview = false;
    data.truckPreview = !source.connected;
  }
  hudRender(document.querySelector(`[data-hud-preview="${profile}"]`), data);
  if (!hudDemo) setText(profile === 'bus' ? 'hudStageTagBus' : 'hudStageTagTruck',
    source.connected ? 'APERÇU · DONNÉES DU JEU' : isBus ? 'APERÇU BUS / CAR · EXEMPLE' : 'APERÇU CAMION · EXEMPLE');
}
// Diagnostic : champs bus_job et véhicule reçus du plugin
let coachDiagText = '';
async function renderCoachDiag(){
  const box = document.getElementById('coachDiag');
  if (!box || !box.open || !window.tel || !window.tel.telemetryCapabilities) return;
  const c = await window.tel.telemetryCapabilities();
  const body = document.getElementById('coachDiagBody');
  if (!c.connected) { body.textContent = 'En attente du jeu.'; coachDiagText = ''; return; }
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const rows = list => list.length ? `<table style="width:100%;border-collapse:collapse;font-size:12px">${list.map(f => `<tr><td style="padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top"><code>${esc(f.name)}</code></td><td style="padding:3px 0;word-break:break-word">${esc(f.value)}</td></tr>`).join('')}</table>` : '<p class="muted">Rien reçu.</p>';
  const co = c.coach || {};
  const found = [['Ligne', co.lineNumber], ['Terminus', co.lineName], ['Prochain arrêt', co.nextStop], ['Avance / retard (min)', co.scheduleMarginMinutes], ['Passagers', co.passengers], ['Places', co.capacity], ['Temp. extérieure', co.outsideTemp], ['Temp. cabine', co.cabinTemp]];
  body.innerHTML = `<p style="margin:6px 0"><b>Véhicule :</b> ${esc(c.vehicleName || '—')} <code>${esc(c.vehicleId || '')}</code> · ${c.coachVehicle ? 'reconnu comme car' : 'non reconnu comme car'} · profil affiché : ${c.vehicleType === 'car' ? 'bus / car' : 'camion'} · plugin ${esc(c.plugin || '?')}${c.mandatoryBreak ? ' · pause obligatoire reçue' : ''}</p>
    <p style="margin:6px 0"><b>Lu par l’appli :</b> ${found.map(([k, v]) => `${k} : ${v == null || v === '' ? '<span class="muted">—</span>' : esc(v)}`).join(' · ')}</p>
    <h3 style="margin:12px 0 4px;font-size:14px">Service car (bus_job)${c.busJob ? '' : ' : aucun service en cours'}</h3>${rows(c.busJobFields || [])}
    <h3 style="margin:12px 0 4px;font-size:14px">Véhicule (truck)</h3>${rows(c.truckFields || [])}
    ${(c.otherConfigs || []).length ? `<p style="margin:10px 0 0">Autres données reçues : ${c.otherConfigs.map(esc).join(', ')}</p>` : ''}`;
  coachDiagText = [`Véhicule : ${c.vehicleName} (${c.vehicleId || '?'}) — car reconnu : ${c.coachVehicle ? 'oui' : 'non'} — plugin ${c.plugin}`,
    'bus_job :', ...(c.busJobFields || []).map(f => `  ${f.name} = ${f.value}`), 'truck :', ...(c.truckFields || []).map(f => `  ${f.name} = ${f.value}`),
    'autres : ' + (c.otherConfigs || []).join(', ')].join('\n');
}
function renderHudPage(){
  ['hudOn', 'hudOnNav', 'hudOnOpt'].forEach(id => { document.getElementById(id).checked = hudSt.on; }); syncHudDot();
  for (const profile of ['truck', 'bus']) {
    const options = hudSt[profile];
    const style = HUD_SELECTABLE_STYLES.includes(options.style) ? options.style : 'bandeau';
    document.querySelectorAll(`[data-hud-profile="${profile}"] [data-hstyle]`).forEach(b => b.classList.toggle('on', b.dataset.hstyle === style));
    document.querySelectorAll(`[data-hud-profile="${profile}"] [data-hpos]`).forEach(b => b.classList.toggle('on', b.dataset.hpos === options.position));
    document.querySelectorAll(`[data-hud-profile="${profile}"] [data-hlogo]`).forEach(b => b.classList.toggle('on', (b.dataset.hlogo === '1') === (options.logo !== false)));
    document.querySelectorAll(`[data-hud-profile="${profile}"] [data-hop]`).forEach(b => b.classList.toggle('on', Number(b.dataset.hop) === Number(options.opacity)));
    document.querySelectorAll(`[data-hud-profile="${profile}"] [data-hscale]`).forEach(b => b.classList.toggle('on', Number(b.dataset.hscale) === Number(options.scale)));
    if (profile === 'truck') {
      const bx = Object.assign({}, TRUCK_HUD_DEFAULT_BOXES, options.boxes || {});
      document.getElementById('hudTruckBoxes').innerHTML = TRUCK_HUD_BOXES.map(([k, l, t]) => `<button type="button" class="chip-tg${bx[k] ? ' on' : ''}" data-hbox="${k}" aria-pressed="${bx[k] ? 'true' : 'false'}" title="${t}">${l}</button>`).join('');
    }
    document.getElementById(profile === 'bus' ? 'hudStageBus' : 'hudStageTruck').style.alignItems = options.position === 'bas' ? 'flex-end' : 'flex-start';
  }
  if (!hudDemo) hudPreview();
}
function hudSave(patch, profile){
  if (patch.on != null) hudSt.on = patch.on;
  if (profile && patch.opt) Object.assign(hudSt[profile], patch.opt);
  renderHudPage();
  if (window.tel) window.tel.setSettings(Object.assign({}, patch.on != null ? { modules: { hud: hudSt.on } } : {},
    profile && patch.opt ? { hud: { [profile]: hudSt[profile] } } : {}));
}
// Teste un seul profil à la fois pour garder les aperçus indépendants.
function stopHudTest() {
  if (!hudDemo) return;
  clearInterval(hudDemo); hudDemo = null;
  for (const [profile, label] of [['truck', 'camion'], ['bus', 'bus']]) {
    const btn = document.getElementById(profile === 'truck' ? 'hudTestTruck' : 'hudTestBus');
    btn.disabled = false;
    btn.textContent = `Tester le HUD ${label}`;
  }
  hudPreview();
}
function startHudTest(profile) {
  stopHudTest();
  const isTruck = profile === 'truck';
  const button = document.getElementById(isTruck ? 'hudTestTruck' : 'hudTestBus');
  const tag = isTruck ? 'hudStageTagTruck' : 'hudStageTagBus';
  const t0 = Date.now(); let loaded = 12, over = 0;
  button.disabled = true;
  button.textContent = `Test ${isTruck ? 'camion' : 'bus'} en cours…`;
  setText(tag, `TEST ${isTruck ? 'CAMION' : 'BUS'} EN COURS`);
  hudDemo = setInterval(() => {
    const t = (Date.now() - t0) / 1000;
    if (t > 15) { stopHudTest(); return; }
    const kmh = t < 4 ? t * 22 : t < 8 ? 88 + Math.sin(t * 2) * 3 : t < 12 ? 88 + (t - 8) * 6 : 112 - (t - 12) * 8;
    loaded += kmh / 3600 * 0.2 * 40; if (kmh > 100) over += kmh / 3600 * 0.2 * 40 * 3;
    const pct = over / loaded * 100, remaining = Math.max(0, 214000 - loaded * 1000);
    hudPreview({ connected: false, live: { speed: kmh / 3.6, speedLimit: (t < 8 ? 90 : 110) / 3.6, navDistance: remaining,
        navTime: remaining / 20, localScale: 19, gameTime: 1400 + Math.floor(t / 3), restStop: 60, fuelRange: 300, fuel: 40,
        truck: { 'fuel.capacity': 100 }, job: { 'delivery.time': 1460 } },
      job: { from: 'Paris', to: 'Lyon', cargo: 'Électronique', mass: 18000, loaded, mode: pct > 5 ? 'course' : 'réel', overPct: pct },
      mission: { remainingKm: remaining / 1000, remainingMin: remaining / 20 / 60 }, 
      today: { loaded: 126 + loaded, empty: 18 }, thresholds: { limit: 100, pct: 5 } }, profile);
  }, 200);
}
