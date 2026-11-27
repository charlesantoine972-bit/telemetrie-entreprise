function mergeSavedSettings(defaults, saved) {
  const settings = { ...defaults, ...(saved || {}) };
  if (settings.theme) {
    const theme = settings.theme;
    delete settings.theme;
    settings.look = { ...defaults.look, theme: ['sombre', 'clair'].includes(theme) ? theme : 'systeme' };
  }
  settings.look = { ...defaults.look, ...(settings.look || {}) };
  const savedHud = settings.hud || {};
  const hudDefaults = defaults.hud || {};
  const legacyHud = Object.fromEntries(['style', 'position', 'logo', 'opacity', 'scale']
    .filter(key => key in savedHud).map(key => [key, savedHud[key]]));
  settings.hud = {
    truck: { ...(hudDefaults.truck || {}), ...legacyHud, ...(savedHud.truck || {}) },
    bus: { ...(hudDefaults.bus || {}), ...legacyHud, ...(savedHud.bus || {}) }
  };
  return settings;
}

function mergeHudSettings(defaults, current, patch) {
  const existing = current || {};
  const updates = patch || {};
  return {
    ...defaults,
    ...existing,
    ...updates,
    truck: { ...defaults.truck, ...(existing.truck || {}), ...(updates.truck || {}) },
    bus: { ...defaults.bus, ...(existing.bus || {}), ...(updates.bus || {}) }
  };
}

// ---------- Vérification des réglages envoyés par l'interface (S9, tâche 5) ----------
// Chaque clé est contrôlée (type, liste de valeurs, longueur). Une valeur refusée provoque une
// erreur en français et RIEN n'est enregistré. Renvoie une copie nettoyée du patch (profils du HUD :
// seules les clés connues sont gardées, pour ne pas écrire n'importe quoi dans reglages.json).
const estObjet = v => !!v && typeof v === 'object' && !Array.isArray(v);
const CLES_REGLAGES = ['vehicleType', 'limitTruck', 'limitCar', 'racePct', 'pseudo', 'look', 'atelier', 'hud', 'modules',
  'showSoon', 'autoTelemetry', 'steamId', 'discordClientId', 'units'];
const CLES_LOOK = ['theme', 'accent', 'vision', 'zoom', 'contrast', 'motion'];

function verifierProfilHud(nom, p) {
  if (!estObjet(p)) throw new Error(`Réglages du bandeau ${nom} invalides.`);
  const out = {};
  if ('style' in p) { if (typeof p.style !== 'string' || !/^[a-z-]{1,32}$/.test(p.style)) throw new Error('Style du bandeau invalide.'); out.style = p.style; }
  if ('position' in p) { if (!['haut', 'bas'].includes(p.position)) throw new Error('Position du bandeau invalide (haut ou bas).'); out.position = p.position; }
  if ('logo' in p) { if (typeof p.logo !== 'boolean') throw new Error('Logo du bandeau : vrai ou faux attendu.'); out.logo = p.logo; }
  for (const [k, label, min, max] of [['opacity', 'Opacité du bandeau', 20, 100], ['scale', 'Taille du bandeau', 50, 200]]) {
    if (!(k in p)) continue;
    if (!Number.isInteger(p[k]) || p[k] < min || p[k] > max) throw new Error(`${label} doit être un nombre entier entre ${min} et ${max}.`);
    out[k] = p[k];
  }
  if ('boxes' in p) {
    if (!estObjet(p.boxes) || Object.keys(p.boxes).length > 50) throw new Error('Informations du bandeau invalides.');
    out.boxes = {};
    for (const [k, v] of Object.entries(p.boxes)) {
      if (!/^[A-Za-z0-9_]{1,32}$/.test(k) || typeof v !== 'boolean') throw new Error('Informations du bandeau invalides.');
      out.boxes[k] = v;
    }
  }
  return out;
}

