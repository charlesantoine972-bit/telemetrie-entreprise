// TCH Map — affichage de la carte (MapLibre GL).
//
// Copyright (C) 2026 Truck & Coach Hub — TCH Map
// Ce programme est un logiciel libre : GNU General Public License v3 ou ultérieure (voir LICENSE).
//
// Reçoit de l'hôte, par le flux « events » du serveur local : config, thème, villes, trace, état du camion, données.
// Carte du jeu : tuiles vectorielles lues dans les fichiers du jeu du joueur (extraction/), dessinées dans le style
// de TruckSim Maps (truckermudgeon/maps, GPL-3) : zones, carrefours, routes par type, ferries, villes officielles.
// Fond : couleur unie, avec les terres réelles (Natural Earth) à peine plus claires, pour situer le reste du monde.
import * as maplibregl from './vendor/maplibre-gl.mjs';
import { toLngLat } from './projection.js';

const VIEW = {
  ets2: { bounds: [[-14, 34], [36, 71]], center: [8, 50], zoom: 4 },
  ats: { bounds: [[-126, 25], [-90, 50]], center: [-110, 38], zoom: 4 },
};
const S = { game: 'ets2', follow: true, hostCities: { ets2: [], ats: [] }, cities: [], markers: [], trail: [], trailLL: [], visited: new Set(), truck: null, dest: null, jeu: {}, rev: 0 };
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const note = (t) => { const e = document.getElementById('note'); e.textContent = t || ''; e.classList.toggle('hidden', !t); };

// Couleurs des zones et des routes : palette sombre de TruckSim Maps (proche de la carte du jeu)
const ZONES = ['match', ['get', 'c'],
  0, 'hsl(200, 2%, 30%)', 1, 'hsl(38, 18%, 30%)', 2, 'hsl(38, 20%, 23%)', 3, 'hsl(143, 16%, 23%)',
  4, 'hsl(0, 70%, 25%)', 5, 'hsl(107, 40%, 25%)', 6, 'hsl(201, 45%, 25%)', 7, 'hsl(53, 60%, 25%)', 8, 'hsl(267, 35%, 25%)',
  'hsl(200, 2%, 30%)'];
// Routes en gris comme dans le jeu (autoroutes plus claires) : seule ta trace est en couleur
const ROUTES = ['match', ['get', 'r'], 'freeway', '#9a9da2', 'divided', '#83878c', 'local', '#6d7176', 'no_vehicles', '#45474b', '#6d7176'];
const ROUTES_BORD = ['match', ['get', 'r'], 'freeway', '#2d3034', '#24272b'];
const LARGEUR = ['interpolate', ['exponential', 1.5], ['zoom'], 3, ['match', ['get', 'r'], 'freeway', 0.6, 0.35], 6, ['match', ['get', 'r'], 'freeway', 1.2, 0.7], 9, 2.4, 12, 7, 14, 22];

