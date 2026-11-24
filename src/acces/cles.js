// Clés d'activation (préparation, sans serveur).
//
// Format : TCH-XXXX-XXXX-XXXX-C
//   - 12 caractères aléatoires en base 32 « de Crockford » (sans I, L, O, U : pas de confusion 0/O, 1/I) ;
//   - C = caractère de contrôle, pour repérer une faute de frappe AVANT d'interroger le serveur.
//
// Important : un format correct ne veut PAS dire que la clé est valide. Seul le serveur sait si une clé existe,
// ce qu'elle donne (rang, permissions), si elle a expiré ou si elle a déjà servi. Sans serveur, l'aperçu local
// simule ce fonctionnement mais ne protège rien.
const crypto = require('node:crypto');

const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const PREFIX = 'TCH';

function checkChar(body) {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum = (sum * 31 + ALPHA.indexOf(body[i]) * (i + 7)) % 32;
  return ALPHA[sum];
}

function generateKey(randomBytes = crypto.randomBytes) {
  const bytes = randomBytes(12);
  let body = '';
  for (let i = 0; i < 12; i++) body += ALPHA[bytes[i] % 32];
  return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${checkChar(body)}`;
}

// Accepte minuscules, espaces, tirets manquants et les confusions courantes (O→0, I/L→1).
function normalizeKey(input) {
  let s = String(input || '').toUpperCase().replace(/[\s_-]+/g, '');
  if (s.startsWith(PREFIX)) s = s.slice(PREFIX.length);
  s = s.replace(/O/g, '0').replace(/[IL]/g, '1');
  if (!/^[0-9A-Z]{13}$/.test(s) || [...s].some(c => !ALPHA.includes(c))) return null;
  return `${PREFIX}-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s[12]}`;
}

function isWellFormed(input) {
  const k = normalizeKey(input);
  if (!k) return false;
  const body = k.slice(4, 18).replace(/-/g, '');
  return checkChar(body) === k[19];
}

// Ce qu'une clé donne : un rang et/ou des permissions, une date de fin, un nombre d'utilisations.
function validateGrant(g) {
  const out = { rank: g && g.rank ? String(g.rank) : null, perms: Array.isArray(g && g.perms) ? g.perms.map(String) : [], expiresAt: null, maxUses: 1 };
  if (g && g.expiresAt) { const t = Date.parse(g.expiresAt); if (!Number.isFinite(t)) return { ok: false, error: 'Date de fin invalide.' }; out.expiresAt = new Date(t).toISOString(); }
  if (g && g.maxUses != null) { const n = Number(g.maxUses); if (!Number.isInteger(n) || n < 1 || n > 1000) return { ok: false, error: 'Utilisations : de 1 à 1000.' }; out.maxUses = n; }
  if (!out.rank && !out.perms.length) return { ok: false, error: 'Une clé doit donner un rang ou au moins une permission.' };
  return { ok: true, grant: out };
}

module.exports = { ALPHA, PREFIX, generateKey, normalizeKey, isWellFormed, validateGrant };
