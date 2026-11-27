/* Truck & Coach Tools → Sauvegardes : profils, copies, analyse, éléments supprimés.
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

// Analyse des sauvegardes (corrompues ou non) : résultats gardés par profil jusqu'à la prochaine analyse
const atAnalysis = {}, atAnalyzing = new Set();
const ANL = { ok: ['✓', 'Saine'], warn: ['!', 'À vérifier'], bad: ['✕', 'Corrompue'] };
const anlIco = st => `<span class="ico ${st}" aria-hidden="true">${ANL[st][0]}</span>`;
function analysisHtml(id){
  if (atAnalyzing.has(id)) return '<div class="anl" role="status"><div class="head"><span class="spinner" style="width:18px;height:18px;border-width:3px"></span>Analyse en cours… (quelques secondes par sauvegarde)</div></div>';
  const a = atAnalysis[id]; if (!a) return '';
  if (a.error) return `<div class="anl" role="status"><div class="head">${anlIco('bad')}Analyse impossible</div><div class="iss">${escM(a.error)}</div></div>`;
  const total = a.slots.length;
  const st = a.bad ? 'bad' : a.warn ? 'warn' : 'ok';
  const title = a.bad ? `${a.bad} fichier(s) corrompu(s)` : a.warn ? `${a.warn} élément(s) à vérifier` : `Tout est sain (${total} sauvegarde${total > 1 ? 's' : ''})`;
  const rows = [];
  const row = (label, sub, x) => `<li>${anlIco(x.status)}<div class="grow"><b>${escM(label)}</b> <span class="muted">· ${ANL[x.status][1]}${sub ? ' · ' + sub : ''}</span>${x.issues && x.issues.length ? `<div class="iss">${x.issues.map(escM).join('<br>')}</div>` : ''}</div></li>`;
  rows.push(row('Profil (profile.sii)', '', { status: a.profile.status, issues: [...a.profile.issues, ...a.profile.notes] }));
  for (const sl of a.slots) rows.push(row(sl.label, fmtDate(sl.modified), { status: sl.status, issues: sl.files.filter(f => f.status !== 'ok').flatMap(f => [...f.issues, ...f.notes].map(t => f.file + ' : ' + t)) }));
  return `<div class="anl" role="status">
    <div class="head">${anlIco(st)}<span class="grow">${title}</span><span class="muted" style="font-weight:500;font-size:12px">analysé à ${new Date(a.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
    ${a.running ? '<div class="iss">Le jeu est ouvert : une sauvegarde en cours d\'écriture peut sembler abîmée. Ferme le jeu et relance l\'analyse pour être sûr.</div>' : ''}
    ${!a.tool ? '<div class="iss">Outil de déchiffrement absent : seuls les fichiers en texte clair sont vérifiés en profondeur.</div>' : ''}
    ${a.bad ? '<div class="iss"><b>Que faire ?</b> Dans le jeu, charge une sauvegarde saine (✓) plus ancienne, ou restaure ci-dessous une copie faite par le Hub. Évite d\'écraser la sauvegarde corrompue avant d\'avoir récupéré ta progression.</div>' : ''}
    <details${st !== 'ok' ? ' open' : ''}><summary>Détail des ${total + 1} éléments analysés</summary><ul>${rows.join('')}</ul></details>
  </div>`;
}
async function analyzeProfile(id){
  if (atAnalyzing.has(id)) return;
  atAnalyzing.add(id); renderSaves();
  const r = await window.tel.atelier.analyze(id);
  atAnalyzing.delete(id);
  atAnalysis[id] = r.ok ? r.data : { error: r.error };
  if (r.ok) announce(r.data.bad ? `Analyse terminée : ${r.data.bad} fichier(s) corrompu(s).` : r.data.warn ? `Analyse terminée : ${r.data.warn} élément(s) à vérifier.` : 'Analyse terminée : tout est sain.');
  renderSaves();
}
const bkRows = (p, list) => list.map(b => `<div class="bk"><span class="grow">${bkLabel(b.name)}${b.label ? ' · <span class="muted">' + escM(b.label) + '</span>' : ''}</span><button class="btn" style="height:30px;font-size:12px" data-rs="${escM(p.id)}" data-rn="${escM(b.name)}" data-pn="${escM(p.name)}">Restaurer</button><button class="btn danger" style="height:30px;font-size:12px" data-delb="${escM(p.id)}" data-rn="${escM(b.name)}" aria-label="Supprimer la sauvegarde du ${bkLabel(b.name)}">Supprimer</button></div>`).join('');
const bkLabel = n => { const m = n.match(/^(\d{4})-(\d\d)-(\d\d)_(\d\d)-(\d\d)/); return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : n; };
async function renderSaves(msg){
  const box = document.getElementById('atProfiles');
  if (!HAS_APP) { box.innerHTML = '<div class="empty">Disponible dans l\'appli installée.</div>'; return; }
  const st = await window.tel.atelier.status();
  if (st.ok) document.getElementById('atGames').innerHTML = Object.entries(st.data).map(([g, v]) => `<span class="chip" style="margin:0"><span class="d" style="background:${!v.installed ? 'var(--muted)' : v.running ? 'var(--race)' : 'var(--ok)'}"></span>${g === 'ets2' ? 'ETS2' : 'ATS'} : ${!v.installed ? 'non trouvé' : v.running ? 'ouvert (ferme-le pour restaurer)' : 'fermé'}</span>`).join('');
  const r = await window.tel.atelier.profiles();
  setText('atMsg', msg || '');
  if (!r.ok) { box.innerHTML = `<div class="empty">${escM(r.error)}</div>`; return; }
  setText('lAtProfiles', String(r.data.length));
  box.innerHTML = r.data.length ? r.data.map(p => `<div class="panel prof">
      <div class="between" style="align-items:flex-start;flex-wrap:wrap"><div style="min-width:160px;flex:1"><b style="font-size:16px">${escM(p.name)}</b><div class="muted" style="font-size:12px;margin-top:2px">${p.game === 'ets2' ? 'ETS2' : 'ATS'}${p.cloud ? ' · Steam Cloud' : ''} · modifié le ${fmtDate(p.modified)}</div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" style="height:36px" data-an="${escM(p.id)}"${atAnalyzing.has(p.id) ? ' disabled' : ''} title="Vérifie si les sauvegardes de ce profil sont corrompues (ne modifie rien)">Analyser</button><button class="btn" style="height:36px" data-dup="${escM(p.id)}" data-pn="${escM(p.name)}" title="Crée un second profil identique pour faire des tests sans toucher à l'original">Dupliquer</button><button class="btn primary" style="height:36px" data-bk="${escM(p.id)}">Sauvegarder</button></div></div>
      ${analysisHtml(p.id)}
      ${p.backups.length ? bkRows(p, p.backups.slice(0, 3)) + (p.backups.length > 3 ? `<details><summary class="muted" style="font-size:12px;cursor:pointer">+ ${p.backups.length - 3} plus ancienne(s)</summary><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">${bkRows(p, p.backups.slice(3))}</div></details>` : '')
        : '<span class="muted" style="font-size:13px">Aucune sauvegarde pour l\'instant.</span>'}
      <div style="display:flex;justify-content:flex-end"><button class="btn danger" style="height:30px;font-size:12px" data-delp="${escM(p.id)}" data-pn="${escM(p.name)}"${p.cloud ? ' disabled title="Profil Steam Cloud : supprime-le depuis le jeu, sinon Steam risque de le remettre"' : ' title="Supprime ce profil du jeu (une copie est gardée pour pouvoir le récupérer)"'}>Supprimer le profil</button></div>
    </div>`).join('')
    : '<div class="empty" style="grid-column:1/-1">Aucun profil trouvé dans Documents\\Euro Truck Simulator 2 ou American Truck Simulator.<br>Lance le jeu une fois et crée un profil, puis clique sur « Actualiser ».</div>';
  box.querySelectorAll('[data-an]').forEach(b => b.onclick = () => analyzeProfile(b.dataset.an));
  box.querySelectorAll('[data-dup]').forEach(b => b.onclick = async () => {
    const def = (b.dataset.pn + ' (copie)').slice(0, 30);
    const ok = await ask('Dupliquer ce profil ?', `Crée un second profil, identique à <b>${escM(b.dataset.pn)}</b> (sauvegardes, argent, camions…), que tu pourras choisir dans le jeu pour faire des tests. L'original n'est pas modifié.
      <label class="field" style="margin-top:12px">Nom de la copie<input id="dupName" maxlength="30" value="${escM(def)}"></label>
      <div class="muted" style="font-size:12px;margin-top:6px">La copie est rangée dans tes profils locaux (pas dans le Steam Cloud). Tu pourras la supprimer ici avec « Supprimer le profil ».</div>`, 'Dupliquer');
    if (!ok) return;
    const name = (document.getElementById('dupName').value || '').trim();
    b.disabled = true;
    const x = await window.tel.atelier.duplicate(b.dataset.dup, name);
    if (x.ok) announce('Profil dupliqué : ' + x.data.name);
    renderSaves(x.ok ? `Copie « ${x.data.name} » créée ✓ Choisis-la dans le jeu pour faire tes tests.` : x.error);
  });
  box.querySelectorAll('[data-bk]').forEach(b => b.onclick = async () => { b.disabled = true; const x = await window.tel.atelier.backup(b.dataset.bk); renderSaves(x.ok ? 'Sauvegarde faite ✓' : x.error); });
  box.querySelectorAll('[data-rs]').forEach(b => b.onclick = async () => {
    const ok = await ask('Restaurer cette sauvegarde ?', `Le profil <b>${b.dataset.pn}</b> va revenir à son état du <b>${bkLabel(b.dataset.rn)}</b>.<br>Une copie de l'état actuel est faite juste avant, au cas où.`, 'Restaurer');
    if (!ok) return;
    const x = await window.tel.atelier.restore(b.dataset.rs, b.dataset.rn);
    renderSaves(x.ok ? 'Profil restauré ✓' : x.error);
  });
  box.querySelectorAll('[data-delb]').forEach(b => b.onclick = async () => {
    const ok = await ask('Supprimer cette sauvegarde ?', `La copie du <b>${bkLabel(b.dataset.rn)}</b> sera effacée définitivement.<br>Ton profil dans le jeu n'est pas touché.`, 'Supprimer');
    if (!ok) return;
    const x = await window.tel.atelier.deleteBackup(b.dataset.delb, b.dataset.rn);
    renderSaves(x.ok ? 'Sauvegarde supprimée ✓' : x.error);
  });
  box.querySelectorAll('[data-delp]').forEach(b => b.onclick = async () => {
    const ok = await ask('Supprimer ce profil ?', `Le profil <b>${escM(b.dataset.pn)}</b> sera retiré du jeu, avec toutes ses sauvegardes en jeu.<br>Une copie est gardée par le Hub : tu pourras le récupérer plus bas, dans « Profils supprimés ».`, 'Supprimer le profil');
    if (!ok) return;
    b.disabled = true;
    const x = await window.tel.atelier.deleteProfile(b.dataset.delp);
    if (x.ok) { delete atAnalysis[b.dataset.delp]; announce('Profil supprimé : ' + b.dataset.pn); }
    renderSaves(x.ok ? `Profil « ${b.dataset.pn} » supprimé ✓ Tu peux encore le récupérer dans « Profils supprimés ».` : x.error);
  });
  renderDeleted();
}
async function renderDeleted(){
  const box = document.getElementById('atDeleted');
  const r = await window.tel.atelier.deletedProfiles();
  if (!r.ok || !r.data.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<h2 style="font-size:16px;margin:24px 0 4px">Profils supprimés</h2>
    <div class="muted" style="font-size:13px;margin-bottom:12px">Ces profils n'existent plus dans le jeu, mais le Hub en a gardé des copies. « Restaurer » les remet dans le jeu.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px">${r.data.map(p => `<div class="panel prof">
      <div class="between" style="align-items:flex-start;flex-wrap:wrap"><div style="min-width:160px;flex:1"><b style="font-size:16px">${escM(p.name)}</b><div class="muted" style="font-size:12px;margin-top:2px">${p.game === 'ets2' ? 'ETS2' : 'ATS'}${p.cloud ? ' · Steam Cloud' : ''} · ${p.backups.length} copie${p.backups.length > 1 ? 's' : ''}</div></div>
        <button class="btn danger" style="height:36px" data-purge="${escM(p.id)}" data-pn="${escM(p.name)}">Effacer définitivement</button></div>
      ${bkRows(p, p.backups.slice(0, 3))}${p.backups.length > 3 ? `<details><summary class="muted" style="font-size:12px;cursor:pointer">+ ${p.backups.length - 3} plus ancienne(s)</summary><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">${bkRows(p, p.backups.slice(3))}</div></details>` : ''}
    </div>`).join('')}</div>`;
  box.querySelectorAll('[data-rs]').forEach(b => b.onclick = async () => {
    const ok = await ask('Récupérer ce profil ?', `Le profil <b>${escM(b.dataset.pn)}</b> va revenir dans le jeu, dans son état du <b>${bkLabel(b.dataset.rn)}</b>.`, 'Restaurer');
    if (!ok) return;
    const x = await window.tel.atelier.restore(b.dataset.rs, b.dataset.rn);
    renderSaves(x.ok ? `Profil « ${b.dataset.pn} » récupéré ✓` : x.error);
  });
  box.querySelectorAll('[data-delb]').forEach(b => b.onclick = async () => {
    const ok = await ask('Supprimer cette sauvegarde ?', `La copie du <b>${bkLabel(b.dataset.rn)}</b> sera effacée définitivement.`, 'Supprimer');
    if (!ok) return;
    const x = await window.tel.atelier.deleteBackup(b.dataset.delb, b.dataset.rn);
    renderSaves(x.ok ? 'Sauvegarde supprimée ✓' : x.error);
  });
  box.querySelectorAll('[data-purge]').forEach(b => b.onclick = async () => {
    const ok = await ask('Effacer définitivement ?', `Toutes les copies du profil <b>${escM(b.dataset.pn)}</b> seront effacées. <b>Tu ne pourras plus le récupérer.</b>`, 'Effacer définitivement');
    if (!ok) return;
    const x = await window.tel.atelier.purgeDeleted(b.dataset.purge);
    renderSaves(x.ok ? `Profil « ${b.dataset.pn} » effacé définitivement.` : x.error);
  });
}
