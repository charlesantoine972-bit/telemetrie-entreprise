/* Espace Entreprise : Vue d'ensemble, Flotte & chauffeurs, Garages, Finances (REFONTE-INTERFACE.md § 4).
   Données : la sauvegarde du profil choisi, lue en LECTURE SEULE par la fonction déjà existante
   window.tel.atelier.summary (la même que Truck & Coach Tools, voir CONTRAT-NOYAU.md) ; « Ce mois-ci »
   vient de la Feuille de route (journal local). Aucune valeur inventée : un champ absent n'est pas affiché.
   La sélection du profil est partagée avec Truck & Coach Tools (atSel, fonctionnalites/outils/outils.js). */

const ENT_USURE_ALERTE = 0.30;   // alerte d'usure au-delà de 30 %
let entLecture = false;

function entEsc(x){ return escM(x == null ? '' : String(x)); }
function entMonnaie(n, jeu){ return Number.isFinite(n) ? nf(Math.round(n)) + (jeu === 'ats' ? ' $' : ' €') : null; }
function entJeuProfil(){ const p = atSel.profiles.find(x => x.id === atSel.profileId); return p ? p.game : null; }
function entSlot(){ return atSel.slots.find(x => x.slot === atSel.slot) || null; }
function entVille(id){ if (!id) return null; const c = typeof cityName === 'function' ? cityName(id) : null; return c || id.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase()); }

// Sélecteur de profil (lecture seule) : même état que Truck & Coach Tools
function entSelecteur(){
  if (!atSel.profiles.length) return '';
  return `<div class="ent-choix" role="group" aria-label="Profil lu">
    <label class="field">Profil<select id="entProf">${atSel.profiles.map(x => `<option value="${entEsc(x.id)}" ${x.id === atSel.profileId ? 'selected' : ''}>${entEsc(x.name)} (${x.game === 'ats' ? 'ATS' : 'ETS2'})</option>`).join('')}</select></label>
    <label class="field">Sauvegarde<select id="entSlot">${atSel.slots.map(x => `<option value="${entEsc(x.slot)}" ${x.slot === atSel.slot ? 'selected' : ''}>${entEsc(x.label)} · ${fmtDate(x.modified)}</option>`).join('')}</select></label>
    <button class="btn primary" id="entLire">${atSel.summary ? 'Relire' : 'Lire la sauvegarde'}</button>
  </div>`;
}
function entBrancherSelecteur(view){
  const p = document.getElementById('entProf'), s = document.getElementById('entSlot'), b = document.getElementById('entLire');
  if (p) p.onchange = async () => { atSel.profileId = p.value; atSel.slots = []; await atLoadSlots(); renderEntreprise(view); };
  if (s) s.onchange = () => { atSel.slot = s.value; atSel.summary = null; renderEntreprise(view); };
  if (b) b.onclick = async () => {
    if (!atSel.profileId || !atSel.slot) return;
    entLecture = true; renderEntreprise(view);
    const r = await window.tel.atelier.summary(atSel.profileId, atSel.slot);
    atSel.summary = r.ok ? r.data : null; atSel.msg = r.ok ? '' : r.error; entLecture = false;
    renderEntreprise(view);
  };
}
// État vide commun : pas d'appli, outil absent, pas de profil, sauvegarde pas encore lue
function entEtatVide(){
  if (typeof HAS_APP !== 'undefined' && !HAS_APP) return 'Ouvre Truck &amp; Coach Hub (l’appli) pour lire ta sauvegarde.';
  if (atSel.info && !atSel.info.available) return 'L’outil de lecture des sauvegardes est introuvable. Réinstalle l’appli ou fais la dernière mise à jour.';
  if (!atSel.profiles.length) return 'Aucun profil trouvé. Lance le jeu une fois et crée un profil, puis reviens ici.';
  if (entLecture) return 'Lecture de la sauvegarde…';
  if (!atSel.summary) return 'Choisis un profil dans l’Atelier (ou ci-dessus), puis lis sa sauvegarde. Rien n’est modifié : la lecture est seule.' + (atSel.msg ? `<br><span class="muted">${entEsc(atSel.msg)}</span>` : '');
  return null;
}
function entChiffre(l, v, aide){ return v == null ? '' : `<div class="stat"><span class="muted">${l}</span><b class="t-num">${v}</b>${aide ? `<span class="muted ent-aide">${aide}</span>` : ''}</div>`; }