const map = new maplibregl.Map({
  container: 'carte',
  attributionControl: false,
  renderWorldCopies: false,
  center: VIEW.ets2.center,
  zoom: VIEW.ets2.zoom,
  minZoom: 2,
  maxZoom: 15,
  dragRotate: false,
  pitchWithRotate: false,
  style: {
    version: 8,
    sources: {
      terres: { type: 'geojson', data: 'fond/terres-ets2.geojson' },
      frontieres: { type: 'geojson', data: 'fond/frontieres-ets2.geojson' },
      trace: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [
      { id: 'fond', type: 'background', paint: { 'background-color': css('--bg') } },
      // Terres réelles, déformées comme la carte du jeu (le reste du monde) ; la carte du jeu ajoute ses propres terres
      { id: 'terres', type: 'fill', source: 'terres', paint: { 'fill-color': css('--land'), 'fill-antialias': false } },
      { id: 'frontieres', type: 'line', source: 'frontieres', paint: { 'line-color': css('--border'), 'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, .7, 9, .25], 'line-width': 1, 'line-dasharray': [3, 2] } },
      // Routes parcourues : ce que tu as exploré, en couleur
      { id: 'trace-halo', type: 'line', source: 'trace', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#000', 'line-opacity': .35, 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 3, 10, 8] } },
      { id: 'trace', type: 'line', source: 'trace', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': css('--trail'), 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.5, 10, 5] } },
    ],
  },
});
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
map.on('dragstart', () => { S.follow = false; });
map.on('zoom', () => syncCityLabels());

// ---------- Carte du jeu (tuiles extraites des fichiers du jeu) ----------
const COUCHES = ['jeu-terre', 'jeu-zones', 'jeu-carrefours', 'jeu-routes-bord', 'jeu-routes', 'jeu-ferries'];
// Fond « monde » (terres réelles non recalées) : seulement tant que la carte du jeu n'est pas prête.
// Ensuite, fond uni + terres du jeu (côtes recalées sur le jeu et tout son contenu) : pas de doublon ni de route dans l'eau.
const fondMonde = (visible) => { for (const id of ['terres', 'frontieres']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none'); };
function retirerJeu() {
  for (const id of COUCHES) if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource('jeu')) map.removeSource('jeu');
  fondMonde(true);
}
async function chargerJeu(game) {
  retirerJeu();
  S.cities = [];
  let info = null;
  try {
    const r = await fetch(`data/${game}/info.json?v=${S.rev}`, { cache: 'no-store' });
    if (r.ok) info = await r.json();
  } catch {}
  if (game !== S.game) return;
  S.jeu[game] = info;
  if (!info) {
    note('Carte du jeu pas encore prête : elle se prépare en arrière-plan (avancement au-dessus). En attendant, villes approximatives.');
    buildCities();
    return;
  }
  note('');
  fondMonde(false);
  const base = new URL(`data/${game}/tuiles/`, location.href).href;
  map.addSource('jeu', { type: 'vector', tiles: [`${base}{z}/{x}/{y}.pbf?v=${encodeURIComponent(info.date)}`], minzoom: info.zmin || 4, maxzoom: info.zmax || 10 });
  const avant = 'trace-halo';
  // Terres du jeu : côtes réelles recalées + tout ce que le jeu contient (aucune route dans l'eau)
  map.addLayer({ id: 'jeu-terre', type: 'fill', source: 'jeu', 'source-layer': 'jeu', filter: ['==', ['get', 't'], 'l'], paint: { 'fill-color': css('--land'), 'fill-antialias': false } }, avant);
  map.addLayer({ id: 'jeu-zones', type: 'fill', source: 'jeu', 'source-layer': 'jeu', filter: ['==', ['get', 't'], 'a'], layout: { 'fill-sort-key': ['get', 'z'] }, paint: { 'fill-color': ZONES } }, avant);
  map.addLayer({ id: 'jeu-carrefours', type: 'fill', source: 'jeu', 'source-layer': 'jeu', filter: ['==', ['get', 't'], 'p'], layout: { 'fill-sort-key': ['get', 'z'] }, paint: { 'fill-color': ZONES } }, avant);
  map.addLayer({ id: 'jeu-routes-bord', type: 'line', source: 'jeu', 'source-layer': 'jeu', minzoom: 7, filter: ['==', ['get', 't'], 'r'], layout: { 'line-cap': 'round', 'line-join': 'bevel' }, paint: { 'line-color': ROUTES_BORD, 'line-gap-width': LARGEUR, 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.5, 12, 1.5] } }, avant);
  map.addLayer({ id: 'jeu-routes', type: 'line', source: 'jeu', 'source-layer': 'jeu', filter: ['==', ['get', 't'], 'r'], layout: { 'line-cap': 'round', 'line-join': 'bevel', 'line-sort-key': ['match', ['get', 'r'], 'freeway', 2, 'divided', 1, 0] }, paint: { 'line-color': ROUTES, 'line-width': LARGEUR } }, avant);
  map.addLayer({ id: 'jeu-ferries', type: 'line', source: 'jeu', 'source-layer': 'jeu', filter: ['in', ['get', 't'], ['literal', ['f', 'tr']]], paint: { 'line-color': ['match', ['get', 't'], 'f', '#6c90ff99', '#8888'], 'line-width': 1.2, 'line-dasharray': [3, 3] } }, avant);
  try {
    const r = await fetch(`data/${game}/villes.json?v=${encodeURIComponent(info.date)}`, { cache: 'no-store' });
    if (r.ok && game === S.game) S.cities = (await r.json()).map(v => ({ name: v.n, rank: v.r, capital: !!v.c, ll: v.p }));
  } catch {}
  buildCities();
}

// ---------- Villes ----------
// Villes officielles (extraites du jeu) ; sinon liste approximative envoyée par l'hôte.
function cityList() {
  if (S.cities.length) return S.cities;
  return (S.hostCities[S.game] || []).map(([id, name, x, z]) => ({ id, name, rank: 6, ll: toLngLat(S.game, x, z) }));
}
function buildCities() {
  for (const m of S.markers) m.remove();
  S.markers = [];
  for (const c of cityList()) {
    const el = document.createElement('div');
    el.className = 'city' + (c.rank <= 3 ? ' big' : c.rank <= 6 ? ' mid' : '');
    el.textContent = c.name;
    const m = new maplibregl.Marker({ element: el, anchor: 'left', offset: [-4, 0] }).setLngLat(c.ll).addTo(map);
    m._ville = c;
    S.markers.push(m);
  }
  computeVisited();
  syncCityLabels();
}
// Distance approximative en mètres entre deux points [lng, lat]
const metres = (a, b) => { const k = Math.cos((a[1] + b[1]) * Math.PI / 360); return Math.hypot((a[0] - b[0]) * k, a[1] - b[1]) * 111320; };
function destination() {
  if (!S.dest) return null;
  const h = (S.hostCities[S.game] || []).find(c => c[0] === S.dest);
  if (!h) return null;
  const ll = toLngLat(S.game, h[2], h[3]);
  let best = null, bd = 20000;
  for (const m of S.markers) { const d = metres(ll, m._ville.ll); if (d < bd) { bd = d; best = m; } }
  return best;
}
function syncCityLabels() {
  const z = map.getZoom(), dest = destination();
  for (const m of S.markers) {
    const el = m.getElement(), c = m._ville, visited = S.visited.has(c), isDest = m === dest;
    el.classList.toggle('new', !visited && !isDest);
    el.classList.toggle('dest', isDest);
    // Comme dans le jeu : les grandes villes d'abord, les petites en zoomant
    const seuil = c.rank <= 3 ? 3.4 : c.rank <= 6 ? 4.6 : 5.6;
    el.classList.toggle('small', !isDest && z < seuil);
  }
}
// Une ville est « visitée » si ta trace passe à moins de 2,5 km
function computeVisited() {
  S.visited = new Set();
  const pts = S.trailLL;
  if (!pts.length) return;
  for (const m of S.markers) {
    const c = m._ville;
    for (let i = 0; i < pts.length; i++) if (metres(pts[i], c.ll) < 2500) { S.visited.add(c); break; }
  }
}

// ---------- Trace ----------
function setTrail(points) {
  // null = coupure envoyée par l'hôte ; on coupe aussi aux grands sauts (téléportation, ferry)
  const raw = Array.isArray(points) ? points : [];
  const lines = []; let cur = [], q = null;
  S.trailLL = [];
  for (const p of raw) {
    const ok = Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]);
    if (!ok || (q && Math.hypot(p[0] - q[0], p[1] - q[1]) > 3000)) { if (cur.length > 1) lines.push(cur); cur = []; q = null; if (!ok) continue; }
    const ll = toLngLat(S.game, p[0], p[1]);
    cur.push(ll); S.trailLL.push(ll); q = p;
  }
  if (cur.length > 1) lines.push(cur);
  const src = map.getSource('trace');
  if (src) src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: lines } }] });
  computeVisited();
  syncCityLabels();
}

