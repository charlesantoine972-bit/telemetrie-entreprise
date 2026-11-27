/* Truck & Coach Tools : éditeur de sauvegardes et cartes d’outils (camions, remorques, profil, Coach).
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

/* ---------- Atelier : éditeur de sauvegardes ---------- */
const AT_PAGES = ['at-profil', 'at-coach', 'at-remorque', 'at-camion'];
function atFloatShow(on){ const f = document.getElementById('atFloat'); on = on && AT_PAGES.includes(state.view) && f.innerHTML.trim() !== ''; f.classList.toggle('hidden', !on); document.getElementById('mainContent').classList.toggle('with-atfloat', on); }
const atSel = { profiles: [], profileId: null, slots: [], slot: null, summary: null, info: null, msg: '' };
const nf = n => Number(n || 0).toLocaleString('fr-FR');
async function atEnsure(){
  if (!HAS_APP) return false;
  if (!atSel.info) { const r = await window.tel.atelier.editorInfo(); atSel.info = r.ok ? r.data : { available: false, truckSkills: [], coachSkills: [] }; }
  const r = await window.tel.atelier.profiles(); atSel.profiles = r.ok ? r.data : [];
  atSel.profilesError = r.ok ? '' : (r.error || 'Lecture des profils impossible.');
  if (!atSel.profileId && atSel.profiles.length) atSel.profileId = atSel.profiles[0].id;
  if (atSel.profileId && !atSel.slots.length) await atLoadSlots();
  return true;
}
async function atLoadSlots(){
  const r = await window.tel.atelier.slots(atSel.profileId);
  atSel.slots = r.ok ? r.data : []; atSel.slot = atSel.slots.length ? atSel.slots[0].slot : null; atSel.summary = null;
  atSel.slotsError = r.ok ? '' : (r.error || 'Lecture des sauvegardes impossible.');
}
async function atLoadSummary(){
  if (!atSel.profileId || !atSel.slot) return;
  atSel.msg = 'Lecture de la sauvegarde…'; renderAtPage(state.view);
  const r = await window.tel.atelier.summary(atSel.profileId, atSel.slot);
  atSel.summary = r.ok ? r.data : null; atSel.msg = r.ok ? '' : r.error;
  renderAtPage(state.view);
}
function atSelHtml(){
  const p = atSel.profiles.find(x => x.id === atSel.profileId);
  const tip = 'Après une modification, charge cette sauvegarde dans le jeu.' + (p && p.cloud ? ' Profil Steam Cloud : si Steam remet l\'ancienne version, coupe Steam Cloud pour ce jeu le temps de la modification.' : '');
  return `<span class="atf-ico" aria-hidden="true">${tIcon('truck', 20)}</span>
    <label class="atf-f"><span>Profil</span><select id="atProf">${atSel.profiles.map(x => `<option value="${escM(x.id)}" ${x.id === atSel.profileId ? 'selected' : ''}>${escM(x.name)} (${x.game === 'ets2' ? 'ETS2' : 'ATS'}${x.cloud ? ', Steam Cloud' : ''})</option>`).join('')}</select></label>
    <label class="atf-f wide"><span>Sauvegarde</span><select id="atSlot">${atSel.slots.map(x => `<option value="${escM(x.slot)}" ${x.slot === atSel.slot ? 'selected' : ''}>${escM(x.label)} · ${fmtDate(x.modified)}</option>`).join('')}</select></label>
    <button class="btn primary" id="atLoad">${atSel.summary ? 'Relire' : 'Charger'}</button>
    <span class="atf-help" tabindex="0" role="note" title="${escM(tip)}" aria-label="${escM(tip)}">?</span>`;
}
function skillSel(id, skill, val){
  if (skill.adr) {
    const n = [0, 1, 3, 7, 15, 31, 63].indexOf(val); const cur = n < 0 ? Math.round(Math.log2((val || 0) + 1)) : n;
    return `<label class="field">${escM(skill.label)}<select id="${id}" data-adr="1">${[0,1,2,3,4,5,6].map(i => `<option value="${(1 << i) - 1}" ${i === cur ? 'selected' : ''}>${i} classe${i > 1 ? 's' : ''} sur 6</option>`).join('')}</select></label>`;
  }
  return `<label class="field">${escM(skill.label)}<select id="${id}">${Array.from({ length: skill.max + 1 }, (_, i) => `<option value="${i}" ${i === val ? 'selected' : ''}>Niveau ${i} / ${skill.max}</option>`).join('')}</select></label>`;
}
// Barème officiel camion (début de chaque palier) ; car : seuls les niveaux 5 et 10 sont connus
const TRUCK_TIERS = [[0,0],[5,3400],[10,11900],[15,25400],[20,44200],[25,70200],[30,103700],[40,176700],[50,249700],[100,575700]];
function lvlTruck(xp){ let t = TRUCK_TIERS[0]; for (const x of TRUCK_TIERS) if (xp >= x[1]) t = x; return t[0] >= 100 ? '100 ou plus' : t[0] + ' ou plus'; }
function lvlCoach(xp){ return xp < 3300 ? 'entre 0 et 4' : xp < 11100 ? 'entre 5 et 9' : xp < 75000 ? '10 ou plus' : '25 ou plus'; }
const BIL = { ok: ['✓', 'var(--ok)'], warn: ['!', 'var(--warn)'], bad: ['✕', 'var(--race)'], info: ['i', 'var(--empty)'] };
const AT_PAGE_NAMES = { 'at-remorque': 'Remorques', 'at-camion': 'Camions', 'at-profil': 'Profil' };
function bilanHtml(b){
  if (!b) return '';
  const ico = (l, sz = 22) => `<span aria-hidden="true" style="width:${sz}px;height:${sz}px;border-radius:50%;background:${BIL[l][1]};color:var(--bg);display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:${sz > 20 ? 13 : 11}px;flex:none">${BIL[l][0]}</span>`;
  const verdict = b.level === 'bad' ? 'À corriger : cette sauvegarde a un problème' : b.level === 'warn' ? 'Quelques points à surveiller' : 'Rien à toucher : tout est en ordre';
  const loans = (b.loans || []).map(l => `<li>${nf(l.amount)} € restants${l.original ? ' sur ' + nf(l.original) + ' €' : ''}${l.months != null ? ' · ' + l.months + ' mois restant(s)' : ''}${l.rate != null ? ' · taux ' + (l.rate * 100).toFixed(1).replace('.', ',') + ' %' : ''}</li>`).join('');
  return `<div class="panel" style="display:flex;flex-direction:column;gap:14px;margin-bottom:16px" role="region" aria-label="Bilan du profil">
    <div class="between" style="align-items:center;gap:12px;flex-wrap:wrap"><h2 style="margin:0">Bilan du profil</h2><span class="muted" style="font-size:12px">Lecture seule · rien n'est modifié</span></div>
    <div style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px">${ico(b.level)}${verdict}</div>
    ${b.money != null ? `<div class="stats" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">${statBox('Compte en banque', nf(b.money) + ' €')}${statBox('Reste des prêts', nf(b.debt) + ' €')}${statBox('Garages', b.garages)}${statBox('Camions', b.trucks)}${statBox('Remorques', b.trailers)}${statBox('Chauffeurs', b.drivers)}${statBox('Usure max.', Math.round((b.worstWear || 0) * 100) + ' %')}${statBox('Jours en jeu', nf(b.gameDays))}</div>` : ''}
    ${loans ? `<details><summary class="soft" style="cursor:pointer;font-weight:600">Détail des prêts (${b.loans.length})</summary><ul class="soft" style="margin:8px 0 0;font-size:13px;line-height:1.8">${loans}</ul></details>` : ''}
    ${b.alerts.length ? `<ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px">${b.alerts.map(a => `<li style="display:flex;gap:10px;align-items:center;font-size:14px">${ico(a.level, 18)}<span class="grow">${escM(a.text)}</span>${a.page ? `<button class="btn" style="height:30px;font-size:12px" data-gopage="${a.page}">Ouvrir ${AT_PAGE_NAMES[a.page]}</button>` : ''}</li>`).join('')}</ul>` : ''}
  </div>`;
}
function statBox(l, v){ return `<div class="stat"><span class="muted">${l}</span><b>${v}</b></div>`; }
function renderAtPage(view){
  if (!AT_PAGES.includes(view)) return;
  document.querySelectorAll('.atbody').forEach(b => { if (b.dataset.page !== view) b.innerHTML = ''; });
  const sec = document.getElementById('v-' + view); const sel = document.getElementById('atFloat'), body = sec.querySelector('.atbody');
  if (!HAS_APP) { sel.innerHTML = ''; body.innerHTML = '<div class="empty">Disponible dans l\'appli installée.</div>'; return; }
  if (atSel.info && !atSel.info.available) { sel.innerHTML = ''; body.innerHTML = '<div class="empty">L\'outil de lecture des sauvegardes est introuvable. Réinstalle l\'appli ou fais la dernière mise à jour.</div>'; return; }
  if (!atSel.profiles.length) { sel.innerHTML = ''; body.innerHTML = '<div class="empty">Aucun profil trouvé. Lance le jeu une fois et crée un profil.</div>'; return; }
  sel.innerHTML = atSelHtml(); atFloatShow(true);
  sel.querySelector('#atProf').onchange = async (e) => { atSel.profileId = e.target.value; atSel.slots = []; await atLoadSlots(); renderAtPage(state.view); };
  sel.querySelector('#atSlot').onchange = (e) => { atSel.slot = e.target.value; atSel.summary = null; renderAtPage(state.view); };
  sel.querySelector('#atLoad').onclick = atLoadSummary;
  const S = atSel.summary;
  if (!S) { body.innerHTML = `<div class="empty">${atSel.msg ? escM(atSel.msg) : (atSel.slots.length ? 'Choisis la sauvegarde à modifier, puis clique sur « Charger ».' : 'Aucune sauvegarde dans ce profil.')}</div>`; return; }
  const apply = '<div class="row" style="margin-top:16px;flex-wrap:wrap"><button class="btn primary" id="atApply" style="height:46px;padding:0 22px">Appliquer à la sauvegarde</button><span class="muted" id="atApplyMsg" style="font-size:13px">' + escM(atSel.msg || '') + '</span></div>';
  let html = '';
  if (view === 'at-profil') {
    html = bilanHtml(S.bilan) + `<div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:16px">${statBox('Argent', nf(S.money) + ' €')}${statBox('XP camion', nf(S.xp))}${statBox('Ville du QG', escM(S.hqCity || '–'))}${statBox('Véhicules', S.vehicles + ' · ' + S.trailers + ' remorque(s)')}</div>
      <div class="panel" style="display:flex;flex-direction:column;gap:14px">
        <div class="row" style="gap:14px;flex-wrap:wrap;align-items:flex-end">
          <label class="field" style="flex:1;min-width:220px">Nom du profil<input id="eProfName" maxlength="30" value="${escM(S.profileName)}"></label>
          <label class="field" style="flex:1;min-width:220px">Nom de l'entreprise (en jeu)<input id="eCompName" maxlength="30" value="${escM(S.companyName)}"></label></div>
        <div class="muted" style="font-size:12px;margin-top:-6px">Le nouveau nom s'affiche dans le choix du profil du jeu. Le dossier du profil sur ton PC garde son ancien nom, c'est normal.</div>
        <div class="row" style="gap:14px;flex-wrap:wrap;align-items:flex-end"><label class="field" style="flex:1;min-width:220px">Argent (€)<input id="eMoney" type="number" min="0" step="1" value="${S.money}"></label>
          <button class="btn" data-add="eMoney" data-v="1000000">+1 M€</button><button class="btn" data-add="eMoney" data-v="10000000">+10 M€</button></div>
        <div class="row" style="gap:14px;flex-wrap:wrap;align-items:flex-end"><label class="field" style="flex:1;min-width:220px">Expérience camion (XP)<input id="eXp" type="number" min="0" step="1" value="${S.xp}"></label>
          <button class="btn" data-add="eXp" data-v="100000">+100 000 XP</button></div>
        <div class="row" style="gap:10px;flex-wrap:wrap;align-items:center"><span class="muted" style="font-size:13px">Atteindre directement :</span>
          <button class="btn" data-lvl="eXp" data-v="70200">Niveau 25 · 70 200 XP</button><button class="btn" data-lvl="eXp" data-v="150000">Niveau 36 · toutes les pièces</button></div>
        <div class="muted" style="font-size:12px">Niveau actuel estimé : <b>${lvlTruck(S.xp)}</b>. Les boutons de niveau n'enlèvent jamais d'XP.</div>
        <h2 style="margin:6px 0 0">Compétences camion</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">${atSel.info.truckSkills.map(k => skillSel('sk_' + k.key, k, S.skills[k.key])).join('')}</div>
        <div><button class="btn" id="skMax">Tout au maximum</button></div>
      </div>` + apply + (S.tools ? toolGrid('at-profil', S, 'Carte, garages et réglages') : '');
  } else if (view === 'at-coach') {
    if (S.busXp == null) html = '<div class="empty">Cette sauvegarde ne contient pas encore de carrière car. Installe le DLC Coaches et lance une première partie en mode Coach.</div>';
    else html = `<div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:16px">${statBox('XP car', nf(S.busXp))}${statBox('Cars possédés', S.buses)}${statBox('Arrêts découverts', S.busStopsDiscovered + ' / ' + S.busStops)}${statBox('XP totale', nf(S.xp + S.busXp))}</div>`
      + (S.tools ? vheroHtml('bus', (S.tools.buses || []).find(t => t.current)) + toolGrid('at-coach', S) + fleetTable('bus', S) : '') + msgRow();
  } else if (view === 'at-camion') {
    const T = S.tools; if (!T) { body.innerHTML = '<div class="empty">Lecture des véhicules impossible pour cette sauvegarde.</div>'; return; }
    html = vheroHtml('truck', T.trucks.find(t => t.current)) + toolGrid('at-camion', S) + fleetTable('truck', S) + msgRow();
  } else if (view === 'at-remorque') {
    const T = S.tools; if (!T) { body.innerHTML = '<div class="empty">Lecture des remorques impossible pour cette sauvegarde.</div>'; return; }
    html = vheroHtml('trailer', T.attached) + toolGrid('at-remorque', S) + fleetTable('trailer', S) + msgRow();
  }
  body.innerHTML = html;
  body.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => openTool(b.dataset.tool));
  body.querySelectorAll('[data-gopage]').forEach(b => b.onclick = () => go(b.dataset.gopage));
  body.querySelectorAll('[data-lvl]').forEach(b => b.onclick = () => { const i = document.getElementById(b.dataset.lvl); i.value = Math.max(Number(i.value) || 0, Number(b.dataset.v)); });
  body.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const i = document.getElementById(b.dataset.add); i.value = (Number(i.value) || 0) + Number(b.dataset.v); });
  const mx = (pfx, list) => list.forEach(k => { const el = document.getElementById(pfx + k.key); if (el) el.value = el.options[el.options.length - 1].value; });
  const skMax = document.getElementById('skMax'); if (skMax) skMax.onclick = () => mx('sk_', atSel.info.truckSkills);
  const ckMax = document.getElementById('ckMax'); if (ckMax) ckMax.onclick = () => mx('ck_', atSel.info.coachSkills);
  const ap = document.getElementById('atApply'); if (ap) ap.onclick = () => atApply(view);
}
async function atApply(view){
  const S = atSel.summary, e = {}, list = [];
  const num = id => { const el = document.getElementById(id); return el ? Number(el.value) : null; };
  const chk = id => { const el = document.getElementById(id); return !!(el && el.checked); };
  if (view === 'at-profil') {
    const pn = document.getElementById('eProfName').value.trim(), cn = document.getElementById('eCompName').value.trim();
    if (pn && pn !== S.profileName) { e.profileName = pn; list.push('Nom du profil : ' + S.profileName + ' → ' + pn); }
    if (cn && cn !== S.companyName) { e.companyName = cn; list.push('Entreprise : ' + S.companyName + ' → ' + cn); }
    if (num('eMoney') !== S.money) { e.money = num('eMoney'); list.push('Argent : ' + nf(S.money) + ' → ' + nf(e.money) + ' €'); }
    if (num('eXp') !== S.xp) { e.xp = num('eXp'); list.push('XP camion : ' + nf(S.xp) + ' → ' + nf(e.xp)); }
    const sk = {}; let ch = false; atSel.info.truckSkills.forEach(k => { const v = num('sk_' + k.key); sk[k.key] = v; if (v !== S.skills[k.key]) ch = true; });
    if (ch) { e.skills = sk; list.push('Compétences camion'); }
  }
  if (chk('eBusStops')) { e.discoverBusStops = true; list.push('Découvrir tous les arrêts de bus'); }
  if (chk('eCities')) { e.visitAllCities = true; list.push('Toutes les villes visitées'); }
  if (chk('eFuel')) { e.refuelAll = true; list.push('Plein de tous les véhicules'); }
  if (chk('eRepair')) { e.repairAll = true; list.push('Réparation complète'); }
  if (!list.length) { atSel.msg = 'Aucun changement à appliquer.'; renderAtPage(view); return; }
  const slotLabel = (atSel.slots.find(x => x.slot === atSel.slot) || {}).label || atSel.slot;
  const ok = await ask('Modifier la sauvegarde ?', `<b>${escM(slotLabel)}</b> du profil <b>${escM((atSel.profiles.find(x => x.id === atSel.profileId) || {}).name || '')}</b> :<ul style="margin:8px 0;padding-left:20px">${list.map(x => '<li>' + escM(x) + '</li>').join('')}</ul>Le jeu doit être fermé. Une copie de secours complète du profil est faite juste avant (restaurable dans « Sauvegardes »).`, 'Appliquer');
  if (!ok) return;
  atSel.msg = 'Modification en cours…'; renderAtPage(view);
  const r = await window.tel.atelier.apply(atSel.profileId, atSel.slot, e);
  if (!r.ok) { atSel.msg = r.error; announce('Erreur : ' + r.error); renderAtPage(view); return; }
  if (e.profileName) { const pr = await window.tel.atelier.profiles(); if (pr.ok) atSel.profiles = pr.data; }
  await atLoadSummary();
  atSel.msg = 'Fait ✓ ' + r.data.report.join(', ') + '. Charge cette sauvegarde dans le jeu.'; announce(atSel.msg);
  renderAtPage(view);
}
/* ---------- Truck Tools : cartes d'outils (camions, remorques, profil) ---------- */
const TI = { // icônes (trait), dessinées pour l'appli
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M3 21h13"/><path d="M6 9h7"/><path d="M15 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  gauge: '<path d="M12 14l4-5"/><circle cx="12" cy="14" r="1.6"/><path d="M4.5 18a9 9 0 1 1 15 0"/>',
  plate: '<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M6.5 12h3M12 12h5.5"/><circle cx="5" cy="9.3" r=".4"/><circle cx="19" cy="9.3" r=".4"/>',
  swap: '<path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>',
  pin: '<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.3"/>',
  weight: '<path d="M6.5 8h11l2.5 12H4z"/><circle cx="12" cy="5.5" r="2.5"/><path d="M9.5 14h5"/>',
  scale: '<path d="M12 4v16M6 20h12"/><path d="M5 8h14"/><path d="m5 8-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/><circle cx="12" cy="16" r="1.3"/>',
  city: '<path d="M3 21h18"/><path d="M5 21V9l5-3v15"/><path d="M10 21V4l9 4v13"/><path d="M13 10h3M13 13h3M13 16h3"/>',
  store: '<path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6z"/><path d="M9 20v-5h6v5"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.3"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
  garage: '<path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-8h10v8"/><path d="M7 16h10"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  truck: '<path d="M2 16V7a1 1 0 0 1 1-1h10v10"/><path d="M13 9h4.5l3.5 4v3h-2"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/><path d="M8.3 17.5h6.4M2 16h2.7"/>',
  trailer: '<rect x="2" y="5" width="15" height="10" rx="1"/><path d="M17 12h5"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="11" cy="17.5" r="1.8"/>',
  engine: '<rect x="5" y="8" width="12" height="9" rx="1"/><path d="M9 8V5h4v3M17 11h2l2-2v8l-2-2h-2M5 12H3M3 10v4"/>',
  badge: '<circle cx="12" cy="12" r="7"/><path d="M9 12l2 2 4-4"/><path d="M4 4l16 16"/>',
  bus: '<rect x="2" y="5" width="20" height="12" rx="2.5"/><path d="M2 11h20M7 5v6M12 5v6M17 5v6"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
  convoy: '<path d="M1.5 15V9h7v6"/><path d="M8.5 11h2l1.5 2v2"/><path d="M13 15V9h7v6"/><path d="M20 11h1.5l1 2v2"/><circle cx="4" cy="16.5" r="1.2"/><circle cx="9.5" cy="16.5" r="1.2"/><circle cx="15.5" cy="16.5" r="1.2"/><circle cx="21" cy="16.5" r="1.2"/>'
};
const tIcon = (k, sz = 24) => `<svg aria-hidden="true" focusable="false" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${TI[k] || ''}</svg>`;
const pct = v => Math.round((v || 0) * 100) + ' %';
const vName = (v, kind) => v ? ((v.brand && v.model && v.model !== v.brand ? v.brand + ' ' + v.model : v.brand || v.model) || (kind === 'trailer' ? 'Remorque' : 'Camion')) : '–';
const cityName = c => c ? c.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase()) : '–';
function gaugeHtml(label, v, kind){
  const w = Math.max(0, Math.min(100, Math.round((v || 0) * 100)));
  const col = kind === 'wear' ? (w >= 50 ? 'var(--race)' : w >= 20 ? 'var(--warn)' : 'var(--ok)') : (w < 15 ? 'var(--race)' : w < 35 ? 'var(--warn)' : 'var(--ok)');
  return `<div class="tgauge"><div class="between"><span class="muted">${label}</span><b>${Math.round((v || 0) * 100)} %</b></div><div class="tbar" role="meter" aria-label="${label}" aria-valuenow="${w}" aria-valuemin="0" aria-valuemax="100"><span style="width:${w}%;background:${col}"></span></div></div>`;
}
function vheroHtml(kind, v){
  const isT = kind !== 'trailer', ico = kind === 'bus' ? 'bus' : isT ? 'truck' : 'trailer', LB = kind === 'bus' ? 'TON CAR' : isT ? 'TON CAMION' : 'REMORQUE ATTELÉE';
  if (!v) return `<div class="vhero panel"><div class="vh-art">${tIcon(ico, 54)}</div><div class="vh-main"><div class="lbl" style="color:var(--accent)">${LB}</div><h2 style="margin:4px 0">${kind === 'bus' ? 'Tu ne conduis pas un de tes cars' : isT ? 'Aucun camion attribué' : 'Aucune remorque attelée'}</h2><div class="muted" style="font-size:13px">${kind === 'bus' ? 'Les outils « Mon car » agissent sur le car que tu conduis. « Tous mes cars » marche toujours.' : isT ? 'Attribue-toi un camion en jeu, ou choisis-en un avec « Changer de camion ».' : 'Prends une mission ou attelle une de tes remorques pour utiliser ces outils.'}</div></div></div>`;
  const meta = isT ? `Garage : ${escM(cityName(v.garage))}` : `${v.parts > 1 ? v.parts + ' remorques (attelage multiple)' : 'Remorque simple'}${v.owned ? ' · à toi' : ' · remorque de mission'}`;
  const gauges = isT
    ? gaugeHtml('Carburant', v.fuel, 'fuel') + gaugeHtml('Usure max.', v.wear, 'wear') + `<div class="tgauge"><span class="muted">Compteur</span><b>${nf(v.odometer)} km</b></div>`
    : `<div class="tgauge"><span class="muted">Cargaison</span><b>${v.cargoMass.map(m => nf(m) + ' kg').join(' + ')}</b></div>` + (v.bodyMass != null ? `<div class="tgauge"><span class="muted">Poids à vide</span><b>${nf((v.bodyMass || 0) + (v.chassisMass || 0))} kg</b></div>` : '') + `<div class="tgauge"><span class="muted">Zones</span><b>${v.restricted ? 'Limitée à certains pays' : 'Partout'}</b></div>`;
  return `<div class="vhero panel"><div class="vh-art">${tIcon(ico, 54)}</div>
    <div class="vh-main"><div class="lbl" style="color:var(--accent)">${LB}</div><h2 style="margin:4px 0">${escM(vName(v, kind))}</h2><div class="muted" style="font-size:13px">${meta}</div>${v.plate ? `<span class="tplate">${escM(v.plate)}</span>` : ''}</div>
    <div class="vh-gauges">${gauges}</div></div>`;
}
function toolCard(t, S){
  const off = t.off ? t.off(S) : '';
  return `<article class="tcard${off ? ' off' : ''}"><div class="tart${window.ILLU && ILLU[t.id] ? ' il-on' : ''}">${(window.ILLU && ILLU[t.id]) || tIcon(t.icon, 46)}</div>
    <div class="tcard-b"><h3>${escM(t.title)}</h3><p>${escM(t.desc)}</p>${t.meta ? `<div class="tmeta">${t.meta(S)}</div>` : ''}</div>
    <div class="tcard-f">${off ? `<span class="muted" style="font-size:12px">${escM(off)}</span>` : `<button class="btn primary" data-tool="${t.id}">Ouvrir</button>`}</div></article>`;
}
const radio = (name, opts, cur) => `<div class="tradio" role="radiogroup">${opts.map(([v, l, d]) => `<label><input type="radio" name="${name}" value="${v}" ${v === cur ? 'checked' : ''}><span><b>${l}</b>${d ? `<small>${d}</small>` : ''}</span></label>`).join('')}</div>`;
const rval = name => { const el = document.querySelector(`#modalBody input[name="${name}"]:checked`); return el ? el.value : null; };
const mv = id => { const el = document.querySelector('#modalBody #' + id); return el ? (el.type === 'checkbox' ? el.checked : el.value) : null; };
const BACKUP_NOTE = '<p class="muted" style="margin:10px 0 0;font-size:12px">Le jeu doit être fermé. Une copie de secours du profil est faite juste avant (restaurable dans « Sauvegardes »).</p>';
const TOOLS = {
  /* ----- Camions ----- */
  truckRepair: { page: 'at-camion', icon: 'wrench', title: 'Réparer', desc: 'Remet à neuf moteur, boîte, cabine, châssis et roues.',
    meta: S => { const c = S.tools.trucks.find(t => t.current); return `Ton camion : <b>${c ? pct(c.wear) : '–'}</b> d'usure`; },
    form: () => radio('tgt', [['current', 'Mon camion', 'Celui que tu conduis'], ['all', 'Toute la flotte', 'Tous les camions de ton entreprise']], 'current'),
    collect: () => ({ e: { truckRepair: rval('tgt') }, list: [rval('tgt') === 'all' ? 'Réparer tous les camions' : 'Réparer mon camion'] }) },
  truckFuel: { page: 'at-camion', icon: 'fuel', title: 'Carburant', desc: 'Fais le plein, ou passe à un réservoir géant pour rouler presque sans fin.',
    meta: S => { const c = S.tools.trucks.find(t => t.current); return `Réservoir : <b>${c ? pct(c.fuel) : '–'}</b>`; },
    form: () => radio('tgt', [['current', 'Mon camion'], ['all', 'Toute la flotte']], 'current') +
      `<label class="field" style="margin-top:12px"><span>Niveau : <b id="fuelOut">100 %</b></span><input type="range" id="fuelLvl" min="0" max="1000" step="10" value="100" oninput="document.getElementById('fuelOut').textContent=this.value+' %'+(this.value>100?' (réservoir géant)':'')"></label>
      <div class="muted" style="font-size:12px">100 % = plein. Au-delà (jusqu'à 1 000 %), le réservoir contient plus que sa capacité : le carburant dure beaucoup plus longtemps.</div>`,
    collect: () => { const l = Number(mv('fuelLvl')) / 100; return { e: { truckFuel: { target: rval('tgt'), level: l } }, list: [`Carburant à ${Math.round(l * 100)} % (${rval('tgt') === 'all' ? 'toute la flotte' : 'mon camion'})`] }; } },
  truckKm: { page: 'at-camion', icon: 'gauge', title: 'Kilométrage', desc: 'Change le compteur kilométrique de ton camion.',
    meta: S => { const c = S.tools.trucks.find(t => t.current); return c ? `Compteur : <b>${nf(c.odometer)} km</b>` : ''; }, off: S => S.tools.trucks.some(t => t.current) ? '' : 'Aucun camion attribué',
    form: S => `<label class="field">Nouveau kilométrage (km)<input id="kmV" type="number" min="0" max="9999999" step="1" value="${(S.tools.trucks.find(t => t.current) || {}).odometer || 0}"></label><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn" onclick="document.getElementById('kmV').value=0">Neuf (0 km)</button></div>`,
    collect: () => ({ e: { truckKm: Number(mv('kmV')) }, list: ['Compteur à ' + nf(mv('kmV')) + ' km'] }) },
  truckPlate: { page: 'at-camion', icon: 'plate', title: 'Plaque d\'immatriculation', desc: 'Ton propre texte et sa couleur, sur ton camion.',
    meta: S => { const c = S.tools.trucks.find(t => t.current); return c && c.plate ? `<span class="tplate sm">${escM(c.plate)}</span>` : ''; }, off: S => S.tools.trucks.some(t => t.current) ? '' : 'Aucun camion attribué',
    form: S => plateForm((S.tools.trucks.find(t => t.current) || {}).plate),
    collect: () => ({ e: { truckPlate: { text: mv('plT'), color: mv('plUseC') ? mv('plC') : null } }, list: ['Plaque du camion : ' + mv('plT')] }) },
  playerTruck: { page: 'at-camion', icon: 'swap', title: 'Changer de camion', desc: 'Prends le volant d\'un autre camion de ta flotte sans passer par le garage.',
    meta: S => `${S.tools.trucks.length} camion(s) dans ta flotte`, off: S => S.tools.trucks.length > 1 ? '' : 'Un seul camion dans ta flotte',
    form: S => `<label class="field">Camion<select id="ptSel">${S.tools.trucks.filter(t => !t.current).map(t => `<option value="${escM(t.id)}">${escM(vName(t))} · ${escM(t.plate || 'sans plaque')} · ${escM(cityName(t.garage))}</option>`).join('')}</select></label>
      <div class="muted" style="font-size:12px;margin-top:8px">Ton chauffeur échange sa place avec celui du camion choisi, et ton QG devient la ville de son garage.</div>`,
    collect: () => { const s = document.querySelector('#modalBody #ptSel'); return { e: { playerTruck: s.value }, list: ['Nouveau camion : ' + s.options[s.selectedIndex].text] }; } },
  truckParts: { page: 'at-camion', icon: 'engine', title: 'Moteur et boîte', desc: 'Monte le moteur ou la boîte d\'un autre camion du même modèle de ta flotte.',
    meta: S => S.tools.parts && S.tools.parts.engine ? `Moteur : <b>${escM(S.tools.parts.names[S.tools.parts.engine] || '–')}</b>` : '',
    off: S => !S.tools.parts ? 'Aucun camion attribué' : (S.tools.parts.engines.length < 2 && S.tools.parts.transmissions.length < 2) ? 'Aucun autre camion du même modèle dans ta flotte' : '',
    form: S => { const P = S.tools.parts; const sel = (id, list, cur) => `<select id="${id}">${list.map(x => `<option value="${escM(x)}" ${x === cur ? 'selected' : ''}>${escM(P.names[x])}${x === cur ? ' (actuel)' : ''}</option>`).join('')}</select>`;
      return `<label class="field">Moteur${sel('peE', P.engines, P.engine)}</label><label class="field" style="margin-top:12px">Boîte de vitesses${sel('peT', P.transmissions, P.transmission)}</label>
      <div class="muted" style="font-size:12px;margin-top:8px">Seules les pièces déjà montées sur un camion du même modèle de ta flotte sont proposées : elles sont sûres pour ce camion.</div>`; },
    collect: () => { const P = atSel.summary.tools.parts, e = {}, list = [];
      if (mv('peE') && mv('peE') !== P.engine) { e.truckEngine = mv('peE'); list.push('Moteur : ' + P.names[e.truckEngine]); }
      if (mv('peT') && mv('peT') !== P.transmission) { e.truckTransmission = mv('peT'); list.push('Boîte : ' + P.names[e.truckTransmission]); }
      if (!list.length) throw new Error('Aucun changement de pièce.'); return { e, list }; } },
  removeBadge: { page: 'at-camion', icon: 'badge', title: 'Retirer le badge', desc: 'Enlève le logo de marque de la calandre de ton camion.',
    off: S => !S.tools.parts ? 'Aucun camion attribué' : !S.tools.parts.badge ? 'Pas de badge sur ce camion' : '',
    form: () => '<p style="margin:0">Le badge (logo de marque) est retiré de ton camion. Tu pourras en remettre un chez un concessionnaire ou à l\'atelier.</p>',
    collect: () => ({ e: { removeBadge: true }, list: ['Badge retiré'] }) },
  teleport: { page: 'at-camion', icon: 'pin', title: 'Téléportation', desc: 'Déplace ton camion (et sa remorque) à un endroit repéré en jeu.',
    async prepare(){ const g = (atSel.profiles.find(x => x.id === atSel.profileId) || {}).game; const r = await window.tel.atelier.cams(g); return r.ok ? r.data : { found: false, positions: [] }; },
    form: (S, cams) => cams.positions.length
      ? `<label class="field">Position enregistrée<select id="tpSel">${cams.positions.map((c, i) => `<option value="${i}" ${i === cams.positions.length - 1 ? 'selected' : ''}>N° ${i + 1} · x ${Math.round(c.x)}, z ${Math.round(c.z)}</option>`).join('')}</select></label><div class="muted" style="font-size:12px;margin-top:8px">La dernière position enregistrée est choisie par défaut.</div>`
      : '<div class="empty" style="padding:18px">Aucune position enregistrée.</div>',
    help: '<ol style="margin:10px 0 0;padding-left:20px;font-size:13px;line-height:1.7"><li>Active la console dans <b>Jeu</b> (jeu fermé).</li><li>En jeu, passe en caméra libre (touche <b>0</b>) et va à l\'endroit voulu.</li><li>Appuie sur <b>Alt + F12</b> pour enregistrer la position, sauvegarde et quitte le jeu.</li></ol>',
    collect: () => { const v = mv('tpSel'); if (v == null) throw new Error('Enregistre d\'abord une position en jeu avec Alt + F12.'); return { e: { teleport: Number(v) }, list: ['Téléportation à la position n° ' + (Number(v) + 1)] }; } },

  /* ----- Cars (Coach Tools) ----- */
  coachXp: { page: 'at-coach', icon: 'bus', title: 'Expérience car', desc: 'Change l\'XP de ta carrière car, ou passe directement au niveau qui débloque tout.',
    meta: S => `<b>${nf(S.busXp)}</b> XP · niveau ${lvlCoach(S.busXp)}`,
    form: S => `<label class="field">Expérience car (XP)<input id="cxV" type="number" min="0" step="1" value="${S.busXp}"></label>
      <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn" onclick="const i=document.getElementById('cxV');i.value=(+i.value||0)+10000">+10 000</button><button type="button" class="btn" onclick="const i=document.getElementById('cxV');i.value=(+i.value||0)+100000">+100 000</button><button type="button" class="btn" onclick="const i=document.getElementById('cxV');i.value=Math.max(+i.value||0,75000)">Niveau 25 · tout débloquer</button><button type="button" class="btn" onclick="const i=document.getElementById('cxV');i.value=Math.max(+i.value||0,150000)">Niveau 36 et plus</button></div>
      <div class="muted" style="font-size:12px;margin-top:8px;line-height:1.6">SCS n'a pas publié tout le barème car : les boutons de niveau prennent une marge.</div>`,
    collect: () => { const v = Math.round(Number(mv('cxV'))); if (!Number.isFinite(v) || v < 0) throw new Error('XP invalide.'); return { e: { busXp: v }, list: ['XP car : ' + nf(atSel.summary.busXp) + ' → ' + nf(v)] }; } },
  coachSkills: { page: 'at-coach', icon: 'bus', title: 'Compétences car', desc: 'Règle les compétences du DLC Coaches (3 rangs chacune).',
    meta: S => S.coachSkills ? `<b>${Object.values(S.coachSkills).reduce((a, b) => a + b, 0)} / ${atSel.info.coachSkills.reduce((a, k) => a + k.max, 0)}</b> rangs débloqués` : '',
    off: S => S.coachSkills ? '' : 'Compétences car absentes de cette sauvegarde',
    form: S => `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">${atSel.info.coachSkills.map(k => skillSel('ck_' + k.key, k, S.coachSkills[k.key])).join('')}</div>
      <div style="margin-top:10px"><button type="button" class="btn" onclick="document.querySelectorAll('#modalBody select[id^=ck_]').forEach(s=>s.value=s.options[s.options.length-1].value)">Tout au maximum</button></div>`,
    collect: () => { const ck = {}; atSel.info.coachSkills.forEach(k => { ck[k.key] = Number(mv('ck_' + k.key)); }); return { e: { coachSkills: ck }, list: ['Compétences car'] }; } },
  busStops: { page: 'at-coach', icon: 'pin', title: 'Arrêts de bus', desc: 'Découvre tous les arrêts de la carte pour tes lignes de car.',
    meta: S => `<b>${S.busStopsDiscovered} / ${S.busStops}</b> découverts`, off: S => !S.busStops ? 'Aucun arrêt dans cette sauvegarde' : S.busStopsDiscovered >= S.busStops ? 'Déjà tous découverts' : '',
    form: S => `<p style="margin:0">Les ${S.busStops - S.busStopsDiscovered} arrêts restants seront marqués comme découverts.</p>`,
    collect: () => ({ e: { discoverBusStops: true }, list: ['Découvrir tous les arrêts de bus'] }) },
  busRepair: { page: 'at-coach', icon: 'wrench', title: 'Réparer', desc: 'Remet à neuf moteur, boîte, carrosserie, châssis et roues de tes cars.',
    meta: S => { const c = (S.tools.buses || []).find(t => t.current); return c ? `Ton car : <b>${pct(c.wear)}</b> d'usure` : `${(S.tools.buses || []).length} car(s) dans ta flotte`; },
    off: S => (S.tools.buses || []).length ? '' : 'Aucun car dans ta flotte',
    form: S => radio('tgt', [['current', 'Mon car', (S.tools.buses || []).some(t => t.current) ? 'Celui que tu conduis' : 'Tu ne conduis pas un de tes cars'], ['all', 'Tous mes cars']], (S.tools.buses || []).some(t => t.current) ? 'current' : 'all'),
    collect: () => ({ e: { busRepair: rval('tgt') }, list: [rval('tgt') === 'all' ? 'Réparer tous mes cars' : 'Réparer mon car'] }) },
  busFuel: { page: 'at-coach', icon: 'fuel', title: 'Carburant', desc: 'Fais le plein de tes cars, ou passe à un réservoir géant.',
    meta: S => { const c = (S.tools.buses || []).find(t => t.current); return c ? `Réservoir : <b>${pct(c.fuel)}</b>` : ''; },
    off: S => (S.tools.buses || []).length ? '' : 'Aucun car dans ta flotte',
    form: S => radio('tgt', [['current', 'Mon car'], ['all', 'Tous mes cars']], (S.tools.buses || []).some(t => t.current) ? 'current' : 'all') +
      `<label class="field" style="margin-top:12px"><span>Niveau : <b id="fuelOut">100 %</b></span><input type="range" id="fuelLvl" min="0" max="1000" step="10" value="100" oninput="document.getElementById('fuelOut').textContent=this.value+' %'+(this.value>100?' (réservoir géant)':'')"></label>`,
    collect: () => { const l = Number(mv('fuelLvl')) / 100; return { e: { busFuel: { target: rval('tgt'), level: l } }, list: [`Carburant à ${Math.round(l * 100)} % (${rval('tgt') === 'all' ? 'tous mes cars' : 'mon car'})`] }; } },
  busKm: { page: 'at-coach', icon: 'gauge', title: 'Kilométrage', desc: 'Change le compteur kilométrique du car que tu conduis.',
    meta: S => { const c = (S.tools.buses || []).find(t => t.current); return c ? `Compteur : <b>${nf(c.odometer)} km</b>` : ''; }, off: S => (S.tools.buses || []).some(t => t.current) ? '' : 'Tu ne conduis pas un de tes cars',
    form: S => `<label class="field">Nouveau kilométrage (km)<input id="kmV" type="number" min="0" max="9999999" step="1" value="${(S.tools.buses.find(t => t.current) || {}).odometer || 0}"></label>`,
    collect: () => ({ e: { busKm: Number(mv('kmV')) }, list: ['Compteur du car à ' + nf(mv('kmV')) + ' km'] }) },
  busPlate: { page: 'at-coach', icon: 'plate', title: 'Plaque d\'immatriculation', desc: 'Ton propre texte et sa couleur, sur le car que tu conduis.',
    meta: S => { const c = (S.tools.buses || []).find(t => t.current); return c && c.plate ? `<span class="tplate sm">${escM(c.plate)}</span>` : ''; }, off: S => (S.tools.buses || []).some(t => t.current) ? '' : 'Tu ne conduis pas un de tes cars',
    form: S => plateForm((S.tools.buses.find(t => t.current) || {}).plate),
    collect: () => ({ e: { busPlate: { text: mv('plT'), color: mv('plUseC') ? mv('plC') : null } }, list: ['Plaque du car : ' + mv('plT')] }) },

  /* ----- Remorques ----- */
  cargoMass: { page: 'at-remorque', icon: 'weight', title: 'Poids de la cargaison', desc: 'Allège ou alourdis le chargement, y compris en double et triple remorque.',
    meta: S => S.tools.attached ? `Actuel : <b>${S.tools.attached.cargoMass.map(m => nf(m) + ' kg').join(' + ')}</b>` : '',
    form: S => radio('cmW', [['attached', 'Remorque attelée', S.tools.attached ? 'Celle que tu tires' : 'Aucune remorque attelée'], ['all', 'Toutes les remorques chargées', 'Missions disponibles et remorques de la sauvegarde']], S.tools.attached ? 'attached' : 'all') +
      `<label class="field" style="margin-top:12px">Poids par remorque (kg)<input id="cmV" type="number" min="0" max="200000" step="100" value="${S.tools.attached ? S.tools.attached.cargoMass[0] : 20000}"></label>
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">${[[0, 'Vide'], [1000, '1 t'], [20000, '20 t'], [40000, '40 t']].map(([v, l]) => `<button type="button" class="btn" onclick="document.getElementById('cmV').value=${v}">${l}</button>`).join('')}</div>
      ${S.tools.attached && S.tools.attached.parts > 1 ? `<label class="row" style="gap:10px;margin-top:12px;font-size:14px"><input type="checkbox" id="cmS" checked> Appliquer aussi aux ${S.tools.attached.parts - 1} autre(s) remorque(s) de l'attelage</label>` : ''}`,
    collect: () => ({ e: { cargoMass: { mass: Number(mv('cmV')), slaves: mv('cmS') !== false, everywhere: rval('cmW') === 'all' } }, list: ['Cargaison à ' + nf(mv('cmV')) + ' kg ' + (rval('cmW') === 'all' ? 'sur toutes les remorques chargées' : 'par remorque attelée')] }) },
  trailerDefMass: { page: 'at-remorque', icon: 'scale', title: 'Poids à vide', desc: 'Change le poids de la caisse et du châssis de la remorque attelée.',
    meta: S => S.tools.attached && S.tools.attached.bodyMass != null ? `Caisse ${nf(S.tools.attached.bodyMass)} kg · châssis ${nf(S.tools.attached.chassisMass)} kg` : '',
    off: S => !S.tools.attached ? 'Aucune remorque attelée' : S.tools.attached.bodyMass == null ? 'Non disponible pour cette remorque' : '',
    form: S => `<div class="row" style="gap:12px;flex-wrap:wrap"><label class="field" style="flex:1">Caisse (kg)<input id="bmV" type="number" min="0" max="100000" value="${S.tools.attached.bodyMass}"></label><label class="field" style="flex:1">Châssis (kg)<input id="chV" type="number" min="0" max="100000" value="${S.tools.attached.chassisMass}"></label></div>`,
    collect: () => ({ e: { trailerDefMass: { body: mv('bmV'), chassis: mv('chV') } }, list: [`Poids à vide : caisse ${nf(mv('bmV'))} kg, châssis ${nf(mv('chV'))} kg`] }) },
  unlockTrailer: { page: 'at-remorque', icon: 'unlock', title: 'Autoriser partout', desc: 'Retire la limite de pays de la remorque attelée (zones interdites).',
    meta: S => S.tools.attached ? (S.tools.attached.restricted ? '<b>Limitée</b> à certains pays' : 'Déjà autorisée partout') : '', off: S => !S.tools.attached ? 'Aucune remorque attelée' : !S.tools.attached.restricted ? 'Déjà autorisée partout' : '',
    form: () => '<p style="margin:0">La remorque pourra être emmenée dans tous les pays, même ceux où elle est normalement interdite.</p>',
    collect: () => ({ e: { unlockTrailer: true }, list: ['Remorque autorisée partout'] }) },
  trailerRepair: { page: 'at-remorque', icon: 'wrench', title: 'Réparer', desc: 'Remet à neuf caisse, châssis, roues et l\'état de la cargaison.',
    meta: S => `${S.tools.trailers.length} remorque(s) à toi`, off: S => S.tools.attached || S.tools.trailers.length ? '' : 'Aucune remorque',
    form: S => radio('tgt', [['current', 'Remorque attelée', S.tools.attached ? 'Avec ses remorques esclaves' : 'Aucune remorque attelée'], ['all', 'Toutes mes remorques']], S.tools.attached ? 'current' : 'all'),
    collect: () => ({ e: { trailerRepair: rval('tgt') }, list: [rval('tgt') === 'all' ? 'Réparer toutes mes remorques' : 'Réparer la remorque attelée'] }) },
  trailerPlate: { page: 'at-remorque', icon: 'plate', title: 'Plaque d\'immatriculation', desc: 'Ton propre texte et sa couleur, sur la remorque attelée.',
    meta: S => S.tools.attached && S.tools.attached.plate ? `<span class="tplate sm">${escM(S.tools.attached.plate)}</span>` : '', off: S => S.tools.attached ? '' : 'Aucune remorque attelée',
    form: S => plateForm(S.tools.attached.plate),
    collect: () => ({ e: { trailerPlate: { text: mv('plT'), color: mv('plUseC') ? mv('plC') : null } }, list: ['Plaque de la remorque : ' + mv('plT')] }) },
  playerTrailer: { page: 'at-remorque', icon: 'swap', title: 'Changer de remorque', desc: 'Attelle une autre remorque de ta flotte, sans aller la chercher.',
    meta: S => `${S.tools.trailers.length} remorque(s) à toi`, off: S => S.tools.trailers.filter(t => !t.current).length ? '' : 'Aucune autre remorque à toi',
    form: S => `<label class="field">Remorque<select id="prSel">${S.tools.trailers.filter(t => !t.current).map(t => `<option value="${escM(t.id)}">${escM(vName(t, 'trailer'))} · ${escM(t.plate || 'sans plaque')}${t.garage ? ' · ' + escM(cityName(t.garage)) : ''}</option>`).join('')}</select></label>`,
    collect: () => { const s = document.querySelector('#modalBody #prSel'); return { e: { playerTrailer: s.value }, list: ['Nouvelle remorque : ' + s.options[s.selectedIndex].text] }; } },

  /* ----- Profil : carte et entreprise ----- */
  visitAllCities: { page: 'at-profil', icon: 'city', title: 'Toutes les villes', desc: 'Marque toutes les villes comme visitées : la carte est découverte.',
    meta: S => `<b>${S.visitedCities} / ${S.totalCities}</b> villes visitées`, off: S => S.visitedCities >= S.totalCities ? 'Déjà toutes visitées' : '',
    form: () => '<p style="margin:0">Toutes les villes de ta sauvegarde seront marquées comme visitées.</p>',
    collect: () => ({ e: { visitAllCities: true }, list: ['Toutes les villes visitées'] }) },
  unlockDealers: { page: 'at-profil', icon: 'store', title: 'Concessionnaires', desc: 'Débloque tous les concessionnaires de camions.',
    meta: S => `<b>${S.tools.dealers}</b> débloqué(s)`, form: () => '<p style="margin:0">Tous les concessionnaires de la carte seront accessibles.</p>',
    collect: () => ({ e: { unlockDealers: true }, list: ['Tous les concessionnaires débloqués'] }) },
  unlockRecruitments: { page: 'at-profil', icon: 'people', title: 'Agences de recrutement', desc: 'Débloque toutes les agences pour embaucher des chauffeurs.',
    meta: S => `<b>${S.tools.recruitments}</b> débloquée(s)`, form: () => '<p style="margin:0">Toutes les agences de recrutement de la carte seront accessibles.</p>',
    collect: () => ({ e: { unlockRecruitments: true }, list: ['Toutes les agences de recrutement débloquées'] }) },
  garages: { page: 'at-profil', icon: 'garage', title: 'Garages', desc: 'Achète tous les garages libres, à la taille de ton choix.',
    meta: S => `<b>${S.tools.garages.owned} / ${S.tools.garages.total}</b> achetés`,
    form: () => radio('gs', [['6', 'Petit', '1 camion, 1 chauffeur'], ['2', 'Moyen', '3 camions, 3 chauffeurs'], ['3', 'Grand', '5 camions, 5 chauffeurs']], '2') +
      '<div class="muted" style="font-size:12px;margin-top:8px">Seuls les garages vides sont concernés : ceux qui ont déjà un camion, un chauffeur ou une remorque ne bougent pas, et aucun garage n\'est réduit.</div>',
    collect: () => ({ e: { garages: Number(rval('gs')) }, list: ['Garages libres : taille ' + ({ 6: 'petite', 2: 'moyenne', 3: 'grande' })[rval('gs')]] }) },
  copyConfig: { page: 'at-profil', icon: 'copy', title: 'Copier les réglages', desc: 'Reprends tes commandes et options d\'un autre profil, même d\'ATS vers ETS2.', direct: true,
    form: () => `<label class="field">Copier depuis<select id="ccFrom">${atSel.profiles.filter(p => p.id !== atSel.profileId).map(p => `<option value="${escM(p.id)}">${escM(p.name)} (${p.game === 'ets2' ? 'ETS2' : 'ATS'})</option>`).join('')}</select></label>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;font-size:14px">${[['controls', 'Commandes (clavier, volant, manette)'], ['config', 'Options du jeu'], ['local', 'Graphismes et écran']].map(([k, l]) => `<label class="row" style="gap:10px"><input type="checkbox" data-cc="${k}" checked> ${l}</label>`).join('')}</div>`,
    off: () => atSel.profiles.length > 1 ? '' : 'Un seul profil sur ce PC',
    async run(){
      const from = mv('ccFrom'), files = [...document.querySelectorAll('#modalBody [data-cc]')].filter(c => c.checked).map(c => c.dataset.cc);
      const r = await window.tel.atelier.copyConfig(from, atSel.profileId, files);
      return r.ok ? 'Réglages copiés ✓ (' + r.data.copied.join(', ') + ')' : r.error;
    } }
};
function plateForm(cur){
  return `<label class="field">Texte de la plaque<input id="plT" maxlength="12" value="${escM(cur || '')}" style="text-transform:uppercase"></label>
    <label class="row" style="gap:10px;margin-top:12px;font-size:14px"><input type="checkbox" id="plUseC"> Texte en couleur <input type="color" id="plC" value="#ff8a3d" aria-label="Couleur du texte" style="width:44px;height:30px;border:none;background:none;padding:0"></label>
    <div class="muted" style="font-size:12px;margin-top:8px">12 caractères maximum. Le pays de la plaque est conservé.</div>`;
}
async function openTool(id){
  const t = TOOLS[id], S = atSel.summary; if (!t || !S) return;
  const extra = t.prepare ? await t.prepare() : null;
  const ok = await ask(t.title, `<div class="tform">${t.form(S, extra)}${t.help || ''}${t.direct ? '' : BACKUP_NOTE}</div>`, t.direct ? 'Copier' : 'Appliquer');
  if (!ok) return;
  if (t.run) { atSel.msg = await t.run(); announce(atSel.msg); renderAtPage(state.view); return; }
  let c; try { c = t.collect(); } catch (err) { atSel.msg = err.message; announce(atSel.msg); renderAtPage(state.view); return; }
  await atSend(c.e, state.view);
}
async function atSend(e, view){
  atSel.msg = 'Modification en cours…'; renderAtPage(view);
  const r = await window.tel.atelier.apply(atSel.profileId, atSel.slot, e);
  if (!r.ok) { atSel.msg = r.error; announce('Erreur : ' + r.error); renderAtPage(view); return; }
  await atLoadSummary();
  atSel.msg = 'Fait ✓ ' + r.data.report.join(', ') + '. Charge cette sauvegarde dans le jeu.'; announce(atSel.msg);
  renderAtPage(view);
}
function toolGrid(page, S, title){
  const list = Object.entries(TOOLS).filter(([, t]) => t.page === page).map(([id, t]) => toolCard({ ...t, id }, S)).join('');
  return `${title ? `<h2 style="margin:22px 0 12px">${title}</h2>` : ''}<div class="tgrid">${list}</div>`;
}
function fleetTable(kind, S){
  const list = kind === 'truck' ? S.tools.trucks : kind === 'bus' ? (S.tools.buses || []) : S.tools.trailers;
  if (!list.length) return '';
  return `<details class="panel" style="margin-top:16px"><summary style="cursor:pointer;font-weight:700">${kind === 'truck' ? 'Ma flotte de camions' : kind === 'bus' ? 'Ma flotte de cars' : 'Mes remorques'} (${list.length})</summary>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">${list.map(v => `<div class="item" style="cursor:default;gap:12px">${tIcon(kind === 'trailer' ? 'trailer' : kind, 22)}<b class="grow">${escM(vName(v, kind))}${v.current ? ' <span class="chip" style="margin-left:6px">Actuel</span>' : ''}</b>${v.plate ? `<span class="tplate sm">${escM(v.plate)}</span>` : ''}<span class="muted" style="font-size:13px;min-width:90px">${escM(cityName(v.garage))}</span><span class="muted" style="font-size:13px;min-width:90px">Usure ${pct(v.wear)}</span>${kind !== 'trailer' ? `<span class="muted" style="font-size:13px;min-width:80px">${pct(v.fuel)} carb.</span>` : ''}</div>`).join('')}</div></details>`;
}
const msgRow = () => atSel.msg ? `<div class="tmsg" role="status">${escM(atSel.msg)}</div>` : '';
