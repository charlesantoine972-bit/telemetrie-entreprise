/* Paramètres « Bientôt disponible » (tâche 5 de la bêta 5).
   Pages et groupes de réglages PRÉVUS : on voit les vrais contrôles (interrupteurs, listes, champs, curseurs),
   mais ils sont tous désactivés et ne font rien. Chaque page porte la mention « Bientôt disponible ».
   - Les données de chaque page sont dans page-*.js (un fichier par page).
   - construirePagesBientot() fabrique les pages au démarrage (appelée depuis app/demarrage.js, AVANT que
     le menu des paramètres soit recopié dans la barre de gauche).
   - Tout est fabriqué avec createElement / textContent : aucun innerHTML, rien à échapper.
   - Les pages sont marquées « is-soon » : elles suivent l'interrupteur Interface → Éléments visibles →
     Pages en préparation, comme les autres pages pas encore prêtes.
   - Aucune fonction du pont window.tel n'est appelée ici. */

// Pages entières (dans cet ordre : chacune se place après la page « apres »)
const PB_PAGES = () => [PB_PAGE_NOTIFICATIONS, PB_PAGE_DONNEES, PB_PAGE_GESTION, PB_PAGE_RACCOURCIS, PB_PAGE_LANGUE, PB_PAGE_AUDIO, PB_PAGE_AVANCE];
// Groupes ajoutés à des pages qui existent déjà
const PB_AJOUTS = () => [PB_AJOUT_COMPTE, PB_AJOUT_MISES_A_JOUR];
const PB_SVG = 'http://www.w3.org/2000/svg';
const PB_DEV_CLICS = 7;

