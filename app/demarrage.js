/* Démarrage de l'interface : tout ce qui s'exécute au chargement, DANS L'ORDRE D'ORIGINE
   (état initial, branchement des boutons, premiers affichages, abonnements aux événements du noyau).
   Ces lignes ont été laissées dans un seul fichier exprès : les sortir dans les dossiers des fonctionnalités
   changerait leur ordre d'exécution (voir app/LISEZ-MOI.md, « Ce qui reste à découper »).
   Chaque bloc indique la fonctionnalité dont il fait partie. */

/* ===== Navigation — voir commun/navigation.js ===== */
state.side = 'hub';
document.querySelectorAll('[data-side-btn]').forEach(b => b.onclick = () => { closeSpaces(); go(lastView[b.dataset.sideBtn]); });
document.getElementById('spaceBtn').onclick = () => document.getElementById('spacePanel').classList.contains('hidden') ? openSpaces() : (closeSpaces(), document.getElementById('spaceBtn').focus());
document.getElementById('spaceClose').onclick = () => { closeSpaces(); document.getElementById('spaceBtn').focus(); };
document.getElementById('spacePanel').addEventListener('click', e => { if (e.target.id === 'spacePanel') closeSpaces(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.getElementById('spacePanel').classList.contains('hidden')) { closeSpaces(); document.getElementById('spaceBtn').focus(); } });
document.getElementById('spaceHome').onclick = () => { closeSpaces(); showLauncher(true); };
document.getElementById('spaceOptions').onclick = () => { closeSpaces(); openGameSettings(); };
const catState = store.get('cats', { gen: true, ent: false });
document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { catState[b.dataset.cat] = !catState[b.dataset.cat]; store.set('cats', catState); applyCats(); });
applyCats();
document.querySelectorAll('[data-app-name]').forEach(e => { e.textContent = APP.name; });
document.querySelectorAll('[data-app-logo]').forEach(e => { e.textContent = APP.logo; });
document.title = APP.name;
if (/-beta/i.test(new URLSearchParams(location.search).get('v') || '')) { document.title = APP.name + ' Bêta'; document.querySelectorAll('.appname b[data-app-name]').forEach(e => e.insertAdjacentHTML('afterend', '<span class="betabadge">BÊTA</span>')); }
let activeGame = store.get('game', null);