async function renderEntreprise(view){
  const box = document.getElementById({ entreprise: 'entVue', flotte: 'entFlotte', garages: 'entGarages', finances: 'entFinances' }[view]);
  if (!box) return;
  if (!atSel.info && typeof atEnsure === 'function') { box.innerHTML = '<div class="empty">Recherche de tes profils…</div>'; await atEnsure(); if (state.view !== view) return; }
  if (!frJournalCache && typeof frChargerJournal === 'function') await frChargerJournal();
  const vide = entEtatVide();
  // Finances : les missions terminées viennent du journal local, elles s'affichent même sans sauvegarde lue.
  if (vide) { box.innerHTML = entSelecteur() + `<div class="empty" role="status">${vide}</div>` + (view === 'finances' ? entMissionsHtml() : ''); entBrancherSelecteur(view); box.querySelectorAll('[data-ent-go]').forEach(b => b.onclick = () => go(b.dataset.entGo)); return; }
  const S = atSel.summary, B = S.bilan || {}, T = S.tools || {}, jeu = entJeuProfil();
  const html = { entreprise: entVueHtml, flotte: entFlotteHtml, garages: entGaragesHtml, finances: entFinancesHtml }[view](S, B, T, jeu);
  box.innerHTML = entSelecteur() + html;
  entBrancherSelecteur(view);
  box.querySelectorAll('[data-ent-go]').forEach(b => b.onclick = () => go(b.dataset.entGo));
}