function pbEl(tag, attrs, ...enfants){
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of enfants) if (c) e.append(c);
  return e;
}
function pbIcone(chemins, taille){
  const s = document.createElementNS(PB_SVG, 'svg');
  for (const [k, v] of Object.entries({ 'aria-hidden': 'true', focusable: 'false', width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) s.setAttribute(k, v);
  for (const d of chemins) { const p = document.createElementNS(PB_SVG, 'path'); p.setAttribute('d', d); s.append(p); }
  return s;
}
// Un contrôle visible mais désactivé (sauf « actif: true », réservé à ce qui ne touche qu'à l'affichage)
function pbControle(c, libelle){
  const off = !c.actif;
  switch (c.type) {
    case 'switch': return pbEl('label', { class: 'switch', style: 'width:46px;height:26px' },
      pbEl('input', { type: 'checkbox', role: 'switch', 'aria-label': libelle, disabled: off, checked: !!c.on }), pbEl('span'));
    case 'liste': {
      const s = pbEl('select', { 'aria-label': libelle, disabled: off });
      (c.options || []).forEach((o, i) => s.append(pbEl('option', { text: o, selected: i === (c.choix || 0) })));
      return s;
    }
    case 'texte': return pbEl('input', { type: 'text', 'aria-label': libelle, placeholder: c.placeholder || '', disabled: off, style: 'width:220px' });
    case 'curseur': {
      const val = pbEl('span', { class: 'muted pb-valeur', text: c.valeur + (c.unite || '') });
      return pbEl('span', { class: 'pb-curseur' }, pbEl('input', { type: 'range', min: c.min, max: c.max, value: c.valeur, 'aria-label': libelle, disabled: off }), val);
    }
    case 'segments': {
      const g = pbEl('div', { class: 'seg', role: 'group', 'aria-label': libelle });
      (c.options || []).forEach((o, i) => g.append(pbEl('button', { type: 'button', class: i === (c.choix || 0) ? 'on' : null, 'aria-pressed': i === (c.choix || 0) ? 'true' : 'false', disabled: off, text: o })));
      return g;
    }
    case 'touche': return pbEl('span', { class: 'pb-touche' }, pbEl('kbd', { class: 'pb-key', text: c.valeur }), pbEl('button', { type: 'button', class: 'btn', disabled: off, 'aria-label': 'Modifier : ' + libelle, text: 'Modifier' }));
    case 'bouton': return pbEl('button', { type: 'button', class: 'btn' + (c.danger ? ' pb-danger' : ''), id: c.id, disabled: off, text: c.label });
    case 'avatar': return pbEl('span', { class: 'pb-avatar', 'aria-hidden': 'true', text: '?' });
    case 'info': return pbEl('span', { class: 'muted pb-info', text: c.texte });
    // Numéro de version : seul bouton vraiment actif de ces pages (7 clics = mode développeur)
    case 'version': return pbEl('button', { type: 'button', class: 'btn pb-version', id: 'pbVersion', title: 'Numéro de version', text: pbVersionTexte() });
  }
  return null;
}
function pbLigne(r){
  const ctl = pbEl('div', { class: 'ctl' });
  for (const c of [].concat(r.ctl || [])) ctl.append(pbControle(c, r.titre));
  return pbEl('div', { class: 'setrow', 'data-bientot': '1' }, pbEl('div', { class: 'lab' }, pbEl('b', { text: r.titre }), pbEl('span', { text: r.desc })), ctl);
}
function pbGroupe(g, marquerSoon){
  const grp = pbEl('div', { class: 'optgroup pb-groupe' + (marquerSoon ? ' is-soon' : '') + (g.cache ? ' hidden' : ''), id: g.id });
  grp.append(pbEl('h3', { text: g.titre }, pbEl('span', { class: 'soon pb-soon', text: 'Bientôt disponible' })));
  if (g.note) grp.append(pbEl('p', { class: 'pb-groupe-note', text: g.note }));
  for (const r of g.reglages) grp.append(pbLigne(r));
  return grp;
}
function pbPage(p){
  const cat = pbEl('div', { class: 'optcat is-soon pb-page', id: 'oc-' + p.id, role: 'tabpanel', 'aria-label': p.titre });
  cat.append(pbEl('div', { class: 'ochead' }, pbEl('h2', { text: p.titre }), pbEl('p', { text: p.intro })));
  const note = pbEl('div', { class: 'pb-note', role: 'note' }, pbEl('b', { text: 'Bientôt disponible.' }));
  note.append(' Cette page montre les réglages prévus. Ils ne sont pas encore actifs : les changer ne fait rien pour l’instant.');
  cat.append(note);
  for (const g of p.groupes) cat.append(pbGroupe(g, false));
  return cat;
}
function pbBoutonMenu(p){
  return pbEl('button', { 'data-oc': p.id, class: 'is-soon', role: 'tab', 'aria-controls': 'oc-' + p.id },
    pbIcone(p.icone, '18'), pbEl('span', { text: p.titre }), pbEl('span', { class: 'soon', text: 'Bientôt' }));
}
// Appelée une seule fois, depuis app/demarrage.js
function construirePagesBientot(){
  const nav = document.getElementById('optNav'), corps = document.querySelector('#v-reglages .optbody');
  if (!nav || !corps) return;
  for (const p of PB_PAGES()) {
    if (document.getElementById('oc-' + p.id)) continue;
    const navApres = nav.querySelector(`[data-oc="${p.apres}"]`), pageApres = document.getElementById('oc-' + p.apres);
    const b = pbBoutonMenu(p), cat = pbPage(p);
    if (navApres) navApres.after(b); else nav.append(b);
    if (pageApres) pageApres.after(cat); else corps.append(cat);
  }
  for (const a of PB_AJOUTS()) {
    const page = document.getElementById('oc-' + a.page); if (!page) continue;
    let repere = page.querySelector(a.apres);
    for (const g of a.groupes) {
      const grp = pbGroupe(g, true);
      if (repere) repere.after(grp); else page.append(grp);
      repere = grp;
    }
  }
  pbBrancherModeDev();
}

/* ---------- Mode développeur caché : 7 clics sur le numéro de version (Avancé) ---------- */
// Il ne fait qu'afficher un groupe de réglages (désactivés). Il ne touche à aucune protection de sécurité.
let pbClics = 0, pbDernierClic = 0;
function pbVersionTexte(){ const v = document.getElementById('appVersion'); return (v && v.textContent.replace(/^Version\s*/, '').trim()) || '–'; }
function pbAfficherModeDev(on){
  const g = document.getElementById('pbDevGroupe'); if (g) g.classList.toggle('hidden', !on);
}
function pbClicVersion(){
  const now = Date.now();
  if (now - pbDernierClic > 3000) pbClics = 0;    // les clics doivent se suivre
  pbDernierClic = now;
  if (store.get('pbDev', false)) { announce('Le mode développeur est déjà affiché, plus bas sur cette page.'); return; }
  pbClics++;
  const reste = PB_DEV_CLICS - pbClics;
  if (reste <= 0) {
    pbClics = 0; store.set('pbDev', true); pbAfficherModeDev(true);
    announce('Mode développeur affiché, plus bas sur cette page.');
    const g = document.getElementById('pbDevGroupe'); if (g) { g.scrollIntoView({ block: 'center', behavior: 'smooth' }); g.classList.remove('flash'); void g.offsetWidth; g.classList.add('flash'); }
  } else if (pbClics >= 3) announce(reste === 1 ? 'Encore 1 clic pour afficher le mode développeur.' : `Encore ${reste} clics pour afficher le mode développeur.`);
}
function pbBrancherModeDev(){
  const b = document.getElementById('pbVersion'); if (!b) return;
  b.onclick = pbClicVersion;
  const src = document.getElementById('appVersion');
  if (src && typeof MutationObserver === 'function') new MutationObserver(() => { b.textContent = pbVersionTexte(); }).observe(src, { childList: true, characterData: true, subtree: true });
  const m = document.getElementById('pbDevMasquer');
  if (m) m.onclick = () => { store.set('pbDev', false); pbAfficherModeDev(false); announce('Mode développeur masqué.'); b.focus(); };
  pbAfficherModeDev(!!store.get('pbDev', false));
}
