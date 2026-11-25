// TCH Mods — analyse des mods d'ETS2 / ATS et de ce que les sauvegardes utilisent.
//
// Copyright (C) 2026 Truck & Coach Hub — TCH Mods
// Ce programme est un logiciel libre : GNU General Public License v3 ou ultérieure (voir LICENSE).
// Idées d'analyse inspirées d'Easy SCSModManager (Switch-Bros, GPL-3) ; lecteur d'archives : ../tch-map/lecteur.
//
// Programme séparé : lancé par l'application hôte avec un fichier de demande JSON, il écrit son rapport JSON
// sur la sortie standard (ligne « @TCH {…} »). Lecture seule : aucun mod, profil ou fichier du jeu n'est modifié.
//
// Demande : { jeu, documents, jeuDossier, workshop, profils: [{ id, nom, actifs: [clé…], sauvegarde?: chemin texte, sauvegardeNom? }] }
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { openArchive } = require('../tch-map/lecteur/archive.js');

const sortie = (o) => process.stdout.write('@TCH ' + JSON.stringify(o) + '\n');
const etape = (nom, extra = {}) => sortie({ etape: nom, ...extra });

// ---------- manifest.sii ----------
function lireManifest(txt) {
  if (!txt) return null;
  const s = txt.toString('utf8');
  const un = (k) => { const m = new RegExp(`^\\s*${k}\\s*:\\s*"?([^"\\r\\n]*)"?`, 'm').exec(s); return m ? m[1].trim() : null; };
  const plusieurs = (k) => [...s.matchAll(new RegExp(`^\\s*${k}\\[\\d*\\]\\s*:\\s*"?([^"\\r\\n]*)"?`, 'gm'))].map(m => m[1].trim()).filter(Boolean);
  return {
    nom: un('display_name'), version: un('package_version'), auteur: un('author'),
    categories: plusieurs('category'), compatibles: plusieurs('compatible_versions'),
    multiOptionnel: /mp_mod_optional\s*:\s*true/.test(s),
  };
}
// « 1.62.* » correspond à « 1.62.3.3 »
function compatible(motifs, version) {
  if (!version || !motifs || !motifs.length) return null;
  return motifs.some(m => new RegExp('^' + m.trim().replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$').test(version));
}
// Famille d'un mod : son nom sans les numéros de version (« promods-eu-map-v283 » → « promods-eu-map »)
const famille = (k) => { let f = k.toLowerCase().trim(), g; do { g = f; f = f.replace(/[ _-]+v?\d+(?:[._]\d+)*[a-z]?$/i, '').replace(/[ _-]*v\d+(?:[._]\d+)*$/i, ''); } while (f !== g && f); return f || k.toLowerCase(); };
const versionDe = (k) => { const m = /(\d+(?:[._]\d+)*)\D*$/.exec(k); return m ? m[1].split(/[._]/).map(Number) : []; };
const plusRecente = (a, b) => { const x = versionDe(a), y = versionDe(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; } return false; };

// ---------- Inventaire ----------
function inventaire(dem) {
  const mods = [];
  const ajouter = (cle, fichiers, source, dossier) => {
    const m = { cle, source, fichiers: [], taille: 0, date: 0, manifest: null, formats: [], illisible: null };
    for (const f of fichiers) {
      try {
        const st = fs.statSync(f);
        m.taille += st.isFile() ? st.size : 0; m.date = Math.max(m.date, st.mtimeMs);
        const a = openArchive(f);
        try {
          m.formats.push(a.kind);
          if (!m.manifest) m.manifest = lireManifest(a.read('manifest.sii'));
          m.fichiers.push({ chemin: f, archive: a.kind });
        } finally { a.close && a.close(); }
      } catch (e) { m.illisible = String(e.message || e); m.fichiers.push({ chemin: f, archive: null }); }
    }
    if (!m.manifest && dossier) { try { m.manifest = lireManifest(fs.readFileSync(path.join(dossier, 'manifest.sii'))); } catch {} }
    mods.push(m);
  };
  // Mods locaux : Documents/<jeu>/mod
  const modDir = path.join(dem.documents, 'mod');
  let ents = []; try { ents = fs.readdirSync(modDir, { withFileTypes: true }); } catch {}
  for (const e of ents) {
    const full = path.join(modDir, e.name);
    if (e.isFile() && /\.(scs|zip)$/i.test(e.name)) ajouter(e.name.replace(/\.(scs|zip)$/i, ''), [full], 'local');
    else if (e.isDirectory() && e.name !== 'workshop' && fs.existsSync(path.join(full, 'manifest.sii'))) ajouter(e.name, [full], 'dossier');
  }
  // Steam Workshop : steamapps/workshop/content/<appid>/<id>
  let ws = []; try { ws = dem.workshop ? fs.readdirSync(dem.workshop, { withFileTypes: true }).filter(e => e.isDirectory() && /^\d+$/.test(e.name)) : []; } catch {}
  for (const e of ws) {
    const dir = path.join(dem.workshop, e.name), fichiers = [];
    const parcourir = (d, n) => { let l = []; try { l = fs.readdirSync(d, { withFileTypes: true }); } catch {} for (const x of l) { const f = path.join(d, x.name); if (x.isFile() && /\.(scs|zip)$/i.test(x.name)) fichiers.push(f); else if (x.isDirectory() && n < 2) parcourir(f, n + 1); } };
    parcourir(dir, 0);
    const cle = 'mod_workshop_package.' + BigInt(e.name).toString(16).toUpperCase().padStart(16, '0');
    ajouter(cle, fichiers, 'workshop', dir);
    mods[mods.length - 1].workshopId = e.name;
  }
  return mods;
}

// ---------- Journal du jeu (game.log.txt) ----------
function journal(dem) {
  const f = path.join(dem.documents, 'game.log.txt');
  let txt = ''; let date = 0;
  try { txt = fs.readFileSync(f, 'latin1'); date = fs.statSync(f).mtimeMs; } catch { return null; }
  const lignes = txt.split(/\r?\n/);
  const v = /Loaded pack set version ([\d.]+)/.exec(txt);
  const res = { date, version: v ? v[1] : null, incompatibles: new Set(), doublons: new Set(), sansCategorie: new Set(), erreursParMod: {}, erreurs: [], plantage: false, sortieNormale: /Shutting down|\[sys\] Quit/i.test(txt) };
  for (const l of lignes) {
    let m;
    if ((m = /\[mods\] Incompatible mod - (.+?)\s*$/.exec(l))) res.incompatibles.add(m[1].trim());
    else if ((m = /\[package\] Package with name '([^']+)' seen more than once/.exec(l))) res.doublons.add(m[1].trim());
    else if ((m = /\[mods\] No valid categories defined for (.+?)\. Setting defaults/.exec(l))) res.sansCategorie.add(m[1].trim());
    if (/<ERROR>/.test(l)) {
      // Fichier d'un mod cité dans l'erreur : « <…/mod/nom.scs | >/def/… » ou « …/workshop/content/227300/123/… »
      const mm = /[\\/]mod[\\/]([^\\/|<>]+?)\.(?:scs|zip)\b/i.exec(l) || /[\\/]workshop[\\/]content[\\/]\d+[\\/](\d+)[\\/]/i.exec(l);
      const texte = l.replace(/^[\d:.]+\s*:\s*/, '').slice(0, 300);
      if (mm) { const k = /^\d+$/.test(mm[1]) ? 'workshop:' + mm[1] : mm[1]; (res.erreursParMod[k] ||= []).push(texte); }
      else if (res.erreurs.length < 40) res.erreurs.push(texte);
    }
  }
  return res;
}

// ---------- Ce que la sauvegarde utilise ----------
// Chemins de définitions cités par la sauvegarde (accessoires, camions, remorques, peintures…)
function cheminsSauvegarde(fichier) {
  const s = fs.readFileSync(fichier, 'utf8');
  const out = new Set();
  for (const m of s.matchAll(/"(\/(?:def|vehicle|material|model2?|unit|automat)\/[^"\s]+\.(?:sii|sui|pmd|tobj|mat))"/g)) out.add(m[1].slice(1));
  return out;
}

function analyser(dem) {
  etape('inventaire');
  const mods = inventaire(dem);
  etape('journal');
  const log = journal(dem);
  const versionJeu = (log && log.version) || dem.versionJeu || null;
  const parCle = new Map(mods.map(m => [m.cle, m]));

  // Mods actifs dans chaque profil (et ceux introuvables)
  const manquants = [];
  for (const p of dem.profils || []) {
    for (const k of p.actifs || []) {
      const m = parCle.get(k);
      if (m) (m.actifDans ||= []).push(p.nom);
      else manquants.push({ cle: k, profil: p.nom });
    }
  }

  // Sauvegardes : chemins fournis seulement par un mod (ni le jeu, ni ses DLC) → ce mod est indispensable
  const besoins = [];
  const avecSauvegarde = (dem.profils || []).filter(p => p.sauvegarde);
  if (avecSauvegarde.length) {
    etape('sauvegardes');
    const jeuArch = [];
    try { for (const f of fs.readdirSync(dem.jeuDossier).filter(f => f.endsWith('.scs'))) { try { jeuArch.push(openArchive(path.join(dem.jeuDossier, f))); } catch {} } } catch {}
    const modArch = [];
    for (const m of mods) for (const f of m.fichiers) { try { modArch.push([m, openArchive(f.chemin)]); } catch {} }
    try {
      for (const p of avecSauvegarde) {
        let chemins; try { chemins = cheminsSauvegarde(p.sauvegarde); } catch { continue; }
        const requis = new Map(), absents = [];
        for (const c of chemins) {
          if (jeuArch.some(a => a.has(c))) continue;               // fourni par le jeu : rien à craindre
          const fournisseurs = modArch.filter(([, a]) => a.has(c)).map(([m]) => m);
          if (!fournisseurs.length) { if (absents.length < 30) absents.push(c); continue; }
          for (const m of fournisseurs) { if (!requis.has(m)) requis.set(m, []); if (requis.get(m).length < 5) requis.get(m).push(c); }
        }
        for (const [m, ex] of requis) (m.requisPar ||= []).push({ profil: p.nom, sauvegarde: p.sauvegardeNom || '', exemples: ex });
        besoins.push({ profil: p.nom, sauvegarde: p.sauvegardeNom || '', chemins: chemins.size, requis: [...requis.keys()].map(m => m.cle), introuvables: absents });
      }
    } finally {
      for (const a of jeuArch) a.close && a.close();
      for (const [, a] of modArch) a.close && a.close();
    }
  }

  // Plusieurs versions d'un même mod
  const familles = new Map();
  for (const m of mods) { const f = famille(m.cle); if (!familles.has(f)) familles.set(f, []); familles.get(f).push(m); }

  // Verdict par mod
  for (const m of mods) {
    const r = [];
    const nom = m.manifest && m.manifest.nom;
    const cites = (set) => set && (set.has(m.cle) || (nom && set.has(nom)));
    const actif = !!(m.actifDans && m.actifDans.length);
    if (log && cites(log.incompatibles)) r.push({ niveau: 'rouge', texte: 'Le jeu le signale comme incompatible avec ta version.' });
    const errs = log && (log.erreursParMod[m.cle] || (m.workshopId && log.erreursParMod['workshop:' + m.workshopId]) || (m.fichiers[0] && log.erreursParMod[path.basename(m.fichiers[0].chemin).replace(/\.(scs|zip)$/i, '')]));
    if (errs && errs.length) r.push({ niveau: 'rouge', texte: `${errs.length} erreur${errs.length > 1 ? 's' : ''} dans le journal du jeu.`, details: errs.slice(0, 5) });
    if (m.illisible) r.push({ niveau: 'rouge', texte: 'Archive illisible ou abîmée.', details: [m.illisible] });
    if (log && cites(log.doublons)) r.push({ niveau: 'orange', texte: 'Présent deux fois (archive et dossier, par exemple).' });
    const c = m.manifest ? compatible(m.manifest.compatibles, versionJeu) : null;
    if (c === false) r.push({ niveau: 'orange', texte: `Déclaré pour ${m.manifest.compatibles.join(', ')} : pas encore mis à jour pour ta version ${versionJeu}.` });
    if (!m.manifest && !m.illisible) r.push({ niveau: 'orange', texte: 'Ancien format (pas de manifeste) : souvent un vieux mod.' });
    const fam = familles.get(famille(m.cle));
    if (fam && fam.length > 1 && fam.some(o => o !== m && plusRecente(o.cle, m.cle))) r.push({ niveau: 'orange', texte: `Une version plus récente est aussi installée (${fam.filter(o => o !== m && plusRecente(o.cle, m.cle)).map(o => o.cle).join(', ')}) : celle-ci est sans doute à retirer.` });
    m.raisons = r;
    m.actif = actif;
    m.statut = r.some(x => x.niveau === 'rouge') ? 'rouge' : r.length ? 'orange' : 'vert';
    // Ne jamais conseiller de retirer un mod dont la sauvegarde a besoin
    m.indispensable = !!(m.requisPar && m.requisPar.length);
  }

  return {
    jeu: dem.jeu, versionJeu, date: Date.now(),
    journal: log && { date: log.date, version: log.version, erreurs: log.erreurs, sortieNormale: log.sortieNormale, incompatibles: [...log.incompatibles] },
    mods: mods.map(m => ({ cle: m.cle, nom: (m.manifest && m.manifest.nom) || m.cle, source: m.source, workshopId: m.workshopId || null, fichiers: m.fichiers.map(f => path.basename(f.chemin)), formats: m.formats, taille: m.taille, date: m.date, manifest: m.manifest, actif: m.actif, actifDans: m.actifDans || [], statut: m.statut, raisons: m.raisons, indispensable: m.indispensable, requisPar: m.requisPar || [] }))
      .sort((a, b) => ({ rouge: 0, orange: 1, vert: 2 }[a.statut] - { rouge: 0, orange: 1, vert: 2 }[b.statut]) || (b.actif - a.actif) || a.nom.localeCompare(b.nom)),
    manquants, besoins,
  };
}

if (require.main === module) {
  try {
    const dem = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    sortie({ etape: 'fini', rapport: analyser(dem) });
  } catch (e) {
    sortie({ etape: 'erreur', message: String(e && e.message || e) });
    process.exitCode = 1;
  }
}
module.exports = { analyser, lireManifest, compatible, famille };