// ---------- Camion ----------
const TRUCK = '<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13" fill="#0F1720" stroke="currentColor" stroke-width="2.5"/><path d="M15 4 L23 24 L15 19.5 L7 24 Z" fill="currentColor"/></svg>';
function setState(s) {
  if (s.game && s.game !== S.game) setGame(s.game);
  S.dest = s.destId || null;
  if (!s.connected || !isFinite(s.x) || !isFinite(s.z) || (!s.x && !s.z)) { if (S.truck) S.truck.getElement().classList.add('off'); syncCityLabels(); return; }
  const ll = toLngLat(S.game, s.x, s.z);
  if (!S.truck) {
    const el = document.createElement('div');
    el.className = 'truck';
    el.style.color = css('--accent');
    el.innerHTML = TRUCK;
    S.truck = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(ll).addTo(map);
    if (S.follow) map.jumpTo({ center: ll, zoom: Math.max(map.getZoom(), 7) });
  } else S.truck.setLngLat(ll);
  const el = S.truck.getElement();
  el.classList.toggle('off', !!s.paused);
  el.firstChild.style.transform = `rotate(${-(s.heading || 0) * 360}deg)`;
  if (S.follow && !s.paused) map.easeTo({ center: ll, duration: 250, easing: t => t });
  syncCityLabels();
}

