/* Dépenses des missions : calculs communs à l'onglet « Dépenses » de la Feuille de route et au bloc
   « Missions terminées » des Finances (espace Entreprise).
   Données : window.tel.journal() (lecture seule). Seuls les montants envoyés par le jeu sont comptés
   (péages, ferries, trains, amendes, pénalités d'annulation : voir docs/DONNEES-DU-JEU.md).
   Le jeu ne transmet ni le prix du carburant ni le coût des réparations : rien n'est estimé.
   Euros (ETS2) et dollars (ATS) ne sont jamais additionnés. */

const DEP_TYPES = [['péage', 'Péages'], ['ferry', 'Ferries'], ['train', 'Trains'], ['amende', 'Amendes'], ['annulation', 'Pénalités d’annulation']];
const DEP_INFRACTIONS = {
  crash: 'Accident', avoid_sleeping: 'Repos non pris', wrong_way: 'Contresens', speeding_camera: 'Radar', no_lights: 'Phares éteints',
  red_signal: 'Feu rouge', speeding: 'Excès de vitesse', avoid_weighing: 'Pesée évitée', illegal_trailer: 'Remorque non autorisée',
  avoid_inspection: 'Contrôle évité', illegal_border_crossing: 'Frontière franchie illégalement', hard_shoulder_violation: 'Bande d’arrêt d’urgence',
  damaged_vehicle_usage: 'Véhicule trop endommagé', generic: 'Infraction'
};
let depMission = 'dernier', depPeriode = 'tout', depType = 'tous';

const depJeu = j => j && j.game === 'ats' ? 'ats' : 'ets2';
const depDevise = g => g === 'ats' ? '$' : '€';
function depLibelle(type){ const t = DEP_TYPES.find(x => x[0] === type); return t ? t[1] : (type ? String(type) : 'Frais'); }
function depMontant(n, g){ return Number.isFinite(n) ? fmt(Math.round(n)) + ' ' + depDevise(g) : '—'; }
// Détail d'une dépense : infraction (amende), trajet (ferry, train) ; seulement ce que le jeu a envoyé
function depDetail(it){
  if (it.offence) return DEP_INFRACTIONS[it.offence] || String(it.offence);
  if (it.from || it.to) return `${it.from || '—'} → ${it.to || '—'}`;
  return '';
}
function depNomMission(j){
  const d = Number.isFinite(j.ended) ? new Date(j.ended).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
  return `${d} · ${j.from || '—'} → ${j.to || '—'}`;
}

// Bilan d'une mission : revenu, dépenses par type, solde. null = inconnu (jamais remplacé par 0 inventé).
function depBilanMission(j){
  const items = Array.isArray(j.expenseItems) ? j.expenseItems.filter(i => Number.isFinite(i.amount)) : null;
  const parType = {};
  if (items) for (const it of items) parType[it.type] = (parType[it.type] || 0) + it.amount;
  const depenses = Number.isFinite(j.expenses) ? j.expenses : (items ? items.reduce((a, i) => a + i.amount, 0) : null);
  const revenu = Number.isFinite(j.revenue) ? j.revenue : null;
  return { jeu: depJeu(j), revenu, depenses, parType, detailConnu: !!items, solde: revenu != null && depenses != null ? revenu - depenses : null };
}

// Totaux d'une liste de missions, séparés par jeu (donc par monnaie)
function depTotaux(jobs){
  const out = {};
  for (const j of jobs) {
    const b = depBilanMission(j), t = (out[b.jeu] ||= { missions: 0, revenu: 0, depenses: 0, parType: {} });
    t.missions++;
    if (b.revenu != null) t.revenu += b.revenu;
    if (b.depenses != null) t.depenses += b.depenses;
    for (const [k, v] of Object.entries(b.parType)) t.parType[k] = (t.parType[k] || 0) + v;
  }
  for (const t of Object.values(out)) t.solde = t.revenu - t.depenses;
  return out;
}

// Bornes d'une période du filtre ([début, fin[ en millisecondes ; null = sans limite)
function depBornes(p, maintenant = new Date()){
  const d = new Date(maintenant); d.setHours(0, 0, 0, 0);
  if (p === 'semaine') { const l = new Date(d); l.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const f = new Date(l); f.setDate(l.getDate() + 7); return [l.getTime(), f.getTime()]; }
  if (p === 'mois') return [new Date(d.getFullYear(), d.getMonth(), 1).getTime(), new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()];
  if (p === 'mois-1') return [new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime(), new Date(d.getFullYear(), d.getMonth(), 1).getTime()];
  return [null, null];
}

// Liste à plat des dépenses reçues, filtrée (mission : 'tous', 'dernier' ou la date de fin de la mission)
function depLignes(jobs, filtre, maintenant){
  const tri = jobs.slice().sort((a, b) => b.ended - a.ended);
  const cible = filtre.mission === 'tous' ? null : filtre.mission === 'dernier' ? (tri[0] ? String(tri[0].ended) : '') : String(filtre.mission);
  const [debut, fin] = depBornes(filtre.periode, maintenant);
  const lignes = [];
  for (const j of tri) {
    if (cible !== null && String(j.ended) !== cible) continue;
    for (const it of (Array.isArray(j.expenseItems) ? j.expenseItems : [])) {
      if (!Number.isFinite(it.amount)) continue;
      const at = Number.isFinite(it.at) ? it.at : j.ended;
      if (debut != null && (at < debut || at >= fin)) continue;
      if (filtre.type !== 'tous' && it.type !== filtre.type) continue;
      lignes.push({ ...it, at, jeu: depJeu(j), mission: j });
    }
  }
  return lignes.sort((a, b) => b.at - a.at);
}

