/* Carte : TCH Map (programme séparé), préparation de la carte du jeu, carte Leaflet.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

const hasTch = () => !!(window.tel && window.tel.tchMap);
const toHex = (c) => { c = String(c || '').trim(); if (/^#[0-9a-f]{3,8}$/i.test(c)) return c; const m = c.match(/\d+(\.\d+)?/g); return m && m.length >= 3 ? '#' + m.slice(0, 3).map(v => Math.round(+v).toString(16).padStart(2, '0')).join('') : null; };
function tchTheme(){
  const cs = getComputedStyle(document.documentElement), v = n => toHex(cs.getPropertyValue(n));
  return { bg: v('--bg'), land: v('--panel'), border: v('--line'), text: v('--text'), muted: v('--muted'), accent: v('--accent'), trail: v('--accent') };
}
async function syncMapEngine(){
  const on = mapEngine === 'tch' && hasTch();
  document.documentElement.dataset.mapEngine = on ? 'tch' : 'old';
  document.querySelectorAll('#mapEngine [data-engine]').forEach(b => { const a = b.dataset.engine === (on ? 'tch' : 'old'); b.classList.toggle('on', a); b.setAttribute('aria-pressed', a); });
  document.getElementById('mapEngine').classList.toggle('hidden', !hasTch());
  const f = document.getElementById('tchFrame');
  f.classList.toggle('hidden', !on);
  if (!hasTch()) return;
  if (!on || state.view !== 'cartePerso') { window.tel.tchMap.visible(false); return; }
  const r = await window.tel.tchMap.start();
  if (!r.ok) { mapEngine = 'old'; syncMapEngine(); const n = document.getElementById('mapNote'); n.textContent = 'Nouvelle carte indisponible : ' + r.error; n.classList.remove('hidden'); return; }
  if (f.dataset.src !== r.url) { f.dataset.src = r.url; f.src = r.url; }
  window.tel.tchMap.theme(tchTheme());
  window.tel.tchMap.visible(true, { game: (typeof M !== 'undefined' && M.game) || activeGame || 'ets2', follow: typeof M !== 'undefined' ? M.follow : true });
}
/* Carte du jeu : préparée une fois par version du jeu, en lisant les fichiers du jeu (lecture seule) */
const TCH_ETAPES = { lecture: 'Lecture des fichiers du jeu', conversion: 'Assemblage des routes et des villes', fond: 'Recalage des côtes sur le jeu', tuiles: 'Découpage de la carte' };
let tchPrepGame = null, tchPrepTimer = null, tchPrepDernier = null;
const tchPrepJeu = () => (typeof M !== 'undefined' && M.game) || activeGame || 'ets2';
const fmtMin = (s) => s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`;
// Avancement réel : lecture = secteurs lus / total (0 → 65 %), assemblage estimé (65 → 95 %), découpage (95 → 99 %)
function tchPrepPct(st, s) {
  if (st.etape === 'tuiles') return 97;
  if (st.etape === 'fond') return 95;
  if (st.etape === 'conversion') { const d = Math.max(0, s - (st.debutConv || s)); return 65 + 30 * Math.min(1, d / 50); }
  return st.total ? 2 + 63 * (st.fait / st.total) : 2;
}
// Petit indicateur discret, visible sur toutes les pages pendant la préparation (comme une mise à jour en arrière-plan)
function tchPrepMini(st) {
  let el = document.getElementById('tchPrepMini');
  if (!el) {
    el = document.createElement('button');
    el.id = 'tchPrepMini'; el.className = 'tchmini'; el.type = 'button';
    el.title = 'Préparation de la carte du jeu, en arrière-plan';
    el.onclick = () => { if (typeof go === 'function') go('cartePerso'); };
    document.body.appendChild(el);
  }
  if (!st) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<span class="spin" aria-hidden="true"></span><span>Carte du jeu ${Math.round(st.pct)} %</span>`;
}
function tchPrepAfficher(st) {
  const box = document.getElementById('tchPrep'), txt = document.getElementById('tchPrepTxt'), btn = document.getElementById('tchPrepBtn');
  const ann = document.getElementById('tchPrepAnnuler'), barW = document.getElementById('tchPrepBarWrap'), bar = document.getElementById('tchPrepBar');
  box.classList.remove('hidden');
  const nom = st.game === 'ats' ? 'ATS' : 'ETS2';
  btn.hidden = true; ann.hidden = true; barW.hidden = true;
  clearInterval(tchPrepTimer); tchPrepTimer = null;
  if (st.etat === 'en-cours' || TCH_ETAPES[st.etape]) {
    if (st.etape === 'conversion' && !(tchPrepDernier && tchPrepDernier.etape === 'conversion')) st.debutConv = st.s || 0;
    else if (tchPrepDernier && tchPrepDernier.debutConv != null) st.debutConv = tchPrepDernier.debutConv;
    tchPrepDernier = st;
    const debut = Date.now() - (st.s || 0) * 1000;
    const maj = () => {
      const s = Math.round((Date.now() - debut) / 1000), pct = tchPrepPct(st, s);
      bar.style.width = pct + '%';
      const lu = st.etape === 'lecture' && st.total ? ` — ${st.fait} / ${st.total} morceaux` : '';
      txt.textContent = `${nom} — ${TCH_ETAPES[st.etape] || TCH_ETAPES.lecture}${lu} (${fmtMin(s)}). En arrière-plan : tu peux continuer à utiliser l’appli et jouer.`;
      tchPrepMini({ pct });
    };
    maj(); tchPrepTimer = setInterval(maj, 1000);
    barW.hidden = false; ann.hidden = false;
    return;
  }
  tchPrepDernier = null; tchPrepMini(null);
  if (st.etape === 'erreur') { txt.textContent = `${nom} — la préparation a échoué : ${st.message}`; btn.textContent = 'Réessayer'; btn.hidden = false; return; }
  const v = st.version ? ` (version ${st.version})` : '';
  if (st.etat === 'a-jour') { txt.textContent = `${nom} — à jour${v}, toutes tes DLC comprises.`; btn.textContent = 'Refaire'; btn.hidden = false; btn.classList.remove('on'); return; }
  if (st.etat === 'perimee') { txt.textContent = `${nom} — le jeu ou tes DLC ont changé depuis la dernière préparation${v}. Elle se refait toute seule au prochain lancement.`; btn.textContent = 'Mettre à jour maintenant'; btn.hidden = false; btn.classList.add('on'); return; }
  if (st.etat === 'sans-jeu') { txt.textContent = `${nom} — jeu introuvable : indique son dossier dans Paramètres → Jeu.`; return; }
  txt.textContent = `${nom} — pas encore préparée. L’appli lit la carte dans tes fichiers du jeu, en arrière-plan et en lecture seule (environ 1 à 2 minutes, une fois par version du jeu).`;
  btn.textContent = 'Préparer la carte'; btn.hidden = false; btn.classList.add('on');
}
async function tchPrepMaj() {
  if (!hasTch() || !window.tel.tchMap.jeuStatut || mapEngine !== 'tch') return;
  tchPrepGame = tchPrepJeu();
  tchPrepAfficher(await window.tel.tchMap.jeuStatut(tchPrepGame));
}
/* ---------- Carte : vraie carte du jeu (Leaflet + tuiles TsMap) ----------
   Pas d'API officielle SCS : la position vient du plugin (x / z monde, en mètres),
   les tuiles sont générées depuis les fichiers du jeu (projet libre SCS_Map_Tiles).
   Dans l'appli, elles passent par tchmap:// (cache disque) ; dans un navigateur, en direct depuis GitHub. */