/* ===== Écran de lancement — voir fonctionnalites/choix-du-jeu/choix-du-jeu.js ===== */
// Visuels : image fournie dans app/assets/games/<jeu>.jpg si elle existe, sinon l'illustration intégrée
document.querySelectorAll('.gamecard').forEach(c => { const img = new Image(); img.onload = () => c.style.setProperty('--photo', `url("assets/games/${c.dataset.game}.jpg")`); img.src = `assets/games/${c.dataset.game}.jpg`; });
document.querySelectorAll('.gamecard').forEach(c => c.onclick = () => openGame(c.dataset.game));
document.getElementById('gameChip').onclick = () => showLauncher(true);
document.getElementById('railLogo').onclick = () => showLauncher(true);
document.getElementById('rail').addEventListener('click', e => {
  const b = e.target.closest('.railbtn'); if (!b || b.dataset.srail) return;
  if (typeof closeSpaces === 'function') closeSpaces();
  const t = b.dataset.rail;
  const wasSel = !document.getElementById('launcher').classList.contains('hidden');
  if (t === 'game') {
    const onSel = !document.getElementById('launcher').classList.contains('hidden');
    if (onSel) return;
    if (railTab === 'game' || !activeGame) showLauncher(true);      // retour au choix du jeu
    else { showLauncher(false); go(lastView[state.side] || 'accueil'); }  // retour dans l'espace en cours
    return;
  }
  showLauncher(false);
  if (t === 'news') go('news', 'news');
  else if (t === 'map') go('cartePerso', 'map');
  else if (t === 'settings') { settingsFrom = wasSel ? 'game' : railTab; openOptCat(lastOptCat.general); go('reglages', 'settings'); }
  else if (t === 'support') go('support', 'support');
});
document.getElementById('rail').addEventListener('keydown', e => {
  if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
  const bs = [...document.querySelectorAll('.railbtn')].filter(x => x.offsetParent !== null), i = bs.indexOf(document.activeElement); if (i < 0) return;
  e.preventDefault(); bs[(i + (e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length].focus();
});
document.getElementById('lfNotes').onclick = () => { showLauncher(false); openOptCat('maj'); go('reglages', 'settings'); };
document.getElementById('lfAbout').onclick = () => { showLauncher(false); go('support', 'support'); };
new MutationObserver(muts => { for (const m of muts) { const t = m.target; if (t.matches && t.matches('.seg button, .sideswitch button')) t.setAttribute('aria-pressed', t.classList.contains('on') ? 'true' : 'false'); else if (m.type === 'childList') syncPressed(t); } })
  .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
syncPressed();
document.querySelector('.skip').onclick = (e) => { e.preventDefault(); document.getElementById('mainContent').focus(); };
document.getElementById('brandBtn').onclick = () => showLauncher(true);
document.querySelectorAll('[data-goto-view]').forEach(b => b.onclick = () => go(b.dataset.gotoView));
document.querySelectorAll('.navbtn').forEach(b => b.onclick = () => go(b.dataset.view));

/* ===== Navigation — voir commun/navigation.js ===== */
let navWidth = Math.min(NAV_MAX, Math.max(NAV_MIN, Number(store.get('navWidth', NAV_DEF)) || NAV_DEF));
document.getElementById('navToggle').onclick = () => { navAuto = false; applyNavMini(document.documentElement.dataset.nav !== 'mini', true); };
document.getElementById('navMiniSwitch').onchange = (e) => applyNavMini(e.target.checked, true);
applyNavMini(store.get('navMini', false));
setNavWidth(navWidth);
(() => {
  const h = document.getElementById('sideResize');
  h.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); h.setPointerCapture(e.pointerId);
    const de = document.documentElement, gauche = document.querySelector('.side').getBoundingClientRect().left;
    de.classList.add('resizing');
    let etat = de.dataset.nav === 'mini' ? 'reduit' : 'large', annonce = false;
    const depart = { mini: etat === 'reduit', largeur: navWidth };
    const move = ev => {
      const r = largeurMenu(ev.clientX - gauche, de.dataset.nav === 'mini', { min: NAV_MIN, max: NAV_MAX });
      etat = r.etat;
      if (r.etat === 'large' && de.dataset.nav === 'mini') applyNavMini(false);
      if (r.largeur != null) setNavWidth(r.largeur);
      de.classList.toggle('nav-va-replier', r.etat === 'replier');
      if (r.etat === 'replier' && !annonce) { annonce = true; announce('Relâche pour replier le menu'); }
      if (r.etat !== 'replier') annonce = false;
    };
    let fini = false;
    const fin = (annule) => {
      if (fini) return; fini = true;
      h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up);
      h.removeEventListener('pointercancel', cancel); h.removeEventListener('lostpointercapture', lost);
      de.classList.remove('resizing', 'nav-va-replier');
      if (annule) { applyNavMini(depart.mini); setNavWidth(depart.largeur); return; }
      if (finGlissement(etat) === 'reduit') applyNavMini(true, true); else applyNavMini(false, true);
      store.set('navWidth', navWidth);
    };
    const up = () => fin(false), cancel = () => fin(true), lost = () => fin(false);
    h.addEventListener('pointermove', move); h.addEventListener('pointerup', up);
    h.addEventListener('pointercancel', cancel); h.addEventListener('lostpointercapture', lost);
  });
  h.addEventListener('dblclick', () => { applyNavMini(false, true); setNavWidth(NAV_DEF, true); });
  h.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const mini = document.documentElement.dataset.nav === 'mini';
    if (e.key === 'ArrowLeft') { if (!mini && navWidth <= NAV_MIN) applyNavMini(true, true); else if (!mini) setNavWidth(navWidth - 16, true); }
    else { if (mini) applyNavMini(false, true); else setNavWidth(navWidth + 16, true); }
  });
})();
window.addEventListener('resize', autoNav);
 autoNav();

