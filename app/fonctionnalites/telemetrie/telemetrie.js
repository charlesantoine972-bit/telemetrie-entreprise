/* Télémétrie : direct camion / car, carburant, usure, ouverture automatique.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

let wasConnected = null; // null = premier relevé (l'appli s'ouvre alors que le jeu tourne peut-être déjà)
function autoOpenTelemetry(connected){
  const justStarted = connected && wasConnected !== true;
  wasConnected = connected;
  if (!justStarted || !autoTel || state.view === 'telemetrie') return;
  // On ne coupe pas une action en cours : fenêtre de confirmation ouverte ou édition dans Truck / Coach Tools.
  const modal = document.getElementById('modal');
  if (modal && !modal.classList.contains('hidden')) return;
  if (state.view && state.view.startsWith('at-')) return;
  showLauncher(false);
  go('telemetrie');
}
const DAYS = ['Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.','Dim.'];
const pct1 = v => (v * 100).toFixed(v < 0.1 ? 1 : 0).replace('.', ',') + ' %';
const litres = v => fmt(Math.round(v)) + ' L';
function renderFuel(L, connected){
  const cap = L && L.truck && Number(L.truck['fuel.capacity']) > 0 ? Number(L.truck['fuel.capacity']) : null;
  const fuel = L && Number.isFinite(L.fuel) && L.fuel >= 0 ? L.fuel : null;
  const tank = document.getElementById('fTank'), bar = document.getElementById('fBar'), res = document.getElementById('fRes');
  if (!connected || fuel == null){
    setText('fPct', '–'); setText('fLiters', ''); bar.style.width = '0%'; tank.className = 'tank'; res.style.display = 'none';
    ['fRange','fToFill','fAvg','fCap'].forEach(id => setText(id, '–')); setText('fWarn', '');
    setText('fHint', connected ? '' : 'Le niveau du réservoir s\'affiche quand le jeu est connecté.');
    return;
  }
  const ratio = cap ? Math.max(0, Math.min(1, fuel / cap)) : null;
  const factor = L.truck && Number(L.truck['fuel.warning.factor']) > 0 ? Number(L.truck['fuel.warning.factor']) : 0.15;
  const low = !!L.fuelWarning || (ratio != null && ratio <= factor);
  setText('fPct', ratio != null ? Math.round(ratio * 100) + ' %' : litres(fuel));
  setText('fLiters', cap ? `${litres(fuel)} sur ${litres(cap)}` : '');
  bar.style.width = ratio != null ? (ratio * 100).toFixed(1) + '%' : '0%';
  tank.className = 'tank' + (low ? ' low' : ratio != null && ratio < 0.3 ? ' mid' : '');
  tank.setAttribute('aria-valuenow', ratio != null ? Math.round(ratio * 100) : 0);
  res.style.display = cap ? '' : 'none'; res.style.left = (factor * 100) + '%'; res.title = 'Seuil de réserve';
  setText('fRange', L.fuelRange > 0 ? km(L.fuelRange) : '–');
  setText('fToFill', cap ? (cap - fuel < 1 ? 'plein fait' : litres(cap - fuel)) : '–');
  setText('fAvg', L.fuelAvg > 0 ? (L.fuelAvg * 100).toFixed(1).replace('.', ',') + ' L/100 km' : '–');
  setText('fCap', cap ? litres(cap) : '–');
  const w = document.getElementById('fWarn'); w.textContent = low ? 'RÉSERVE' : ''; w.style.color = low ? 'var(--race)' : '';
  setText('fHint', low ? 'Niveau bas : pense à t\'arrêter à la prochaine station.' : cap ? '' : 'Le jeu n\'a pas encore transmis la capacité du réservoir.');
}
/* ---------- Télémétrie : onglets Camion / Car avec bascule automatique ---------- */
let telManual = null, telLastType = null;
function telTab(){ return telManual || (telLastType === 'car' ? 'bus' : 'truck'); }
function applyTelTab(){
  const t = telTab();
  document.getElementById('v-telemetrie').dataset.tel = t;
  const fuel = document.getElementById('fuelPanel'), col = document.querySelector(t === 'bus' ? '#v-telemetrie .telright' : '#v-telemetrie .tel-left');
  if (fuel.parentElement !== col) col.insertBefore(fuel, t === 'bus' ? document.getElementById('wearPanel') : null);
  document.querySelectorAll('#telTabs button').forEach(b => b.classList.toggle('on', b.dataset.tt === t));
}
let telLastConnected = false;
function telAutoText(connected){
  setText('telAuto', !connected ? 'Bascule automatique selon le véhicule que tu conduis.'
    : telManual ? `Tu regardes l’onglet ${telManual === 'bus' ? 'Car' : 'Camion'} : reviens sur ${telLastType === 'car' ? 'Car' : 'Camion'} pour suivre ton véhicule.`
    : `Bascule automatique : ${telLastType === 'car' ? 'car' : 'camion'} détecté.`);
}
function renderTelTab(sn){
  // L’onglet suit la mission que le jeu signale ; sans mission, le véhicule détecté
  const type = !sn.connected ? telLastType : sn.mission ? (sn.mission.type === 'bus' ? 'car' : 'camion') : sn.vehicleType;
  if (type !== telLastType){ telLastType = type; telManual = null; } // nouveau véhicule : on suit
  telLastConnected = sn.connected;
  applyTelTab(); telAutoText(sn.connected);
}
let tripSig = '';
function renderTruckTrip(m){
  const p = m.progress, pct = p != null ? Math.round(p * 100) : null;
  const html = `<div class="node"><b>${esc(m.from || '—')}</b><span>${esc(m.fromCompany || '')}</span></div>`
    + `<div class="line"${pct != null ? ` title="${pct} % du trajet"` : ''}><i style="width:${pct || 0}%"></i>${pct != null ? `<u style="left:${pct}%"></u>` : ''}</div>`
    + `<div class="node end"><b>${esc(m.to || '—')}</b><span>${esc(m.toCompany || '')}</span></div>`
    + `<div class="muted" style="grid-column:1/-1;font-size:12px;display:flex;justify-content:space-between"><span>${pct != null ? pct + ' % du trajet' : 'Avancement inconnu (GPS du jeu sans itinéraire)'}</span><span>${m.remainingKm != null ? km(m.remainingKm) + ' restants' : ''}</span></div>`;
  if (html !== tripSig){ tripSig = html; document.getElementById('jTrip').innerHTML = html; }
}
let stopsSig = '';
function renderBus(sn){
  // Service car : uniquement ce que le jeu envoie (configuration « bus_job »)
  const g = sn.mission && sn.mission.type === 'bus' ? sn.mission : null;
  const j = g && g.tracked ? sn.job : null, c = sn.coach, L = sn.live;
  document.getElementById('bNone').classList.toggle('hidden', !!g);
  document.getElementById('bBox').classList.toggle('hidden', !g);
  setText('bNone', sn.connected ? 'Aucun service car en cours dans le jeu.' : 'En attente du jeu.');
  const st = document.getElementById('bState');
  st.textContent = g ? 'EN SERVICE' : ''; st.style.color = 'var(--loaded)';
  if (g){
    setText('bLine', [g.lineNumber ? 'Ligne ' + g.lineNumber : 'Service car', g.lineName || g.to].filter(Boolean).join(' · '));
    const count = g.stageCount || 1, cur = g.stageCurrent || 0;
    const rows = [];
    rows.push(`<div class="stop done"><i class="dot"></i><b>${esc(g.from || 'Départ')}</b><span>départ</span></div>`);
    // Arrêts déjà desservis : noms notés par l’appli si elle a suivi le service, sinon leur nombre (donné par le jeu)
    const served = j ? (j.stops || []).filter(x => x.kind === 'arrêt') : [];
    if (served.length){
      const shown = served.length > 3 ? [{ more: served.length - 2 }, ...served.slice(-2)] : served;
      for (const x of shown){
        if (x.more) { rows.push(`<div class="stop done"><i class="dot"></i><span style="text-align:left">… ${x.more} arrêt${x.more > 1 ? 's' : ''} desservi${x.more > 1 ? 's' : ''}</span><span></span></div>`); continue; }
        const t = new Date(x.at); rows.push(`<div class="stop done"><i class="dot"></i><b>${esc(x.name || 'Arrêt')}</b><span>${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}</span></div>`);
      }
    } else if (cur > 0) rows.push(`<div class="stop done"><i class="dot"></i><span style="text-align:left">${cur} arrêt${cur > 1 ? 's' : ''} desservi${cur > 1 ? 's' : ''}</span><span></span></div>`);
    const left = g.remainingKm;
    const isLast = cur >= count - 1;
    rows.push(`<div class="stop next"><i class="dot"></i><b>${esc(g.nextStop || '—')}</b><span>${isLast ? 'terminus' : `arrêt ${cur + 1} sur ${count}`}${left != null ? ' · ' + km(left) : ''}</span></div>`);
    const between = count - cur - 2;
    if (between > 0) rows.push(`<div class="stop todo"><i class="dot"></i><span style="text-align:left">${between} autre${between > 1 ? 's' : ''} arrêt${between > 1 ? 's' : ''}</span><span></span></div>`);
    if (!isLast && g.to && g.to !== g.nextStop) rows.push(`<div class="stop todo"><i class="dot"></i><b>${esc(g.to)}</b><span>terminus</span></div>`);
    const html = rows.join('');
    if (html !== stopsSig){ stopsSig = html; document.getElementById('bStops').innerHTML = html; }
    setText('bLeft', left != null ? km(left) : '–');
    setText('bTime', g.remainingMin != null ? dur(g.remainingMin) : '–');
    const m = c && c.scheduleMarginMinutes;
    const sched = document.getElementById('bSched');
    sched.textContent = m == null ? '–' : m === 0 ? "à l'heure" : m > 0 ? `${dur(m)} d'avance` : `${dur(-m)} de retard`;
    sched.style.color = m == null ? '' : m < 0 ? 'var(--race)' : 'var(--ok)';
    setText('bKm', j ? km(j.loaded) : '–');
    setText('bIncome', g.income ? fmt(g.income) + ' €' : '–');
    setText('bOver', j ? j.overPct.toFixed(1).replace('.', ',') + ' %' : '–');
  }
  // Voyageurs
  const pax = c && Number.isFinite(c.passengers) ? c.passengers : null, cap = c && Number.isFinite(c.capacity) && c.capacity > 0 ? c.capacity : null;
  setText('pCount', pax != null ? fmt(pax) : '–');
  setText('pCap', cap ? `voyageur${pax > 1 ? 's' : ''} sur ${fmt(cap)} places` : pax != null ? 'voyageurs à bord' : '');
  document.getElementById('pBar').style.width = pax != null && cap ? Math.min(100, pax / cap * 100).toFixed(1) + '%' : '0%';
  const sat = c && Number.isFinite(c.satisfactionPct) ? c.satisfactionPct : null;
  const satEl = document.getElementById('pSat');
  satEl.textContent = sat != null ? Math.round(sat) + ' %' : '–';
  satEl.style.color = sat == null ? '' : sat < 50 ? 'var(--race)' : sat < 75 ? 'var(--warn)' : 'var(--ok)';
  const sb = document.getElementById('pSatBar'); sb.style.width = sat != null ? sat + '%' : '0%';
  sb.style.background = sat == null ? '' : sat < 50 ? 'var(--race)' : sat < 75 ? 'var(--warn)' : 'var(--ok)';
  setText('pHint', !sn.connected ? 'Les voyageurs s’affichent quand le jeu est connecté.'
    : sn.vehicleType !== 'car' ? 'Tu ne conduis pas de car en ce moment.'
    : [pax == null ? 'Le jeu n’envoie pas encore le nombre de voyageurs.' : '', sat == null ? 'Le jeu n’envoie pas encore la satisfaction : la force G et les à-coups montrent le confort de ta conduite.' : ''].filter(Boolean).join(' '));
  // Force G (lissée) : point dans le cercle, droite = virage à droite, haut = accélération
  const gf = sn.gforce, dot = document.getElementById('gDot');
  const f = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ',') + ' G';
  if (gf){
    const sc = 124, x = Math.max(-62, Math.min(62, gf.lat * sc)), y = Math.max(-62, Math.min(62, -gf.lon * sc));
    dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1));
    dot.setAttribute('fill', gf.total >= 0.3 ? 'var(--race)' : gf.total >= 0.18 ? 'var(--warn)' : 'var(--ok)');
    setText('gNow', gf.total.toFixed(2).replace('.', ',') + ' G');
    setText('gLat', f(gf.lat)); setText('gLon', f(gf.lon));
  } else { dot.setAttribute('cx', 0); dot.setAttribute('cy', 0); dot.setAttribute('fill', 'var(--muted)'); ['gNow', 'gLat', 'gLon'].forEach(id => setText(id, '–')); }
  setText('gMax', j && j.gMax ? j.gMax.toFixed(2).replace('.', ',') + ' G' : '–');
  setText('gJolts', j ? String(j.jolts || 0) : '–');
  setText('bTrack', g ? (j ? '' : 'L’appli n’a pas suivi ce service depuis son début : km en service, pic de G et à-coups ne sont pas connus.') : '');
}
let wearSig = '';
function renderWear(L, connected, vehicleType, job){
  const box = document.getElementById('wearBody');
  const W = connected && L && L.wear;
  if (!W){
    const msg = connected ? 'Mets à jour le plugin du jeu (Options → Jeu &amp; plugin) pour afficher les dégâts.' : 'Les dégâts s\'affichent quand le jeu est connecté.';
    if (wearSig !== msg){ wearSig = msg; box.innerHTML = `<div class="soft">${msg}</div>`; }
    return;
  }
  const ok = v => Number.isFinite(v) && v >= 0;
  const row = (label, v) => { if (!ok(v)) return ''; const c = v >= 0.3 ? 'bad' : v >= 0.1 ? 'mid' : '';
    return `<div class="wrow ${c}"><span>${label}</span><div class="wb"><i style="width:${Math.min(100, v * 100).toFixed(1)}%"></i></div><b>${pct1(v)}</b></div>`; };
  const avg = arr => { const v = arr.filter(ok); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const truckParts = [['Moteur', W.engine], ['Boîte de vitesses', W.transmission], ['Cabine', W.cabin], ['Châssis', W.chassis], ['Roues', W.wheels]];
  const isCar = vehicleType === 'car';
  let html = '';
  const tAvg = avg(truckParts.map(p => p[1]));
  html += `<h3>${isCar ? 'Car' : 'Camion'}${tAvg != null ? `<b>${pct1(tAvg)} en moyenne</b>` : ''}</h3>` + truckParts.map(p => row(p[0], p[1])).join('');
  if (!isCar){
    const trParts = [['Châssis', W.trailerChassis], ['Roues', W.trailerWheels], ['Caisse', W.trailerBody]];
    if (L.trailerConnected){
      const rAvg = avg(trParts.map(p => p[1]));
      html += `<h3>Remorque${rAvg != null ? `<b>${pct1(rAvg)} en moyenne</b>` : ''}</h3>` + trParts.map(p => row(p[0], p[1])).join('');
    } else html += '<h3>Remorque</h3><div class="soft" style="font-size:13px">Aucune remorque attelée.</div>';
    if (job && job.type === 'truck') html += '<h3>Marchandise</h3>' + row('Cargaison', Number(L.cargoDamage) || 0);
  }
  if (html !== wearSig){ wearSig = html; box.innerHTML = html; }
}
function renderLive(sn){
  document.getElementById('v-telemetrie').dataset.conn = sn.connected ? 'on' : 'off';
  const L = sn.live, chip = document.getElementById('connChip');
  const game = L && L.game === 'ats' ? 'American Truck Simulator' : 'Euro Truck Simulator 2';
  chip.innerHTML = !sn.connected ? '<span class="d" style="background:var(--muted)"></span>En attente du jeu'
    : L.paused ? '<span class="d" style="background:var(--warn)"></span>' + game + ' · en pause'
    : '<span class="d" style="background:var(--ok)"></span>' + game + ' · connecté';
  document.getElementById('waitPanel').classList.toggle('hidden', sn.connected);
  const dotCol = !sn.connected ? 'var(--muted)' : L.paused ? 'var(--warn)' : 'var(--ok)';
  const txt = !sn.connected ? 'En attente du jeu' : (L.paused ? 'Jeu en pause' : 'Jeu connecté');
  setText('lToday', km(sn.today.loaded + sn.today.empty)); setText('lJobs', String(sn.totals.deliveries));
  document.getElementById('hGame').innerHTML = `<span class="d" style="background:${dotCol}"></span>Jeu : ${!sn.connected ? 'en attente' : (L.paused ? 'en pause' : 'connecté')}`;
  const t = sn.today, nb = sn.jobs.filter(j => new Date(j.ended).toDateString() === new Date().toDateString() && j.status === 'livrée').length;
  document.getElementById('hToday').innerHTML = (t.loaded + t.empty) > 0
    ? `Aujourd'hui : <b style="color:var(--loaded);margin:0 4px">${km(t.loaded)}</b> chargés · <b style="color:var(--empty);margin:0 4px">${km(t.empty)}</b> à vide · <b style="margin:0 4px">${nb}</b> livraison${nb > 1 ? 's' : ''}`
    : 'Aucun kilomètre aujourd\'hui pour l\'instant. Bonne route !';

  const th = sn.thresholds;
  setText('lRule', `Seuil ${Math.round(UNITS.fromKmh(th.limit))} ${UNITS.sp} · ${th.pct} % max`);
  if (L){
    const kmh = Math.round(Math.abs(L.speed) * 3.6);
    setText('lSpeed', Math.round(UNITS.speed(Math.abs(L.speed))));
    const lim = Math.round(L.speedLimit * 3.6);
    const limEl = document.getElementById('lLimit');
    limEl.style.visibility = lim > 0 ? 'visible' : 'hidden'; setText('lLimit', lim ? Math.round(UNITS.speed(L.speedLimit)) : '');
    document.getElementById('lSpeed').style.color = kmh > th.limit ? 'var(--race)' : '';
    setText('tKind', sn.vehicleType === 'car' ? carWord() : 'Camion');
    setText('tName', L.truck ? `${L.truck.brand || ''} ${L.truck.name || ''}`.trim() : '–');
    setText('tRest', Number.isFinite(L.restStop) ? (L.restStop > 0 ? dur(L.restStop) : 'maintenant') : '–');
    const gt = L.gameTime; setText('tClock', gt ? `${DAYS[Math.floor(gt/1440)%7]} ${String(Math.floor(gt/60)%24).padStart(2,'0')}:${String(gt%60).padStart(2,'0')}` : '–');
  } else {
    setText('lSpeed', '–'); document.getElementById('lLimit').style.visibility = 'hidden';
  }

  // Mission camion : uniquement ce que le jeu envoie (configuration « job » du SDK)
  const m = sn.mission && sn.mission.type === 'truck' ? sn.mission : null;
  const tj = m && m.tracked ? sn.job : null; // compteurs de l’appli, seulement pour cette même mission
  document.getElementById('jNone').classList.toggle('hidden', !!m);
  document.getElementById('jBox').classList.toggle('hidden', !m);
  setText('jNone', sn.connected ? 'Aucune livraison en cours dans le jeu.' : 'En attente du jeu.');
  const modeEl = document.getElementById('lMode');
  const race = !!(tj && tj.mode === 'course');
  modeEl.className = 'mode ' + (race ? 'race' : 'real'); setText('lMode', race ? 'COURSE' : 'RÉEL');
  if (m){
    setText('jRoute', `${m.from || '—'} → ${m.to || '—'}`);
    setText('jCargo', [m.cargo, m.mass ? (m.mass / 1000).toFixed(1).replace('.', ',') + ' t' : '', m.special ? 'convoi exceptionnel' : ''].filter(Boolean).join(' · ') || '—');
    setText('jLeft', m.remainingKm != null ? km(m.remainingKm) : '–');
    setText('jTime', m.remainingMin != null ? dur(m.remainingMin) : '–');
    const dl = m.deadline;
    setText('jDeadline', dl != null && dl > 0 ? `${DAYS[Math.floor(dl / 1440) % 7]} ${String(Math.floor(dl / 60) % 24).padStart(2, '0')}:${String(dl % 60).padStart(2, '0')}` : '–');
    setText('jDeadlineLbl', m.timeLeft == null ? 'Livraison avant' : m.timeLeft >= 0 ? `Livraison avant · reste ${dur(m.timeLeft)}` : `Livraison avant · ${dur(-m.timeLeft)} de retard`);
    document.getElementById('jDeadline').style.color = m.timeLeft != null && m.timeLeft < 0 ? 'var(--race)' : '';
    setText('jPlanned', m.planned ? km(m.planned) : '–');
    setText('jDmg', m.cargoDamage != null ? (m.cargoDamage * 100).toFixed(1).replace('.', ',') + ' %' : '–');
    setText('jIncome', m.income ? fmt(m.income) + ' €' : '–');
    renderTruckTrip(m);
    setText('jTrack', tj ? `Suivi par l’appli depuis le début de la mission : ${km(tj.loaded)} chargé · ${km(tj.empty)} à vide · ${tj.overPct.toFixed(1).replace('.', ',')} % au-dessus du seuil.`
      : 'L’appli n’a pas suivi cette mission depuis son début : seules les données du jeu sont affichées.');
    setText('jState', m.loaded ? 'CHARGÉ' : 'À VIDE');
    document.getElementById('jState').style.color = m.loaded ? 'var(--loaded)' : 'var(--empty)';
  } else setText('jState', '');

  renderTelTab(sn);
  renderBus(sn);
  renderFuel(L, sn.connected);
  renderWear(L, sn.connected, sn.vehicleType, m);

  const s = sn.session;
  setText('sLoaded', km(s.loaded)); setText('sEmpty', km(s.empty));
  document.getElementById('sBar').style.width = (s.loaded + s.empty) ? Math.round(s.loaded / (s.loaded + s.empty) * 100) + '%' : '0%';
  setText('dLoaded', km(sn.today.loaded)); setText('dEmpty', km(sn.today.empty));
}
let lastJobsSig = '';
