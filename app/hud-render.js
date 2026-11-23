const HUD_STYLES = { bandeau: 'Bandeau', compact: 'Compact', tableau: 'Tableau de bord', minimal: 'Minimal', navigation: 'Navigation' };
const HUD_SELECTABLE_STYLES = ['bandeau', 'navigation'];
function hudRender(root, d){
  const q = k => root.querySelector('[data-h="' + k + '"]');
  const fmt = (n, dd = 0) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: dd, minimumFractionDigits: dd });
  const o = d.options || {};
  root.className = 'hud s-' + (HUD_STYLES[o.style] && HUD_SELECTABLE_STYLES.includes(o.style) ? o.style : 'bandeau');
  root.style.setProperty('--op', (o.opacity || 82) / 100);
  const scale = [80, 100, 120].includes(Number(o.scale)) ? Number(o.scale) : 100;
  root.style.transform = `scale(${scale / 100})`;
  root.style.transformOrigin = o.position === 'bas' ? 'bottom center' : 'top center';
  q('logo').classList.toggle('off', o.logo === false);
  const L = d.live || {}, th = d.thresholds || { limit: 100, pct: 5 };
  const kmh = Math.round((L.speed || 0) * 3.6);
  q('speed').textContent = Math.abs(kmh);
  q('sp').classList.toggle('over', kmh > th.limit);
  const lim = Math.round((L.speedLimit || 0) * 3.6);
  q('lim').textContent = lim; q('lim').classList.toggle('off', !lim);
  // Compteurs de l’appli seulement s’ils concernent la mission affichée par le jeu
  const j = d.mission && !d.mission.tracked ? null : d.job, m = q('mode');
  m.className = 'mode ' + (!j ? 'none' : j.mode === 'course' ? 'race' : 'real');
  m.textContent = !j ? 'SANS MISSION' : j.mode === 'course' ? 'COURSE · ' + fmt(j.overPct, 0) + ' %' : 'RÉEL';
  root.classList.toggle('race', !!j && j.mode === 'course');
  q('kLeft').classList.toggle('off', !(L.navDistance > 0));
  q('left').textContent = fmt((L.navDistance || 0) / 1000, 0) + ' km';
  q('kKm').classList.toggle('off', !j);
  if (j) q('km').textContent = fmt(j.loaded, 1) + ' km chargés';
  hudMission(root, d);
  hudTruck(root, d);
  hudCoach(root, d);
  // Ne jamais couper le bandeau : si l'écran est trop étroit pour la taille choisie, on réduit.
  const room = (typeof window !== 'undefined' && window.innerWidth || 0) - 16, wide = (root.offsetWidth || 0) * scale / 100;
  if (room > 0 && wide > room) root.style.transform = `scale(${(room / root.offsetWidth).toFixed(3)})`;
  q('today').textContent = fmt((d.today && (d.today.loaded + d.today.empty)) || 0, 0) + ' km';
}


