/* Compte & accès (aperçu local).
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

/* ---------- Compte & accès (préparation : aperçu local, pas encore de serveur) ---------- */
const accApi = () => (window.tel && window.tel.acces) || null;
let accPerms = [], accRanksList = [], accSession = null;
const accCall = async (name, ...a) => { const api = accApi(); if (!api) return { ok: false, error: 'Disponible dans l’appli installée.' }; return api[name](...a); };
const accMsg = (id, txt, bad) => { const e = document.getElementById(id); if (!e) return; e.textContent = txt || ''; e.style.color = bad ? 'var(--race)' : ''; };
const rankPill = r => `<span class="rankpill" style="--rc:${escM(r.color || '#94a3b8')}">${escM(r.name)}</span>`;
async function renderAcces(){
  if (!accPerms.length && accApi()) accPerms = (await accApi().info()).permissions;
  const s = await accCall('session');
  if (!s.ok) { setText('accPerms', s.error); return; }
  accSession = s.value;
  const me = accSession.rank, can = p => accSession.perms.includes(p);
  const pill = document.getElementById('accRank'); pill.textContent = me.name; pill.style.setProperty('--rc', me.color);
  const pn = Object.fromEntries(accPerms);
  setText('accPerms', accSession.perms.length ? accSession.perms.map(p => pn[p] || p).join(' · ') : 'Aucun accès en plus pour le moment.');
  setText('accSteam', accSession.steamId ? `Compte Steam ${accSession.steamId} (renseigné dans Steam & Discord). La vraie connexion Steam arrivera avec le serveur.` : 'Ton compte Steam servira à te reconnaître, sans mot de passe à créer. Renseigne ton SteamID64 dans Steam & Discord.');
  const rr = await accCall('ranks'); accRanksList = rr.ok ? rr.value : [];
  document.getElementById('accAs').innerHTML = accRanksList.map(r => `<option value="${escM(r.id)}"${r.id === me.id ? ' selected' : ''}>${escM(r.name)} (niveau ${r.level})</option>`).join('');
  // Rangs
  document.getElementById('accRanksGroup').classList.toggle('hidden', !can('acces.rangs') && !can('acces.membres'));
  document.getElementById('accRankForm').classList.toggle('hidden', !can('acces.rangs'));
  document.getElementById('accRanks').innerHTML = accRanksList.map(r => {
    const editable = can('acces.rangs') && !r.system && me.level > r.level;
    const perms = r.perms.includes('*') ? 'Tous les accès' : (r.perms.length ? r.perms.map(p => pn[p] || p).join(' · ') : 'Aucun accès en plus');
    return `<div class="accrow">${rankPill(r)}<span class="muted">niveau ${r.level}${r.system ? ' · de base' : ''}</span><span class="grow muted">${escM(perms)}</span>${editable ? `<button class="btn" data-ar-edit="${escM(r.id)}">Modifier</button><button class="btn" data-ar-del="${escM(r.id)}">Supprimer</button>` : ''}</div>`;
  }).join('');
  const mine = accSession.perms;
  document.getElementById('arPerms').innerHTML = '<legend>Permissions</legend>' + accPerms.map(([id, lab]) => `<label><input type="checkbox" value="${id}"${mine.includes(id) ? '' : ' disabled'}><span>${escM(lab)}${mine.includes(id) ? '' : ' <span class="muted">(tu ne l’as pas)</span>'}</span></label>`).join('');
  document.querySelectorAll('[data-ar-del]').forEach(b => b.onclick = async () => {
    const r = accRanksList.find(x => x.id === b.dataset.arDel);
    if (!await ask('Supprimer le rang « ' + escM(r.name) + ' » ?', 'Les membres qui l’ont repassent Membre, et les clés qui le donnent sont désactivées.', 'Supprimer')) return;
    const x = await accCall('deleteRank', r.id); if (!x.ok) accMsg('arMsg', x.error, true); renderAcces();
  });
  document.querySelectorAll('[data-ar-edit]').forEach(b => b.onclick = () => {
    const r = accRanksList.find(x => x.id === b.dataset.arEdit), f = document.getElementById('accRankForm');
    f.open = true; f.dataset.editId = r.id; f.querySelector('summary').textContent = 'Modifier « ' + r.name + ' »';
    document.getElementById('arName').value = r.name; document.getElementById('arColor').value = r.color; document.getElementById('arLevel').value = r.level;
    document.querySelectorAll('#arPerms input').forEach(i => { i.checked = r.perms.includes(i.value); });
  });
  // Clés
  document.getElementById('accKeysGroup').classList.toggle('hidden', !can('acces.cles'));
  if (can('acces.cles')) {
    document.getElementById('akRank').innerHTML = accRanksList.filter(r => r.level < me.level && r.id !== 'membre').map(r => `<option value="${escM(r.id)}">${escM(r.name)}</option>`).join('');
    const k = await accCall('keys'), list = k.ok ? k.value : [];
    const rn = Object.fromEntries(accRanksList.map(r => [r.id, r]));
    document.getElementById('accKeys').innerHTML = list.length ? list.map(x => {
      const done = x.revoked || x.uses >= x.grant.maxUses || (x.grant.expiresAt && Date.parse(x.grant.expiresAt) < Date.now());
      const st = x.revoked ? 'désactivée' : x.uses >= x.grant.maxUses ? 'utilisée' : (x.grant.expiresAt && Date.parse(x.grant.expiresAt) < Date.now()) ? 'expirée' : `${x.uses}/${x.grant.maxUses} utilisation${x.grant.maxUses > 1 ? 's' : ''}`;
      return `<div class="accrow${done ? ' off' : ''}"><code>${escM(x.key)}</code>${x.grant.rank && rn[x.grant.rank] ? rankPill(rn[x.grant.rank]) : ''}<span class="grow muted">${escM(st)}${x.grant.expiresAt ? ' · jusqu’au ' + escM(new Date(x.grant.expiresAt).toLocaleDateString('fr-FR')) : ''}</span><button class="btn" data-ak-copy="${escM(x.key)}">Copier</button>${done ? '' : `<button class="btn" data-ak-off="${escM(x.key)}">Désactiver</button>`}</div>`;
    }).join('') : '<div class="accrow muted">Aucune clé pour le moment.</div>';
    document.querySelectorAll('[data-ak-copy]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.akCopy); accMsg('akMsg', 'Clé copiée.'); } catch { accMsg('akMsg', 'Copie impossible : sélectionne la clé à la main.', true); } });
    document.querySelectorAll('[data-ak-off]').forEach(b => b.onclick = async () => { const x = await accCall('revokeKey', b.dataset.akOff); if (!x.ok) accMsg('akMsg', x.error, true); renderAcces(); });
  }
}
