/* Feuille de route : onglets (Trajets, Calendrier, Rapport de la semaine, Rapport du mois).
   Données : window.tel.journal() (lecture seule, voir CONTRAT-NOYAU.md) = kilomètres par jour + 300 derniers trajets.
   Règle : rien d'inventé. Un repère n'apparaît que s'il se calcule avec ce qui est enregistré ;
   « matières dangereuses » n'est pas affiché : le jeu ne le transmet pas à l'appli. */

const frCalOuverts = new Set(); // trajets dépliés dans le calendrier
let frDernierFin = null, frJournalCache = null, frOnglet = 'trajets', frMoisVu = null, frJourChoisi = null, frDecalSemaine = 0, frDecalMois = 0;
const FR_ONGLETS = ['trajets', 'calendrier', 'semaine', 'mois'];
const frJourCle = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const frEstCar = j => j.missionType === 'bus';
const frTermine = j => j.status === 'livrée' || (!j.abandoned && j.status !== 'annulée' && j.status !== 'interrompue');

async function frChargerJournal(){
  if (!window.tel || !window.tel.journal) return null;
  try { frJournalCache = await window.tel.journal(); } catch { frJournalCache = null; }
  return frJournalCache;
}

// Statistiques d'une période [debut, fin[ (millisecondes) : même calcul pour la semaine, le mois et la Vue d'ensemble
function frStatsPeriode(J, debut, fin){
  const jobs = (J && Array.isArray(J.jobs) ? J.jobs : []).filter(j => j.ended >= debut && j.ended < fin);
  const st = { trajets: jobs.length, livraisons: 0, services: 0, voyageurs: 0, voyageursConnus: false, km: 0, kmCharge: 0, kmVide: 0, carburant: 0, carburantConnu: false,
    course: 0, degats: [], revenus: {}, depenses: {}, jours: 0 };
  for (const j of jobs) {
    if (frEstCar(j)) { if (frTermine(j)) st.services++; if (Number.isFinite(j.passengers)) { st.voyageurs += j.passengers; st.voyageursConnus = true; } }
    else if (j.status === 'livrée') st.livraisons++;
    if (Number.isFinite(j.fuelUsed)) { st.carburant += j.fuelUsed; st.carburantConnu = true; }
    if (j.mode === 'course') st.course++;
    if (Number.isFinite(j.damage)) st.degats.push(j.damage);
    const g = j.game === 'ats' ? 'ats' : 'ets2';
    if (Number.isFinite(j.revenue)) st.revenus[g] = (st.revenus[g] || 0) + j.revenue;
    if (Number.isFinite(j.expenses)) st.depenses[g] = (st.depenses[g] || 0) + j.expenses;
  }
  // Kilomètres : compteur par jour (tout ce qui a été roulé, missions ou non)
  const days = (J && J.days) || {};
  for (const [k, v] of Object.entries(days)) {
    const t = new Date(k + 'T12:00:00').getTime();
    if (t >= debut && t < fin) { st.kmCharge += v.loaded || 0; st.kmVide += v.empty || 0; if ((v.loaded || 0) + (v.empty || 0) > 0) st.jours++; }
  }
  st.km = st.kmCharge + st.kmVide;
  st.conso = st.carburantConnu && st.km > 0 ? st.carburant / st.km * 100 : null;
  st.degatsMoy = st.degats.length ? st.degats.reduce((a, b) => a + b, 0) / st.degats.length : null;
  return st;
}
const frArgent = o => Object.entries(o).filter(([, v]) => v).map(([g, v]) => fmt(Math.round(v)) + (g === 'ats' ? ' $' : ' €')).join(' · ') || '—';
const frLitres = n => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' L';
function frEcart(a, b){ // écart en % avec la période précédente, seulement si elle a des données
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return '';
  const p = Math.round((a - b) / b * 100);
  return ` <span class="fr-ecart">${p > 0 ? '+' : ''}${p} % <span class="sr-only">par rapport à la période précédente</span></span>`;
}

