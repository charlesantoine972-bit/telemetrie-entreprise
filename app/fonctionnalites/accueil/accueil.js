/* Page Accueil du Hub : bouton « Lancer le jeu ».
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

async function launch(game){
  const hint = document.getElementById('launchHint');
  const r = await window.tel.launchGame(game);
  renderPlugin(r.status || []);
  hint.textContent = r.ok ? 'Lancement demandé à Steam… Bonne route !' : r.error;
  setTimeout(() => { syncLaunch(); }, 6000);
}
function otherGame(){ return activeGame === 'ats' ? 'ets2' : 'ats'; }
function bindAts(){ const a = document.getElementById('lnkAts'); if (a) a.onclick = (e) => { e.preventDefault(); launch(otherGame()); }; }
// Accueil dans le contexte du jeu choisi : bouton principal = ce jeu, lien = l'autre
function syncLaunch(){
  const g = activeGame === 'ats' ? 'ats' : 'ets2';
  setText('btnLaunch', 'LANCER ' + GAMES_UI[g].name.toUpperCase());
  const hint = document.getElementById('launchHint');
  hint.innerHTML = 'Le plugin est vérifié, puis le jeu se lance via Steam. <a href="#" id="lnkAts">Lancer ' + GAMES_UI[otherGame()].name + '</a>';
  bindAts();
}
