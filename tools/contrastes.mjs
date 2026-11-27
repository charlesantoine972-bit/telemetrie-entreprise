#!/usr/bin/env node
// Calcule les contrastes WCAG 2.2 des paires texte / fond de app/commun/tokens.css.
// Échoue (code 1) si un ratio est sous le seuil du référentiel :
//   4,5:1 pour le texte, 3:1 pour le grand texte et les composants graphiques.
// Usage : node tools/contrastes.mjs [--md]   (--md : table Markdown)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(path.join(racine, 'app/commun/tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// --- Lecture des règles (sélecteur, contexte @media, déclarations) ---
function regles(src, media = '') {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const ouv = src.indexOf('{', i);
    if (ouv < 0) break;
    const tete = src.slice(i, ouv).trim();
    let prof = 1, j = ouv + 1;
    while (j < src.length && prof) { if (src[j] === '{') prof++; else if (src[j] === '}') prof--; j++; }
    const corps = src.slice(ouv + 1, j - 1);
    if (tete.startsWith('@media')) out.push(...regles(corps, tete));
    else {
      const decl = {};
      for (const m of corps.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decl[m[1]] = m[2].trim();
      out.push({ sel: tete.replace(/\s+/g, ' '), media, decl });
    }
    i = j;
  }
  return out;
}
const toutes = regles(css);
const regle = (sel, media = '') => {
  const r = toutes.find(x => x.sel === sel && x.media === media);
  if (!r) throw new Error(`Règle introuvable : ${media} ${sel}`);
  return r.decl;
};

// --- Construction des thèmes ---
const sombre = regle(':root');
const clair = { ...sombre, ...regle(':root[data-theme="clair"]') };
const systemeClair = { ...sombre, ...regle(':root:not([data-theme])', '@media (prefers-color-scheme: light)') };
const fort = regle(':root[data-contrast="fort"]');
const fortSysteme = regle(':root:not([data-contrast])', '@media (prefers-contrast: more)');

const erreurs = [];
for (const k of new Set([...Object.keys(clair), ...Object.keys(systemeClair)]))
  if (clair[k] !== systemeClair[k]) erreurs.push(`Thème Système clair ≠ thème clair pour ${k} (${systemeClair[k]} / ${clair[k]})`);
if (JSON.stringify(fort) !== JSON.stringify(fortSysteme)) erreurs.push('Contraste renforcé : réglage de l\'appli ≠ réglage de Windows');

const themes = {
  'Sombre': sombre,
  'Clair': clair,
  'Sombre + contraste renforcé': { ...sombre, ...fort },
  'Clair + contraste renforcé': { ...clair, ...fort },
  'Sombre + vision rouge-vert': { ...sombre, ...regle(':root[data-vision="rg"]') },
  'Clair + vision rouge-vert': { ...clair, ...regle(':root[data-vision="rg"]'), ...regle(':root[data-theme="clair"][data-vision="rg"]') },
  'Sombre + vision bleu-jaune': { ...sombre, ...regle(':root[data-vision="by"]') },
  'Clair + vision bleu-jaune': { ...clair, ...regle(':root[data-vision="by"]'), ...regle(':root[data-theme="clair"][data-vision="by"]') },
};

function valeur(t, nom, vu = new Set()) {
  const v = t[nom];
  if (v == null) throw new Error(`Token manquant : ${nom}`);
  const m = /^var\((--[\w-]+)\)$/.exec(v);
  if (m) { if (vu.has(m[1])) throw new Error(`Boucle : ${nom}`); vu.add(m[1]); return valeur(t, m[1], vu); }
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`Couleur non hexadécimale pour ${nom} : ${v}`);
  return v.toUpperCase();
}
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = hex => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// --- Paires vérifiées : [premier plan, fonds, type] ; texte = 4,5, ui = 3 ---
const SURFACES = ['--bg', '--nav', '--panel', '--hover', '--active'];
const PAIRES = [
  ['--text', SURFACES, 'texte'],
  ['--soft', SURFACES, 'texte'],
  ['--muted', SURFACES, 'texte'],
  ['--accent', ['--bg', '--nav', '--panel'], 'texte'],          // « HUB », liens
  ['--on-accent', ['--accent', '--accent-strong'], 'texte'],    // bouton principal, survol
  ['--ok', ['--bg', '--panel'], 'texte'],                        // mots d'état
  ['--warn', ['--bg', '--panel'], 'texte'],
  ['--danger', ['--bg', '--panel'], 'texte'],
  ['--info', ['--bg', '--panel'], 'texte'],
  ['--accent', SURFACES, 'ui'],                                  // barre active, interrupteur, focus
  ['--ctl', ['--bg', '--nav', '--panel', '--hover'], 'ui'],      // contours de contrôles
  ['--loaded', ['--bg', '--panel', '--map'], 'ui'],              // données (carte, graphiques)
  ['--empty', ['--bg', '--panel', '--map'], 'ui'],
];
const VISION = new Set(['--ok', '--warn', '--danger', '--loaded', '--empty']);
const SEUIL = { texte: 4.5, ui: 3 };

const lignes = [];
for (const [nomTheme, t] of Object.entries(themes)) {
  const vision = nomTheme.includes('vision'), fortT = nomTheme.includes('renforcé');
  for (const [fg, fonds, type] of PAIRES) {
    if (vision && !VISION.has(fg)) continue;                     // vision : seules les couleurs qui changent
    if (fortT && !['--soft', '--muted'].includes(fg)) continue;  // renforcé : seuls les textes qui changent
    for (const fond of fonds) {
      const r = ratio(valeur(t, fg), valeur(t, fond));
      const ok = r >= SEUIL[type];
      lignes.push({ theme: nomTheme, fg, fond, type, a: valeur(t, fg), b: valeur(t, fond), r, ok });
      if (!ok) erreurs.push(`${nomTheme} : ${fg} (${valeur(t, fg)}) sur ${fond} (${valeur(t, fond)}) = ${r.toFixed(2)}:1 < ${SEUIL[type]}:1`);
    }
  }
}

if (process.argv.includes('--md')) {
  let theme = '';
  for (const l of lignes) {
    if (l.theme !== theme) { theme = l.theme; console.log(`\n**${theme}**\n\n| Premier plan | Fond | Usage | Ratio | Seuil | |\n|---|---|---|---|---|---|`); }
    console.log(`| \`${l.fg}\` ${l.a} | \`${l.fond}\` ${l.b} | ${l.type} | ${l.r.toFixed(2)}:1 | ${SEUIL[l.type]}:1 | ${l.ok ? '✓' : '✗'} |`);
  }
} else {
  const min = Math.min(...lignes.map(l => l.r));
  console.log(`${lignes.length} paires vérifiées dans ${Object.keys(themes).length} thèmes, plus faible : ${min.toFixed(2)}:1`);
}
if (erreurs.length) { console.error(erreurs.map(e => '✗ ' + e).join('\n')); process.exit(1); }