/* ===== Paramètres — voir fonctionnalites/parametres/parametres.js ===== */
/* ---------- Options : catégories ---------- */
let optCat = store.get('optCat', 'general');
construirePagesBientot();   // pages « Bientôt disponible » : avant la recopie du menu ci-dessous (fonctionnalites/parametres/bientot/)
document.getElementById('optNav').addEventListener('click', e => { const b = e.target.closest('[data-oc]'); if (b) { openOptCat(b.dataset.oc); document.querySelector('main').scrollTop = 0; } });
document.getElementById('optNav').addEventListener('keydown', e => {
  if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const bs = [...document.querySelectorAll('#optNav [data-oc]')], i = bs.findIndex(b => b.dataset.oc === optCat);
  const n = bs[(i + (['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : bs.length - 1)) % bs.length];
  e.preventDefault(); openOptCat(n.dataset.oc); n.focus();
});
(() => {
  const nav = document.getElementById('navOptions');
  document.querySelectorAll('#optNav [data-oc]').forEach(b => {
    const c = document.createElement('button');
    c.className = 'navbtn' + (b.classList.contains('is-soon') ? ' is-soon' : ''); c.dataset.oc = b.dataset.oc;
    c.innerHTML = b.innerHTML.replace('width="18" height="18"', 'width="20" height="20"');
    c.querySelector('span').style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    c.onclick = () => { openOptCat(c.dataset.oc); document.querySelector('main').scrollTop = 0; };
    nav.append(c);
  });
  document.getElementById('optBack').onclick = () => {
    if (railTab === 'settings') {
      if (settingsFrom === 'news') return go('news', 'news');
      if (settingsFrom === 'map') return go('cartePerso', 'map');
      if (settingsFrom === 'support') return go('support', 'support');
      return showLauncher(true);       // ouvert depuis la page Game
    }
    go(lastView[state.side] || 'accueil');
  };
  applyNavMini(document.documentElement.dataset.nav === 'mini'); // infobulles des nouvelles entrées en menu réduit
})();
/* Espace Entreprise : Retour (et Alt + ←) ramène au menu principal, sur l'entrée Entreprise */
document.getElementById('entBack').onclick = () => {
  go(lastEnJeu || 'accueil');
  const b = document.getElementById('navEntBtn'); if (b) b.focus();
};
document.addEventListener('keydown', e => {
  if (e.altKey && e.key === 'ArrowLeft' && inEntreprise() && railTab === 'game') { e.preventDefault(); document.getElementById('entBack').click(); }
});
openOptCat(optCat);

/* ===== Navigation — voir commun/navigation.js ===== */
/* ---------- Bêta : tout se referme au retour au menu principal ---------- */
var atDirty = false;
document.getElementById('mainContent').addEventListener('input', e => { if (e.target.closest('#v-at-profil .atbody, #v-at-coach .atbody')) atDirty = true; });
document.getElementById('mainContent').addEventListener('change', e => { if (e.target.closest('#v-at-profil .atbody, #v-at-coach .atbody')) atDirty = true; });

/* ===== Paramètres — voir fonctionnalites/parametres/parametres.js ===== */
const lastOptCat = Object.assign({ general: 'general', game: 'jeu' }, store.get('lastOptCat', {}));
const openOptCatBase = openOptCat;
openOptCat = function (cat) { openOptCatBase(cat); syncOptMode(); };
document.getElementById('navOptBtn').onclick = openGameSettings;
(() => {
  const b = document.createElement('button');
  b.className = 'navbtn optmode'; b.id = 'optSwitchMode';
  b.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>';
  b.onclick = () => { openOptCat(optMode === 'game' ? lastOptCat.general : lastOptCat.game); document.querySelector('main').scrollTop = 0; };
  document.getElementById('navOptions').append(b);
})();
document.querySelectorAll('#unitsSeg [data-units]').forEach(b => b.onclick = async () => {
  if (!HAS_APP) { UNITS.set(b.dataset.units); syncUnitsUI(); return; }
  const st = await window.tel.setSettings({ units: b.dataset.units });
  UNITS.set(st.units); loadSettingsUI();
});
document.getElementById('optCopyGame').onclick = async () => {
  const g = activeGame === 'ats' ? 'ats' : 'ets2', o = g === 'ats' ? 'ets2' : 'ats';
  const ok = await ask('Copier les réglages de ' + GAMES_UI[o].tag + ' ?', `Les réglages de jeu de <b>${GAMES_UI[o].name}</b> (Conduite, HUD, profil de carrière) remplacent ceux de <b>${GAMES_UI[g].name}</b>. Les unités ne changent pas.`, 'Copier');
  if (!ok || !HAS_APP) return;
  reloadGameUI(await window.tel.copyGameSettings(o, g));
};
if (window.tel && window.tel.onSettingsChanged) window.tel.onSettingsChanged(st => { if (st.activeGame && st.activeGame !== activeGame) applyGame(st.activeGame); else reloadGameUI(st); });

/* ===== Compte & accès — voir fonctionnalites/compte/compte.js ===== */
document.getElementById('accRedeem').onclick = async () => {
  const v = document.getElementById('accKey').value;
  const r = await accCall('redeem', v);
  if (!r.ok) return accMsg('accKeyMsg', r.error, true);
  document.getElementById('accKey').value = '';
  accMsg('accKeyMsg', `Clé activée : tu es maintenant ${r.value.rank.name}.`);
  renderAcces();
};
document.getElementById('accKey').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('accRedeem').click(); });
document.getElementById('accAs').onchange = async e => { await accCall('previewAs', e.target.value); renderAcces(); };
document.getElementById('accReset').onclick = async () => {
  if (!await ask('Effacer l’aperçu ?', 'Les rangs et les clés créés pour essayer sont supprimés, et tu redeviens Fondateur.', 'Effacer')) return;
  await accCall('reset'); accMsg('accKeyMsg', ''); renderAcces();
};
document.getElementById('arSave').onclick = async () => {
  const f = document.getElementById('accRankForm');
  const input = { id: f.dataset.editId || undefined, name: document.getElementById('arName').value, color: document.getElementById('arColor').value, level: Number(document.getElementById('arLevel').value), perms: [...document.querySelectorAll('#arPerms input:checked')].map(i => i.value) };
  const r = await accCall('saveRank', input);
  if (!r.ok) return accMsg('arMsg', r.error, true);
  accMsg('arMsg', `Rang « ${r.value.name} » enregistré.`);
  delete f.dataset.editId; f.querySelector('summary').textContent = 'Créer un rang'; document.getElementById('arName').value = '';
  renderAcces();
};
document.getElementById('akCreate').onclick = async () => {
  const exp = document.getElementById('akExp').value;
  const r = await accCall('createKeys', Number(document.getElementById('akCount').value), { rank: document.getElementById('akRank').value || null, maxUses: Number(document.getElementById('akUses').value), expiresAt: exp ? exp + 'T23:59:59' : null });
  if (!r.ok) return accMsg('akMsg', r.error, true);
  accMsg('akMsg', r.value.length > 1 ? `${r.value.length} clés créées.` : 'Clé créée.');
  renderAcces();
};
document.getElementById('accVtcBtn').onclick = async () => {
  setText('accVtc', 'Recherche sur TruckersMP…');
  const r = await accCall('vtc');
  if (!r.ok) return setText('accVtc', r.error);
  const v = r.value;
  setText('accVtc', !v.found || !v.vtc ? v.reason : `${v.vtc.name}${v.vtc.tag ? ' [' + v.vtc.tag + ']' : ''}${v.vtc.role ? ' · rôle : ' + v.vtc.role : ''} (TruckersMP). Plus tard, le fondateur de ta VTC pourra relier ce rôle à un rang de l’appli.`);
};
const openOptCatAcc = openOptCat;
openOptCat = function (cat) { openOptCatAcc(cat); if (cat === 'compte') renderAcces(); };

/* ===== Paramètres — voir fonctionnalites/parametres/parametres.js ===== */
document.querySelectorAll('.rail-settings [data-srail]').forEach(b => b.onclick = () => b.dataset.srail === 'back' ? leaveSettings() : openFolder(b.dataset.srail));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || railTab !== 'settings' || state.view !== 'reglages') return;
  if (!document.getElementById('modal').classList.contains('hidden')) return;          // une fenêtre ouverte se ferme d'abord
  const q = document.getElementById('optQuery'); if (q && q.value) { q.value = ''; runOptSearch(); return; }
  leaveSettings();
});
// Recherche : fouille toutes les catégories (générales et du jeu), y compris celles des autres dossiers
(() => {
  const nav = document.getElementById('navOptions'), back = document.getElementById('optBack');
  const box = document.createElement('div');
  box.className = 'optsearch';
  box.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="optQuery" type="search" placeholder="Rechercher un réglage" aria-label="Rechercher un réglage" autocomplete="off">';
  const res = document.createElement('div'); res.className = 'optresults hidden'; res.id = 'optResults'; res.setAttribute('role', 'listbox'); res.setAttribute('aria-label', 'Résultats');
  const title = document.createElement('div'); title.className = 'optfolder'; title.id = 'optFolderTitle';
  back.after(box, res, title);
  document.getElementById('optQuery').addEventListener('input', runOptSearch);
  document.getElementById('optQuery').addEventListener('keydown', e => { if (e.key === 'Enter') { const f = res.querySelector('button'); if (f) f.click(); } if (e.key === 'ArrowDown') { const f = res.querySelector('button'); if (f) { e.preventDefault(); f.focus(); } } });
})();
const openOptCatRail = openOptCat;
openOptCat = function (cat) { openOptCatRail(cat); const f = folderOf(cat); lastOptCat['f_' + f] = cat; syncSettingsRail(); };
const setRailBase = setRail;
setRail = function (t) { setRailBase(t); if (typeof syncSettingsRail === 'function') syncSettingsRail(); };

