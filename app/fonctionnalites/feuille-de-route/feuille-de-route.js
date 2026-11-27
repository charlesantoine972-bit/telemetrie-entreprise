/* Feuille de route et Mes trajets.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

function renderHistory(sn){
  const t = sn.totals;
  const cards = [
    ['Km chargés', km(t.loaded), 'var(--loaded)'], ['Km à vide', km(t.empty), 'var(--empty)'],
    ['Km réels', km(t.real), 'var(--ok)'], ['Km en course', km(t.race), 'var(--race)'],
    ['Livraisons', fmt(t.deliveries), ''], ['Revenus', moneyByGame(t, 'revenue'), ''], ['Dépenses', moneyByGame(t, 'expenses'), ''],
    ['Carburant consommé', fmt(Math.round(t.fuelUsed)) + ' L', ''], ['Amendes', `${t.fines} (${fmt(t.finesAmount)} €)`, '']
  ];
  const box = document.getElementById('totals'); if (!box) return;
  box.style.gridTemplateColumns = 'repeat(auto-fill,minmax(170px,1fr))';
  document.getElementById('totals').innerHTML = cards.map(([l,v,c]) => `<div class="stat"><span class="muted">${l}</span><b style="color:${c||'inherit'}">${v}</b></div>`).join('');
}
function renderRoadmap(sn){
  const j = sn.job, live = sn.live || {}, totals = sn.totals;
  const routeConnection = document.getElementById('routeConnection');
  routeConnection.innerHTML = `<span class="d" style="background:${sn.connected?'var(--ok)':'var(--muted)'}"></span>${sn.connected?'Jeu connecté':'En attente du jeu'}`;
  const currency = (j && j.game === 'ats') || live.game === 'ats' ? '$' : '€';
  const money = n => Number.isFinite(n) ? fmt(Math.round(n)) + ' ' + currency : '—';
  const liters = n => Number.isFinite(n) ? Number(n).toLocaleString('fr-FR',{maximumFractionDigits:1}) + ' L' : '—';
  const dateTime = n => Number.isFinite(n) ? new Date(n).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}) : '—';
  const missionDescription = j && j.missionType === 'bus'
    ? (j.busMarket === 'tourist_job' ? 'Circuit touristique en autocar' : 'Mission en autocar')
    : j ? `${j.cargo || 'Marchandise inconnue'}${j.mass ? ' · ' + (j.mass/1000).toLocaleString('fr-FR',{maximumFractionDigits:1}) + ' t' : ''}` : '';
  const routeMission = document.getElementById('routeMission');
  routeMission.innerHTML = j ? `
    <div class="between" style="gap:12px;flex-wrap:wrap"><span class="lbl" style="color:var(--ok)">MISSION EN COURS · ${escM(j.game === 'ats' ? 'ATS' : 'ETS2')}</span><span class="muted">${dateTime(j.started)}</span></div>
    <div style="font-size:clamp(24px,4vw,36px);font-weight:700">${escM(j.from || '—')} <span style="color:var(--accent)">→</span> ${escM(j.to || '—')}</div>
    <div class="soft">${escM(missionDescription)}</div>
    <div class="kv">
      <div class="k"><span>Véhicule</span><span>${escM(j.truck || '—')}</span></div>
      ${j.missionType === 'bus' ? `<div class="k"><span>Prochain arrêt${j.stageCount ? ` · étape ${j.stageCurrent + 1}/${j.stageCount}` : ''}</span><span>${escM(j.nextStop || '—')}</span></div>` : ''}
      <div class="k"><span>Distance parcourue</span><span>${km(j.distance)}</span></div>
      <div class="k"><span>${j.missionType === 'bus' ? 'Distance GPS jusqu’au prochain arrêt' : 'Distance restante · GPS'}</span><span>${Number.isFinite(live.navDistance) && live.navDistance >= 0 ? km(live.navDistance/1000) : '—'}</span></div>
      <div class="k"><span>Revenu prévu</span><span>${money(j.income)}</span></div>
    </div>` : `<div><h2 style="margin:0 0 6px">Aucune mission en cours</h2><span class="soft">${sn.connected ? 'Les détails de ta prochaine mission apparaîtront ici dès que le jeu la transmettra.' : 'Lance ETS2 ou ATS avec le plugin pour suivre ta prochaine mission en direct.'}</span></div>`;
  const currentFuel = Number.isFinite(live.fuel) ? liters(live.fuel) : '—';
  const currentBalance = j && Number.isFinite(j.income) && Number.isFinite(j.expenses)
    ? money(j.income - j.expenses) : '—';
  document.getElementById('routeStats').innerHTML = [
    [j ? 'Carburant ajouté' : 'Carburant ajouté (total)', liters(j ? j.fuelAdded : totals.fuelAdded)],
    [j ? 'Carburant consommé' : 'Carburant consommé (total)', liters(j ? j.fuelUsed : totals.fuelUsed)],
    ['Dans le réservoir', currentFuel],
    [j ? 'Dépenses de la mission' : 'Dépenses (total)', j ? money(j.expenses) : moneyByGame(totals, 'expenses')],
    ['Solde prévu hors carburant', currentBalance],
    ...(j ? [['Dépenses totales (tous trajets)', moneyByGame(totals, 'expenses')]] : [])
  ].map(([label,value]) => `<div class="stat"><span class="muted">${label}</span><b>${value}</b></div>`).join('');
  document.getElementById('routeExpenseTotal').textContent = money(j ? j.expenses : 0);
  const expenses = j && Array.isArray(j.expenseItems) ? j.expenseItems : [];
  document.getElementById('routeExpenses').innerHTML = expenses.length ? expenses.slice().reverse().map(e =>
    `<div class="between" style="gap:12px;padding:8px 0;border-top:1px solid var(--line)"><span>${escM(e.type)} · ${dateTime(e.at)}</span><b>${money(e.amount)}</b></div>`
  ).join('') : '<span class="soft">Aucune dépense reçue pour cette mission.</span>';
  const fuelStops = j && Array.isArray(j.fuelStops) ? j.fuelStops : [];
  document.getElementById('routeFuelStops').innerHTML = fuelStops.length ? fuelStops.slice().reverse().map(stop =>
    `<div class="between" style="gap:12px;padding:8px 0;border-top:1px solid var(--line)"><span>Plein détecté · ${dateTime(stop.at)}</span><b>${liters(stop.liters)}</b></div>`
  ).join('') : '<span class="soft">Aucun plein détecté pour cette mission.</span>';
  renderRouteHistory(Array.isArray(sn.jobs) ? sn.jobs : []);
}
// ---- Feuille de route : trajets récents séparés camion / car, avec le détail du parcours
let routeTab = 'truck', routeSig = '';
const routeOpen = new Set();
function routeStatus(entry){
  const st = entry.status || '';
  if (st === 'annulée' || (entry.abandoned && st !== 'interrompue')) return { label: 'Abandonné', color: 'var(--race)', cut: true };
  if (st === 'interrompue') return { label: 'Interrompu', color: 'var(--warn)', cut: true, note: 'Une autre mission a été prise avant la fin.' };
  if (st === 'livrée') return { label: entry.missionType === 'bus' ? 'Terminé' : 'Livré', color: 'var(--ok)', cut: false };
  return { label: 'Terminé', color: 'var(--ok)', cut: false };
}
function routeTimeline(entry, stat){
  const hm = n => Number.isFinite(n) ? new Date(n).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '';
  const isBus = entry.missionType === 'bus';
  let stops = Array.isArray(entry.stops) && entry.stops.length ? entry.stops.slice() : null;
  if (!stops) { // ancienne mission : seuls le départ et la destination sont connus
    stops = [{ kind: 'départ', name: entry.from, company: entry.fromCompany, at: entry.started, km: 0 }];
    stops.push({ kind: stat.cut ? 'abandon' : 'arrivée', name: stat.cut && isBus ? entry.nextStop : entry.to, company: entry.toCompany, at: entry.ended, km: entry.distance });
  }
  const items = [];
  stops.forEach((p, i) => {
    const prev = stops[i - 1];
    const leg = prev && Number.isFinite(p.km) && Number.isFinite(prev.km) ? Math.max(0, p.km - prev.km) : null;
    const legTxt = leg != null ? `<div class="seg-km">+ ${km(leg)}${p.at && prev.at ? ' · ' + dur((p.at - prev.at) / 60000) : ''} depuis ${i === 1 ? 'le départ' : 'l’arrêt précédent'}</div>` : '';
    const where = `${escM(p.name || '—')}${p.company ? ` <span class="muted">· ${escM(p.company)}</span>` : ''}`;
    if (p.kind === 'départ') items.push(`<li><span class="pt"></span><b>${where}</b><div class="muted" style="font-size:12px">Départ ${hm(p.at)}</div></li>`);
    else if (p.kind === 'arrêt') items.push(`<li><span class="pt"></span><b>${where}</b><div class="muted" style="font-size:12px">Arrêt desservi ${hm(p.at)} · ${km(p.km)} au compteur de la mission</div>${legTxt}</li>`);
    else if (p.kind === 'arrivée') items.push(`<li class="end"><span class="pt"></span><b>${where}</b><div style="font-size:12px;color:var(--ok);font-weight:600">${isBus ? 'Terminus atteint' : 'Livré'} ${hm(p.at)} · ${km(p.km)} parcourus</div>${legTxt}</li>`);
    else if (p.kind === 'abandon') {
      const planned = !isBus && entry.planned ? ` sur ${km(entry.planned)} prévus` : '';
      items.push(`<li class="cut"><span class="pt"></span><b style="color:var(--race)">${stat.label} ici</b><div class="muted" style="font-size:12px">${hm(p.at)} · après ${km(p.km)}${planned}${p.name ? `, en route vers ${escM(p.name)}` : ''}</div>${legTxt}${stat.note ? `<div class="muted" style="font-size:12px">${stat.note}</div>` : ''}</li>`);
      if (isBus) {
        const left = Number.isFinite(entry.stageCount) && Number.isFinite(entry.stageCurrent) ? entry.stageCount - entry.stageCurrent : 0;
        if (p.name && p.name !== entry.to) items.push(`<li class="todo"><span class="pt"></span>${escM(p.name)}<div style="font-size:12px">Arrêt non desservi</div></li>`);
        if (left > 2) items.push(`<li class="todo"><span class="pt"></span><span style="font-size:12px">+ ${left - 2} autre${left - 2 > 1 ? 's' : ''} arrêt${left - 2 > 1 ? 's' : ''} non desservi${left - 2 > 1 ? 's' : ''}</span></li>`);
        if (entry.to) items.push(`<li class="todo"><span class="pt"></span>${escM(entry.to)}<div style="font-size:12px">Terminus non atteint</div></li>`);
      } else if (entry.to) items.push(`<li class="todo"><span class="pt"></span>${escM(entry.to)}${entry.toCompany ? ` · ${escM(entry.toCompany)}` : ''}<div style="font-size:12px">Non livré</div></li>`);
    }
  });
  return `<ol class="rt-tl">${items.join('')}</ol>`;
}
function renderRouteHistory(all){
  const isBus = e => e.missionType === 'bus';
  const truckJobs = all.filter(e => !isBus(e)), busJobs = all.filter(isBus);
  document.getElementById('routeCountTruck').textContent = truckJobs.length;
  document.getElementById('routeCountBus').textContent = busJobs.length;
  const cAll = document.getElementById('routeCountAll'); if (cAll) cAll.textContent = all.length;
  const list = (routeTab === 'all' ? all : routeTab === 'bus' ? busJobs : truckJobs).slice(0, 20);
  const sig = routeTab + ':' + all.length + ':' + (all[0] ? all[0].ended : '');
  if (sig === routeSig) return; routeSig = sig;
  const box = document.getElementById('routeHistory');
  if (!list.length) { box.innerHTML = `<span class="soft" style="display:block;padding:12px 0;border-top:1px solid var(--line)">${routeTab === 'all' ? 'Aucun trajet terminé pour l’instant.' : routeTab === 'bus' ? 'Aucun service en car terminé pour l’instant.' : 'Aucune livraison en camion terminée pour l’instant.'}</span>`; return; }
  box.innerHTML = list.map(entry => routeItemHtml(entry, routeOpen.has(String(entry.ended)))).join('');
}
// Un trajet terminé, repliable : en-tête (date, parcours, km, état, dépenses, revenu, solde) puis le déroulé
// (routeTimeline) et le bilan. Utilisé par l'historique (onglet Trajets) et par le Calendrier.
function routeItemHtml(entry, open){
    const isBus = e => e.missionType === 'bus';
    const dateTime = n => Number.isFinite(n) ? new Date(n).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}) : '—';
    const liters = n => Number.isFinite(n) ? Number(n).toLocaleString('fr-FR',{maximumFractionDigits:1}) + ' L' : '—';
    const unit = entry.game === 'ats' ? '$' : '€';
    const money = v => Number.isFinite(v) ? fmt(Math.round(v)) + ' ' + unit : '—';
    const stat = routeStatus(entry);
    const expenses = Number.isFinite(entry.expenses) ? entry.expenses : null;
    const revenue = Number.isFinite(entry.revenue) ? entry.revenue : (stat.cut ? 0 : null);
    const balance = expenses !== null && revenue !== null ? revenue - expenses : null;
    const bus = isBus(entry);
    const title = bus && entry.lineNumber ? `<span class="muted">Ligne ${escM(entry.lineNumber)} · </span>` : '';
    const sub = bus ? (entry.stageCount ? `${entry.stageCount} étape${entry.stageCount > 1 ? 's' : ''}` : 'Service car') : [entry.cargo || 'Marchandise', entry.mass ? (entry.mass/1000).toLocaleString('fr-FR',{maximumFractionDigits:1}) + ' t' : ''].filter(Boolean).join(' · ');
    const items = Array.isArray(entry.expenseItems) ? entry.expenseItems : [];
    const expenseRows = items.length
      ? items.slice().reverse().map(it => `<div class="between" style="gap:12px;padding:6px 0;border-top:1px solid var(--line)"><span>${escM(it.type || 'Frais')} · ${dateTime(it.at)}</span><b>${money(it.amount)}</b></div>`).join('')
      : `<div class="soft" style="padding:6px 0;border-top:1px solid var(--line)">${expenses ? 'Détail non disponible pour cette ancienne mission.' : 'Aucun frais reçu.'}</div>`;
    const key = String(entry.ended);
    const tonnes = Number.isFinite(entry.mass) && entry.mass > 0 ? (entry.mass/1000).toLocaleString('fr-FR',{maximumFractionDigits:1}) + ' t' : '';
    const cargoRow = bus ? '' : `<div class="k"><span>Cargaison</span><span>${escM(entry.cargo || '—')}${tonnes ? ' · ' + tonnes : ''}${entry.special === true ? ' <span class="muted">(⚑ convoi exceptionnel)</span>' : ''}</span></div>`;
    return `<details class="rt-item" data-key="${key}"${open ? ' open' : ''}>
      <summary><span class="rt-arrow" aria-hidden="true">▸</span><div class="rt-row">
        <span class="muted">${dateTime(entry.ended)}</span>
        <span style="min-width:0"><b>${title}${escM(entry.from || '—')} → ${escM(entry.to || '—')}</b><div class="muted" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escM(sub)}</div></span>
        <span class="rt-num">${km(entry.distance)}</span>
        <span class="rt-badge" style="color:${stat.color}"><span class="d" style="background:${stat.color}"></span>${stat.label}</span>
        <span class="rt-num">${money(expenses)}</span>
        <span class="rt-num" style="font-weight:700">${money(revenue)}</span>
        <span class="rt-num" style="color:${balance == null ? 'inherit' : balance < 0 ? 'var(--race)' : 'var(--ok)'}">${money(balance)}</span>
      </div></summary>
      <div class="rt-detail">
        <div><div class="lbl" style="margin-bottom:10px">${bus ? 'PARCOURS ET ARRÊTS' : 'TRAJET'}</div>${routeTimeline(entry, stat)}</div>
        <div>
          <div class="lbl" style="margin-bottom:8px">BILAN</div>
          <div class="rt-kv">
            ${cargoRow}
            <div class="k"><span>Véhicule</span><span>${escM(entry.truck || '—')}</span></div>
            <div class="k"><span>Mode</span><span>${entry.mode === 'course' ? 'Course' : 'Réel'}${Number.isFinite(entry.overPct) && entry.overPct > 0 ? ` <span class="muted">(${Math.round(entry.overPct)} % du trajet au-dessus du seuil)</span>` : ''}</span></div>
            <div class="k"><span>Km parcourus</span><span>${km(entry.distance)} <span class="muted">(${bus ? 'en service' : 'chargé'} ${km(entry.loaded)} · à vide ${km(entry.empty)})</span></span></div>
            ${!bus && entry.planned ? `<div class="k"><span>Distance prévue</span><span>${km(entry.planned)}</span></div>` : ''}
            <div class="k"><span>Carburant</span><span>${liters(entry.fuelUsed)} consommés · ${liters(entry.fuelAdded)} ajoutés</span></div>
            ${Number.isFinite(entry.damage) ? `<div class="k"><span>Dégâts</span><span>${(entry.damage * 100).toFixed(1).replace('.', ',')} %</span></div>` : ''}
            <div class="k"><span>Revenu</span><span>${money(revenue)}${stat.cut ? ' <span class="muted">(mission non terminée)</span>' : ''}</span></div>
            <div class="k"><span>Dépenses</span><span>${money(expenses)}</span></div>
            <div class="k"><span>Solde hors carburant</span><b>${money(balance)}</b></div>
          </div>
          <div class="muted" style="font-size:12px;margin:12px 0 2px">Dépenses du trajet${stat.cut ? ' (comptées même si abandonné)' : ''}</div>
          ${expenseRows}
        </div>
      </div>
    </details>`;
}
// Montants par jeu : € pour ETS2, $ pour ATS (jamais additionnés). Anciennes données : total en €.
function moneyByGame(t, key){
  const m = t.money || {}, parts = [];
  if (m.ets2 && m.ets2[key]) parts.push(fmt(Math.round(m.ets2[key])) + ' €');
  if (m.ats && m.ats[key]) parts.push(fmt(Math.round(m.ats[key])) + ' $');
  if (!parts.length) return fmt(Math.round(t[key] || 0)) + ' €';
  return parts.join(' · ');
}
