/* Page News (actualités Steam).
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

/* ---------- Bêta : page News ---------- */
let newsTab = null;
const newsCache = {};
function newsDate(t){ try { return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } }
async function renderNewsPage(){
  if (!newsTab) newsTab = activeGame === 'ats' ? 'ats' : 'ets2';
  document.querySelectorAll('#newsSeg [data-news]').forEach(b => { const on = b.dataset.news === newsTab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const body = document.getElementById('newsBody');
  if (newsTab === 'app') {
    const list = [...(window.NOTES_BETA || []).slice(0, 2), ...(window.NOTES_VERSION || []).slice(0, 3)];
    body.innerHTML = '<div class="newsgrid">' + list.map(n => `<button class="newscard" style="all:unset;cursor:pointer;display:flex;flex-direction:column;gap:8px;padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--panel)" data-notes-ver="${escM(n.version)}"><span class="nmeta"><span class="gtag">${/bêta/.test(n.version) ? 'BÊTA' : 'APPLI'}</span>Version ${escM(n.version)} · ${escM(newsDate(n.date + 'T12:00:00'))}</span><h3>${escM(n.titre || '')}</h3><p>${escM((sortNotes(n.notes)[0] || ['', ''])[1])}</p><span class="nmore">Toutes les notes de cette version →</span></button>`).join('') + '</div>';
    body.querySelectorAll('[data-notes-ver]').forEach(b => b.onclick = () => { settingsFrom = 'news'; notesTab = /bêta/.test(b.dataset.notesVer) ? 'beta' : 'officielle'; openOptCat('maj'); go('reglages', 'settings'); });
    return;
  }
  const g = newsTab, name = GAMES_UI[g].name;
  if (!HAS_APP || !window.tel.steamNews) { body.innerHTML = '<div class="empty">Les actualités Steam s’affichent dans l’appli installée.</div>'; return; }
  if (!newsCache[g]) body.innerHTML = `<div class="empty">Chargement des actualités ${escM(name)}…</div>`;
  const r = newsCache[g] || await window.tel.steamNews(g);
  if (newsTab !== g) return;
  if (!r.ok) { body.innerHTML = `<div class="empty">Actualités indisponibles pour le moment (${escM(r.error || 'hors ligne')}). Réessaie plus tard.</div>`; return; }
  newsCache[g] = r;
  if (!r.items.length) { body.innerHTML = '<div class="empty">Aucune annonce récente.</div>'; return; }
  body.innerHTML = '<div class="newsgrid">' + r.items.map(n => `<a class="newscard" href="${escM(n.url)}" target="_blank" rel="noopener"><span class="nmeta"><span class="gtag">${GAMES_UI[g].tag}</span>${escM(n.date ? newsDate(n.date) : '')} · Steam</span><h3>${escM(n.title)}</h3><p>${escM(n.text)}</p><span class="nmore">Lire sur Steam →</span></a>`).join('') + '</div>';
}
