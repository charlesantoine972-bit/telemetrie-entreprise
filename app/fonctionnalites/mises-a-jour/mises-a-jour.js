/* Mises à jour de l’appli (vérification, téléchargement, installation).
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

let autoInstall = false, installing = false;
async function refreshUpdate(){
  if (!HAS_APP) return;
  const u = await window.tel.updateStatus();
  const M = { dev: ['var(--muted)', 'mode test'], idle: ['var(--muted)', 'vérification…'], checking: ['var(--muted)', 'vérification…'], none: ['var(--ok)', 'à jour (v' + shownVer(u.current) + ')'],
    available: ['var(--loaded)', 'v' + shownVer(u.version) + ' disponible'], downloading: ['var(--warn)', 'téléchargement ' + (u.progress || 0) + ' %'],
    ready: ['var(--loaded)', 'v' + shownVer(u.version) + ' prête'], error: ['var(--muted)', 'hors ligne'], failed: ['var(--race)', 'téléchargement interrompu'] };
  const m = M[u.state] || M.idle;
  document.getElementById('hUpdate').innerHTML = `<span class="d" style="background:${m[0]}"></span>Mises à jour : ${m[1]}`;
  renderUpdatePanel(u);
  // bannière dans le menu
  const ban = document.getElementById('updBanner'), show = ['available', 'downloading', 'ready', 'failed'].includes(u.state);
  ban.classList.toggle('hidden', !show);
  document.querySelector('.side [data-view="reglages"]').classList.toggle('hasupd', show);
  if (show) {
    setText('updBannerText', u.state === 'downloading' ? `Téléchargement de la v${shownVer(u.version)}… ${u.progress || 0} %` : u.state === 'ready' ? `La v${shownVer(u.version)} est prête.` : u.state === 'failed' ? 'Téléchargement interrompu.' : `Mise à jour v${shownVer(u.version)} disponible.`);
    const bb = document.getElementById('updBannerBar'); bb.classList.toggle('hidden', u.state !== 'downloading'); bb.firstElementChild.style.width = (u.progress || 0) + '%';
    const btn = document.getElementById('updBannerBtn'); btn.classList.toggle('hidden', u.state === 'downloading');
    btn.textContent = u.state === 'ready' ? 'Installer et fermer' : u.state === 'failed' ? 'Réessayer' : 'Mettre à jour';
  }
  if (u.state === 'ready' && autoInstall && !installing) doInstall(u.version);
}
async function startUpdate(){
  const cur = await window.tel.updateStatus();
  if (cur.state === 'ready') return doInstall(cur.version);
  if (cur.state === 'available' || cur.state === 'failed') { autoInstall = true; await window.tel.downloadUpdate(); return refreshUpdate(); }
  renderUpdatePanel({ ...cur, state: 'checking' });
  const u = await window.tel.checkUpdate();
  renderUpdatePanel(u); refreshUpdate();
}
async function doInstall(version){
  installing = true;
  setText('installingTitle', `Installation de la v${version}…`);
  document.getElementById('installing').classList.remove('hidden');
  const ok = await window.tel.installUpdate();
  if (!ok) { installing = false; document.getElementById('installing').classList.add('hidden'); }
}
function renderUpdatePanel(u, extra){
  setText('updCurrent', 'v' + shownVer(u.current));
  const btn = document.getElementById('btnUpdate');
  const MSG = { dev: 'Mode test : les mises à jour ne sont actives que dans l\'appli installée.', checking: 'Recherche en cours…', none: 'Tu as la dernière version.',
    available: 'La version v' + shownVer(u.version) + ' est disponible. Elle s\'installe sans assistant Windows, puis l\'appli redémarre toute seule.',
    downloading: 'Téléchargement de la v' + shownVer(u.version) + ' : ' + (u.progress || 0) + ' %', ready: 'La version v' + shownVer(u.version) + ' est prête à être installée.',
    error: 'Impossible de vérifier (pas de connexion ?).', failed: 'Le téléchargement s\'est interrompu. Réessaie.', idle: 'L\'appli vérifie toute seule au démarrage puis toutes les 30 minutes.' };
  setText('updMsg', extra || MSG[u.state] || MSG.idle);
  btn.textContent = u.state === 'ready' ? 'Installer et fermer' : u.state === 'available' ? 'Mettre à jour vers v' + shownVer(u.version) : u.state === 'failed' ? 'Réessayer'
    : u.state === 'downloading' ? 'Téléchargement… ' + (u.progress || 0) + ' %' : u.state === 'checking' ? 'Recherche…' : 'Rechercher une mise à jour';
  btn.disabled = u.state === 'checking' || u.state === 'downloading';
  btn.style.opacity = btn.disabled ? .6 : 1;
  const bar = document.getElementById('updBar'); bar.classList.toggle('hidden', u.state !== 'downloading'); bar.firstElementChild.style.width = (u.progress || 0) + '%';
}
