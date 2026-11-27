/* Marketplace (en préparation : visible seulement avec Paramètres → Interface → « Pages en préparation »).
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

/* ---------- Marketplace (catalogue de départ : nos modules) ---------- */
const MK_CATS = { modules: 'Modules du Hub', trucks: 'Camions', cars: 'Cars & bus' };
const MK = [
  { id: 'tablette', name: 'Tablette in-game', author: 'Truck & Coach Hub', cat: 'modules', games: ['ETS2', 'ATS'], version: '1.0 (en préparation)', size: '—',
    desc: 'Mission en cours, collègues en ligne, messages de l\'entreprise, GPS et musique, sur une tablette à ouvrir en jeu.',
    long: 'Une tablette que tu ouvres et refermes en jeu avec une touche. Elle affiche ta mission en cours, les collègues de ton entreprise en ligne, les messages de l\'entreprise et des petites applis. Deux versions : universelle (posée sur l\'écran) ou calée sur l\'écran de ton camion.',
    feat: ['Mission en cours : trajet, reste, arrivée, dégâts, carburant', 'Kilomètres de la session (chargé / à vide) et ton rang', 'Collègues en ligne et messages de l\'entreprise', 'Applis : GPS, lecteur de musique, et plus tard un « App Store »', 'Version calée sur l\'écran du camion, mémorisée par modèle'] },
  { id: 'gps', name: 'Mini-GPS', author: 'Truck & Coach Hub', cat: 'modules', games: ['ETS2', 'ATS'], version: '1.0 (en préparation)', size: '—',
    desc: 'Un petit GPS discret, style TomTom : prochaine direction, distance et temps restants, limitation.',
    long: 'Un petit GPS dans un coin de l\'écran, pour garder l\'essentiel sous les yeux sans ouvrir la carte du jeu. Position, taille et transparence réglables.',
    feat: ['Prochaine direction', 'Distance et temps restants, destination', 'Limitation de vitesse', 'Position, taille et transparence réglables'] }
];
let mkGame = 'all';
// Entrée globale (barre de gauche) : filtre réglé sur le jeu choisi ; un contenu commun aux deux jeux n'apparaît qu'une fois.
function openMarketplace(){
  mkGame = activeGame === 'ats' ? 'ATS' : 'ETS2';
  document.querySelectorAll('#mkGame [data-g]').forEach(x => { const on = x.dataset.g === mkGame; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  go('mk-discover', 'market');
}
function mkCard(m){
  return `<article class="mkcard"><div class="mkimg"><svg aria-hidden="true" focusable="false" width="34" height="34" viewBox="0 0 24 24" fill="currentColor">${m.id === 'gps' ? '<path d="M5.84 4.57a8.7 8.7 0 0 1 12.32 12.31l-1.19 1.18q-1.31 1.29-3.4 3.3c-.88.85-2.26.85-3.13 0l-3.5-3.39-1.1-1.09a8.7 8.7 0 0 1 0-12.31M17.1 5.63a7.2 7.2 0 1 0-10.2 10.2l1.5 1.46 3.08 3c.29.28.75.28 1.04 0l3.4-3.3 1.18-1.17a7.2 7.2 0 0 0 0-10.19M12 7.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>' : '<path d="M19.75 4C20.99 4 22 5 22 6.25v11.5C22 19 21 20 19.75 20H4.25C3.01 20 2 19 2 17.75V6.25C2 5.01 3 4 4.25 4zm0 1.5H4.25a.75.75 0 0 0-.75.75v11.5c0 .42.34.75.75.75h15.5c.41 0 .75-.33.75-.75V6.25a.75.75 0 0 0-.75-.75m-9.5 10h3.5a.75.75 0 0 1 .1 1.5h-3.6a.75.75 0 0 1-.1-1.5zh3.5z"/>'}</svg></div>
    <div class="mkbody"><div class="row" style="gap:8px"><b style="font-size:15px">${escM(m.name)}</b><span class="soon" style="margin:0">Bientôt</span></div>
    <span class="muted" style="font-size:12px">${escM(m.author)} · ${m.games.join(' / ')} · ${escM(MK_CATS[m.cat])}</span>
    <span class="soft" style="font-size:13px;line-height:1.6;flex:1">${escM(m.desc)}</span>
    <div class="row" style="gap:8px;margin-top:4px"><button class="btn primary" disabled style="height:36px;opacity:.55;cursor:not-allowed">Installer</button><button class="btn" style="height:36px" data-mk-item="${m.id}">Voir l'aperçu</button></div></div></article>`;
}
function bindMkPreview(root){ root.querySelectorAll('[data-mk-item]').forEach(b => b.onclick = () => go('mk-item:' + b.dataset.mkItem)); }
let mkFrom = 'mk-discover';
function renderMkItem(id){
  const m = MK.find(x => x.id === id); if (!m) return;
  setText('mkItemName', m.name); setText('mkItemKick', 'MARKETPLACE · ' + MK_CATS[m.cat].toUpperCase());
  setText('mkItemMeta', `${m.author} · ${m.games.join(' / ')}`);
  setText('mkItemDesc', m.long);
  document.getElementById('mkItemFeat').innerHTML = m.feat.map(f => '<li>' + escM(f) + '</li>').join('');
  document.getElementById('mkItemInfo').innerHTML = [['Auteur', m.author], ['Jeux', m.games.join(' / ')], ['Catégorie', MK_CATS[m.cat]], ['Version', m.version], ['Prix', 'Gratuit'], ['Statut', 'Bientôt disponible']]
    .map(([k, v]) => `<div class="between" style="font-size:14px"><span class="muted">${k}</span><b>${escM(v)}</b></div>`).join('');
  const pv = document.getElementById('mkItemPreview'); pv.innerHTML = '';
  if (id === 'tablette') { const c = document.querySelector('#v-tablette .tablet').cloneNode(true); c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); pv.appendChild(c); }
  else pv.appendChild(document.getElementById('tplGps').content.cloneNode(true));
}
const MK_FEATURED = ['tablette', 'gps'];
const MK_NEWS = [
  { d: '20/11/2026', t: 'Truck & Coach Tools : supprimer une sauvegarde ou un profil', x: 'Dans Truck & Coach Tools → Sauvegardes, chaque copie faite par le Hub a un bouton « Supprimer », et chaque profil un bouton « Supprimer le profil ». Un profil supprimé reste récupérable dans « Profils supprimés » tant que tu n\'effaces pas ses copies.' },
  { d: '17/11/2026', t: 'Truck & Coach Tools : dupliquer un profil et bilan du profil', x: 'Dans Truck & Coach Tools → Sauvegardes, « Dupliquer » crée une copie de ton profil pour faire des tests sans risque. Dans Truck & Coach Tools → Profil, un bilan en lecture seule montre tes finances, ta flotte et les problèmes à corriger.' },
  { d: '17/11/2026', t: 'Truck & Coach Tools : analyse des sauvegardes', x: 'Dans Truck & Coach Tools → Sauvegardes, le bouton « Analyser » vérifie si les sauvegardes d\'un profil sont corrompues (fichier vide, tronqué, illisible…) sans rien modifier.' },
  { d: '17/11/2026', t: 'Nouvelle couleur et couleur d\'accent au choix', x: 'Le jaune et le bleu laissent place à un orange ambre. Dans Options → Interface, choisis ta couleur d\'accent : pastilles, roue de couleurs ou couleur de Windows.' },
  { d: '17/11/2026', t: 'HUD : seulement quand tu joues', x: 'Le bandeau se cache dans le menu pause, en Alt+Tab, sur le bureau et quand le jeu est réduit. Plugin du jeu mis à jour (1.1.0) : relance le jeu une fois.' },
  { d: '17/11/2026', t: 'Carte en direct', x: 'La vraie carte d\'ETS2 et d\'ATS avec ton camion en direct, ta destination, le tracé de ta session et tes trajets terminés. Hub → Général → Carte.' },
  { d: '17/11/2026', t: 'Accessibilité revue (WCAG 2.1 AA)', x: 'Navigation complète au clavier, lien « Aller au contenu », lecteurs d\'écran (NVDA, Narrateur), contrastes vérifiés dans tous les thèmes, mode Contraste élevé de Windows, une seule couleur d\'action.' },
  { d: '17/11/2026', t: 'Bandeau / HUD en jeu', x: 'Le bandeau par-dessus le jeu est disponible : vitesse, limitation, mode réel / course, distance restante. À activer dans Hub → Entreprise.' },
  { d: '17/11/2026', t: 'Renommer son profil', x: 'Dans Truck & Coach Tools, change le nom de ton profil et de ton entreprise en jeu.' },
  { d: '17/11/2026', t: 'Thèmes et accessibilité', x: 'Thèmes De base, Sombre et Clair, couleurs adaptées au daltonisme, texte agrandi, contraste renforcé.' },
  { d: '17/11/2026', t: 'Coach Tools : carrière car (DLC Coaches)', x: 'XP et compétences car, arrêts de bus, réparation, plein et carte, directement sur tes sauvegardes solo.' },
  { d: '12/11/2026', t: 'Sortie du DLC Coaches', x: 'Les kilomètres en car sont comptés comme ceux en camion, avec leur propre seuil « course » (110 km/h par défaut).' }
];
function renderMkNews(){
  document.getElementById('mkFeatList').innerHTML = MK_FEATURED.map(id => MK.find(x => x.id === id)).filter(Boolean).map(m => `
    <div class="mkfeat" style="flex-direction:column;align-items:flex-start;gap:10px"><span class="lbl" style="color:var(--accent)">À LA UNE · ${escM(m.author.toUpperCase())}</span>
      <b style="font-size:22px">${escM(m.name)}</b><span class="soft" style="font-size:14px;line-height:1.6">${escM(m.desc)}</span>
      <div style="display:flex;gap:10px"><button class="btn" data-mk-item="${m.id}">Voir l'aperçu</button><button class="btn primary" disabled style="opacity:.6;cursor:not-allowed">Bientôt</button></div></div>`).join('');
  document.getElementById('mkNewsList').innerHTML = MK_NEWS.map(n => `<div class="panel" style="display:flex;gap:16px;align-items:flex-start;padding:14px 18px">
    <span class="muted" style="font-size:12px;white-space:nowrap;padding-top:3px">${n.d}</span><div><b>${escM(n.t)}</b><div class="soft" style="font-size:14px;line-height:1.6;margin-top:3px">${escM(n.x)}</div></div></div>`).join('');
  mkFrom = 'mk-news'; bindMkPreview(document.getElementById('v-mk-news'));
}
function renderMk(){
  const q = (document.getElementById('mkSearch').value || '').toLowerCase();
  const list = MK.filter(m => (mkGame === 'all' || m.games.includes(mkGame)) && (!q || (m.name + ' ' + m.desc).toLowerCase().includes(q)));
  const g = document.getElementById('mkGrid');
  g.innerHTML = list.length ? list.map(mkCard).join('') : '<div class="empty" style="grid-column:1/-1">Aucun contenu ne correspond à ta recherche.</div>';
  bindMkPreview(g);
}
function renderMkCat(cat){
  document.getElementById('mkCatTitle').textContent = MK_CATS[cat] || 'Catégorie';
  const list = MK.filter(m => m.cat === cat);
  const g = document.getElementById('mkCatGrid');
  g.innerHTML = list.map(mkCard).join(''); bindMkPreview(g);
  document.getElementById('mkCatEmpty').classList.toggle('hidden', list.length > 0);
}