/* ===== Carte — voir fonctionnalites/carte/carte.js ===== */
/* ---------- Nouvelle carte : TCH Map (programme séparé, GPL-3, dossier tch-map/) ----------
   L'appli ne fait que l'afficher dans un cadre et lui envoyer des messages : aucun code de la carte ici. */
let mapEngine = store.get('mapEngine', 'tch');
document.querySelectorAll('#mapEngine [data-engine]').forEach(b => b.onclick = () => { mapEngine = b.dataset.engine; store.set('mapEngine', mapEngine); syncMapEngine(); });
const openMapBase = openMap;
openMap = async function () { await openMapBase(); syncMapEngine(); };
// Boutons existants : ils pilotent aussi la nouvelle carte
document.getElementById('mapFollow').addEventListener('click', () => { if (hasTch() && mapEngine === 'tch') window.tel.tchMap.visible(true, { follow: M.follow }); });
document.querySelectorAll('[data-mapgame]').forEach(b => b.addEventListener('click', () => { if (hasTch() && mapEngine === 'tch' && state.view === 'cartePerso') window.tel.tchMap.visible(true, { game: b.dataset.mapgame }); }));
if (hasTch() && window.tel.tchMap.onProgression) {
  window.tel.tchMap.onProgression((m) => {
    if (m.etape === 'fini' || m.etape === 'erreur') tchPrepMini(null);
    if (m.game !== (tchPrepGame || tchPrepJeu())) { if (TCH_ETAPES[m.etape]) tchPrepMini({ pct: m.total ? 2 + 63 * m.fait / m.total : 2 }); return; }
    tchPrepGame = m.game;
    if (m.etape === 'fini') { tchPrepMaj(); return; }
    tchPrepAfficher(m.etape === 'erreur' ? m : { ...m, etat: 'en-cours' });
  });
  document.getElementById('tchPrepBtn').onclick = async () => {
    const r = await window.tel.tchMap.preparer(tchPrepGame || tchPrepJeu());
    if (!r.ok) tchPrepAfficher({ game: tchPrepGame, etape: 'erreur', message: r.error }); else tchPrepAfficher({ game: tchPrepGame, etat: 'en-cours', etape: 'lecture', s: 0 });
  };
  document.getElementById('tchPrepAnnuler').onclick = () => window.tel.tchMap.annuler();
  document.querySelectorAll('[data-mapgame]').forEach(b => b.addEventListener('click', () => setTimeout(tchPrepMaj, 50)));
}
const syncMapEngineBase = syncMapEngine;
syncMapEngine = async function () { await syncMapEngineBase(); tchPrepMaj(); };

