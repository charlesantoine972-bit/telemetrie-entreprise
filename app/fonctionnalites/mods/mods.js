/* Truck & Coach Tools → Mods & sauvegarde (analyse par tch-mods).
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

/* ---------- Truck & Coach Tools → Mods & sauvegarde (analyse par tch-mods, programme séparé) ---------- */
const modsCache = {};
let modsFiltre = 'tous';
const ETAPES_MODS = { profils: 'Lecture de tes profils et de tes sauvegardes récentes…', inventaire: 'Inventaire des mods…', journal: 'Lecture du journal du jeu…', sauvegardes: 'Recherche des mods utilisés par tes sauvegardes…' };
const escMod = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tailleM = (o) => o > 1e9 ? (o / 1e9).toFixed(1) + ' Go' : o > 1e6 ? Math.round(o / 1e6) + ' Mo' : Math.max(1, Math.round(o / 1e3)) + ' Ko';
function renderMods() {
  const g = activeGame === 'ats' ? 'ats' : 'ets2', r = modsCache[g];
  const res = document.getElementById('modsResume'), liste = document.getElementById('modsListe'), msg = document.getElementById('modsMsg');
  if (!window.tel || !window.tel.mods) { msg.textContent = 'Disponible dans l’application installée.'; return; }
  if (!r) { res.innerHTML = ''; liste.innerHTML = ''; return; }
  const n = { rouge: 0, orange: 0, vert: 0 }; for (const m of r.mods) n[m.statut]++;
  const actifs = r.mods.filter(m => m.actif).length, indisp = r.mods.filter(m => m.indispensable).length;
  const j = r.journal;
  msg.textContent = `Analyse du ${new Date(r.date).toLocaleString('fr-FR')} — jeu en version ${r.versionJeu || 'inconnue'}` + (j ? `, journal du jeu du ${new Date(j.date).toLocaleString('fr-FR')}${j.sortieNormale ? '' : ' (le jeu ne s’est pas fermé normalement : plantage ?)'}` : ', pas de journal du jeu trouvé') + '.';
  res.innerHTML = `
    <div class="panel"><div class="lbl">À corriger</div><div class="big" style="color:#e5534b">${n.rouge}</div><div class="soft">signalés par le jeu ou abîmés</div></div>
    <div class="panel"><div class="lbl">À vérifier</div><div class="big" style="color:#e0a030">${n.orange}</div><div class="soft">anciens, en double, pas à jour</div></div>
    <div class="panel"><div class="lbl">Sans problème</div><div class="big" style="color:#3fb27f">${n.vert}</div><div class="soft">${r.mods.length} mods installés, ${actifs} actifs</div></div>
    <div class="panel"><div class="lbl">Ta sauvegarde en a besoin</div><div class="big">${indisp}</div><div class="soft">à ne jamais retirer</div></div>` +
    (r.manquants.length ? `<div class="panel" style="grid-column:1/-1;border-color:#e5534b"><b>Mods actifs introuvables</b><div class="soft" style="margin-top:4px">${r.manquants.slice(0, 12).map(x => `${escMod(x.cle)} (profil ${escMod(x.profil)})`).join(' · ')}${r.manquants.length > 12 ? ' …' : ''}<br>Le jeu les ignore, mais si ta sauvegarde utilisait leur contenu, elle peut ne plus se charger.</div></div>` : '') +
    r.besoins.map(b => `<div class="panel" style="grid-column:1/-1"><b>${escMod(b.profil)}</b> <span class="soft">— ${escMod(b.sauvegarde)} : ${b.chemins} éléments lus (camions, remorques, accessoires…)</span><div class="soft" style="margin-top:4px">${b.requis.length ? `Utilise du contenu de <b>${b.requis.length}</b> mod${b.requis.length > 1 ? 's' : ''} : ${b.requis.map(escMod).join(', ')}.` : 'Tout vient du jeu et de tes DLC : aucun mod indispensable.'}${b.introuvables.length ? ` <b style="color:#e5534b">${b.introuvables.length} élément(s) ne viennent ni du jeu ni d’un mod installé</b> : un mod retiré ? (${b.introuvables.slice(0, 3).map(escMod).join(', ')}…)` : ''}</div></div>`).join('');
  const f = modsFiltre;
  const mods = r.mods.filter(m => f === 'tous' || (f === 'verifier' && m.statut !== 'vert') || (f === 'actifs' && m.actif) || (f === 'sauvegarde' && m.indispensable));
  liste.innerHTML = mods.length ? mods.map((m, i) => `
    <div class="modrow">
      <span class="pt ${m.statut}" title="${m.statut === 'rouge' ? 'À corriger' : m.statut === 'orange' ? 'À vérifier' : 'Sans problème'}"></span>
      <div>
        <div class="nm">${escMod(m.nom)}${m.indispensable ? '<span class="tag keep">Ta sauvegarde en a besoin : ne pas retirer</span>' : ''}${m.actif ? '<span class="tag">Actif</span>' : ''}<span class="tag">${m.source === 'workshop' ? 'Workshop' : 'Local'}</span></div>
        <div class="mt">${escMod(m.fichiers.join(', ') || m.cle)} · ${tailleM(m.taille)}${m.manifest && m.manifest.version ? ' · version ' + escMod(m.manifest.version) : ''}${m.manifest && m.manifest.auteur ? ' · ' + escMod(m.manifest.auteur) : ''}${m.actifDans.length ? ' · actif dans ' + m.actifDans.map(escMod).join(', ') : ''}</div>
        ${m.raisons.length ? `<ul>${m.raisons.map(x => `<li>${escMod(x.texte)}${x.details ? `<details><summary>Détails</summary><code>${x.details.map(escMod).join('\n')}</code></details>` : ''}</li>`).join('')}</ul>` : ''}
        ${m.requisPar.length ? `<details><summary>Ce que ta sauvegarde utilise de ce mod</summary><code>${m.requisPar.map(q => escMod(q.profil + ' — ' + q.sauvegarde + ' :\n  ' + q.exemples.join('\n  '))).join('\n')}</code></details>` : ''}
      </div>
      <button class="btn" data-mod-ouvrir="${i}" style="height:32px;font-size:12.5px">${m.source === 'workshop' ? 'Page Workshop' : 'Afficher le fichier'}</button>
    </div>`).join('') : '<div class="soft">Aucun mod dans cette catégorie.</div>';
  liste.querySelectorAll('[data-mod-ouvrir]').forEach(b => b.onclick = () => { const m = mods[+b.dataset.modOuvrir]; window.tel.mods.ouvrir({ game: g, workshopId: m.workshopId, fichier: m.fichiers[0] }); });
}
