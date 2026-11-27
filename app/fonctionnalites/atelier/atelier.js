/* Truck & Coach Tools : nom de l’espace, interrupteurs par jeu, console du jeu.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

/* ---------- Atelier ---------- */
function toolsName(g){ return (g || activeGame) === 'ats' ? 'Truck & Road Trip Tools' : 'Truck & Coach Tools'; }
let atByGame = { ets2: false, ats: false };
function applyAtelier(on){
  document.getElementById('sideBtnAtelier').classList.toggle('hidden', !on);
  const lca = document.getElementById('lcardAtelier'); if (lca) lca.classList.toggle('hidden', !on);
  if (!on && state.side === 'atelier') go('accueil');
}
// Interface → Éléments visibles : un interrupteur par jeu
function syncAtelierSwitches(st){
  if (st && st.games) atByGame = { ets2: !!(st.games.ets2 || {}).atelier, ats: !!(st.games.ats || {}).atelier };
  if (st && st.activeGame) atByGame[st.activeGame] = !!st.atelier;
  document.querySelectorAll('[data-atg]').forEach(i => { i.checked = !!atByGame[i.dataset.atg]; });
  applyAtelier(!!atByGame[activeGame === 'ats' ? 'ats' : 'ets2']);
}
const fmtDate = ms => ms ? new Date(ms).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '–';
async function renderConsole(msg){
  const box = document.getElementById('atConsole');
  if (!HAS_APP) { box.innerHTML = '<div class="empty">Disponible dans l\'appli installée.</div>'; return; }
  const rows = [];
  for (const g of ['ets2', 'ats']) {
    const r = await window.tel.atelier.consoleState(g);
    const name = g === 'ets2' ? 'Euro Truck Simulator 2' : 'American Truck Simulator';
    rows.push(!r.ok || !r.data.found
      ? `<div class="item" style="cursor:default"><b class="grow">${name}</b><span class="muted" style="font-size:13px">Configuration introuvable (lance le jeu une fois)</span></div>`
      : `<div class="item" style="cursor:default"><b class="grow">${name}</b><span class="soft" style="font-size:13px">${r.data.enabled ? 'Console activée' : 'Console désactivée'}</span><label class="switch"><input type="checkbox" data-con="${g}" ${r.data.enabled ? 'checked' : ''}><span></span></label></div>`);
  }
  box.innerHTML = rows.join('');
  setText('atConsoleMsg', msg || '');
  box.querySelectorAll('[data-con]').forEach(c => c.onchange = async () => { const x = await window.tel.atelier.setConsole(c.dataset.con, c.checked); renderConsole(x.ok ? 'Réglage enregistré ✓' : x.error); });
  const cv = document.getElementById('atConvoy'), crow = [];
  for (const g of ['ets2', 'ats']) {
    const r = await window.tel.atelier.convoy(g); const name = g === 'ets2' ? 'Euro Truck Simulator 2' : 'American Truck Simulator';
    crow.push(!r.ok || !r.data.found ? `<div class="item" style="cursor:default"><b class="grow">${name}</b><span class="muted" style="font-size:13px">Configuration introuvable</span></div>`
      : `<div class="item" style="cursor:default"><b class="grow">${name}</b><span class="soft" style="font-size:13px">${r.data.size >= 128 ? '128 places' : (r.data.size || 8) + ' places'}</span><label class="switch"><input type="checkbox" data-cv="${g}" ${r.data.size >= 128 ? 'checked' : ''} aria-label="Convois à 128 places, ${name}"><span></span></label></div>`);
  }
  cv.innerHTML = crow.join('');
  cv.querySelectorAll('[data-cv]').forEach(c => c.onchange = async () => { const x = await window.tel.atelier.setConvoy(c.dataset.cv, c.checked); renderConsole(x.ok ? 'Réglage enregistré ✓' : x.error); });
}
