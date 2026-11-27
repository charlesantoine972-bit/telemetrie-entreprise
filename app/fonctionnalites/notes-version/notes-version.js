/* Notes de version (Paramètres → Mises à jour) et numéro affiché.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

// Numéro de version montré à l'utilisateur (ex. 0.13.25 technique → 0.13.24.1 affiché)
function shownVer(x){ return x && typeof window.versionAffichee === 'function' ? window.versionAffichee(x) : x; }
const RUBS = window.NOTES_RUBRIQUES || [['nouveau', 'Nouveautés'], ['ameliore', 'Améliorations'], ['change', 'Changements'], ['corrige', 'Corrections']];
const RUB_TAG = { nouveau: 'Nouveau', ameliore: 'Amélioré', change: 'Changé', corrige: 'Corrigé' };
const notesFmt = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; } };
const sortNotes = notes => RUBS.flatMap(([k]) => notes.filter(([t]) => t === k)).concat(notes.filter(([t]) => !RUB_LAB[t]));
function rubHtml(notes) {
  return RUBS.map(([k, lab]) => {
    const items = notes.filter(([t]) => t === k);
    if (!items.length) return '';
    const head = `<h4>${lab} <span class="n">(${items.length})</span></h4>`, ul = '<ul>' + items.map(([, txt]) => `<li><span>${escM(txt)}</span></li>`).join('') + '</ul>';
    // Corrections en dernier, repliées quand la liste est longue
    if (k === 'corrige' && items.length > 3) return `<div class="rub t-${k}"><details class="rub-fold"><summary>${head}</summary>${ul}</details></div>`;
    return `<div class="rub t-${k}">${head}${ul}</div>`;
  }).join('');
}
function betaOn() { return APP_BETA || !!store.get('betaProgram', false); }
function renderNotes(current) {
  const box = document.getElementById('lNotesList');
  if (!box) return;
  const seg = document.getElementById('notesSeg');
  if (!betaOn()) notesTab = 'officielle';
  seg.classList.toggle('hidden', !betaOn());
  seg.querySelectorAll('[data-notes]').forEach(b => { const on = b.dataset.notes === notesTab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  const list = (notesTab === 'beta' ? window.NOTES_BETA : window.NOTES_VERSION) || [];
  if (!list.length) { box.innerHTML = '<p class="muted" style="margin:0">Aucune note pour le moment.</p>'; return; }
  const cur = current && list.some(n => n.version === current) ? current : list[0].version;
  box.innerHTML = list.map(n => `<details${n.version === cur ? ' open' : ''}><summary><span class="ver">Version ${escM(n.version)}</span>`
    + (n.version === current ? '<span class="vnow">Ta version</span>' : '')
    + `<span class="vtitle">${escM(n.titre || '')}</span><span class="vdate">${escM(notesFmt(n.date))}</span></summary>`
    + rubHtml(n.notes) + '</details>').join('');
}
