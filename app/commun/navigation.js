/* Navigation : espaces (Hub, Marketplace, Tools), barre globale, menu latéral, changement de page (go), repères, pages en préparation.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

let state = { side:'hub', view:'accueil', metric:'total', period:'mois', profile:'lucas' };
/* ---------- navigation ---------- */
const SOON = {
  _cartePerso: { t: 'Carte', d: "La vraie carte d'Euro Truck Simulator 2, avec ton camion en direct.", l: ['Ta position en direct sur la carte du jeu', 'Destination, distance et temps restants', 'Tracé de tes trajets terminés'], w: 'Prévu à l\'étape 1.3.' },
  _vtc: { t: 'Ma VTC', d: 'La vue d\'ensemble de ton entreprise.', l: ['Kilomètres et livraisons de toute l\'entreprise', 'Chauffeurs en ligne', 'Objectif collectif du mois', 'Événement du jour'], w: 'Prévu avec la partie en ligne (étape 2).' },
  '_at-profil': { t: 'Profil', d: 'Modifier ton profil solo.', l: ['Argent du compte', 'Points d\'expérience et niveau', 'Ville du QG'], w: 'Prévu dans une prochaine version de Truck & Coach Tools. Une copie de secours sera faite avant chaque modification.' },
  '_at-carte': { t: 'Carte', d: 'Découvrir la carte d\'un coup.', l: ['Marquer les villes comme visitées', 'Débloquer les concessionnaires', 'Débloquer les agences de recrutement'], w: 'Prévu dans une prochaine version de Truck & Coach Tools.' },
  '_at-camion': { t: 'Camion & remorque', d: 'Ajuster ton camion et ta remorque.', l: ['Poids de la cargaison (simple et double remorque)', 'Carburant', 'Configuration du moteur'], w: 'Prévu dans une prochaine version de Truck & Coach Tools.' },
  '_at-repar': { t: 'Réparation', d: 'Remettre ton matériel à neuf.', l: ['Usure du moteur et de la boîte', 'Cabine et châssis', 'Roues', 'Caisse de la remorque'], w: 'Prévu dans une prochaine version de Truck & Coach Tools.' },
  calendrier: { t: 'Calendrier', d: 'Le calendrier de ton entreprise : convois, événements et rendez-vous du mois.', l: ['Vue du mois avec tous les événements', 'Détail d\'un événement : rendez-vous, départ, trajet, mods requis', 'Inscription en un clic', 'Rappel avant le départ'], w: 'Prévu avec la partie en ligne (étape 2).' },
  convois: { t: 'Convois & événements', d: 'Le calendrier des convois de ton entreprise, avec les inscriptions.', l: ['Calendrier du mois', 'Détail d\'un convoi : rendez-vous, départ, trajet', 'Inscription / désinscription en un clic', 'Rappel avant le départ'], w: 'Prévu avec la partie en ligne (étape 2).' },
  defis: { t: 'Défis & duels', d: 'Lance des défis à tes collègues et fixe-toi des objectifs.', l: ['Objectifs personnels (semaine / mois)', 'Duels entre chauffeurs (distance, gains, livraisons)', 'Défis entreprise contre entreprise', 'Célébrations des paliers atteints'], w: 'Prévu avec la partie en ligne (étape 2).' },
  missions: { t: 'Missions partagées', d: 'Envoie des missions et des feuilles de route à tes collègues.', l: ['Envoyer une mission à un chauffeur', 'Boucles et circuits en plusieurs étapes', 'Feuille de route en PDF'], w: 'Prévu avec la partie en ligne (étape 2).' },
  infos: { t: 'Infos VTC', d: 'La présentation de ton entreprise.', l: ['Histoire et règles de l\'entreprise', 'Conseils et FAQ', 'Liste des membres'], w: 'Prévu avec la partie en ligne (étape 2).' },
  _hud: { t: 'HUD', d: 'Un petit affichage discret par-dessus le jeu : vitesse, limitation, mode réel / course, distance restante.', l: ['Activable / désactivable avec l\'interrupteur du menu « En jeu »', 'Logo : celui de l\'appli, de ton entreprise ou aucun', 'Choix des infos affichées, position, taille, transparence', 'Alerte en cas d\'excès de vitesse'], w: 'Prévu à l\'étape 1.2. Le jeu doit être en « plein écran fenêtré ».' },
  gps: { t: 'Mini-GPS', d: 'Un petit GPS discret en jeu, style TomTom.', l: ['Module complémentaire facultatif, à installer depuis Options', 'Destination, distance et temps restants', 'Limitation de vitesse'], w: 'Prévu à l\'étape 1.4.' }
};
const SOON_ICONS = {"at-profil": "<path d=\"M17.75 14C19 14 20 15 20 16.25v.57c0 .9-.32 1.76-.9 2.44Q16.74 22.01 12 22q-4.74.01-7.1-2.74a3.8 3.8 0 0 1-.9-2.43v-.58C4 15 5.01 14 6.25 14zm0 1.5H6.25a.75.75 0 0 0-.75.75v.58c0 .53.2 1.05.54 1.46C7.3 19.76 9.26 20.5 12 20.5q4.09 0 5.96-2.21c.35-.41.54-.93.54-1.47v-.57a.75.75 0 0 0-.75-.75M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7\"/>", "at-carte": "<path d=\"M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m2.94 14.5H9.06c.65 2.41 1.79 4 2.94 4s2.29-1.59 2.94-4m-7.43 0H4.79a8.5 8.5 0 0 0 4.09 3.41q-.79-1.25-1.27-3.02zm11.7 0H16.5c-.32 1.33-.79 2.5-1.37 3.41a8.5 8.5 0 0 0 3.9-3.13zM7.1 10H3.74v.02a8.5 8.5 0 0 0 .3 4.98h3.18a20 20 0 0 1-.13-5m8.3 0H8.6a19 19 0 0 0 .14 5h6.52a19 19 0 0 0 .14-5m4.87 0h-3.35a21 21 0 0 1-.13 5h3.18a8.5 8.5 0 0 0 .3-5M8.88 4.09h-.02a8.5 8.5 0 0 0-4.61 4.4l3.05.01c.31-1.75.86-3.28 1.58-4.41m3.12-.6-.12.01c-1.26.12-2.48 2.12-3.05 5h6.34c-.56-2.87-1.78-4.87-3.04-5zm3.12.6.1.17A13 13 0 0 1 16.7 8.5h3.05a8.5 8.5 0 0 0-4.34-4.29z\"/>", "at-camion": "<path d=\"M7.75 6a.75.75 0 0 0-.75.75v4.5c0 .41.34.75.75.75h5.5c.41 0 .75-.34.75-.75v-4.5a.75.75 0 0 0-.75-.75zm.75 4.5v-3h4v3zM6.75 3A2.75 2.75 0 0 0 4 5.75V20.5h-.25a.75.75 0 0 0 0 1.5h13.5a.75.75 0 0 0 0-1.5H17v-1.8q.57.3 1.25.3A2.75 2.75 0 0 0 21 16.25v-5.83c0-.6-.2-1.18-.55-1.65l-1.1-1.47a.75.75 0 0 0-1.2.9l1.1 1.47q.25.33.25.75v5.83a1.24 1.24 0 1 1-2.49 0V14.5l-.01-.12V5.75A2.75 2.75 0 0 0 14.25 3zm8.75 17.5h-10V5.75c0-.69.56-1.25 1.25-1.25h7.5c.7 0 1.25.56 1.25 1.25z\"/>", "at-repar": "<path d=\"M11 7.5a5.5 5.5 0 0 1 7.66-5.06.75.75 0 0 1 .24 1.22L16.3 6.25l1.44 1.44 2.59-2.59a.75.75 0 0 1 1.22.24 5.49 5.49 0 0 1-6.35 7.5l-8.3 8.32a2.87 2.87 0 1 1-4.07-4.06l8.31-8.31Q11 8.16 11 7.5m5.5-4a4 4 0 0 0-3.8 5.27c.1.27.03.57-.18.77L3.9 18.16a1.37 1.37 0 0 0 1.94 1.94l8.63-8.62c.2-.2.5-.27.76-.18a4 4 0 0 0 5.25-4.22l-1.85 1.85c-.48.48-1.28.48-1.76 0l-1.8-1.8a1.25 1.25 0 0 1 0-1.76l1.85-1.85z\"/>", "calendrier": "<path d=\"M17.75 3C19.55 3 21 4.46 21 6.25v11.5c0 1.8-1.46 3.25-3.25 3.25H6.25A3.25 3.25 0 0 1 3 17.75V6.25C3 4.45 4.46 3 6.25 3zm1.75 5.5h-15v9.25c0 .97.78 1.75 1.75 1.75h11.5c.97 0 1.75-.78 1.75-1.75zm-11.75 6a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5m4.25 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5m-4.25-4a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5m4.25 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5m4.25 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5m1.5-6H6.25c-.97 0-1.75.78-1.75 1.75V7h15v-.75c0-.97-.78-1.75-1.75-1.75\"/>", "cartePerso": "<path d=\"M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m0 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17m0 7c.41 0 .75.34.75.75v5a.75.75 0 0 1-1.5 0v-5c0-.41.34-.75.75-.75M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2\"/>", "vtc": "<path d=\"M6.25 3.5a.75.75 0 0 0-.75.75V20.5h2v-2.75c0-.69.56-1.25 1.25-1.25h6.5c.69 0 1.25.56 1.25 1.25v2.75h2v-8.75a.75.75 0 0 0-.75-.75h-2a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 0-.75-.75zM9 18v2.5h2.25V18zm3.75 0v2.5H15V18zm6.5 4H4.75a.75.75 0 0 1-.75-.75v-17C4 3.01 5 2 6.25 2h8c1.24 0 2.25 1 2.25 2.25V9.5h1.25c1.24 0 2.25 1 2.25 2.25v9.5c0 .41-.34.75-.75.75M7.5 6.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0m1 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2m0-3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2M12 5.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m0 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2m3.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2M12 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2\"/>", "convois": "<path d=\"M4.25 3C3.01 3 2 4 2 5.25v12c0 1.17.9 2.13 2.04 2.24a3 3 0 0 0 5.92.01h2.08a3 3 0 0 0 5.92 0h1.79c1.24 0 2.25-1 2.25-2.25v-5.41q0-.5-.22-.97l-1.7-3.58A2.3 2.3 0 0 0 18.05 6H16.5v-.75c0-1.24-1-2.25-2.25-2.25zm13.58 15a3 3 0 0 0-1.33-1.6v-3.9h4v3h-1.25a.75.75 0 1 0 0 1.5h1.25v.25c0 .41-.34.75-.75.75zM15 16a3 3 0 0 0-2.83 2H9.83a3 3 0 0 0-5.66 0 .75.75 0 0 1-.67-.75v-12c0-.41.34-.75.75-.75h10c.41 0 .75.34.75.75zm1.5-8.5h1.55q.47.02.68.43L20.18 11H16.5zM7 20.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m9.5-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0\"/>", "defis": "<path d=\"M15.25 2c1.16 0 2.12.88 2.24 2h1.27c.92 0 1.67.7 1.74 1.6v3.15a3.25 3.25 0 0 1-3.06 3.24l-.2.01a5.8 5.8 0 0 1-4.74 3.95v1.55h1.75a3.25 3.25 0 0 1 3.25 3.07v.68c0 .38-.28.7-.64.74l-.1.01h-10a.75.75 0 0 1-.75-.65v-.6a3.25 3.25 0 0 1 3.06-3.24l.18-.01H11v-1.55A5.8 5.8 0 0 1 6.27 12h-.02A3.25 3.25 0 0 1 3 8.75v-3C3 4.78 3.78 4 4.75 4H6c.13-1.12 1.08-2 2.24-2zm-1 17h-5c-.83 0-1.52.58-1.7 1.35l-.03.15h8.47A1.75 1.75 0 0 0 14.4 19zm1-15.5h-7a.75.75 0 0 0-.75.75v6a4.25 4.25 0 0 0 8.5 0v-6a.75.75 0 0 0-.75-.75m3.5 2H17.5v4.98c.8-.11 1.43-.76 1.5-1.58V5.75a.3.3 0 0 0-.18-.24zM6 5.5H4.75a.25.25 0 0 0-.25.25v3c0 .88.65 1.61 1.5 1.73z\"/>", "missions": "<path d=\"M17.03 11.03a.75.75 0 1 0-1.06-1.06L11 14.94l-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5c.3.3.77.3 1.06 0zm-1.04-6.95A2.25 2.25 0 0 0 13.75 2h-3.5c-1.16 0-2.11.87-2.24 2H6.25C5.01 4 4 5 4 6.25v13.5C4 20.99 5 22 6.25 22h11.5c1.24 0 2.25-1 2.25-2.25V6.25C20 5.01 19 4 17.75 4h-1.76zm0 .02.01.15zm-5.74 2.4h3.5c.78 0 1.47-.4 1.87-1h2.13c.41 0 .75.34.75.75v13.5c0 .41-.34.75-.75.75H6.25a.75.75 0 0 1-.75-.75V6.25c0-.41.34-.75.75-.75h2.13c.4.6 1.09 1 1.87 1m0-3h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1 0-1.5\"/>", "infos": "<path d=\"M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m0 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17m0 7c.41 0 .75.34.75.75v5a.75.75 0 0 1-1.5 0v-5c0-.41.34-.75.75-.75M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2\"/>", "hud": "<path d=\"M6.75 8a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5zM6 11.75c0-.41.34-.75.75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1-.75-.75M6.75 14a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5zm-2-10A2.75 2.75 0 0 0 2 6.75v10.5A2.75 2.75 0 0 0 4.75 20h14.5A2.75 2.75 0 0 0 22 17.25V6.75A2.75 2.75 0 0 0 19.25 4zM3.5 6.75c0-.69.56-1.25 1.25-1.25h14.5c.69 0 1.25.56 1.25 1.25v10.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25z\"/>", "gps": "<path d=\"M5.84 4.57a8.7 8.7 0 0 1 12.32 12.31l-1.19 1.18q-1.31 1.29-3.4 3.3c-.88.85-2.26.85-3.13 0l-3.5-3.39-1.1-1.09a8.7 8.7 0 0 1 0-12.31M17.1 5.63a7.2 7.2 0 1 0-10.2 10.2l1.5 1.46 3.08 3c.29.28.75.28 1.04 0l3.4-3.3 1.18-1.17a7.2 7.2 0 0 0 0-10.19M12 7.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4\"/>"};
const lastView = { hub: 'accueil', market: 'mk-discover', atelier: 'at-saves' };
function setSide(side){
  state.side = side;
  document.documentElement.dataset.side = side;
  document.querySelectorAll('[data-side-btn]').forEach(b => b.classList.toggle('on', b.dataset.sideBtn === side));
  document.getElementById('navHub').classList.toggle('hidden', side !== 'hub');
  document.getElementById('navMarket').classList.toggle('hidden', side !== 'market');
  // Dans Options, le menu latéral devient le menu des catégories d'options
  const inOpt = typeof state !== 'undefined' && state.view === 'reglages';
  document.getElementById('navHub').classList.toggle('hidden', inOpt || side !== 'hub');
  document.getElementById('navMarket').classList.toggle('hidden', inOpt || side !== 'market');
  document.getElementById('navAtelier').classList.toggle('hidden', inOpt || side !== 'atelier');
  document.getElementById('navOptions').classList.toggle('hidden', !inOpt);
  document.getElementById('navOptBtn').classList.toggle('hidden', inOpt);
  setText('spaceTitle', inOpt ? (typeof railTab !== 'undefined' && railTab === 'settings' ? 'SETTINGS' : 'OPTIONS') : ({ hub: 'HUB', market: 'MARKETPLACE', atelier: toolsName().toUpperCase() }[side] || ''));
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
const NAV_MIN = 200, NAV_MAX = 380, NAV_DEF = 264, NAV_SNAP = 150;
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
  const narrow = window.innerWidth < 900;
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
  setSide(side);
  // ouvre la catégorie qui contient la page demandée
  for (const k of Object.keys(catState)) { const g = document.getElementById('cat-' + k); if (g && g.querySelector(`[data-view="${['classement','carte'].includes(view) ? 'vtc' : view}"]`) && !catState[k]) { catState[k] = true; applyCats(); } }
  const navView = ['classement', 'carte'].includes(view) ? 'vtc' : view.startsWith('mk-item:') ? mkFrom : view;
  document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('on', b.dataset.view === navView));
  if (view === 'vtc' && ['classement', 'carte'].includes(vtcTab)) vtcTab = 'missions';
  if (['vtc', 'classement', 'carte'].includes(view)) renderVtcBars(view === 'vtc' ? vtcTab : view);
  const soon = SOON[view];
  const secId = soon ? 'soon' : (view.startsWith('mk-cat:') ? 'mk-cat' : view.startsWith('mk-item:') ? 'mk-item' : view);
  document.querySelectorAll('main > section').forEach(sec => sec.classList.toggle('hidden', sec.id !== 'v-' + secId));
  if (soon){
    document.getElementById('soonTitle').textContent = soon.t;
    document.getElementById('soonText').textContent = soon.d;
    document.getElementById('soonWhen').textContent = soon.w;
    document.getElementById('soonList').innerHTML = soon.l.map(x => '<li>' + x + '</li>').join('');
    document.getElementById('soonIcon').innerHTML = '<svg aria-hidden="true" focusable="false" width="30" height="30" viewBox="0 0 24 24" fill="currentColor">' + SOON_ICONS[view] + '</svg>';
  }
  if (view === 'vtc') { const d = SOON[vtcTab]; document.getElementById('vtcText').textContent = d.d; document.getElementById('vtcList').innerHTML = d.l.map(x => '<li>' + x + '</li>').join(''); }
  if (view.startsWith('mk-cat:')) renderMkCat(view.slice(7));
  if (view.startsWith('mk-item:')) renderMkItem(view.slice(8)); else if (view.startsWith('mk-')) mkFrom = view;
  if (view === 'mk-discover') renderMk();
  if (view === 'mk-news') renderMkNews();
  if (view === 'news') renderNewsPage();
  if (view === 'hud') renderHudPage();
  if (view === 'cartePerso') openMap();
  if (view === 'profil') renderProfile();
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
    const cat = grp && grp.previousElementSibling && grp.previousElementSibling.matches('.navcat') ? grp.previousElementSibling.querySelector('span').textContent : '';
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
  if (!show && typeof state !== 'undefined' && ['vtc', 'calendrier', 'infos', 'classement', 'carte', 'missions', 'convois', 'defis'].includes(state.view) && !(['carte', 'cartePerso'].includes(state.view) && railTab === 'map')) go('accueil');
  if (!show && typeof optCat !== 'undefined' && optCat === 'compte') openOptCat('general');
  if (save && window.tel) window.tel.setSettings({ showSoon: !!show });
}
