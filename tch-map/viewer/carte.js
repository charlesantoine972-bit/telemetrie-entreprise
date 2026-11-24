// TCH Map — affichage de la carte (MapLibre GL).
//
// Copyright (C) 2026 Truck & Coach Hub — TCH Map
// Ce programme est un logiciel libre : GNU General Public License v3 ou ultérieure (voir LICENSE).
//
// Reçoit de l'hôte, par le flux « events » du serveur local : config, thème, villes, trace et état du camion.
// Fond : terres et frontières réelles (Natural Earth), recalées sur la carte du jeu (Islande déplacée comme dans ETS2).
// Les routes du jeu s'ajoutent quand elles ont été générées depuis les fichiers du jeu (dossier data/<jeu>/).
import * as maplibregl from './vendor/maplibre-gl.mjs';
import { toLngLat } from './projection.js';

const VIEW = {
  ets2: { bounds: [[-14, 34], [36, 71]], center: [8, 50], zoom: 4 },
  ats: { bounds: [[-126, 25], [-90, 50]], center: [-110, 38], zoom: 4 },
};
const S = { game: 'ets2', follow: true, cities: { ets2: [], ats: [] }, markers: [], trail: [], visited: new Set(), truck: null, state: null, dest: null, gameData: {} };
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const note = (t) => { const e = document.getElementById('note'); e.textContent = t || ''; e.classList.toggle('hidden', !t); };

const map = new maplibregl.Map({
  container: 'carte',
  attributionControl: false,
  renderWorldCopies: false,
  center: VIEW.ets2.center,
  zoom: VIEW.ets2.zoom,
  minZoom: 2.5,
  maxZoom: 15,
  dragRotate: false,
  pitchWithRotate: false,
  style: {
    version: 8,
    sources: {
      terres: { type: 'geojson', data: 'fond/terres.geojson' },
      frontieres: { type: 'geojson', data: 'fond/frontieres.geojson' },
      trace: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [
      { id: 'fond', type: 'background', paint: { 'background-color': css('--bg') } },
      { id: 'terres', type: 'fill', source: 'terres', paint: { 'fill-color': css('--land') } },
      { id: 'frontieres', type: 'line', source: 'frontieres', paint: { 'line-color': css('--border'), 'line-width': 1, 'line-dasharray': [3, 2] } },
      // Routes parcourues : ce que tu as exploré, en couleur
      { id: 'trace-halo', type: 'line', source: 'trace', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#000', 'line-opacity': .35, 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 3, 10, 8] } },
      { id: 'trace', type: 'line', source: 'trace', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': css('--trail'), 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.5, 10, 5] } },
    ],
  },
});
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
map.on('dragstart', () => { S.follow = false; });
map.on('zoom', () => syncCityLabels());

// ---------- Routes du jeu (générées depuis les fichiers du jeu, plus tard) ----------
async function loadGameRoads(game) {
  if (S.gameData[game] !== undefined) return;
  S.gameData[game] = null;
  try {
    const r = await fetch(`data/${game}/routes.geojson`, { cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    S.gameData[game] = await r.json();
    const id = 'routes-' + game;
    map.addSource(id, { type: 'geojson', data: S.gameData[game] });
    map.addLayer({ id, type: 'line', source: id, paint: { 'line-color': css('--border'), 'line-width': ['interpolate', ['linear'], ['zoom'], 4, .5, 12, 3] } }, 'trace-halo');
    note('');
  } catch {
    note('Routes du jeu bientôt : elles seront générées depuis tes fichiers du jeu. En attendant, fond géographique réel.');
    setTimeout(() => note(''), 6000);
  }
}

// ---------- Villes ----------
function buildCities() {
  for (const m of S.markers) m.remove();
  S.markers = [];
  for (const [id, name, x, z] of S.cities[S.game] || []) {
    const el = document.createElement('div');
    el.className = 'city';
    el.dataset.id = id;
    el.textContent = name;
    const m = new maplibregl.Marker({ element: el, anchor: 'left', offset: [-3, 0] }).setLngLat(toLngLat(S.game, x, z)).addTo(map);
    S.markers.push(m);
  }
  syncCityLabels();
}
function syncCityLabels() {
  const z = map.getZoom();
  for (const m of S.markers) {
    const el = m.getElement(), id = el.dataset.id, visited = S.visited.has(id), dest = S.dest && S.dest === id;
    el.classList.toggle('new', !visited && !dest);
    el.classList.toggle('dest', !!dest);
    // Peu de noms quand on voit tout le pays, tous les noms en zoomant
    el.classList.toggle('small', !dest && (z < 4.6 || (z < 5.6 && !visited)));
  }
}
// Une ville est « visitée » si ta trace passe à moins de 2,5 km
function computeVisited() {
  const list = S.cities[S.game] || [], pts = S.trail;
  S.visited = new Set();
  if (!pts.length) return;
  const R2 = 2500 * 2500;
  for (const [id, , cx, cz] of list) {
    for (let i = 0; i < pts.length; i += 1) { const dx = pts[i][0] - cx, dz = pts[i][1] - cz; if (dx * dx + dz * dz < R2) { S.visited.add(id); break; } }
  }
}

// ---------- Trace ----------
function setTrail(points) {
  // null = coupure envoyée par l'hôte ; on coupe aussi aux grands sauts (téléportation, ferry)
  const raw = Array.isArray(points) ? points : [];
  S.trail = raw.filter(p => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]));
  const lines = []; let cur = [], q = null;
  for (const p of raw) {
    const ok = Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]);
    if (!ok || (q && Math.hypot(p[0] - q[0], p[1] - q[1]) > 3000)) { if (cur.length > 1) lines.push(cur); cur = []; q = null; if (!ok) continue; }
    cur.push(toLngLat(S.game, p[0], p[1])); q = p;
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
  S.state = s;
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
    if (S.follow) map.jumpTo({ center: ll, zoom: Math.max(map.getZoom(), 5.5) });
  } else S.truck.setLngLat(ll);
  const el = S.truck.getElement();
  el.classList.toggle('off', !!s.paused);
  el.firstChild.style.transform = `rotate(${-(s.heading || 0) * 360}deg)`;
  if (S.follow && !s.paused) map.easeTo({ center: ll, duration: 250, easing: t => t });
  syncCityLabels();
}

function setGame(game) {
  S.game = game === 'ats' ? 'ats' : 'ets2';
  if (S.truck) { S.truck.remove(); S.truck = null; }
  map.setMaxBounds(null);
  map.fitBounds(VIEW[S.game].bounds, { animate: false, padding: 20 });
  buildCities();
  setTrail([]);
  loadGameRoads(S.game);
}

// Éclaircit une couleur #rrggbb (les terres doivent se détacher de la mer)
function lighten(hex, f) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return hex;
  const n = parseInt(m[1], 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * f));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
