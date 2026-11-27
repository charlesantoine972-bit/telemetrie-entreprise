/* Paramètres : catégories, paramètres généraux / du jeu, mode dossiers, recherche, plugin, programme bêta.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

function openOptCat(cat){
  if (!document.getElementById('oc-' + cat) || (typeof catVisible === 'function' && !catVisible(cat))) cat = 'general';   // page absente ou en préparation masquée
  optCat = cat; store.set('optCat', cat);
  document.querySelectorAll('#optNav [data-oc]').forEach(b => { const on = b.dataset.oc === cat; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
  document.querySelectorAll('#navOptions [data-oc]').forEach(b => { const on = b.dataset.oc === cat; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  document.querySelectorAll('.optcat').forEach(c => c.classList.toggle('on', c.id === 'oc-' + cat));
  if (cat === 'hud') setTimeout(() => renderHudPage(), 0); // hudSt est prêt après le chargement
  if (typeof state !== 'undefined' && state.view === 'reglages') setTimeout(() => { pageMarks('reglages'); }, 0);
}
/* ---------- Bêta : paramètres généraux et paramètres du jeu ---------- */
const OPT_GAME = ['jeu', 'conduite', 'hud'];
let optMode = 'general';
const carWord = () => activeGame === 'ats' ? 'Road Trip' : 'Car';
function syncOptMode(){
  optMode = OPT_GAME.includes(optCat) ? 'game' : 'general';
  lastOptCat[optMode] = optCat; store.set('lastOptCat', lastOptCat);
  document.querySelectorAll('#optNav [data-oc], #navOptions [data-oc]').forEach(b => b.classList.toggle('hidden', OPT_GAME.includes(b.dataset.oc) !== (optMode === 'game')));
  const g = activeGame === 'ats' ? 'ats' : 'ets2', u = GAMES_UI[g], o = GAMES_UI[g === 'ats' ? 'ets2' : 'ats'];
  const h = document.querySelector('#v-reglages > h1'); if (h) h.textContent = optMode === 'game' ? 'Paramètres ' + u.tag : 'Paramètres généraux';
  document.getElementById('optGameBar').classList.toggle('hidden', optMode !== 'game');
  setText('optGameTag', u.tag); setText('optGameName', u.name); setText('optCopyGame', 'Copier depuis ' + o.tag);
  const sw = document.getElementById('optSwitchMode');
  if (sw) sw.querySelector('span').textContent = optMode === 'game' ? 'Paramètres généraux' : 'Paramètres ' + u.tag;
  if (typeof state !== 'undefined' && state.view === 'reglages') setText('spaceTitle', optMode === 'game' ? 'PARAMÈTRES ' + u.tag : 'PARAMÈTRES');
}
function openGameSettings(){ openOptCat(lastOptCat.game); go('reglages'); }
// Réglages du jeu choisi : chargés côté appli (HUD, seuils, unités), puis l'interface suit
async function loadGameSettings(g){
  applyGameLabels(g);
  if (!HAS_APP || !window.tel.setGame) return;
  const st = await window.tel.setGame(g);
  reloadGameUI(st);
}
function reloadGameUI(st){
  if (!st) return;
  UNITS.set(st.units); syncUnitsUI(); UNITS.label(document); syncAtelierSwitches(st);
  if (typeof hudSt !== 'undefined') { hudSt.on = !!(st.modules && st.modules.hud); for (const p of ['truck', 'bus']) Object.assign(hudSt[p], st.hud && st.hud[p] || {}); if (state.view === 'hud' || optCat === 'hud') renderHudPage(); }
  if (state.view === 'reglages') loadSettingsUI();
  syncOptMode();
}
function syncUnitsUI(){
  document.querySelectorAll('#unitsSeg [data-units]').forEach(b => { const on = b.dataset.units === UNITS.mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  UNITS.label(document);
}
// ATS : le transport de voyageurs s'appelle Road Trip (DLC d'ATS), pas Car
function applyGameLabels(g){
  const w = g === 'ats' ? 'Road Trip' : 'Car';
  const tt = document.querySelector('#telTabs [data-tt="bus"]'); if (tt) tt.textContent = w;
  const rt = document.querySelector('[data-rt="bus"]'); if (rt && rt.firstChild) rt.firstChild.nodeValue = w + ' ';
  const op = document.querySelector('#sType option[value="car"]'); if (op) op.textContent = g === 'ats' ? 'Road Trip' : 'Car / bus';
  setText('sCarLab', 'Seuil ' + (g === 'ats' ? 'Road Trip' : 'car'));
  const ct = document.querySelector('#v-at-coach h1'); if (ct) ct.textContent = g === 'ats' ? 'Road Trip Tools' : 'Coach Tools';
  const nc = document.querySelector('.navbtn[data-view="at-coach"] span'); if (nc) nc.textContent = g === 'ats' ? 'Road Trip Tools' : 'Coach Tools';
  const tn = toolsName(g);
  SIDE_NAMES.atelier = tn;
  const tb = document.querySelector('#sideBtnAtelier b'); if (tb) tb.textContent = tn;
  const td = document.querySelector('#sideBtnAtelier .st-txt > span:last-child'); if (td) td.textContent = 'Sauvegardes, camions, remorques, profil et ' + (g === 'ats' ? 'Road Trip.' : 'cars.');
  const na = document.getElementById('navAtelier'); if (na) na.setAttribute('aria-label', tn);
  if (state.side === 'atelier' && state.view !== 'reglages') setText('spaceTitle', tn.toUpperCase());
  const hb = document.getElementById('hudTestBus'); if (hb) { hb.textContent = g === 'ats' ? 'Tester le HUD Road Trip' : 'Tester le HUD bus'; const h2 = hb.parentElement.querySelector('h2'); if (h2) h2.textContent = g === 'ats' ? 'Bandeau Road Trip' : 'Bandeau car'; }
  document.querySelectorAll('#oc-hud .optgroup > h3').forEach(h => { if (/^Bandeau (car|Road Trip)$/.test(h.textContent)) h.textContent = g === 'ats' ? 'Bandeau Road Trip' : 'Bandeau car'; });
}
/* ---------- Mode Paramètres : dossiers dans la barre + recherche ---------- */
// Depuis Settings (barre de l'accueil), la barre de gauche se transforme : Retour, puis les dossiers de réglages.
// La colonne d'à côté montre la recherche et les catégories du dossier choisi.
const SET_FOLDERS = {
  compte: ['compte'],
  appli: ['general', 'affichage', 'acces', 'notifs', 'raccourcis', 'langue', 'audio'],
  jeu: ['jeu', 'conduite', 'hud'],
  connexions: ['integrations'],
  donnees: ['maj', 'donnees', 'gestion'],
  aide: ['aide', 'avance'],
};
const folderOf = cat => Object.keys(SET_FOLDERS).find(f => SET_FOLDERS[f].includes(cat)) || 'appli';
const catVisible = cat => { const el = document.getElementById('oc-' + cat); return !!el && !(el.classList.contains('is-soon') && document.documentElement.dataset.hideSoon); };
function syncSettingsRail(){
  const inRail = railTab === 'settings';
  const f = folderOf(optCat);
  document.querySelectorAll('.rail-settings [data-srail]').forEach(b => {
    const on = inRail && b.dataset.srail === f;
    b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    if (SET_FOLDERS[b.dataset.srail]) b.classList.toggle('hidden', !SET_FOLDERS[b.dataset.srail].some(catVisible));
  });
  if (!inRail) return;
  // Dans le mode Paramètres : seulement les catégories du dossier ouvert
  document.querySelectorAll('#navOptions [data-oc]').forEach(b => b.classList.toggle('hidden', !SET_FOLDERS[f].includes(b.dataset.oc)));
  const sw = document.getElementById('optSwitchMode'); if (sw) sw.classList.add('hidden');
  const t = document.getElementById('optFolderTitle'); if (t) t.textContent = ({ compte: 'Compte', appli: 'Appli', jeu: 'Jeu · ' + GAMES_UI[activeGame === 'ats' ? 'ats' : 'ets2'].tag, connexions: 'Liens', donnees: 'Données', aide: 'Aide' })[f];
}
function openFolder(f){
  const cats = SET_FOLDERS[f].filter(catVisible);
  const pick = cats.includes(lastOptCat['f_' + f]) ? lastOptCat['f_' + f] : cats[0];
  if (pick) openOptCat(pick);
  document.querySelector('main').scrollTop = 0;
}
function leaveSettings(){ document.getElementById('optBack').click(); }
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Index de la recherche. Les réglages « Bientôt disponible » (pages en préparation) sont trouvables, avec la mention ;
// si les pages en préparation sont masquées, le résultat mène à l'interrupteur qui les affiche.
function optIndex(){
  const out = [], soonCache = !!document.documentElement.dataset.hideSoon;
  const soonRow = (document.getElementById('soonSwitch') || { closest: () => null }).closest('.setrow');
  document.querySelectorAll('#v-reglages .optcat').forEach(cat => {
    const id = cat.id.replace(/^oc-/, '');
    const cname = (cat.querySelector('.ochead h2') || {}).textContent || id;
    cat.querySelectorAll('.setrow').forEach(r => {
      const b = r.querySelector('.lab b'); if (!b) return;
      if (r.closest('.hidden')) return;                        // réglage caché (ex. mode développeur pas débloqué)
      const soon = !!r.closest('.is-soon, [data-bientot]');
      if (!soon && !catVisible(id)) return;
      const h3 = r.closest('.optgroup') && r.closest('.optgroup').querySelector('h3');
      const group = h3 ? (h3.firstChild ? h3.firstChild.textContent : h3.textContent).trim() : '';
      const d = (r.querySelector('.lab span') || {}).textContent || '';
      const path = cname + (group ? ' › ' + group : '') + (soon ? ' · Bientôt disponible' : '');
      const hay = norm(b.textContent + ' ' + d + ' ' + group + ' ' + cname + (soon ? ' bientot disponible' : ''));
      if (soon && soonCache && r.closest('.is-soon')) {
        if (soonRow) out.push({ cat: 'affichage', el: soonRow, title: b.textContent.trim(), path: path + ' (active « Pages en préparation » pour la voir)', hay });
      } else out.push({ cat: id, el: r, title: b.textContent.trim(), path, hay });
    });
  });
  return out;
}
function runOptSearch(){
  const q = norm(document.getElementById('optQuery').value).trim(), res = document.getElementById('optResults');
  const cats = [...document.querySelectorAll('#navOptions [data-oc]')], title = document.getElementById('optFolderTitle');
  if (!q) { res.classList.add('hidden'); res.innerHTML = ''; title.classList.remove('hidden'); cats.forEach(b => b.style.display = ''); return; }
  cats.forEach(b => b.style.display = 'none'); title.classList.add('hidden');
  const words = q.split(/\s+/);
  const hits = optIndex().filter(x => words.every(w => x.hay.includes(w))).sort((a, b) => (norm(b.title).includes(words[0]) ? 1 : 0) - (norm(a.title).includes(words[0]) ? 1 : 0)).slice(0, 30);
  res.classList.remove('hidden');
  res.innerHTML = hits.length ? hits.map((h, i) => `<button role="option" data-hit="${i}"><b>${escM(h.title)}</b><span>${escM(h.path)}</span></button>`).join('') : '<div class="none">Aucun réglage trouvé.</div>';
  res.querySelectorAll('[data-hit]').forEach(b => b.onclick = () => {
    const h = hits[Number(b.dataset.hit)];
    document.getElementById('optQuery').value = ''; runOptSearch();
    openOptCat(h.cat);
    const g = h.el.closest('details'); if (g) g.open = true;
    setTimeout(() => { h.el.scrollIntoView({ block: 'center', behavior: 'smooth' }); h.el.classList.remove('flash'); void h.el.offsetWidth; h.el.classList.add('flash'); const f = h.el.querySelector('input,select,button'); if (f) f.focus({ preventScroll: true }); }, 60);
  });
}
function renderPlugin(list, msg){
  const el = document.getElementById('pluginList');
  if (!HAS_APP){ el.innerHTML = '<div class="soft">Disponible dans l\'application installée.</div>'; return; }
  el.innerHTML = list.length ? list.map(g => `<div class="item" style="cursor:default">
      <span style="font-size:20px;color:${g.status==='ok'?'var(--ok)':'var(--race)'}">${g.status==='ok'?'✓':'!'}</span>
      <div class="grow"><b>${g.name}</b><div class="muted" style="font-size:12px;overflow:hidden;text-overflow:ellipsis">${g.bin}</div></div>
      <span class="soft" style="font-size:13px;text-align:right">${g.message}</span></div>`).join('')
    : '<div class="soft">Aucun jeu trouvé automatiquement. Clique sur « Choisir le dossier du jeu… » et sélectionne le dossier d\'Euro Truck Simulator 2.</div>';
  const okCount = list.filter(g => g.status === 'ok').length;
  const pc = !HAS_APP ? ['var(--muted)', 'disponible dans l\'appli'] : okCount ? ['var(--ok)', 'installé'] : list.length ? ['var(--race)', 'à vérifier'] : ['var(--race)', 'jeu introuvable'];
  document.getElementById('hPlugin').innerHTML = `<span class="d" style="background:${pc[0]}"></span>Plugin : ${pc[1]}`;
  const w = document.getElementById('waitPlugin');
  const ok = list.filter(g => g.status === 'ok').map(g => g.name);
  w.textContent = ok.length ? 'Plugin installé pour : ' + ok.join(', ') + '.' : 'Plugin pas encore installé : va dans Options → Jeu & plugin.';
  if (msg !== undefined) setText('pluginMsg', msg);
}
async function loadSettingsUI(){
  if (!HAS_APP) return;
  const st = await window.tel.getSettings();
  document.getElementById('sPseudo').value = st.pseudo || '';
  document.getElementById('sType').value = st.vehicleType;
  UNITS.set(st.units); syncUnitsUI();
  document.getElementById('sTruck').value = Math.round(UNITS.fromKmh(st.limitTruck));
  document.getElementById('sCar').value = Math.round(UNITS.fromKmh(st.limitCar));
  document.getElementById('sPct').value = st.racePct;
  document.getElementById('steamId').value = st.steamId || '';
  document.getElementById('discordClientId').value = st.discordClientId || '';
  const integrationStatus = await window.tel.integrationStatus();
  setText('steamStatus', integrationStatus.steamKeyConfigured ? 'Clé Steam chiffrée enregistrée sur cet appareil.' : 'Aucune clé enregistrée.');
  renderPlugin(await window.tel.pluginStatus());
}
async function refreshPseudo(){
  if (!HAS_APP) return;
  const st = await window.tel.getSettings();
  setText('pName', st.pseudo || 'Choisis ton pseudo');
  setText('pAvatar', st.pseudo ? st.pseudo.replace(/[^A-Za-z0-9À-ÿ]/g, '').slice(0, 2).toUpperCase() || '?' : '?');
}
// Programme bêta (Options → Interface → Éléments visibles) : ne fait qu'afficher, n'installe rien
function applyBeta() {
  const sw = document.getElementById('betaSwitch'), on = betaOn();
  sw.checked = on; sw.disabled = APP_BETA;
  if (APP_BETA) setText('betaDesc', 'Tu utilises Truck & Coach Hub Bêta : le programme reste activé. Les notes s’ouvrent sur la bêta, l’onglet « Version officielle » montre celles de l’appli normale.');
  document.getElementById('betaDlRow').classList.toggle('hidden', !on || APP_BETA);
  renderNotes(v);
}