/* ===== Truck & Coach Tools → Mods & sauvegarde — voir fonctionnalites/mods/mods.js ===== */
if (window.tel && window.tel.mods) {
  document.getElementById('modsAnalyser').onclick = async () => {
    const g = activeGame === 'ats' ? 'ats' : 'ets2', btn = document.getElementById('modsAnalyser'), msg = document.getElementById('modsMsg');
    btn.disabled = true; msg.textContent = 'Analyse en cours…';
    const r = await window.tel.mods.analyser(g);
    btn.disabled = false;
    if (!r.ok) { msg.textContent = 'Analyse impossible : ' + r.error; return; }
    modsCache[g] = r.data; renderMods();
  };
  window.tel.mods.onProgression((m) => { if (state.view === 'at-mods' && ETAPES_MODS[m.etape]) document.getElementById('modsMsg').textContent = ETAPES_MODS[m.etape]; });
  document.getElementById('modsDossier').onclick = () => window.tel.mods.ouvrir({ game: activeGame === 'ats' ? 'ats' : 'ets2' });
  document.querySelectorAll('#modsFiltre [data-f]').forEach(b => b.onclick = () => { modsFiltre = b.dataset.f; document.querySelectorAll('#modsFiltre [data-f]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); renderMods(); });
}

/* ===== Page News — voir fonctionnalites/news/news.js ===== */
document.querySelectorAll('#newsSeg [data-news]').forEach(b => b.onclick = () => { newsTab = b.dataset.news; renderNewsPage(); });
document.getElementById('waitOpenPlugin').onclick = () => { openOptCat('jeu'); go('reglages'); };
document.getElementById('supHelp').onclick = () => { settingsFrom = 'support'; openOptCat('aide'); go('reglages', 'settings'); };
document.getElementById('supNotes').onclick = () => { settingsFrom = 'support'; openOptCat('maj'); go('reglages', 'settings'); };
document.getElementById('hudOpenOptions').onclick = () => { openOptCat('hud'); go('reglages'); };

/* ===== Navigation — voir commun/navigation.js ===== */
const revealObs = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
}, { root: document.getElementById('mainContent'), rootMargin: '0px 0px -40px 0px' }) : null;
document.getElementById('mainContent').addEventListener('scroll', e => e.currentTarget.classList.toggle('scrolled', e.currentTarget.scrollTop > 48), { passive: true });

/* ===== Truck & Coach Tools — voir fonctionnalites/atelier/atelier.js ===== */
document.querySelectorAll('[data-atg]').forEach(i => i.onchange = async (e) => {
  const g = i.dataset.atg, want = e.target.checked, name = toolsName(g);
  if (want) {
    const ok = await ask('Activer ' + name + ' ?', 'Ces outils expérimentaux modifient les <b>profils solo</b> de ' + (g === 'ats' ? 'American Truck Simulator' : 'Euro Truck Simulator 2') + '.<ul style="margin:10px 0 0;padding-left:20px"><li>Le jeu doit être fermé pendant une modification.</li><li>Une copie de secours est faite avant chaque changement, avec un bouton « Restaurer ».</li><li>Les profils multijoueur ne sont jamais modifiés.</li></ul>', 'Activer');
    if (!ok) { e.target.checked = false; return; }
  }
  atByGame[g] = want;
  let st = null;
  if (window.tel && window.tel.setGameKey) st = await window.tel.setGameKey(g, 'atelier', want);
  else if (window.tel && (activeGame === 'ats' ? 'ats' : 'ets2') === g) st = await window.tel.setSettings({ atelier: want });
  syncAtelierSwitches(st);
});

/* ===== Truck & Coach Tools → Sauvegardes — voir fonctionnalites/sauvegardes/sauvegardes.js ===== */
document.getElementById('atRefresh').onclick = () => renderSaves();
document.getElementById('atAnalyzeAll').onclick = async (e) => {
  if (!HAS_APP) return;
  const r = await window.tel.atelier.profiles(); if (!r.ok) return;
  e.target.disabled = true;
  for (const p of r.data) await analyzeProfile(p.id);
  e.target.disabled = false;
};
document.getElementById('atOpenFolder').onclick = () => window.tel && window.tel.atelier.openBackups();

/* ===== Navigation — voir commun/navigation.js ===== */
document.getElementById('soonSwitch').onchange = (e) => applySoon(e.target.checked, true);
applySoon(store.get('showSoon', false));
if (window.tel) window.tel.getSettings().then(st => applySoon(!!st.showSoon));

/* ===== Télémétrie — voir fonctionnalites/telemetrie/telemetrie.js ===== */
/* ---------- Télémétrie automatique au lancement du jeu ---------- */
let autoTel = store.get('autoTelemetry', true);
document.getElementById('autoTelSwitch').checked = autoTel;
document.getElementById('autoTelSwitch').onchange = (e) => { autoTel = e.target.checked; store.set('autoTelemetry', autoTel); if (window.tel) window.tel.setSettings({ autoTelemetry: autoTel }); };
if (window.tel) window.tel.getSettings().then(st => { if (typeof st.autoTelemetry === 'boolean') { autoTel = st.autoTelemetry; store.set('autoTelemetry', autoTel); document.getElementById('autoTelSwitch').checked = autoTel; } });

/* ===== Page HUD — voir fonctionnalites/hud/hud.js ===== */
document.getElementById('coachDiag').addEventListener('toggle', renderCoachDiag);
document.getElementById('coachDiagCopy').onclick = async () => {
  await renderCoachDiag();
  if (!coachDiagText) { setText('coachDiagMsg', 'Lance le jeu d’abord.'); return; }
  try { await navigator.clipboard.writeText(coachDiagText); setText('coachDiagMsg', 'Copié ✓'); }
  catch { setText('coachDiagMsg', 'Copie impossible.'); }
  setTimeout(() => setText('coachDiagMsg', ''), 2500);
};
['hudOn', 'hudOnNav', 'hudOnOpt'].forEach(id => document.getElementById(id).onchange = (e) => { ['hudOn', 'hudOnNav', 'hudOnOpt'].forEach(o => { document.getElementById(o).checked = e.target.checked; }); syncHudDot(); hudSave({ on: e.target.checked }); });
document.querySelectorAll('[data-hud-profile] [data-hstyle]').forEach(b => b.onclick = () => hudSave({ opt: { style: b.dataset.hstyle } }, b.closest('[data-hud-profile]').dataset.hudProfile));
document.querySelectorAll('[data-hud-profile] [data-hpos]').forEach(b => b.onclick = () => hudSave({ opt: { position: b.dataset.hpos } }, b.closest('[data-hud-profile]').dataset.hudProfile));
document.querySelectorAll('[data-hud-profile] [data-hlogo]').forEach(b => b.onclick = () => hudSave({ opt: { logo: b.dataset.hlogo === '1' } }, b.closest('[data-hud-profile]').dataset.hudProfile));
document.querySelectorAll('[data-hud-profile] [data-hop]').forEach(b => b.onclick = () => hudSave({ opt: { opacity: Number(b.dataset.hop) } }, b.closest('[data-hud-profile]').dataset.hudProfile));
document.getElementById('hudTruckBoxes').addEventListener('click', e => {
  const b = e.target.closest('[data-hbox]'); if (!b) return;
  const boxes = Object.assign({}, TRUCK_HUD_DEFAULT_BOXES, hudSt.truck.boxes || {});
  boxes[b.dataset.hbox] = !boxes[b.dataset.hbox];
  hudSave({ opt: { boxes } }, 'truck');
});
document.querySelectorAll('[data-hud-profile] [data-hscale]').forEach(b => b.onclick = () => hudSave({ opt: { scale: Number(b.dataset.hscale) } }, b.closest('[data-hud-profile]').dataset.hudProfile));
document.getElementById('hudTestTruck').onclick = () => startHudTest('truck');
document.getElementById('hudTestBus').onclick = () => startHudTest('bus');
if (window.tel) window.tel.getSettings().then(st => {
  hudSt.on = !!(st.modules && st.modules.hud);
  for (const profile of ['truck', 'bus']) Object.assign(hudSt[profile], st.hud && st.hud[profile] || {});
  renderHudPage();
});

/* ===== Marketplace — voir fonctionnalites/marketplace/marketplace.js ===== */
document.getElementById('mkBack').onclick = () => go(mkFrom);
document.getElementById('mkSearch').oninput = renderMk;
bindMkPreview(document.getElementById('v-mk-discover'));
document.querySelectorAll('#mkGame [data-g]').forEach(b => b.onclick = () => { mkGame = b.dataset.g; document.querySelectorAll('#mkGame [data-g]').forEach(x => x.classList.toggle('on', x === b)); renderMk(); });

/* ===== Paramètres → Apparence — voir fonctionnalites/parametres/apparence.js ===== */
let look = Object.assign({}, DEF_LOOK, store.get('look', {}));
const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (look.theme === 'systeme') applyLook(); });
document.querySelectorAll('[data-theme-btn]').forEach(x => x.onclick = () => applyLook({ theme: x.dataset.themeBtn }, true));
document.querySelectorAll('[data-vision-btn]').forEach(x => x.onclick = () => applyLook({ vision: x.dataset.visionBtn }, true));
document.querySelectorAll('[data-accent-btn]').forEach(x => x.onclick = () => applyLook({ accent: x.dataset.accentBtn }, true));
const accentPick = document.getElementById('accentPick');
accentPick.oninput = (e) => applyLook({ accent: e.target.value.toUpperCase() }, false);
accentPick.onchange = (e) => applyLook({ accent: e.target.value.toUpperCase() }, true);
if (window.tel && window.tel.systemAccent){
  window.tel.systemAccent().then(c => { winAccent = c || null; applyAccent(); });
  window.tel.onSystemAccent(c => { winAccent = c || null; applyAccent(); });
}
document.querySelectorAll('[data-zoom-btn]').forEach(x => x.onclick = () => applyLook({ zoom: x.dataset.zoomBtn }, true));
document.getElementById('contrastSwitch').onchange = (e) => applyLook({ contrast: e.target.checked }, true);
document.getElementById('motionSwitch').onchange = (e) => applyLook({ motion: e.target.checked }, true);
applyLook();
if (window.tel) window.tel.getSettings().then(st => { if (st.look) applyLook(st.look); syncAtelierSwitches(st); if (st.atelier) window.tel.atelier.profiles().then(r => r.ok && setText('lAtProfiles', String(r.data.length))); });