/* ---------- Onglets accessibles (flèches gauche / droite, Début, Fin) ---------- */
function frOuvrirOnglet(o, focus){
  frOnglet = o;
  for (const k of FR_ONGLETS) {
    const t = document.getElementById('frTab-' + k), p = document.getElementById('frPan-' + k);
    if (!t || !p) continue;
    const on = k === o; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; t.classList.toggle('on', on); p.hidden = !on;
    if (on && focus) t.focus();
  }
  if (o !== 'trajets') frChargerJournal().then(() => frRendreOnglet());
}
function frRendreOnglet(){
  if (frOnglet === 'calendrier') frRenderCalendrier();
  else if (frOnglet === 'semaine') frRenderRapport('semaine');
  else if (frOnglet === 'mois') frRenderRapport('mois');
}
function frBrancherOnglets(){
  const liste = document.getElementById('frOnglets'); if (!liste) return;
  liste.addEventListener('click', e => { const b = e.target.closest('[role="tab"]'); if (b) frOuvrirOnglet(b.dataset.fr); });
  liste.addEventListener('keydown', e => {
    const i = FR_ONGLETS.indexOf(frOnglet); let n = null;
    if (e.key === 'ArrowRight') n = FR_ONGLETS[(i + 1) % 4]; else if (e.key === 'ArrowLeft') n = FR_ONGLETS[(i + 3) % 4];
    else if (e.key === 'Home') n = FR_ONGLETS[0]; else if (e.key === 'End') n = FR_ONGLETS[3];
    if (n) { e.preventDefault(); frOuvrirOnglet(n, true); }
  });
  const cal = document.getElementById('frCal');
  if (cal) cal.addEventListener('toggle', e => { const d = e.target; if (d.classList && d.classList.contains('rt-item')) d.open ? frCalOuverts.add(d.dataset.key) : frCalOuverts.delete(d.dataset.key); }, true);
  for (const id of ['frCal', 'frSemaine', 'frMois']) {
    const box = document.getElementById(id);
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-fr-act]'); if (!b) return;
      const a = b.dataset.frAct;
      if (a === 'mois-') { frMoisVu.setMonth(frMoisVu.getMonth() - 1); frJourChoisi = null; frRenderCalendrier(); }
      else if (a === 'mois+') { frMoisVu.setMonth(frMoisVu.getMonth() + 1); frJourChoisi = null; frRenderCalendrier(); }
      else if (a === 'jour') { frJourChoisi = b.dataset.jour; frRenderCalendrier(); const f = document.querySelector(`#frCal [data-jour="${frJourChoisi}"]`); if (f) f.focus(); }
      else if (a === 'sem-') { frDecalSemaine--; frRenderRapport('semaine'); }
      else if (a === 'sem+') { frDecalSemaine = Math.min(0, frDecalSemaine + 1); frRenderRapport('semaine'); }
      else if (a === 'moisr-') { frDecalMois--; frRenderRapport('mois'); }
      else if (a === 'moisr+') { frDecalMois = Math.min(0, frDecalMois + 1); frRenderRapport('mois'); }
      else if (a === 'copier') frCopier(b);
    });
  }
}