function setGame(game) {
  S.game = game === 'ats' ? 'ats' : 'ets2';
  const suffixe = S.game === 'ets2' ? '-ets2' : '';
  map.getSource('terres')?.setData(`fond/terres${suffixe}.geojson`);
  map.getSource('frontieres')?.setData(`fond/frontieres${suffixe}.geojson`);
  if (S.truck) { S.truck.remove(); S.truck = null; }
  map.fitBounds(VIEW[S.game].bounds, { animate: false, padding: 20 });
  setTrail([]);
  chargerJeu(S.game);
}

// Éclaircit une couleur #rrggbb
function lighten(hex, f) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return hex;
  const n = parseInt(m[1], 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * f));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
// Fond uni : la mer prend la couleur du fond de l'appli, les terres réelles sont à peine plus claires.
function setTheme(t) {
  const root = document.documentElement.style;
  for (const k of ['bg', 'border', 'text', 'muted', 'accent', 'trail']) if (t[k]) root.setProperty('--' + k, t[k]);
  if (t.bg) root.setProperty('--land', lighten(t.bg, .055));
  if (!map.isStyleLoaded()) return map.once('load', () => setTheme(t));
  map.setPaintProperty('fond', 'background-color', css('--bg'));
  map.setPaintProperty('terres', 'fill-color', css('--land'));
  if (map.getLayer('jeu-terre')) map.setPaintProperty('jeu-terre', 'fill-color', css('--land'));
  map.setPaintProperty('frontieres', 'line-color', css('--border'));
  map.setPaintProperty('trace', 'line-color', css('--trail'));
  if (S.truck) S.truck.getElement().style.color = css('--accent');
}

// ---------- Messages de l'hôte ----------
map.on('load', () => {
  const ev = new EventSource('events');
  const on = (k, fn) => ev.addEventListener(k, (e) => { try { fn(JSON.parse(e.data)); } catch (err) { console.error(k, err); } });
  on('config', (c) => { if (c.game && c.game !== S.game) setGame(c.game); if (typeof c.follow === 'boolean') { S.follow = c.follow; if (S.follow && S.truck) map.easeTo({ center: S.truck.getLngLat(), zoom: Math.max(map.getZoom(), 7) }); } });
  on('theme', setTheme);
  on('cities', (c) => { S.hostCities = { ets2: c.ets2 || [], ats: c.ats || [] }; if (!S.cities.length) buildCities(); });
  on('trail', (t) => { if ((t.game || 'ets2') === S.game) setTrail(t.points); });
  on('state', setState);
  // Nouvelle carte extraite des fichiers du jeu : on la recharge
  on('donnees', (d) => { S.rev++; if ((d.game || S.game) === S.game) chargerJeu(S.game); });
  setGame(S.game);
});
// Essais : recentrer la carte (événement interne à la page, sans effet pour l'hôte)
window.addEventListener('tch-vue', (e) => { const d = e.detail || {}; if (Array.isArray(d.c)) map.jumpTo({ center: d.c, zoom: d.z || map.getZoom() }); });
