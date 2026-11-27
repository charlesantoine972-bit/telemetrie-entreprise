/* Utilitaires communs : formats, mémoire locale (store), textes, échappement, accessibilité, fenêtre de confirmation.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

const fmt = n => n.toLocaleString('fr-FR');
/* ---------- côtés (Hub / Marketplace), catégories dépliables, écran de lancement ---------- */
const store = { get(k, d){ try { const v = localStorage.getItem('tch.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
                set(k, v){ try { localStorage.setItem('tch.' + k, JSON.stringify(v)); } catch {} } };
// Accessibilité : état « appuyé » des boutons de choix, annonces pour les lecteurs d'écran
function announce(t){ const r = document.getElementById('srLive'); r.textContent = ''; setTimeout(() => { r.textContent = t; }, 60); }
function syncPressed(root){ (root || document).querySelectorAll('.seg button, .sideswitch button').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false')); }
/* ---------- Fenêtre de confirmation ---------- */
function ask(title, html, yes = 'Confirmer'){
  return new Promise(res => {
    setText('modalTitle', title); document.getElementById('modalBody').innerHTML = html; setText('modalYes', yes);
    const m = document.getElementById('modal'), back = document.activeElement, app = document.querySelector('.app'), wasInert = app.inert;
    m.classList.remove('hidden'); app.inert = true;
    const no = document.getElementById('modalNo'), yesB = document.getElementById('modalYes');
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); done(false); }
      else if (e.key === 'Tab') { e.preventDefault(); const f = [...m.querySelectorAll('input,select,textarea,button')].filter(x => !x.disabled);
        const i = f.indexOf(document.activeElement); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
      else if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); done(true); } };
    const done = v => { m.classList.add('hidden'); app.inert = wasInert; document.removeEventListener('keydown', key, true); setTimeout(() => { if (back && back.focus) back.focus(); }, 0); res(v); };
    document.addEventListener('keydown', key, true);
    yesB.onclick = () => done(true); no.onclick = () => done(false);
    const first = m.querySelector('#modalBody input'); if (first) { first.focus(); first.select(); } else no.focus();
  });
}
const escM = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* =================== DONNÉES RÉELLES (plugin) =================== */
const HAS_APP = !!window.tel;
const km = n => (n == null ? '–' : (n < 10 ? n.toFixed(1).replace('.', ',') : fmt(Math.round(n))) + ' km');
function dur(min){ if (min == null || min < 0) return '–'; const h = Math.floor(min/60), m = Math.round(min%60); return h ? `${h} h ${String(m).padStart(2,'0')}` : `${m} min`; }
function setText(id, v){ const el = document.getElementById(id); if (el && el.textContent !== String(v)) el.textContent = v; }
const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