/* ---------- Calendrier ---------- */
// Repères calculables avec les données enregistrées : nouvelle ville, ligne répétée, record du mois, convoi exceptionnel.
function frReperes(J){
  const jobs = (J.jobs || []).slice().sort((a, b) => a.ended - b.ended);
  const villes = new Set(), lignes = new Set(), parJour = {};
  for (const j of jobs) {
    const k = frJourCle(new Date(j.ended)), r = (parJour[k] ||= { nouvelle: [], repetee: [], special: 0, trajets: [] });
    r.trajets.push(j);
    const ligne = (j.from || '') + '→' + (j.to || '');
    if (j.from && j.to) { if (lignes.has(ligne)) r.repetee.push(ligne); lignes.add(ligne); }
    for (const v of [j.from, j.to]) if (v && !villes.has(v)) { villes.add(v); if (v === j.to) r.nouvelle.push(v); }
    if (j.special === true) r.special++;
  }
  return parJour;
}
function frRenderCalendrier(){
  const box = document.getElementById('frCal'); if (!box) return;
  const J = frJournalCache;
  if (!J) { box.innerHTML = '<div class="empty">Le journal des trajets n’est pas disponible.</div>'; return; }
  if (!frMoisVu) { const d = new Date(); frMoisVu = new Date(d.getFullYear(), d.getMonth(), 1); }
  const an = frMoisVu.getFullYear(), mo = frMoisVu.getMonth();
  const rep = frReperes(J), days = J.days || {};
  const nbJours = new Date(an, mo + 1, 0).getDate(), decal = (new Date(an, mo, 1).getDay() + 6) % 7;
  let record = null, recKm = 0;
  for (let d = 1; d <= nbJours; d++) { const v = days[frJourCle(new Date(an, mo, d))]; const k = v ? (v.loaded || 0) + (v.empty || 0) : 0; if (k > recKm) { recKm = k; record = d; } }
  const titre = frMoisVu.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const cases = [];
  for (let i = 0; i < decal; i++) cases.push('<div class="fr-case vide" aria-hidden="true"></div>');
  const auj = frJourCle(new Date());
  for (let d = 1; d <= nbJours; d++) {
    const cle = frJourCle(new Date(an, mo, d)), v = days[cle], r = rep[cle];
    const kmj = v ? (v.loaded || 0) + (v.empty || 0) : 0;
    const liv = r ? r.trajets.filter(j => !frEstCar(j) && j.status === 'livrée').length : 0;
    const serv = r ? r.trajets.filter(j => frEstCar(j) && frTermine(j)).length : 0;
    const vg = r ? r.trajets.filter(frEstCar).reduce((a, j) => a + (Number.isFinite(j.passengers) ? j.passengers : 0), 0) : 0;
    const marques = [];
    if (r && r.special) marques.push(['⚑', 'Convoi exceptionnel']);
    if (r && r.nouvelle.length) marques.push(['◆', 'Nouvelle ville']);
    if (r && r.repetee.length) marques.push(['↻', 'Ligne répétée']);
    if (record === d && recKm > 0) marques.push(['★', 'Record du mois']);
    const lignes = [kmj > 0 ? km(kmj) : '', liv ? `${liv} livraison${liv > 1 ? 's' : ''}` : '', serv ? (vg ? `${vg} voyageur${vg > 1 ? 's' : ''}` : `${serv} service${serv > 1 ? 's' : ''}`) : ''].filter(Boolean);
    const nom = new Date(an, mo, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    cases.push(`<button type="button" class="fr-case${cle === frJourChoisi ? ' on' : ''}${cle === auj ? ' auj' : ''}" data-fr-act="jour" data-jour="${cle}" aria-pressed="${cle === frJourChoisi}" aria-label="${escM(nom + (lignes.length ? ' : ' + lignes.join(', ') : ' : rien d’enregistré') + (marques.length ? ' · ' + marques.map(m => m[1]).join(', ') : ''))}">
      <span class="fr-num">${d}</span>${lignes.map(l => `<span class="fr-l">${l}</span>`).join('')}${marques.length ? `<span class="fr-marques" aria-hidden="true">${marques.map(m => `<span title="${m[1]}">${m[0]} ${m[1]}</span>`).join('')}</span>` : ''}</button>`);
  }
  let detail = '';
  if (frJourChoisi) {
    const r = rep[frJourChoisi], v = days[frJourChoisi];
    const nom = new Date(frJourChoisi + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    detail = `<div class="panel fr-jour" aria-live="polite"><h3 class="t-sous">${escM(nom)}</h3>
      ${v ? `<p class="soft">${km((v.loaded || 0) + (v.empty || 0))} roulés · chargé ${km(v.loaded || 0)} · à vide ${km(v.empty || 0)}</p>` : '<p class="muted">Aucun kilomètre enregistré ce jour-là.</p>'}
      ${r && r.trajets.length ? `<p class="muted fr-note">Clique sur un trajet (ou Entrée) pour le dérouler : arrêts, kilomètres, carburant, dégâts, revenu, dépenses et solde.</p>
      <div class="rt-row rt-head" aria-hidden="true"><span>Date</span><span>Trajet</span><span>Km</span><span>Statut</span><span>Dépenses</span><span>Revenu</span><span>Solde</span></div>
      <div class="fr-jour-trajets">${r.trajets.slice().sort((a, b) => b.ended - a.ended).map(j => routeItemHtml(j, frCalOuverts.has(String(j.ended)))).join('')}</div>` : '<p class="muted">Aucun trajet terminé ce jour-là.</p>'}</div>`;
  }
  box.innerHTML = `<div class="fr-cal-tete"><button type="button" class="btn" data-fr-act="mois-" aria-label="Mois précédent">‹</button><h2 class="t-section fr-mois">${escM(titre.charAt(0).toUpperCase() + titre.slice(1))}</h2><button type="button" class="btn" data-fr-act="mois+" aria-label="Mois suivant">›</button></div>
    <div class="fr-legende muted">Repères : ⚑ convoi exceptionnel · ◆ nouvelle ville · ↻ ligne répétée · ★ record du mois. Les matières dangereuses ne sont pas indiquées : le jeu ne transmet pas cette information.</div>
    <div class="fr-grille" role="group" aria-label="${escM(titre)}">${['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].map(j => `<div class="fr-jsem" aria-hidden="true">${j}</div>`).join('')}${cases.join('')}</div>${detail}`;
}

/* ---------- Rapports (semaine, mois) ---------- */
function frBornes(type, decal){
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (type === 'semaine') { const lundi = new Date(d); lundi.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7 * decal); const fin = new Date(lundi); fin.setDate(lundi.getDate() + 7); return [lundi, fin]; }
  const debut = new Date(d.getFullYear(), d.getMonth() + decal, 1); return [debut, new Date(debut.getFullYear(), debut.getMonth() + 1, 1)];
}
function frTexteRapport(type, debut, fin, st){
  const titre = type === 'semaine' ? `Rapport de la semaine du ${debut.toLocaleDateString('fr-FR')} au ${new Date(fin - 1).toLocaleDateString('fr-FR')}` : `Rapport du mois de ${debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
  const l = [`**${titre}** · Truck & Coach Hub`, `Kilomètres : ${km(st.km)} (chargé ${km(st.kmCharge)}, à vide ${km(st.kmVide)})`, `Livraisons : ${st.livraisons}`];
  if (st.services) l.push(`Services en car : ${st.services}${st.voyageursConnus ? ` · ${st.voyageurs} voyageurs` : ''}`);
  if (st.carburantConnu) l.push(`Carburant : ${frLitres(st.carburant)}${st.conso != null ? ` · ${st.conso.toFixed(1).replace('.', ',')} L/100 km` : ''}`);
  l.push(`Trajets avec excès de vitesse (mode course) : ${st.course}`);
  if (st.degatsMoy != null) l.push(`Dégâts moyens : ${(st.degatsMoy * 100).toFixed(1).replace('.', ',')} %`);
  l.push(`Revenus : ${frArgent(st.revenus)} · Dépenses : ${frArgent(st.depenses)}`);
  return l.join('\n');
}
function frRenderRapport(type){
  const box = document.getElementById(type === 'semaine' ? 'frSemaine' : 'frMois'); if (!box) return;
  const J = frJournalCache;
  if (!J) { box.innerHTML = '<div class="empty">Le journal des trajets n’est pas disponible.</div>'; return; }
  const decal = type === 'semaine' ? frDecalSemaine : frDecalMois;
  const [debut, fin] = frBornes(type, decal), [pd, pf] = frBornes(type, decal - 1);
  const st = frStatsPeriode(J, debut.getTime(), fin.getTime()), av = frStatsPeriode(J, pd.getTime(), pf.getTime());
  const nom = type === 'semaine' ? `Semaine du ${debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${new Date(fin - 1).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : (s => s.charAt(0).toUpperCase() + s.slice(1))(debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
  const pre = type === 'semaine' ? 'sem' : 'moisr';
  const nav = `<div class="fr-cal-tete"><button type="button" class="btn" data-fr-act="${pre}-" aria-label="${type === 'semaine' ? 'Semaine' : 'Mois'} précédent${type === 'semaine' ? 'e' : ''}">‹</button><h2 class="t-section fr-mois">${escM(nom)}</h2><button type="button" class="btn" data-fr-act="${pre}+" ${decal >= 0 ? 'disabled' : ''} aria-label="${type === 'semaine' ? 'Semaine' : 'Mois'} suivant${type === 'semaine' ? 'e' : ''}">›</button></div>`;
  if (!st.trajets && !st.km) { box.innerHTML = nav + `<div class="empty">Rien d’enregistré ${type === 'semaine' ? 'cette semaine' : 'ce mois-ci'}. Roule avec le plugin du jeu : les chiffres se remplissent tout seuls.</div>`; return; }
  const c = (l, v, e) => `<div class="stat"><span class="muted">${l}</span><b class="t-num">${v}${e || ''}</b></div>`;
  const cartes = [
    c('Kilomètres', km(st.km), frEcart(st.km, av.km)), c('Livraisons', fmt(st.livraisons), frEcart(st.livraisons, av.livraisons)),
    st.services ? c(st.voyageursConnus ? 'Voyageurs' : 'Services en car', fmt(st.voyageursConnus ? st.voyageurs : st.services)) : '',
    st.carburantConnu ? c('Carburant', frLitres(st.carburant), frEcart(st.carburant, av.carburant)) : '',
    st.conso != null ? c('Consommation', st.conso.toFixed(1).replace('.', ',') + ' L/100 km') : '',
    c('Excès de vitesse', fmt(st.course) + ' trajet' + (st.course > 1 ? 's' : '')),
    st.degatsMoy != null ? c('Dégâts moyens', (st.degatsMoy * 100).toFixed(1).replace('.', ',') + ' %') : '',
    c('Revenus', frArgent(st.revenus)), c('Dépenses', frArgent(st.depenses))
  ].join('');
  // Détail : jour par jour (semaine) ou semaine par semaine (mois)
  const lignes = [];
  if (type === 'semaine') for (let i = 0; i < 7; i++) { const a = new Date(debut); a.setDate(debut.getDate() + i); const b = new Date(a); b.setDate(a.getDate() + 1); lignes.push([a.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' }), frStatsPeriode(J, a.getTime(), b.getTime())]); }
  else { let a = new Date(debut); while (a < fin) { const b = new Date(a); b.setDate(a.getDate() + (7 - ((a.getDay() + 6) % 7))); const bb = b > fin ? fin : b; lignes.push([`Du ${a.getDate()} au ${new Date(bb - 1).getDate()}`, frStatsPeriode(J, a.getTime(), bb.getTime())]); a = bb; } }
  const tableau = `<div class="fr-tab-wrap"><table class="fr-table"><caption class="sr-only">Détail ${type === 'semaine' ? 'jour par jour' : 'semaine par semaine'}</caption><thead><tr><th scope="col">${type === 'semaine' ? 'Jour' : 'Semaine'}</th><th scope="col">Km</th><th scope="col">Livraisons</th><th scope="col">Services car</th><th scope="col">Carburant</th></tr></thead>
    <tbody>${lignes.map(([n, s]) => `<tr><th scope="row">${escM(n)}</th><td>${s.km ? km(s.km) : '—'}</td><td>${s.livraisons || '—'}</td><td>${s.services || '—'}</td><td>${s.carburantConnu && s.carburant ? frLitres(s.carburant) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  box.innerHTML = nav + `<div class="stats fr-stats">${cartes}</div>
    <div class="fr-copie"><button type="button" class="btn primary" data-fr-act="copier" data-type="${type}">Copier le rapport</button><span class="muted" role="status" id="frCopie-${type}"></span></div>
    <p class="muted fr-note">${av.trajets || av.km ? 'Les pourcentages comparent avec la période précédente.' : 'Pas de comparaison : rien n’est enregistré sur la période précédente.'} Excès de vitesse = trajets passés en mode « course » (au-delà du seuil réglé dans les Paramètres).</p>
    <div class="panel"><h3 class="t-sous">${type === 'semaine' ? 'Jour par jour' : 'Semaine par semaine'}</h3>${tableau}</div>`;
  box.dataset.texte = frTexteRapport(type, debut, fin, st);
}
async function frCopier(b){
  const type = b.dataset.type, box = document.getElementById(type === 'semaine' ? 'frSemaine' : 'frMois'), out = document.getElementById('frCopie-' + type);
  const t = box.dataset.texte || '';
  let ok = false;
  try { await navigator.clipboard.writeText(t); ok = true; } catch {
    const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; } ta.remove();
  }
  if (out) out.textContent = ok ? 'Rapport copié : colle-le dans Discord.' : 'Copie impossible : sélectionne le texte à la main.';
}