const MAP_FALLBACK = {
  ets2: { x1: -94621.8047, x2: 79370.13, y1: -80209.1641, y2: 93782.77, tileSize: 512, minZoom: 0, maxZoom: 8, version: '1.49', localGenerated: false },
  ats: { x1: -127721.344, x2: 20049.6563, y1: -72181.5, y2: 75589.5, tileSize: 512, minZoom: 0, maxZoom: 8, version: '1.48', localGenerated: false }
};
const MAP_RAW = { ets2: 'https://raw.githubusercontent.com/Unicor-p/SCS_Map_Tiles/master/ets2/latest/Tiles/{z}/{x}/{y}.png',
                  ats: 'https://raw.githubusercontent.com/Unicor-p/SCS_Map_Tiles/master/ats/latest/Tiles/{z}/{x}/{y}.png' };
const mapKm = n => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: n < 10 ? 1 : 0 });
const mapGameOf = g => g === 'ats' ? 'ats' : 'ets2';
function mapLL(x, z, game = M.game){
  const i = M.info[game] || MAP_FALLBACK[game], P = i.tileSize / (i.x2 - i.x1);
  return L.latLng(-(z - i.y1) * P, (x - i.x1) * P);
}
function mapTileStatus(){
  const info = M.info[M.game] || MAP_FALLBACK[M.game];
  const button = document.getElementById('mapImport'), legacy = document.getElementById('mapLegacy');
  button.textContent = `Importer les tuiles ${M.game === 'ats' ? 'ATS' : 'ETS2'}`;
  legacy.classList.toggle('hidden', !info.localGenerated);
  setText('mapVerE', (M.info.ets2 || {}).version || '1.49');
  setText('mapVerA', (M.info.ats || {}).version || '1.48');
  const status = document.getElementById('mapTileStatus');
  status.textContent = info.localGenerated
    ? `Carte locale ${M.game === 'ats' ? 'ATS' : 'ETS2'} · ${info.version} · tuiles ${info.minZoom}–${info.maxZoom}. Générée depuis les fichiers installés du jeu ; elle reste sur ce PC.`
    : `Fond historique (ETS2 ${(M.info.ets2 || {}).version || '1.49'}, ATS ${(M.info.ats || {}).version || '1.48'}). Pour inclure les DLC officiels possédés, génère les tuiles avec TsMap depuis les fichiers locaux du jeu (zoom 0–8), puis importe le dossier ici. L’application ne modifie ni ne téléverse ces fichiers.`;
}
function mapCity(game, id, name){
  const list = (window.TCH_VILLES && window.TCH_VILLES[game]) || [];
  const low = String(name || '').toLowerCase();
  return list.find(c => id && c[0] === id) || list.find(c => low && c[1].toLowerCase() === low) || null;
}
const TRUCK_SVG = '<svg aria-hidden="true" focusable="false" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#0F1720" stroke="#E7B655" stroke-width="2.5"/><path d="M15 4 L23 24 L15 19.5 L7 24 Z" fill="#E7B655" stroke="#0F1720" stroke-width="1" stroke-linejoin="round"/></svg>';
const FLAG_SVG = '<svg aria-hidden="true" focusable="false" width="30" height="30" viewBox="0 0 24 24" fill="#6FD8C4" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.8))"><path d="M3 3.75c0-.42.34-.75.75-.75h16.5c.62 0 .98.7.6 1.2L16.7 9.75l4.16 5.55c.38.5.02 1.2-.6 1.2H4.5v4.75c0 .38-.28.7-.65.74l-.1.01a.75.75 0 0 1-.74-.65l-.01-.1z"/></svg>';
function mapInit(){
  if (M.map || !window.L) return;
  M.map = L.map('lmap', { crs: L.CRS.Simple, minZoom: 0, maxZoom: 10, zoomSnap: 0.5, zoomDelta: 0.5, wheelPxPerZoomLevel: 90,
                          attributionControl: true, zoomControl: true, maxBoundsViscosity: 0.8, fadeAnimation: true });
  M.map.attributionControl.setPrefix(false);
  M.trail = L.layerGroup().addTo(M.map);
  M.jobs = L.layerGroup().addTo(M.map);
  M.cities = L.layerGroup();
  M.map.on('dragstart', () => mapSetFollow(false));
  document.getElementById('mapFollow').onclick = () => mapSetFollow(!M.follow);
  document.querySelectorAll('[data-mapgame]').forEach(b => b.onclick = () => { store.set('mapGame', b.dataset.mapgame); mapSetGame(b.dataset.mapgame, true); });
  document.getElementById('mapShowTrail').onchange = mapDrawHistory;
  document.getElementById('mapShowJobs').onchange = mapDrawHistory;
  document.getElementById('mapShowCities').onchange = (e) => { e.target.checked ? M.cities.addTo(M.map) : M.cities.remove(); };
  document.getElementById('mapClear').onclick = async () => { if (window.tel) { await window.tel.map.clearCache(); mapCacheInfo(); } };
  document.getElementById('mapImport').onclick = async () => {
    try {
      const result = await window.tel.map.selectTileset(M.game);
      if (result.canceled) return;
      M.info = result.info;
      mapSetGame(M.game, true);
    } catch (e) { document.getElementById('mapNote').textContent = 'Import impossible : ' + e.message; document.getElementById('mapNote').classList.remove('hidden'); }
  };
  document.getElementById('mapLegacy').onclick = async () => {
    try { M.info = await window.tel.map.useLegacy(M.game); mapSetGame(M.game, true); }
    catch (e) { document.getElementById('mapNote').textContent = 'Changement impossible : ' + e.message; document.getElementById('mapNote').classList.remove('hidden'); }
  };
  mapSetGame(M.game, true);
}
function mapSetFollow(on){
  M.follow = on;
  const b = document.getElementById('mapFollow');
  b.classList.toggle('on', on); b.textContent = on ? 'Suivre mon camion' : 'Recentrer sur mon camion';
  if (on && M.truck) M.map.setView(M.truck.getLatLng(), Math.max(M.map.getZoom(), 5));
}
function mapSetGame(game, force){
  if (!force && game === M.game) return;
  M.game = game;
  document.querySelectorAll('[data-mapgame]').forEach(b => b.classList.toggle('on', b.dataset.mapgame === game));
  if (M.tiles) M.tiles.remove();
  M.tileOk = 0; M.tileErr = 0;
  const mapInfo = M.info[game] || MAP_FALLBACK[game], size = mapInfo.tileSize || 512;
  const minZoom = Number.isInteger(mapInfo.minZoom) ? mapInfo.minZoom : 0;
  const maxZoom = Number.isInteger(mapInfo.maxZoom) ? mapInfo.maxZoom : 8;
  const url = window.tel ? `tchmap://${game}/{z}/{x}/{y}.png` : MAP_RAW[game];
  M.tiles = L.tileLayer(url, { tileSize: size, minZoom, maxNativeZoom: maxZoom, maxZoom: Math.max(10, minZoom), noWrap: true,
    bounds: [[-size, 0], [0, size]], keepBuffer: 3,
    attribution: 'Carte : SCS Software (fichiers locaux) · tuiles TsMap / SCS_Map_Tiles · Leaflet' }).addTo(M.map);
  M.map.setMaxBounds([[-size * 1.25, -size * .25], [size * .25, size * 1.25]]);
  M.tiles.on('tileload', () => { M.tileOk++; mapNote(); });
  M.tiles.on('tileerror', () => { M.tileErr++; mapNote(); });
  M.cities.clearLayers();
  for (const c of ((window.TCH_VILLES || {})[game] || []))
    L.marker(mapLL(c[2], c[3], game), { interactive: false, icon: L.divIcon({ className: '', html: `<div class="lcity">${escM(c[1])}</div>`, iconSize: [0, 0] }) }).addTo(M.cities);
  if (M.truck) { M.truck.remove(); M.truck = null; }
  if (M.dest) { M.dest.remove(); M.dest = null; }
  M.firstFix = true;
  M.map.setView([-size / 2, size / 2], Math.max(1.5, minZoom));
  mapTileStatus();
  mapDrawHistory();
}
function mapNote(){
  const el = document.getElementById('mapNote');
  const mapInfo = M.info[M.game] || MAP_FALLBACK[M.game];
  let t = '';
  if (M.tileErr && !M.tileOk) t = mapInfo.localGenerated
    ? 'Impossible de lire l’export local. Vérifie le dossier importé et régénère les tuiles si nécessaire.'
    : 'Impossible de charger la carte : vérifie ta connexion Internet. Les zones déjà vues restent disponibles hors ligne.';
  else if (M.tileErr > 3) t = mapInfo.localGenerated
    ? 'Certaines tuiles de l’export local sont absentes ou illisibles. Vérifie le dossier importé et régénère les niveaux 0–8 si nécessaire.'
    : 'Certaines tuiles sont indisponibles : couverture ancienne ou problème réseau. Importe un export TsMap pour les DLC récents.';
  el.textContent = t; el.classList.toggle('hidden', !t);
  if (M.tileErr && !M.tileOk && !document.getElementById('mapShowCities').checked) { document.getElementById('mapShowCities').checked = true; M.cities.addTo(M.map); }
}
// Tracés : on découpe en morceaux de même couleur (chargé / à vide) et aux coupures (ferry, train…)
function mapRuns(pts){
  const runs = []; let cur = null;
  for (const p of pts) {
    if (!p) { cur = null; continue; }
    if (!cur || cur.loaded !== p[2]) { const prev = cur && cur.pts[cur.pts.length - 1]; cur = { loaded: p[2], pts: prev ? [prev] : [] }; runs.push(cur); }
    cur.pts.push(mapLL(p[0], p[1]));
  }
  return runs;
}
function mapDrawHistory(){
  if (!M.map) return;
  M.trail.clearLayers(); M.jobs.clearLayers();
  const h = M.hist;
  if (!h) return;
  const css = getComputedStyle(document.documentElement);
  const cLoaded = css.getPropertyValue('--loaded').trim() || '#E7B655', cEmpty = css.getPropertyValue('--empty').trim() || '#7FB3E6';
  if (document.getElementById('mapShowJobs').checked)
    for (const j of h.jobs.filter(j => (j.game || 'ets2') === M.game)) {
      const segs = []; let s = [];
      for (const p of j.path) { if (!p) { if (s.length > 1) segs.push(s); s = []; } else s.push(mapLL(p[0], p[1])); }
      if (s.length > 1) segs.push(s);
      L.polyline(segs, { color: '#9FB3C8', weight: 3, opacity: .55 })
        .bindTooltip(`${escM(j.from || '?')} → ${escM(j.to || '?')} · ${mapKm(j.distance)} km · ${escM(j.status || '')}`, { sticky: true })
        .addTo(M.jobs);
    }
  if (document.getElementById('mapShowTrail').checked && h.game === M.game)
    for (const r of mapRuns(h.trail)) if (r.pts.length > 1) L.polyline(r.pts, { color: r.loaded ? cLoaded : cEmpty, weight: 4, opacity: .9, interactive: false }).addTo(M.trail);
}
async function mapLoadHistory(){
  if (!window.tel) return;
  try { M.hist = await window.tel.map.history(); M.histAt = Date.now(); mapDrawHistory(); } catch {}
}
async function mapCacheInfo(){
  if (!window.tel) { setText('mapCache', 'Cache : dans l\'appli'); return; }
  try { const c = await window.tel.map.cache(); setText('mapCache', `Cache : ${(c.bytes / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`); } catch {}
}
// Dans l'espace d'un jeu, la carte est celle de ce jeu (une seule carte chargée).
// Depuis Map dans la barre de gauche (accueil), on choisit Europe ou Amérique, une à la fois.
function mapLocked(){ return typeof railTab === 'undefined' || railTab !== 'map'; }
function syncMapSwitch(live){ const sw = document.getElementById('mapGameSw'); if (sw) sw.classList.toggle('hidden', !!live || mapLocked()); }
async function openMap(){
  if (window.tel) { try { M.info = await window.tel.map.info(); } catch {} }
  mapInit();
  setTimeout(() => M.map && M.map.invalidateSize(), 50);
  await mapLoadHistory();
  if (mapLocked()) mapSetGame(activeGame === 'ats' ? 'ats' : 'ets2');
  else if (M.hist && M.hist.game && !(M.hist.live)) mapSetGame(M.hist.game);
  syncMapSwitch();
  mapCacheInfo();
  if (!window.tel) updateMap({ connected: false, live: null, job: null, demo: true });
}
function updateMap(sn){
  if (!M.map) return;
  const s = sn.connected ? sn.live : null;
  const chip = document.getElementById('mapChip');
  const st = sn.demo ? ['var(--muted)', 'Aperçu (hors appli)'] : !s ? ['var(--muted)', 'En attente du jeu'] : s.paused ? ['var(--race)', 'Jeu en pause'] : ['var(--ok)', 'En direct'];
  const html = `<span class="d" style="background:${st[0]}"></span>${st[1]}`;
  if (chip.innerHTML !== html) chip.innerHTML = html;
  syncMapSwitch(!!s);
  if (s && (!mapLocked() || mapGameOf(s.game) === activeGame)) mapSetGame(mapGameOf(s.game));
  if (window.tel && Date.now() - M.histAt > 5000) mapLoadHistory();
  if (window.tel && Date.now() - (M.cacheAt || 0) > 30000) { M.cacheAt = Date.now(); mapCacheInfo(); }

  // Camion
  let pos = null, heading = 0;
  if (s && (s.x || s.z)) { pos = mapLL(s.x, s.z); heading = s.heading || 0; }
  else if (M.hist && M.hist.game === M.game) { const last = [...M.hist.trail].reverse().find(Boolean); if (last) pos = mapLL(last[0], last[1]); }
  if (pos) {
    if (!M.truck) M.truck = L.marker(pos, { interactive: false, zIndexOffset: 1000, icon: L.divIcon({ className: '', html: `<div class="ltruck">${TRUCK_SVG}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(M.map);
    else M.truck.setLatLng(pos);
    const el = M.truck.getElement();
    if (el) { const d = el.firstChild; d.style.transform = `rotate(${-heading * 360}deg)`; d.style.opacity = s ? 1 : .5; }
    if (M.follow) {
      if (M.firstFix) { M.map.setView(pos, 6, { animate: false }); M.firstFix = false; }
      else if (s && !s.paused) M.map.panTo(pos, { animate: true, duration: .25, noMoveStart: true });
    }
  }

  // Mission et destination
  const j = sn.job;
  setText('mapJobTitle', j ? `${j.from || '?'} → ${j.to || '?'}` : 'Pas de mission');
  setText('mapDest', j ? `${j.to || '?'}${j.toCompany ? ' · ' + j.toCompany : ''}` : '—');
  setText('mapLeft', s && s.navDistance > 0 ? mapKm(s.navDistance / 1000) + ' km' : '—');
  const sec = s && s.navTime > 0 ? s.navTime : 0;
  setText('mapTime', sec ? (sec >= 3600 ? `${Math.floor(sec / 3600)} h ${String(Math.round(sec % 3600 / 60)).padStart(2, '0')}` : `${Math.max(1, Math.round(sec / 60))} min`) : '—');
  setText('mapSpeed', s ? `${Math.round(UNITS.speed(s.speed))} ${UNITS.sp} · ${s.speedLimit > 0 ? Math.round(UNITS.speed(s.speedLimit)) + ' ' + UNITS.sp : 'pas de limite'}` : '—');
  const city = j ? mapCity(j.game || M.game, j.toId, j.to) : null;
  if (city && (j.game || M.game) === M.game) {
    const ll = mapLL(city[2], city[3]);
    if (!M.dest) M.dest = L.marker(ll, { icon: L.divIcon({ className: '', html: `<div class="ldest">${FLAG_SVG}</div>`, iconSize: [30, 30], iconAnchor: [6, 28] }) }).addTo(M.map);
    else M.dest.setLatLng(ll);
    M.dest.bindTooltip(`Destination : ${escM(j.to)}`);
  } else if (M.dest) { M.dest.remove(); M.dest = null; }
}
