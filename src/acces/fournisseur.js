// Fournisseur des accès : là où vivent les rangs, les membres et les clés.
//
// Aujourd'hui : APERÇU LOCAL. Tout est rangé dans un fichier sur ce PC, toi seul le vois, et rien n'est protégé
// (n'importe qui pourrait modifier ce fichier). Il sert à préparer l'interface et les règles.
// Demain : SERVEUR (connexion Steam, base en ligne). L'appli appellera les mêmes méthodes ; seul le fournisseur change.
//
// Contrat (méthodes, toutes asynchrones) — à reproduire côté serveur :
//   session()                    → { mode, steamId, rankId, rank, perms, extraPerms }
//   ranks()                      → rangs triés (rangs de base + rangs créés)
//   saveRank(input)              → rang enregistré           (permission acces.rangs, niveau < le sien)
//   deleteRank(id)               → true                      (idem)
//   keys()                       → clés créées               (permission acces.cles)
//   createKeys(count, grant)     → nouvelles clés            (idem ; on ne donne qu'un rang inférieur au sien)
//   revokeKey(key)               → true                      (idem)
//   redeemKey(key)               → { rank, perms }           (tout le monde)
//   resetPreview()               → efface l'aperçu local
const fs = require('node:fs');
const path = require('node:path');
const R = require('./rangs');
const K = require('./cles');

class ApercuLocal {
  constructor(dir, getSteamId = () => '') {
    this.file = path.join(dir, 'acces-apercu.json');
    this.getSteamId = getSteamId;
    this.data = this._load();
  }
  _load() {
    try {
      const d = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return { ranks: Array.isArray(d.ranks) ? d.ranks : [], keys: Array.isArray(d.keys) ? d.keys : [], me: d.me && typeof d.me === 'object' ? d.me : { rankId: R.FONDATEUR, extraPerms: [] } };
    } catch { return { ranks: [], keys: [], me: { rankId: R.FONDATEUR, extraPerms: [] } }; }
  }
  _save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file);
  }
  _all() { return R.sortRanks([...R.SYSTEM_RANKS, ...this.data.ranks]); }
  _rank(id) { return this._all().find(r => r.id === id) || R.SYSTEM_RANKS.find(r => r.id === 'membre'); }
  _me() {
    const rank = this._rank(this.data.me.rankId);
    const extra = (this.data.me.extraPerms || []).filter(p => R.PERM_IDS.includes(p));
    return { ...rank, perms: [...new Set([...R.permsOf(rank), ...extra])] };
  }
  _need(perm) { if (!R.hasPerm(this._me(), perm)) throw new Error('Ton rang ne le permet pas.'); }

  async session() {
    const me = this._me(), rank = this._rank(this.data.me.rankId);
    return { mode: 'apercu', steamId: this.getSteamId() || '', rankId: rank.id, rank, perms: me.perms, extraPerms: this.data.me.extraPerms || [] };
  }
  async ranks() { return this._all(); }
  async saveRank(input) {
    const v = R.validateRank(input, this._me(), this._all());
    if (!v.ok) throw new Error(v.error);
    const i = this.data.ranks.findIndex(r => r.id === v.rank.id);
    if (i >= 0) this.data.ranks[i] = v.rank; else this.data.ranks.push(v.rank);
    this._save();
    return v.rank;
  }
  async deleteRank(id) {
    const r = this._all().find(x => x.id === id);
    if (!r || !R.canEditRank(this._me(), r)) throw new Error('Tu ne peux pas supprimer ce rang.');
    this.data.ranks = this.data.ranks.filter(x => x.id !== id);
    if (this.data.me.rankId === id) this.data.me.rankId = 'membre';
    this.data.keys.forEach(k => { if (k.grant.rank === id) k.revoked = true; });
    this._save();
    return true;
  }
  async keys() { this._need('acces.cles'); return this.data.keys.slice().reverse(); }
  async createKeys(count, grant) {
    this._need('acces.cles');
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 50) throw new Error('De 1 à 50 clés à la fois.');
    const v = K.validateGrant(grant);
    if (!v.ok) throw new Error(v.error);
    const me = this._me();
    if (v.grant.rank) {
      const target = this._all().find(r => r.id === v.grant.rank);
      if (!target) throw new Error('Rang inconnu.');
      if (!(me.level > target.level) || target.id === R.FONDATEUR) throw new Error('Tu ne peux donner qu’un rang plus bas que le tien.');
    }
    if (v.grant.perms.some(p => !me.perms.includes(p))) throw new Error('Tu ne peux pas donner une permission que tu n’as pas.');
    const made = [];
    for (let i = 0; i < n; i++) {
      let key; do { key = K.generateKey(); } while (this.data.keys.some(k => k.key === key));
      const k = { key, grant: v.grant, createdAt: new Date().toISOString(), uses: 0, revoked: false };
      this.data.keys.push(k); made.push(k);
    }
    this._save();
    return made;
  }
  async revokeKey(key) {
    this._need('acces.cles');
    const k = this.data.keys.find(x => x.key === K.normalizeKey(key));
    if (!k) throw new Error('Clé inconnue.');
    k.revoked = true; this._save();
    return true;
  }
  async redeemKey(input) {
    if (!K.isWellFormed(input)) throw new Error('Cette clé est mal écrite : vérifie chaque caractère.');
    const k = this.data.keys.find(x => x.key === K.normalizeKey(input));
    if (!k) throw new Error('Clé inconnue. (Aperçu : seules les clés créées sur ce PC existent.)');
    if (k.revoked) throw new Error('Cette clé a été désactivée.');
    if (k.grant.expiresAt && Date.parse(k.grant.expiresAt) < Date.now()) throw new Error('Cette clé a expiré.');
    if (k.uses >= k.grant.maxUses) throw new Error('Cette clé a déjà été utilisée.');
    k.uses++;
    const cur = this._rank(this.data.me.rankId);
    const target = k.grant.rank && this._all().find(r => r.id === k.grant.rank);
    if (target && target.level > cur.level) this.data.me.rankId = target.id;       // une clé ne fait jamais descendre
    this.data.me.extraPerms = [...new Set([...(this.data.me.extraPerms || []), ...k.grant.perms])];
    this._save();
    return { rank: this._rank(this.data.me.rankId), perms: this._me().perms };
  }
  // Aperçu seulement : se mettre dans la peau d'un rang pour voir l'interface comme lui.
  async previewAs(rankId) { this.data.me.rankId = this._rank(rankId).id; this.data.me.extraPerms = []; this._save(); return this.session(); }
  async resetPreview() { this.data = { ranks: [], keys: [], me: { rankId: R.FONDATEUR, extraPerms: [] } }; this._save(); return true; }
}

// Le futur serveur : mêmes méthodes, qui appelleront l'API en ligne.
class Serveur {
  constructor(url) { this.url = url; }
  _absent() { throw new Error('Le serveur des accès n’existe pas encore.'); }
  async session() { this._absent(); } async ranks() { this._absent(); } async saveRank() { this._absent(); }
  async deleteRank() { this._absent(); } async keys() { this._absent(); } async createKeys() { this._absent(); }
  async revokeKey() { this._absent(); } async redeemKey() { this._absent(); }
}

function createProvider({ dir, serverUrl, getSteamId }) {
  return serverUrl ? new Serveur(serverUrl) : new ApercuLocal(dir, getSteamId);
}

module.exports = { ApercuLocal, Serveur, createProvider };