/* ===== Carte — voir fonctionnalites/carte/carte.js ===== */
const M = { map: null, info: MAP_FALLBACK, game: store.get('mapGame', 'ets2'), follow: true, tiles: null, truck: null, dest: null,
            trail: null, jobs: null, cities: null, firstFix: true, hist: null, histAt: 0, tileOk: 0, tileErr: 0, lastLive: null };

/* ===== Télémétrie — voir fonctionnalites/telemetrie/telemetrie.js ===== */
document.getElementById('telTabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-tt]'); if (!b) return;
  // Revenir sur l’onglet du véhicule conduit réactive la bascule automatique
  telManual = b.dataset.tt === (telLastType === 'car' ? 'bus' : 'truck') ? null : b.dataset.tt;
  applyTelTab(); telAutoText(telLastConnected);
});
applyTelTab();

/* ===== Page Accueil du Hub — voir fonctionnalites/accueil/accueil.js ===== */
document.querySelectorAll('.addon-preview').forEach(a => a.onclick = (e) => { e.preventDefault(); go(a.dataset.goto); });
if (HAS_APP){
  document.getElementById('btnLaunch').onclick = () => launch(activeGame === 'ats' ? 'ats' : 'ets2');
  syncLaunch();
  bindAts();
  document.querySelectorAll('[data-link]').forEach(b => b.onclick = async () => {
    const ok = await window.tel.openLink(b.dataset.link);
    if (!ok && b.dataset.link === 'mods') setText('launchHint', 'Dossier des mods introuvable (Documents\\Euro Truck Simulator 2\\mod).');
  });
  document.getElementById('btnUpdate').onclick = startUpdate;
  document.getElementById('updBannerBtn').onclick = startUpdate;
  refreshPseudo(); refreshUpdate(); setInterval(refreshUpdate, 1500);
  document.getElementById('btnSave').onclick = async () => {
    const limits = ['sTruck', 'sCar', 'sPct'].map(id => document.getElementById(id));
    if (!limits.every(input => input.reportValidity())) return;
    try {
      await window.tel.setSettings({
        pseudo: document.getElementById('sPseudo').value.trim(),
        vehicleType: document.getElementById('sType').value,
        limitTruck: Math.min(150, Math.max(60, Math.round(UNITS.toKmh(Number(document.getElementById('sTruck').value))))),
        limitCar: Math.min(150, Math.max(60, Math.round(UNITS.toKmh(Number(document.getElementById('sCar').value))))),
        racePct: Number(document.getElementById('sPct').value)
      });
      refreshPseudo();
      setText('saveMsg', 'Enregistré ✓'); setTimeout(() => setText('saveMsg', ''), 2000);
    } catch (error) {
      setText('saveMsg', cleanError(error, 'Enregistrement impossible.'));
    }
  };
  // Messages d'erreur sans le préfixe technique d'Electron (« Error invoking remote method … »).
  function cleanError(error, fallback) { return String((error && error.message) || fallback).replace(/^Error invoking remote method '[^']*': (\w*Error: )?/, '') || fallback; }
  document.getElementById('btnSteamTest').onclick = async () => {
    const status = document.getElementById('steamStatus');
    status.textContent = 'Vérification Steam…';
    try {
      const id = document.getElementById('steamId').value.trim();
      await window.tel.setSettings({ steamId: id });
      const key = document.getElementById('steamApiKey').value.trim();
      if (key) await window.tel.setSteamApiKey(key);
      const profile = await window.tel.steamProfile();
      document.getElementById('steamApiKey').value = '';
      status.textContent = `${profile.name} — ` + profile.games.map(g => `${g.name} : ${g.owned ? `possédé, ${g.playtimeHours} h` : 'non détecté'}`).join(' · ');
    } catch (error) { status.textContent = cleanError(error, 'Connexion Steam impossible.'); }
  };
  document.getElementById('btnSteamClear').onclick = async () => {
    const status = document.getElementById('steamStatus');
    try {
      await window.tel.clearSteamApiKey();
      document.getElementById('steamApiKey').value = '';
      status.textContent = 'Clé Steam effacée.';
    } catch (error) { status.textContent = cleanError(error, 'Impossible d’effacer la clé.'); }
  };
  document.getElementById('btnDiscordTest').onclick = async () => {
    const status = document.getElementById('discordStatus');
    status.textContent = 'Connexion à Discord…';
    try {
      const clientId = document.getElementById('discordClientId').value.trim();
      await window.tel.setSettings({ discordClientId: clientId });
      const result = await window.tel.testDiscordPresence(clientId);
      status.textContent = result.ok ? result.message : result.error;
    } catch (error) { status.textContent = cleanError(error, 'Connexion Discord impossible.'); }
  };
  document.getElementById('btnInstall').onclick = async () => renderPlugin(await window.tel.installPlugin(), 'Vérification terminée.');
  document.getElementById('btnChoose').onclick = async () => {
    const r = await window.tel.chooseGameFolder();
    renderPlugin(r.status, r.ok ? 'Dossier ajouté.' : (r.error || ''));
  };
  window.tel.pluginStatus().then(l => renderPlugin(l));
  const poll = async () => { try { const sn = await window.tel.snapshot(); autoOpenTelemetry(!!sn.connected); renderLive(sn); if (state.view === 'hud' || state.view === 'reglages') { const t = sn.connected ? `Profil actif : ${sn.vehicleType === 'car' ? 'bus / car' : 'camion'}` : 'En attente du jeu'; setText('hudVehicleDetected', t); setText('hudVehicleDetectedOpt', t); } if (state.view === 'reglages') renderCoachDiag(); if (state.view === 'accueil') renderAccueilResume(sn); if (state.view === 'feuilleRoute') { renderRoadmap(sn); renderHistory(sn); if (sn.jobs && sn.jobs.length && sn.jobs[0].ended !== frDernierFin) { frDernierFin = sn.jobs[0].ended; if (frOnglet !== 'trajets') frChargerJournal().then(frRendreOnglet); } } if (state.view === 'cartePerso') updateMap(sn); if (state.view === 'hud' && !hudDemo) hudPreview(sn.connected ? sn : hudStatic); } catch(e) {} };
  setInterval(poll, 250); poll();
  document.getElementById('routeTabs').addEventListener('click', e => {
    const b = e.target.closest('button[data-rt]'); if (!b) return;
    routeTab = b.dataset.rt; routeSig = '';
    document.querySelectorAll('#routeTabs button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    document.getElementById('routeTabHint').textContent = routeTab === 'all' ? 'Tous les trajets, camion et car. Clique sur un trajet pour voir son détail.' : routeTab === 'bus'
      ? 'Car : un service peut avoir beaucoup d’arrêts. Clique sur un trajet pour voir chaque arrêt desservi et où le service s’est arrêté.'
      : 'Camion : une livraison d’un point A à un point B. Clique sur un trajet pour voir où il s’est terminé.';
    window.tel.snapshot().then(sn => renderRouteHistory(Array.isArray(sn.jobs) ? sn.jobs : []));
  });
  document.getElementById('routeHistory').addEventListener('toggle', e => {
    const d = e.target; if (!d.classList || !d.classList.contains('rt-item')) return;
    d.open ? routeOpen.add(d.dataset.key) : routeOpen.delete(d.dataset.key);
  }, true);
  frBrancherOnglets();
} else {
  renderPlugin([]);
  document.getElementById('hUpdate').innerHTML = '<span class="d" style="background:var(--muted)"></span>Mises à jour : dans l\'appli';
}
const v = shownVer(new URLSearchParams(location.search).get('v'));
if (v) { document.getElementById('appVersion').textContent = 'Version ' + v; document.getElementById('lVersion').textContent = 'Version ' + v; setText('lfVer', v); setText('supVer', 'version ' + v); }

/* ===== Notes de version — voir fonctionnalites/notes-version/notes-version.js ===== */
// Notes de version (Options → Mises à jour), rangées par rubriques : Nouveautés, Améliorations, Changements, Corrections.
const RAW_VER = new URLSearchParams(location.search).get('v') || '';
const APP_BETA = /-beta/i.test(RAW_VER);
const RUB_LAB = Object.fromEntries(RUBS);
let notesTab = APP_BETA ? 'beta' : 'officielle';
document.querySelectorAll('#notesSeg [data-notes]').forEach(b => b.onclick = () => { notesTab = b.dataset.notes; renderNotes(v); });

/* ===== Paramètres — voir fonctionnalites/parametres/parametres.js ===== */
document.getElementById('betaSwitch').onchange = e => { store.set('betaProgram', e.target.checked); notesTab = e.target.checked ? notesTab : 'officielle'; applyBeta(); };
document.getElementById('betaDl').onclick = () => window.open('https://github.com/charlesantoine972-bit/telemetrie-entreprise/releases');
applyBeta();

/* ===== Navigation — voir commun/navigation.js ===== */
renderNews(v);
renderMk();
 go('accueil');
 if (activeGame) applyGame(activeGame);
 showLauncher(true);
 tickTablet();
setInterval(tickTablet, 3000);