function validateSettingsPatch(patch) {
  if (!estObjet(patch)) throw new Error('Réglages invalides.');
  for (const k of Object.keys(patch)) if (!CLES_REGLAGES.includes(k)) throw new Error(`Réglage inconnu : ${String(k).slice(0, 40)}.`);
  const limits = {
    limitTruck: ['Seuil camion', 60, 150],
    limitCar: ['Seuil car', 60, 150],
    racePct: ['Pourcentage de course', 0, 100]
  };
  for (const [key, [label, min, max]] of Object.entries(limits)) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${label} doit être un nombre entier entre ${min} et ${max}.`);
    }
  }
  const propre = { ...patch };
  if ('pseudo' in patch) {
    if (typeof patch.pseudo !== 'string') throw new Error('Le pseudo doit être un texte.');
    const p = patch.pseudo.trim();
    if (p.length > 32) throw new Error('Le pseudo fait 32 caractères au plus.');
    if (/[\u0000-\u001f\u007f<>]/.test(p)) throw new Error('Le pseudo contient des caractères non autorisés.');
    propre.pseudo = p;
  }
  if ('vehicleType' in patch && !['camion', 'car'].includes(patch.vehicleType)) throw new Error('Profil de carrière invalide (camion ou car).');
  for (const k of ['atelier', 'showSoon', 'autoTelemetry']) if (k in patch && typeof patch[k] !== 'boolean') throw new Error(`Réglage ${k} : vrai ou faux attendu.`);
  if ('units' in patch && !['metric', 'imperial'].includes(patch.units)) throw new Error('Unités invalides (metric ou imperial).');
  for (const k of ['steamId', 'discordClientId']) if (k in patch && (typeof patch[k] !== 'string' || patch[k].length > 20)) throw new Error(`Réglage ${k} : texte de 20 caractères au plus attendu.`);
  if ('look' in patch) {
    if (!estObjet(patch.look)) throw new Error('Réglages d’apparence invalides.');
    // clés inconnues retirées sans erreur : l'interface envoie l'apparence gardée dans sa mémoire locale, qui peut dater d'une ancienne version
    propre.look = Object.fromEntries(Object.entries(patch.look).filter(([k]) => CLES_LOOK.includes(k)));
  }
  if ('modules' in patch) {
    if (!estObjet(patch.modules)) throw new Error('Modules invalides.');
    for (const [k, v] of Object.entries(patch.modules)) if (k !== 'hud' || typeof v !== 'boolean') throw new Error('Modules invalides.');
  }
  if ('hud' in patch) {
    if (!estObjet(patch.hud)) throw new Error('Réglages du bandeau invalides.');
    propre.hud = {};
    for (const [k, v] of Object.entries(patch.hud)) {
      if (!['truck', 'bus'].includes(k)) throw new Error('Réglages du bandeau invalides.');
      propre.hud[k] = verifierProfilHud(k === 'bus' ? 'car' : 'camion', v);
    }
  }
  return propre;
}

// ---------- Lecture et écriture de reglages.json (G5 et G12, tâche 5) ----------
// Lecture : un fichier illisible n'est JAMAIS écrasé. Il est renommé en reglages.corrompu-<date>.json,
// puis on repart de la copie de secours (reglages.bak.json, mise à jour au plus une fois par jour).
// Renvoie { saved, etat } : etat = 'ok', 'absent', 'restaure' (copie de secours reprise) ou 'defaut'.
const fs = require('fs');
const path = require('path');
const UN_JOUR = 24 * 60 * 60 * 1000;
const fichierSecours = file => file.replace(/\.json$/, '') + '.bak.json';

function lireJson(file) {
  const v = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!estObjet(v)) throw new SyntaxError('le contenu n’est pas un objet');
  return v;
}

function lireReglages(file, maintenant = Date.now()) {
  let saved;
  try { saved = lireJson(file); }
  catch (error) {
    if (error.code === 'ENOENT') return { saved: {}, etat: 'absent' };
    if (!(error instanceof SyntaxError)) throw error;
    const date = new Date(maintenant).toISOString().replace(/[:.]/g, '-');
    const garde = file.replace(/\.json$/, '') + `.corrompu-${date}.json`;
    try { fs.renameSync(file, garde); } catch {}
    try { return { saved: lireJson(fichierSecours(file)), etat: 'restaure', fichierAbime: garde }; }
    catch { return { saved: {}, etat: 'defaut', fichierAbime: garde }; }
  }
  // Fichier lisible : copie de secours du jour (au plus une fois par 24 h)
  try {
    const bak = fichierSecours(file);
    let ancienne = true;
    try { ancienne = maintenant - fs.statSync(bak).mtimeMs > UN_JOUR; } catch {}
    if (ancienne) ecrireAtomique(bak, JSON.stringify(saved, null, 2));
  } catch {}
  return { saved, etat: 'ok' };
}

// Écriture atomique : fichier .tmp puis renommage (une coupure ne laisse jamais un fichier à moitié écrit).
function ecrireAtomique(file, texte) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, texte);
  fs.renameSync(tmp, file);
}
function ecrireReglages(file, settings) { ecrireAtomique(file, JSON.stringify(settings, null, 2)); }

module.exports = { mergeSavedSettings, mergeHudSettings, validateSettingsPatch, lireReglages, ecrireReglages, CLES_REGLAGES };