function entEnTete(S, jeu){
  const slot = entSlot(), info = [];
  if (S.hqCity) info.push(`QG : ${entEsc(entVille(S.hqCity))}`);
  if (Number.isFinite(S.xp) && typeof lvlTruck === 'function') info.push(`Niveau ${lvlTruck(S.xp)}`);
  if (S.profileName) info.push(`Profil : ${entEsc(S.profileName)}`);
  if (slot && slot.modified) info.push(`Sauvegarde du ${fmtDate(slot.modified)}`);
  return `<div class="panel ent-tete"><div class="t-sous">${entEsc(S.companyName || S.profileName || 'Mon entreprise')}</div><div class="muted">${info.join(' · ')}${jeu ? ` · ${jeu === 'ats' ? 'ATS' : 'ETS2'}` : ''}</div></div>`;
}
// Ce mois-ci : depuis la Feuille de route (journal local), seulement si des trajets existent
function entMoisHtml(){
  const J = typeof frJournalCache !== 'undefined' ? frJournalCache : null;
  if (!J || typeof frStatsPeriode !== 'function') return '<p class="muted">Ouvre la Feuille de route une fois pour charger tes trajets du mois.</p>';
  const d = new Date(), debut = new Date(d.getFullYear(), d.getMonth(), 1).getTime(), fin = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  const st = frStatsPeriode(J, debut, fin);
  if (!st.trajets) return '<p class="muted">Aucun trajet enregistré ce mois-ci.</p>';
  return `<div class="stats ent-stats">${entChiffre('Kilomètres', km(st.km))}${entChiffre('Livraisons', fmt(st.livraisons))}${st.services ? entChiffre('Services en car', fmt(st.services)) : ''}${entChiffre('Trajets', fmt(st.trajets))}</div>
    <button class="btn" data-ent-go="feuilleRoute">Ouvrir la Feuille de route</button>`;
}
function entVueHtml(S, B, T, jeu){
  const prets = Array.isArray(B.loans) ? B.loans.length : null;
  const flotte = [B.trucks != null ? `${B.trucks} camion${B.trucks > 1 ? 's' : ''}` : '', B.drivers != null ? `${B.drivers} chauffeur${B.drivers > 1 ? 's' : ''}` : '', B.trailers != null ? `${B.trailers} remorque${B.trailers > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
  return entEnTete(S, jeu) + `
    <div class="stats ent-stats" role="list">
      ${entChiffre('Argent', entMonnaie(S.money, jeu))}
      ${entChiffre('Prêts', B.debt != null ? entMonnaie(B.debt, jeu) : null, prets != null ? `${prets} prêt${prets > 1 ? 's' : ''} en cours` : '')}
      ${entChiffre('Garages', B.garages != null ? fmt(B.garages) : null)}
      ${entChiffre('Flotte', B.trucks != null ? fmt(B.trucks) : null, flotte)}
    </div>
    <div class="ent-grille">
      <div class="panel"><h2 class="t-sous">Flotte par garage</h2>${entParGarage(T, true)}<button class="btn" data-ent-go="flotte">Voir la flotte</button></div>
      <div class="panel"><h2 class="t-sous">Ce mois-ci</h2>${entMoisHtml()}</div>
    </div>`;
}
// Camions regroupés par garage, avec alerte d'usure > 30 % (icône + texte, jamais la couleur seule)
function entParGarage(T, court){
  const camions = Array.isArray(T.trucks) ? T.trucks : [];
  if (!camions.length) return '<p class="muted">Aucun camion dans cette sauvegarde.</p>';
  const groupes = new Map();
  for (const c of camions) { const g = c.garage || ''; if (!groupes.has(g)) groupes.set(g, []); groupes.get(g).push(c); }
  return [...groupes].map(([g, l]) => `<div class="ent-garage"><div class="ent-g-nom">${g ? entEsc(entVille(g)) : 'Sans garage'} <span class="muted">· ${l.length} camion${l.length > 1 ? 's' : ''}</span></div>
    <ul class="ent-liste">${l.slice(0, court ? 6 : 999).map(c => {
      const usure = Number.isFinite(c.wear) ? c.wear : null, alerte = usure != null && usure > ENT_USURE_ALERTE;
      return `<li><span>${entEsc([c.brand, c.model].filter(Boolean).join(' ') || 'Camion')}${c.plate ? ` <span class="muted">· ${entEsc(c.plate)}</span>` : ''}${c.current ? ' <span class="muted">· ton camion</span>' : ''}</span>
        ${usure != null ? `<span class="${alerte ? 'ent-alerte' : 'muted'}">${alerte ? '<span aria-hidden="true">⚠</span> ' : ''}Usure ${Math.round(usure * 100)} %${alerte ? ' : à réparer' : ''}</span>` : ''}</li>`;
    }).join('')}${court && l.length > 6 ? `<li class="muted">+ ${l.length - 6} autre(s)</li>` : ''}</ul></div>`).join('');
}
function entFlotteHtml(S, B, T, jeu){
  const cars = Array.isArray(T.buses) ? T.buses : [];
  return entEnTete(S, jeu) + `
    <div class="stats ent-stats">${entChiffre('Camions', B.trucks != null ? fmt(B.trucks) : null)}${entChiffre('Remorques', B.trailers != null ? fmt(B.trailers) : null)}${entChiffre('Chauffeurs', B.drivers != null ? fmt(B.drivers) : null)}${cars.length ? entChiffre('Cars', fmt(cars.length)) : ''}</div>
    <div class="panel"><h2 class="t-sous">Camions par garage</h2>${entParGarage(T, false)}</div>
    <div class="panel"><h2 class="t-sous">Chauffeurs</h2><p class="muted">La sauvegarde donne aujourd’hui seulement leur nombre${B.drivers != null ? ` (${fmt(B.drivers)})` : ''}. Le détail de chaque chauffeur (nom, compétences) n’est pas encore lu par l’appli.</p></div>`;
}
function entGaragesHtml(S, B, T, jeu){
  const g = T.garages || null;
  const camions = Array.isArray(T.trucks) ? T.trucks : [];
  const parGarage = new Map(); for (const c of camions) if (c.garage) parGarage.set(c.garage, (parGarage.get(c.garage) || 0) + 1);
  return entEnTete(S, jeu) + `
    <div class="stats ent-stats">${entChiffre('Garages achetés', B.garages != null ? fmt(B.garages) : null)}${g ? entChiffre('Petits', fmt(g.small)) + entChiffre('Grands', fmt(g.large)) + entChiffre('Minuscules', fmt(g.tiny)) : ''}</div>
    <div class="panel"><h2 class="t-sous">Garages avec des camions</h2>${parGarage.size ? `<ul class="ent-liste">${[...parGarage].sort((a, b) => b[1] - a[1]).map(([id, n]) => `<li><span>${entEsc(entVille(id))}</span><span class="muted">${n} camion${n > 1 ? 's' : ''}</span></li>`).join('')}</ul>` : '<p class="muted">Aucun camion rangé dans un garage.</p>'}</div>`;
}
function entFinancesHtml(S, B, T, jeu){
  const prets = Array.isArray(B.loans) ? B.loans : [];
  return entEnTete(S, jeu) + `
    <div class="stats ent-stats">${entChiffre('Argent', entMonnaie(S.money, jeu))}${entChiffre('Reste des prêts', B.debt != null ? entMonnaie(B.debt, jeu) : null)}${B.overdraft ? entChiffre('Découvert', 'Oui') : ''}</div>
    <div class="panel"><h2 class="t-sous">Prêts</h2>${prets.length ? `<ul class="ent-liste">${prets.map(l => `<li><span>${entMonnaie(l.amount, jeu) || '—'} restants${l.original ? ` sur ${entMonnaie(l.original, jeu)}` : ''}</span><span class="muted">${[l.months != null ? l.months + ' mois' : '', l.rate != null ? 'taux ' + (l.rate * 100).toFixed(1).replace('.', ',') + ' %' : ''].filter(Boolean).join(' · ')}</span></li>`).join('')}</ul>` : '<p class="muted">Aucun prêt en cours.</p>'}</div>
    ${entMissionsHtml()}`;
}

/* ---------- Finances : missions terminées (journal local, window.tel.journal via la Feuille de route) ----------
   Revenu et dépenses tels que le jeu les a envoyés (docs/DONNEES-DU-JEU.md) ; euros et dollars jamais additionnés. */
function entTotauxPeriodeHtml(titre, jobs){
  const t = depTotaux(jobs), jeux = Object.keys(t).sort();
  if (!jeux.length) return `<div class="ent-periode"><h3 class="ent-g-nom">${titre}</h3><p class="muted">Aucune mission terminée.</p></div>`;
  return `<div class="ent-periode"><h3 class="ent-g-nom">${titre}</h3>${jeux.map(g => `<div class="stats ent-stats">
      ${entChiffre('Missions' + (jeux.length > 1 ? (g === 'ats' ? ' ATS' : ' ETS2') : ''), fmt(t[g].missions))}
      ${entChiffre('Revenus', depMontant(t[g].revenu, g))}${entChiffre('Dépenses', depMontant(t[g].depenses, g), DEP_TYPES.filter(([k]) => t[g].parType[k]).map(([k, l]) => `${l} ${depMontant(t[g].parType[k], g)}`).join(' · '))}
      ${entChiffre('Solde', depMontant(t[g].solde, g))}</div>`).join('')}</div>`;
}
function entMissionsHtml(){
  const J = typeof frJournalCache !== 'undefined' ? frJournalCache : null;
  const titre = '<h2 class="t-sous">Missions terminées</h2>';
  if (!J || typeof depBilanMission !== 'function') return `<div class="panel">${titre}<p class="muted">Le journal des trajets n’est pas disponible pour l’instant.</p></div>`;
  const jobs = (Array.isArray(J.jobs) ? J.jobs : []).filter(j => Number.isFinite(j.ended) && frTermine(j)).sort((a, b) => b.ended - a.ended);
  if (!jobs.length) return `<div class="panel">${titre}<p class="muted">Aucune mission camion ou car terminée pour l’instant. Roule avec le plugin du jeu : chaque mission terminée apparaîtra ici avec son revenu et ses dépenses.</p></div>`;
  const [sd, sf] = depBornes('semaine'), [md, mf] = depBornes('mois');
  const dans = (d, f) => jobs.filter(j => j.ended >= d && j.ended < f);
  const lignes = jobs.slice(0, 20).map(j => {
    const b = depBilanMission(j);
    const detail = DEP_TYPES.filter(([k]) => b.parType[k]).map(([k, l]) => `${l} ${depMontant(b.parType[k], b.jeu)}`).join(' · ');
    const dep = b.depenses == null ? '—' : b.depenses === 0 ? 'Aucune' : depMontant(b.depenses, b.jeu) + (detail ? `<div class="muted ent-aide">${entEsc(detail)}</div>` : (b.detailConnu ? '' : '<div class="muted ent-aide">détail non enregistré</div>'));
    const signe = b.solde == null ? '' : b.solde < 0 ? ' ent-negatif' : '';
    return `<tr><td>${entEsc(new Date(j.ended).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }))}</td>
      <th scope="row">${entEsc(j.from || '—')} → ${entEsc(j.to || '—')}<div class="muted ent-aide">${frEstCar(j) ? 'Car' : entEsc([j.cargo || 'Camion', Number.isFinite(j.mass) && j.mass > 0 ? (j.mass / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' t' : ''].filter(Boolean).join(' · '))}</div></th>
      <td class="ent-num">${depMontant(b.revenu, b.jeu)}</td><td class="ent-num">${dep}</td><td class="ent-num${signe}">${b.solde == null ? '—' : (b.solde < 0 ? '<span class="sr-only">négatif : </span>' : '') + depMontant(b.solde, b.jeu)}</td></tr>`;
  }).join('');
  return `<div class="panel">${titre}
    <div class="ent-grille">${entTotauxPeriodeHtml('Cette semaine', dans(sd, sf))}${entTotauxPeriodeHtml('Ce mois-ci', dans(md, mf))}</div>
    <div class="fr-tab-wrap"><table class="fr-table ent-table"><caption class="sr-only">Missions terminées : revenu, dépenses et solde</caption>
      <thead><tr><th scope="col">Date</th><th scope="col">Mission</th><th scope="col" class="ent-num">Revenu</th><th scope="col" class="ent-num">Dépenses</th><th scope="col" class="ent-num">Solde</th></tr></thead>
      <tbody>${lignes}</tbody></table></div>
    <p class="muted ent-aide">${jobs.length > 20 ? `Les 20 dernières sur ${jobs.length}. ` : ''}Dépenses = péages, ferries, trains, amendes et pénalités envoyés par le jeu. Le jeu ne transmet ni le prix du carburant ni le coût des réparations : ils ne sont pas comptés. Détail de chaque dépense : Feuille de route → Dépenses.</p>
    <button class="btn" data-ent-go="feuilleRoute">Ouvrir la Feuille de route</button></div>`;
}
