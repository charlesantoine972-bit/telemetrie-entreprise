/* Navigation : espaces (Hub, Marketplace, Tools), barre globale, menu latéral, changement de page (go), repères, pages en préparation.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

let state = { side:'hub', view:'accueil', metric:'total', period:'mois', profile:'lucas' };
/* ---------- navigation ---------- */
const lastView = { hub: 'accueil', market: 'mk-discover', atelier: 'at-saves' };
/* Espace Entreprise : même mécanique que l'espace Paramètres (le menu du Hub est remplacé par le sien, avec Retour) */
const ENT_VIEWS = ['entreprise', 'feuilleRoute', 'flotte', 'garages', 'finances', 'telemetrie'];
let lastEnJeu = 'accueil';   // page « En jeu » où revenir avec Retour
const inEntreprise = () => state.side === 'hub' && ENT_VIEWS.includes(state.view);
function setSide(side){
  state.side = side;
  document.documentElement.dataset.side = side;
  document.querySelectorAll('[data-side-btn]').forEach(b => b.classList.toggle('on', b.dataset.sideBtn === side));
  document.getElementById('navHub').classList.toggle('hidden', side !== 'hub');
  document.getElementById('navMarket').classList.toggle('hidden', side !== 'market');
  // Dans Options, le menu latéral devient le menu des catégories d'options
  const inOpt = typeof state !== 'undefined' && state.view === 'reglages';
  const inEnt = !inOpt && side === 'hub' && ENT_VIEWS.includes(state.view);
  document.getElementById('navHub').classList.toggle('hidden', inOpt || inEnt || side !== 'hub');
  document.getElementById('navEntreprise').classList.toggle('hidden', inOpt || !inEnt);
  document.documentElement.toggleAttribute('data-espace-entreprise', inEnt);
  document.getElementById('navMarket').classList.toggle('hidden', inOpt || side !== 'market');
  document.getElementById('navAtelier').classList.toggle('hidden', inOpt || side !== 'atelier');
  document.getElementById('navOptions').classList.toggle('hidden', !inOpt);
  document.getElementById('navOptBtn').classList.toggle('hidden', inOpt);
  setText('spaceTitle', inOpt ? (typeof railTab !== 'undefined' && railTab === 'settings' ? 'SETTINGS' : 'OPTIONS') : inEnt ? 'Entreprise' : ({ hub: 'HUB', market: 'MARKETPLACE', atelier: toolsName().toUpperCase() }[side] || ''));
  document.querySelectorAll('.spacetile').forEach(t => { if (t.dataset.sideBtn === side) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
}
/* ---------- Burger : panneau des espaces ---------- */
function openSpaces(){
  const p = document.getElementById('spacePanel'); p.classList.remove('hidden');
  document.getElementById('spaceBtn').setAttribute('aria-expanded', 'true');
  const cur = p.querySelector('.spacetile.on') || p.querySelector('.spacetile'); if (cur) cur.focus();
}
function closeSpaces(){
  const p = document.getElementById('spacePanel'); if (p.classList.contains('hidden')) return;
  p.classList.add('hidden'); const b = document.getElementById('spaceBtn'); b.setAttribute('aria-expanded', 'false');
}
function applyCats(){
  for (const [k, open] of Object.entries(catState)) {
    const g = document.getElementById('cat-' + k), btn = document.querySelector(`[data-cat="${k}"]`);
    if (!g || !btn) continue;
    g.classList.toggle('closed', !open); btn.setAttribute('aria-expanded', open); btn.querySelector('.arr').textContent = open ? '▾' : '▸';
  }
}
/* ---------- Nom de l'appli : un seul endroit à changer ---------- */
const APP = { name: 'Truck & Coach Hub', logo: 'T&C' };
/* ---------- Barre globale ---------- */
// Visible sur la page Game et les pages News, Map, Settings, Support ouvertes depuis la barre.
// Dans les espaces (Hub, Marketplace, Truck & Coach Tools) : menu 0.12.0.7 seul.
function syncRailVisibility(){
  const onSel = !document.getElementById('launcher').classList.contains('hidden');
  document.documentElement.classList.toggle('in-space', !onSel && (typeof railTab === 'undefined' || railTab === 'game'));
}
const GAMES_UI = { ets2: { tag: 'ETS2', name: 'Euro Truck Simulator 2' }, ats: { tag: 'ATS', name: 'American Truck Simulator' } };
let railTab = 'game';
let settingsFrom = 'game';
function setRail(t){
  railTab = t; document.documentElement.dataset.rail = t;
  syncRailVisibility();
  document.querySelectorAll('.railbtn').forEach(b => { const on = b.dataset.rail === t; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
}
/* ---------- Menu latéral rétractable (icônes seules) ---------- */
const NAV_MIN = 200, NAV_MAX = 380, NAV_DEF = 264; // seuils de repli : commun/menu-largeur.js
let navAuto = false; // menu réduit automatiquement parce que la fenêtre est étroite
function applyNavMini(mini, save){
  const root = document.documentElement;
  if (mini) root.dataset.nav = 'mini'; else delete root.dataset.nav;
  root.style.setProperty('--navw', mini ? '72px' : navWidth + 'px');
  const t = document.getElementById('navToggle'), lab = mini ? 'Agrandir le menu' : 'Réduire le menu';
  t.setAttribute('aria-label', lab); t.title = lab; t.setAttribute('aria-expanded', mini ? 'false' : 'true');
  const sw = document.getElementById('navMiniSwitch'); if (sw) sw.checked = !!mini;
  // Menu réduit : le nom de chaque page s’affiche au survol
  document.querySelectorAll('.side .navbtn').forEach(b => {
    const name = (b.querySelector('span') || b).textContent.trim();
    if (mini) { b.title = name; b.setAttribute('aria-label', name); } else { b.removeAttribute('title'); b.removeAttribute('aria-label'); }
  });
  if (save) store.set('navMini', !!mini);
}
function setNavWidth(w, save){
  navWidth = Math.round(Math.min(NAV_MAX, Math.max(NAV_MIN, w)));
  if (document.documentElement.dataset.nav !== 'mini') document.documentElement.style.setProperty('--navw', navWidth + 'px');
  const h = document.getElementById('sideResize'); h.setAttribute('aria-valuenow', navWidth); h.setAttribute('aria-valuemin', NAV_MIN); h.setAttribute('aria-valuemax', NAV_MAX);
  if (save) store.set('navWidth', navWidth);
}
// Petite fenêtre : menu réduit tout seul, puis remis comme avant quand la place revient
function autoNav(){
  const narrow = window.innerWidth / (parseFloat(document.documentElement.style.zoom) || 1) < 900; // tient compte de la taille du texte choisie dans l'appli
  if (narrow && document.documentElement.dataset.nav !== 'mini') { navAuto = true; applyNavMini(true); }
  else if (!narrow && navAuto) { navAuto = false; applyNavMini(store.get('navMini', false)); }
}
function resetSpaces(){
  closeSpaces();
  atDirty = false;
  if (typeof atSel !== 'undefined') { atSel.summary = null; atSel.msg = ''; }
  document.querySelectorAll('.atbody').forEach(b => { b.innerHTML = ''; });
  const f = document.getElementById('atFloat'); if (f) f.classList.add('hidden');
  Object.assign(lastView, { hub: 'accueil', market: 'mk-discover', atelier: 'at-saves' });
  state.side = 'hub';
}
function go(view, rail){
  if (view !== 'cartePerso' && window.tel && window.tel.tchMap) window.tel.tchMap.visible(false);
  state.view = view;
  // Onglet de la barre globale : celui demandé, sinon Settings pour les Options, Support, ou Game (espaces du jeu)
  if (typeof setRail === 'function') setRail(rail || (view === 'support' ? 'support' : 'game'));
  const side = (view === 'reglages' || view === 'support') ? state.side : (view.startsWith('mk-') ? 'market' : view.startsWith('at-') ? 'atelier' : 'hub');
  if (view !== 'reglages' && view !== 'support' && !rail) lastView[side] = view;
  if (side === 'hub' && !ENT_VIEWS.includes(view)) lastEnJeu = view;
  setSide(side);
  // ouvre la catégorie qui contient la page demandée
  for (const k of Object.keys(catState)) { const g = document.getElementById('cat-' + k); if (g && g.querySelector(`[data-view="${view}"]`) && !catState[k]) { catState[k] = true; applyCats(); } }
  const navView = view.startsWith('mk-item:') ? mkFrom : view;
  document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('on', b.dataset.view === navView));
  const secId = view.startsWith('mk-cat:') ? 'mk-cat' : view.startsWith('mk-item:') ? 'mk-item' : view;
  document.querySelectorAll('main > section').forEach(sec => sec.classList.toggle('hidden', sec.id !== 'v-' + secId));
  if (view.startsWith('mk-cat:')) renderMkCat(view.slice(7));
  if (view.startsWith('mk-item:')) renderMkItem(view.slice(8)); else if (view.startsWith('mk-')) mkFrom = view;
  if (view === 'mk-discover') renderMk();
  if (view === 'mk-news') renderMkNews();
  if (view === 'news') renderNewsPage();
  if (view === 'hud') renderHudPage();
  if (view === 'feuilleRoute') frOuvrirOnglet(frOnglet);
  if (['entreprise', 'flotte', 'garages', 'finances'].includes(view)) renderEntreprise(view);
  if (view === 'cartePerso') openMap();
  if (view === 'reglages') loadSettingsUI();
  if (view === 'at-saves') renderSaves();
  if (view === 'at-mods') renderMods();
  atFloatShow(false);
  if (AT_PAGES.includes(view)) atEnsure().then(() => renderAtPage(view));
  if (view === 'at-jeu') renderConsole();
  document.querySelector('main').scrollTop = 0;
  pageMarks(view);
  document.querySelectorAll('.navbtn[data-view]').forEach(b => { if (b.classList.contains('on')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (view === 'reglages') openOptCat(optCat);
  const h = document.querySelector('main > section:not(.hidden) h1'); const title = h ? h.textContent.trim() : '';
  if (title) { document.title = title + ' · ' + APP.name + (/-beta/i.test(new URLSearchParams(location.search).get('v') || '') ? ' Bêta' : ''); announce('Page ' + title); }
}
/* ---------- Repères de navigation ---------- */
const reduceMotion = () => document.documentElement.dataset.motion === 'reduit' || matchMedia('(prefers-reduced-motion: reduce)').matches;
const SIDE_NAMES = { hub: 'Hub', market: 'Marketplace', atelier: 'Truck & Coach Tools' };
let navIndex = -1;
function reveal(root){
  if (!root || !revealObs || reduceMotion()) return;
  const items = [...root.querySelectorAll('.panel, .optgroup, .stat, .lcard, .tcard')].filter(el => !el.parentElement.closest('.panel, .optgroup, .tcard') && el.offsetParent !== null);
  const fold = document.getElementById('mainContent').clientHeight;
  let k = 0;
  for (const el of items) {
    el.classList.remove('in'); el.classList.add('rv');
    el.style.setProperty('--rd', el.getBoundingClientRect().top < fold ? Math.min(k++, 6) * 0.045 + 's' : '0s');
    revealObs.observe(el);
  }
}
function pageMarks(view){
  const main = document.getElementById('mainContent');
  const sec = main.querySelector(':scope > section:not(.hidden)');
  // Fil d'Ariane : espace › catégorie (le nom de la page apparaît en haut quand on fait défiler)
  const parts = [];
  const RAIL_NAMES = { news: 'News', map: 'Map', support: 'Support' };
  if (RAIL_NAMES[railTab]) parts.push(RAIL_NAMES[railTab]);
  else if (view === 'reglages') parts.push(railTab === 'settings' ? 'Settings' : (typeof optMode !== 'undefined' && optMode === 'game' ? 'Paramètres ' + GAMES_UI[activeGame === 'ats' ? 'ats' : 'ets2'].tag : 'Options'));
  else {
    parts.push(SIDE_NAMES[state.side] || '');
    const btn = document.querySelector(`.side .navscroll:not(.hidden) .navbtn.on`);
    const grp = btn && btn.closest('.navgroup');
    const lab = grp && grp.getAttribute('aria-labelledby') && document.getElementById(grp.getAttribute('aria-labelledby'));
    const cat = inEntreprise() ? 'Entreprise' : lab ? lab.textContent : grp && grp.previousElementSibling && grp.previousElementSibling.matches('.navcat') ? grp.previousElementSibling.querySelector('span').textContent : '';
    if (cat) parts.push(cat);
  }
  const clean = parts.filter(Boolean);
  document.getElementById('pbCrumb').innerHTML = clean.map((p, i) => `<span class="${i === clean.length - 1 ? 'cur' : ''}">${escM(p)}</span>`).join('<i>›</i>');
  const h = sec && sec.querySelector('h1');
  const optCatName = view === 'reglages' ? ((document.querySelector('#optNav [data-oc].on span') || {}).textContent || '') : '';
  setText('pbTitle', optCatName || (h ? h.textContent.replace(/\s+/g, ' ').trim().replace(/ (En attente du jeu|Euro Truck Simulator 2.*|American Truck Simulator.*)$/, '') : ''));
  if (!sec) return;
  // Transition : la page arrive du côté où se trouve son entrée dans le menu
  const all = [...document.querySelectorAll('.side .navbtn[data-view]')];
  const idx = all.findIndex(b => b.classList.contains('on'));
  sec.style.setProperty('--dx', reduceMotion() || navIndex < 0 || idx === navIndex ? '0px' : idx > navIndex ? '18px' : '-18px');
  navIndex = idx;
  if (!reduceMotion()) { sec.classList.remove('enter'); void sec.offsetWidth; sec.classList.add('enter'); }
  main.classList.remove('scrolled');
  reveal(sec);
}
/* ---------- Pages en préparation (masquées par défaut) ---------- */
function applySoon(show, save){
  store.set('showSoon', !!show);
  if (show) delete document.documentElement.dataset.hideSoon; else document.documentElement.dataset.hideSoon = '1';
  document.getElementById('soonSwitch').checked = !!show;
  if (!show && typeof optCat !== 'undefined' && typeof catVisible === 'function' && !catVisible(optCat)) openOptCat('general');   // page de paramètres en préparation
  if (save && window.tel) window.tel.setSettings({ showSoon: !!show });
}
