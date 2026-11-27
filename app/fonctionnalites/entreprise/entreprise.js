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
  if (vide) { box.innerHTML = entSelecteur() + `<div class="empty" role="status">${vide}</div>`; entBrancherSelecteur(view); return; }
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
      <div class="panel"><h2 class="t-sous">Flotte &amp; chauffeurs par garage</h2>${entParGarage(T, true)}<button class="btn" data-ent-go="flotte">Voir la flotte</button></div>
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
    <div class="panel"><h2 class="t-sous">Revenus et dépenses</h2>${entMoisHtml()}<p class="muted">L’historique de la banque du jeu n’est pas lu par l’appli : les revenus détaillés sont dans la Feuille de route (Rapport du mois).</p></div>`;
}