/* ---------- Onglet « Dépenses » de la Feuille de route ---------- */
function frRenderDepenses(){
  const box = document.getElementById('frDep'); if (!box) return;
  const J = frJournalCache;
  if (!J) { box.innerHTML = '<div class="empty">Le journal des trajets n’est pas disponible.</div>'; return; }
  const jobs = (Array.isArray(J.jobs) ? J.jobs : []).filter(j => Number.isFinite(j.ended)).sort((a, b) => b.ended - a.ended);
  if (!jobs.length) { box.innerHTML = '<div class="empty">Aucune mission enregistrée pour l’instant. Les péages, ferries, trains, amendes et pénalités apparaîtront ici après ta première mission avec le plugin du jeu.</div>'; return; }
  if (depMission !== 'tous' && depMission !== 'dernier' && !jobs.some(j => String(j.ended) === depMission)) depMission = 'dernier';
  const opt = (v, l, cur) => `<option value="${escM(v)}"${v === cur ? ' selected' : ''}>${escM(l)}</option>`;
  const choix = `<div class="dep-filtres" role="group" aria-label="Filtres des dépenses">
    <label class="field">Mission<select id="depMission">${opt('dernier', 'Dernière mission', depMission)}${opt('tous', 'Toutes les missions', depMission)}${jobs.slice(0, 100).map(j => opt(String(j.ended), depNomMission(j), depMission)).join('')}</select></label>
    <label class="field">Période<select id="depPeriode">${[['tout', 'Toute la période'], ['semaine', 'Cette semaine'], ['mois', 'Ce mois-ci'], ['mois-1', 'Le mois dernier']].map(([v, l]) => opt(v, l, depPeriode)).join('')}</select></label>
    <label class="field">Type<select id="depType">${opt('tous', 'Tous les types', depType)}${DEP_TYPES.map(([v, l]) => opt(v, l, depType)).join('')}</select></label>
  </div>`;
  const lignes = depLignes(jobs, { mission: depMission, periode: depPeriode, type: depType });
  const mission = depMission === 'tous' ? null : depMission === 'dernier' ? jobs[0] : jobs.find(j => String(j.ended) === depMission);
  // Totaux par type, séparés par monnaie
  const tot = {};
  for (const l of lignes) { const t = (tot[l.jeu] ||= {}); t[l.type] = (t[l.type] || 0) + l.amount; }
  const cartes = Object.entries(tot).map(([g, t]) => DEP_TYPES.filter(([k]) => t[k]).map(([k, lib]) => `<div class="stat"><span class="muted">${escM(lib)}${Object.keys(tot).length > 1 ? (g === 'ats' ? ' (ATS)' : ' (ETS2)') : ''}</span><b class="t-num">${depMontant(t[k], g)}</b></div>`).join('')
    + `<div class="stat"><span class="muted">Total${Object.keys(tot).length > 1 ? (g === 'ats' ? ' (ATS)' : ' (ETS2)') : ''}</span><b class="t-num">${depMontant(Object.values(t).reduce((a, b) => a + b, 0), g)}</b></div>`).join('');
  const entete = mission ? `<div class="panel dep-mission"><h2 class="t-sous">${escM(mission.from || '—')} → ${escM(mission.to || '—')}</h2>
      <p class="muted">${escM([new Date(mission.ended).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }), frEstCar(mission) ? 'Car' : (mission.cargo || null), routeStatus(mission).label].filter(Boolean).join(' · '))}</p>
      <p class="muted">${Number.isFinite(mission.fuelAdded) && mission.fuelAdded > 0 ? `Carburant : ${frLitres(mission.fuelAdded)} ajoutés. ` : ''}Le jeu ne transmet ni le prix du carburant ni le coût des réparations : ils ne sont pas comptés.</p></div>`
    : '<p class="muted dep-note">Le jeu ne transmet ni le prix du carburant ni le coût des réparations : ils ne sont pas comptés.</p>';
  const tableau = lignes.length ? `<div class="fr-tab-wrap"><table class="fr-table dep-table"><caption class="sr-only">Détail des dépenses</caption>
      <thead><tr><th scope="col">Date</th><th scope="col">Type</th><th scope="col">Détail</th>${mission ? '' : '<th scope="col">Mission</th>'}<th scope="col" class="dep-num">Montant</th></tr></thead>
      <tbody>${lignes.map(l => `<tr><td>${escM(new Date(l.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }))}</td><th scope="row">${escM(depLibelle(l.type))}</th><td>${escM(depDetail(l)) || '<span class="muted">—</span>'}</td>${mission ? '' : `<td>${escM(depNomMission(l.mission))}</td>`}<td class="dep-num">${depMontant(l.amount, l.jeu)}</td></tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">Aucune dépense reçue du jeu pour ce choix${mission && Number.isFinite(mission.expenses) && mission.expenses > 0 && !Array.isArray(mission.expenseItems) ? ' (détail non enregistré pour cette ancienne mission)' : ''}.</div>`;
  box.innerHTML = choix + entete + (cartes ? `<div class="stats fr-stats" role="list" aria-label="Totaux par type">${cartes}</div>` : '') + `<div class="panel"><h3 class="t-sous">Détail</h3>${tableau}</div>`;
}
function frBrancherDepenses(){
  const box = document.getElementById('frDep'); if (!box) return;
  box.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'depMission') depMission = e.target.value; else if (id === 'depPeriode') depPeriode = e.target.value; else if (id === 'depType') depType = e.target.value; else return;
    frRenderDepenses();
    const f = document.getElementById(id); if (f) f.focus();
  });
}