function setTheme(t) {
  const root = document.documentElement.style;
  for (const k of ['bg', 'land', 'border', 'text', 'muted', 'accent', 'trail']) if (t[k]) root.setProperty('--' + k, k === 'land' ? lighten(t[k], .06) : t[k]);
  if (!map.isStyleLoaded()) return map.once('load', () => setTheme(t));
  map.setPaintProperty('fond', 'background-color', css('--bg'));
  map.setPaintProperty('terres', 'fill-color', css('--land'));
  map.setPaintProperty('frontieres', 'line-color', css('--border'));
  map.setPaintProperty('trace', 'line-color', css('--trail'));
  if (S.truck) S.truck.getElement().style.color = css('--accent');
}

// ---------- Messages de l'hôte ----------
map.on('load', () => {
  const ev = new EventSource('events');
  const on = (k, fn) => ev.addEventListener(k, (e) => { try { fn(JSON.parse(e.data)); } catch (err) { console.error(k, err); } });
  on('config', (c) => { if (c.game) setGame(c.game); if (typeof c.follow === 'boolean') { S.follow = c.follow; if (S.follow && S.truck) map.easeTo({ center: S.truck.getLngLat(), zoom: Math.max(map.getZoom(), 5.5) }); } });
  on('theme', setTheme);
  on('cities', (c) => { S.cities = { ets2: c.ets2 || [], ats: c.ats || [] }; buildCities(); computeVisited(); syncCityLabels(); });
  on('trail', (t) => { if ((t.game || 'ets2') === S.game) setTrail(t.points); });
  on('state', setState);
  setGame(S.game);
});
