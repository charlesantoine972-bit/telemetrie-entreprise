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

/* ---------- Résumé de l'Accueil (bêta 5, étape D) : En cours, Dernier trajet, Mon entreprise ----------
   Rien d'inventé : chaque ligne n'apparaît que si la donnée existe. Rendu seulement quand le contenu change. */
let accSig = '';
function renderAccueilResume(sn){
  if (!document.getElementById('accEnCours')) return;
  const j = sn && sn.job, live = (sn && sn.live) || {}, dernier = sn && Array.isArray(sn.jobs) && sn.jobs[0];
  const hud = document.getElementById('hudOnNav'), hudOn = !!(hud && hud.checked);
  const reste = Number.isFinite(live.navDistance) && live.navDistance >= 0 ? km(live.navDistance / 1000) : null;
  const S = typeof atSel !== 'undefined' ? atSel.summary : null;
  const sig = JSON.stringify([!!(sn && sn.connected), j && [j.from, j.to, j.cargo, j.missionType], reste, dernier && dernier.ended, hudOn, S && [S.companyName, S.money]]);
  if (sig === accSig) return; accSig = sig;
  document.getElementById('hHud').innerHTML = `<span class="d" style="background:${hudOn ? 'var(--ok)' : 'var(--muted)'}"></span>HUD : ${hudOn ? 'activé' : 'désactivé'}`;
  const liens = '<div class="acc-liens"><button class="btn" data-goto="cartePerso">Carte</button><button class="btn" data-goto="telemetrie">Télémétrie</button></div>';
  let enCours;
  if (sn && sn.connected && j) enCours = `<h2 class="t-sous">En cours</h2>
    <div class="acc-route">${escM(j.from || '—')} → ${escM(j.to || '—')}</div>
    <div class="soft">${j.missionType === 'bus' ? 'Service en car' : escM(j.cargo || 'Marchandise')}${!j.missionType && j.mass ? ' · ' + (j.mass / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' t' : ''}</div>
    ${reste ? `<div class="muted">Distance restante (GPS) : <b class="t-num">${reste}</b></div>` : ''}${liens}`;
  else if (sn && sn.connected) enCours = `<h2 class="t-sous">En cours</h2><p class="soft">Jeu connecté, pas de mission pour l’instant. Prends un contrat : il s’affichera ici.</p>${liens}`;
  else enCours = `<h2 class="t-sous">En cours</h2><p class="soft">Le jeu n’est pas lancé. Utilise le bouton ci-dessus pour le lancer : ta mission s’affichera ici.</p>`;
  document.getElementById('accEnCours').innerHTML = enCours;
  document.getElementById('accDernier').innerHTML = `<h2 class="t-sous">Dernier trajet</h2>` + (dernier
    ? `<div class="acc-route">${escM(dernier.from || '—')} → ${escM(dernier.to || '—')}</div><div class="muted">${new Date(dernier.ended).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · ${km(dernier.distance)} · ${escM(routeStatus(dernier).label)}</div>`
    : '<p class="soft">Aucun trajet terminé pour l’instant.</p>') + '<div class="acc-liens"><button class="btn" data-goto="feuilleRoute">Feuille de route</button></div>';
  document.getElementById('accEntreprise').innerHTML = `<h2 class="t-sous">Mon entreprise</h2>` + (S
    ? `<div class="acc-route">${escM(S.companyName || S.profileName || 'Mon entreprise')}</div><div class="muted">${S.bilan && S.bilan.trucks != null ? `${S.bilan.trucks} camion(s) · ${S.bilan.garages} garage(s)` : ''}</div>`
    : '<p class="soft">Lis la sauvegarde de ton profil pour voir ton entreprise.</p>') + '<div class="acc-liens"><button class="btn" data-goto="entreprise">Vue d’ensemble</button></div>';
  document.querySelectorAll('.acc-resume [data-goto]').forEach(b => b.onclick = () => go(b.dataset.goto));
}
