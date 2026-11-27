/* Paramètres → Apparence : thème, accent, vision des couleurs, taille du texte.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

/* ---------- Apparence : thème, vision des couleurs, taille du texte ---------- */
const DEF_LOOK = { theme: 'base', accent: 'defaut', vision: 'normale', zoom: '100', contrast: false, motion: false };
let winAccent = null; // couleur d'accent de Windows (#RRGGBB), si disponible
const ACC_PRESETS = ['#4FD1A5', '#3CC8D8', '#5B8CFF', '#A78BFA', '#F472B6', '#FF6B5B', '#E7B655'];
// Contraste WCAG entre deux couleurs #RRGGBB
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const lum = h => { const c = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const mixHex = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };
// Éclaircit (fond sombre) ou fonce (fond clair) la couleur jusqu'à un contraste suffisant
function fitAccent(hex, bg, min){
  const dark = lum(bg) < .2, to = dark ? '#FFFFFF' : '#000000';
  let c = hex; for (let t = .05; ratio(c, bg) < min && t <= 1; t += .05) c = mixHex(hex, to, t);
  return c;
}
function cssHex(v){ v = (v || '').trim(); if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase(); const m = v.match(/\d+/g); return m && m.length >= 3 ? rgbHex(m.slice(0, 3).map(Number)) : '#0F1720'; }
function applyAccent(){
  const de = document.documentElement;
  ['--accent', '--accent-strong', '--on-accent', '--accent-soft'].forEach(p => de.style.removeProperty(p));
  let want = null;
  if (/^#[0-9a-f]{6}$/i.test(look.accent)) want = look.accent;
  else if (look.accent === 'windows' || (look.accent === 'defaut' && look.theme === 'systeme')) want = winAccent;
  if (want){
    const cs = getComputedStyle(de), bg = cssHex(cs.getPropertyValue('--bg')), panel = cssHex(cs.getPropertyValue('--panel'));
    const acc = fitAccent(fitAccent(want, bg, 4.5), panel, 4.5);
    const onAcc = ratio('#000000', acc) >= ratio('#FFFFFF', acc) ? '#000000' : '#FFFFFF';
    de.style.setProperty('--accent', acc);
    de.style.setProperty('--accent-soft', `color-mix(in srgb, ${acc} 14%, transparent)`);
    de.style.setProperty('--accent-strong', fitAccent(acc, mixHex(bg, acc, .14), 4.5));
    de.style.setProperty('--on-accent', onAcc);
  }
  const custom = /^#/.test(look.accent) && !ACC_PRESETS.includes(look.accent);
  document.querySelectorAll('[data-accent-btn]').forEach(x => { const on = x.dataset.accentBtn === look.accent; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  const wh = document.getElementById('accentWheel'); if (wh){ wh.classList.toggle('on', custom); if (custom) wh.style.background = look.accent; else wh.style.background = ''; }
  const pk = document.getElementById('accentPick'); if (pk) pk.value = /^#/.test(look.accent) ? look.accent.toLowerCase() : '#ff8a3d';
  const wb = document.getElementById('accentWin'); if (wb){ wb.classList.toggle('hidden', !winAccent); if (winAccent) wb.style.setProperty('--sw', winAccent); }
}
function applyLook(patch, save){
  Object.assign(look, patch || {}); store.set('look', look);
  const de = document.documentElement;
  de.dataset.theme = look.theme === 'systeme' ? (mq && mq.matches ? 'clair' : 'sombre') : look.theme;
  if (look.vision === 'normale') delete de.dataset.vision; else de.dataset.vision = look.vision;
  applyAccent();
  if (look.contrast) de.dataset.contrast = 'fort'; else delete de.dataset.contrast;
  if (look.motion) de.dataset.motion = 'reduit'; else delete de.dataset.motion;
  de.style.zoom = (Number(look.zoom) || 100) / 100;
  document.querySelectorAll('[data-theme-btn]').forEach(x => x.classList.toggle('on', x.dataset.themeBtn === look.theme));
  document.querySelectorAll('[data-vision-btn]').forEach(x => x.classList.toggle('on', x.dataset.visionBtn === look.vision));
  document.querySelectorAll('[data-zoom-btn]').forEach(x => x.classList.toggle('on', x.dataset.zoomBtn === String(look.zoom)));
  const cs = document.getElementById('contrastSwitch'); if (cs) cs.checked = !!look.contrast;
  const ms = document.getElementById('motionSwitch'); if (ms) ms.checked = !!look.motion;
  if (save && window.tel) window.tel.setSettings({ look });
}
