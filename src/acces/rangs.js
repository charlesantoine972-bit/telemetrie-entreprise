// Rangs et permissions (préparation, sans serveur).
//
// Deux familles de rangs, même modèle :
//   - rangs de l'APPLI (scope 'app') : Fondateur, Administrateur, Testeur… gérés par toi, donnent les clés de test,
//     l'accès bêta, des options en plus ;
//   - rangs d'une VTC (scope 'vtc') : ceux de l'entreprise du joueur (lus sur TruckersMP / Trucky, ou créés par
//     le fondateur de la VTC), traduits en permissions dans l'appli.
//
// Règles :
//   - un rang a un niveau (0 à 100). On ne peut donner, modifier ou supprimer qu'un rang de niveau STRICTEMENT
//     inférieur au sien ;
//   - le rang Fondateur (niveau 100) est fixe : il ne se crée pas, ne se modifie pas, ne se retire pas ;
//   - un rang ne peut pas donner une permission que son créateur n'a pas.

const PERMISSIONS = [
  ['acces.cles', 'Créer et distribuer des clés d’activation'],
  ['acces.rangs', 'Créer, modifier et supprimer des rangs'],
  ['acces.membres', 'Donner un rang aux membres'],
  ['beta.acces', 'Accès aux versions bêta'],
  ['outils.experimentaux', 'Outils expérimentaux (Truck & Coach Tools, Truck & Road Trip Tools)'],
  ['vtc.gerer', 'Gérer la VTC (membres, recrutement)'],
  ['vtc.convois', 'Organiser des convois et des événements'],
  ['vtc.missions', 'Créer des missions partagées'],
];
const PERM_IDS = PERMISSIONS.map(([id]) => id);

const FONDATEUR = 'fondateur';
const SYSTEM_RANKS = [
  { id: FONDATEUR, name: 'Fondateur', color: '#f59e0b', level: 100, system: true, perms: ['*'] },
  { id: 'admin', name: 'Administrateur', color: '#ef4444', level: 80, system: true, perms: ['acces.cles', 'acces.membres', 'beta.acces', 'outils.experimentaux', 'vtc.gerer', 'vtc.convois', 'vtc.missions'] },
  { id: 'testeur', name: 'Testeur', color: '#22c55e', level: 20, system: true, perms: ['beta.acces', 'outils.experimentaux'] },
  { id: 'membre', name: 'Membre', color: '#94a3b8', level: 0, system: true, perms: [] },
];

const clone = (o) => JSON.parse(JSON.stringify(o));
function permsOf(rank) {
  if (!rank) return [];
  return rank.perms && rank.perms.includes('*') ? PERM_IDS.slice() : (rank.perms || []).filter(p => PERM_IDS.includes(p));
}
const hasPerm = (rank, perm) => permsOf(rank).includes(perm);

// Peut-on donner ce rang à quelqu'un ?
function canAssign(actor, target) {
  if (!actor || !target) return false;
  if (target.id === FONDATEUR) return false;
  return hasPerm(actor, 'acces.membres') && actor.level > target.level;
}

// Peut-on modifier ou supprimer ce rang ?
function canEditRank(actor, target) {
  if (!actor || !target) return false;
  if (target.id === FONDATEUR || target.system) return false;   // rangs de base : fixes
  return hasPerm(actor, 'acces.rangs') && actor.level > target.level;
}

function slug(name) {
  return String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'rang';
}

// Vérifie un rang créé ou modifié par `actor`. Renvoie { ok, rank } ou { ok:false, error }.
function validateRank(input, actor, existing = []) {
  const name = String(input && input.name || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 24) return { ok: false, error: 'Le nom du rang fait de 2 à 24 caractères.' };
  const color = String(input.color || '').trim();
  if (!/^#[0-9a-f]{6}$/i.test(color)) return { ok: false, error: 'Choisis une couleur.' };
  const level = Number(input.level);
  if (!Number.isInteger(level) || level < 1 || level > 99) return { ok: false, error: 'Le niveau va de 1 à 99.' };
  if (!actor || !hasPerm(actor, 'acces.rangs')) return { ok: false, error: 'Ton rang ne permet pas de gérer les rangs.' };
  if (level >= actor.level) return { ok: false, error: `Le niveau doit être plus bas que le tien (${actor.level}).` };
  const mine = permsOf(actor);
  const perms = [...new Set((input.perms || []).filter(p => PERM_IDS.includes(p)))];
  const extra = perms.filter(p => !mine.includes(p));
  if (extra.length) return { ok: false, error: 'Tu ne peux pas donner une permission que tu n’as pas.' };
  const id = input.id || slug(name);
  const clash = existing.find(r => r.id !== input.id && (r.id === id || r.name.toLowerCase() === name.toLowerCase()));
  if (clash) return { ok: false, error: 'Un rang porte déjà ce nom.' };
  const prev = input.id && existing.find(r => r.id === input.id);
  if (prev && !canEditRank(actor, prev)) return { ok: false, error: 'Tu ne peux pas modifier ce rang.' };
  return { ok: true, rank: { id, name, color: color.toLowerCase(), level, system: false, perms, scope: input.scope === 'vtc' ? 'vtc' : 'app' } };
}

function sortRanks(ranks) { return ranks.slice().sort((a, b) => b.level - a.level || a.name.localeCompare(b.name)); }

module.exports = { PERMISSIONS, PERM_IDS, FONDATEUR, SYSTEM_RANKS: clone(SYSTEM_RANKS), permsOf, hasPerm, canAssign, canEditRank, validateRank, sortRanks, slug };
