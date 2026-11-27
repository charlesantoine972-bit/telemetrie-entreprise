/* Écran de lancement : choix du jeu (ETS2 / ATS) et encart « Nouveautés ».
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

function showLauncher(on, force){
  // Revenir au menu principal referme tout ; une modification de sauvegarde pas appliquée est signalée avant.
  if (on && !force && typeof atDirty !== 'undefined' && atDirty && document.getElementById('launcher').classList.contains('hidden')) {
    ask('Quitter sans appliquer ?', 'Tu as modifié des valeurs dans Truck &amp; Coach Tools sans cliquer sur « Appliquer à la sauvegarde ». Si tu reviens au menu principal, ces changements sont perdus. Ta sauvegarde n’a pas été modifiée.', 'Quitter sans appliquer')
      .then(ok => { if (ok) showLauncher(true, true); });
    return;
  }
  if (on) resetSpaces();
  document.getElementById('launcher').classList.toggle('hidden', !on);
  document.querySelector('.app').inert = !!on;
  syncRailVisibility();
  if (on) { setRail('game'); refreshGames(); setTimeout(() => { const c = document.querySelector('#launcher .gamecard.current') || document.querySelector('#launcher .gamecard'); if (c) c.focus(); }, 0); }
}
function applyGame(g){
  activeGame = g; store.set('game', g);
  const u = GAMES_UI[g] || GAMES_UI.ets2;
  setText('gameTag', u.tag); setText('gameName', u.name);
  document.getElementById('gameChip').setAttribute('aria-label', `Jeu actif : ${u.name}. Changer de jeu`);
  // Le jeu choisi devient le contexte des espaces : carte du bon jeu, ce jeu mis en avant
  store.set('mapGame', g);
  try { if (typeof mapSetGame === 'function' && typeof M !== 'undefined' && M.game !== g) mapSetGame(g, true); } catch {}
  document.querySelectorAll('.gamecard').forEach(c => c.classList.toggle('current', c.dataset.game === g));
  if (typeof syncLaunch === 'function' && document.getElementById('btnLaunch')) syncLaunch();
  if (typeof loadGameSettings === 'function') loadGameSettings(g);
}
function openGame(g){ applyGame(g); showLauncher(false); go(lastView[state.side] || 'accueil'); }
function refreshGames(){
  if (!window.tel || !window.tel.atelier || !window.tel.atelier.status) return;
  Promise.all([window.tel.atelier.status().catch(() => null), window.tel.pluginStatus().catch(() => [])]).then(([st, pl]) => {
    for (const g of ['ets2', 'ats']) {
      const el = document.getElementById('gs-' + g); if (!el) continue;
      const inst = st && st[g] && st[g].installed, run = st && st[g] && st[g].running;
      const p = (pl || []).find(x => x.id === g);
      const txt = run ? 'Jeu en cours' : inst ? 'Profils trouvés sur ce PC' : 'Pas de profil trouvé sur ce PC';
      el.className = 'gc-status ' + (run || (inst && p && p.status === 'ok') ? 'ok' : inst ? 'warn' : '');
      el.querySelector('span').textContent = txt + (p ? (p.status === 'ok' ? ' · plugin installé' : ' · plugin à installer') : '');
    }
  });
}
// Encart « Nouveautés » sur l'écran d'accueil : une seule fois après chaque mise à jour
function renderNews(current){
  const list = (APP_BETA ? window.NOTES_BETA : window.NOTES_VERSION) || [], n = list.find(x => x.version === current) || (!current && list[0]);
  const box = document.getElementById('lNews');
  if (!n || store.get('seenNotes', null) === n.version) { box.classList.add('hidden'); return; }
  setText('lNewsVer', n.version); setText('lNewsTitre', n.titre || '');
  const all = sortNotes(n.notes), items = all.slice(0, 4);
  document.getElementById('lNewsList').innerHTML = items.map(([t, txt]) => `<li><span class="tag t-${escM(t)}">${escM(RUB_TAG[t] || t)}</span><span>${escM(txt)}</span></li>`).join('')
    + (n.notes.length > items.length ? `<li class="muted" style="font-size:13px">… et ${n.notes.length - items.length} autre${n.notes.length - items.length > 1 ? 's' : ''} changement${n.notes.length - items.length > 1 ? 's' : ''}.</li>` : '');
  box.classList.remove('hidden');
  const seen = () => { store.set('seenNotes', n.version); box.classList.add('hidden'); };
  document.getElementById('lNewsOk').onclick = seen;
  document.getElementById('lNewsClose').onclick = seen;
  document.getElementById('lNewsAll').onclick = () => { seen(); showLauncher(false); settingsFrom = 'game'; openOptCat('maj'); go('reglages', 'settings'); };
}
