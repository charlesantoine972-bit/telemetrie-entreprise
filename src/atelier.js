// Atelier (outils avancés, expérimental) : sauvegarde / restauration des profils et console de développement.
// Rien ici ne modifie une sauvegarde sans copie de secours préalable.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { SaveEditor, TRUCK_SKILLS, COACH_SKILLS } = require('./save-editor');

const GAMES = {
  ets2: { name: 'Euro Truck Simulator 2', folder: 'Euro Truck Simulator 2', exe: 'eurotrucks2.exe' },
  ats: { name: 'American Truck Simulator', folder: 'American Truck Simulator', exe: 'amtrucks.exe' }
};
const PROFILE_DIRS = ['profiles', 'steam_profiles'];

class Atelier {
  constructor(documentsDir, backupsDir, decryptExe) {
    this.docs = documentsDir;
    this.backups = backupsDir;
    this.editor = new SaveEditor(decryptExe);
  }

  // ---------- Édition des sauvegardes
  editorInfo() { return { available: this.editor.available(), truckSkills: TRUCK_SKILLS, coachSkills: COACH_SKILLS }; }
  saveSlots(id) { return this.editor.slots(this.resolve(id).dir); }
  saveSummary(id, slot) {
    const r = this.resolve(id);
    if (!/^[A-Za-z0-9_-]+$/.test(slot)) throw new Error('Sauvegarde inconnue.');
    return this.editor.summary(path.join(r.dir, 'save', slot));
  }
  saveApply(id, slot, edits) {
    const r = this.resolve(id);
    if (this.isRunning(r.game)) throw new Error(`Ferme ${GAMES[r.game].name} avant de modifier une sauvegarde.`);
    const allowed = ['profileName', 'companyName', 'money', 'xp', 'busXp', 'skills', 'coachSkills', 'visitAllCities', 'discoverBusStops', 'repairAll', 'refuelAll'];
    const clean = {}; for (const k of allowed) if (edits && edits[k] != null) clean[k] = edits[k];
    if (!Object.keys(clean).length) throw new Error('Aucune modification demandée.');
    const backupName = this.backup(id, 'Avant modification (Truck Tools)');
    const report = this.editor.apply(r.dir, slot, clean);
    return { report, backupName };
  }

  // ---------- Analyse : sauvegardes corrompues ou non (lecture seule, rien n'est modifié)
  async analyze(id) {
    const r = this.resolve(id);
    if (!fs.existsSync(r.dir)) throw new Error('Dossier du profil introuvable.');
    const profile = await this.editor.checkFile(path.join(r.dir, 'profile.sii'), ['user_profile']);
    const saveDir = path.join(r.dir, 'save');
    let dirs = []; try { dirs = fs.readdirSync(saveDir, { withFileTypes: true }).filter(d => d.isDirectory() && d.name !== 'multiplayer_backup'); } catch {}
    const labels = new Map(this.editor.slots(r.dir).map(s => [s.slot, s.label]));
    const slots = [];
    for (const d of dirs) {
      const dir = path.join(saveDir, d.name);
      let modified = 0; try { modified = fs.statSync(path.join(dir, 'game.sii')).mtimeMs; } catch { try { modified = fs.statSync(dir).mtimeMs; } catch {} }
      const res = await this.editor.analyzeSlot(dir);
      slots.push({ slot: d.name, label: labels.get(d.name) || (d.name === 'autosave' ? 'Sauvegarde automatique' : 'Sauvegarde ' + d.name), modified, ...res });
    }
    slots.sort((a, b) => b.modified - a.modified);
    const count = k => slots.filter(s => s.status === k).length;
    return { id, running: this.isRunning(r.game), tool: this.editor.available(), profile, slots,
      ok: count('ok'), warn: count('warn') + (profile.status === 'warn' ? 1 : 0), bad: count('bad') + (profile.status === 'bad' ? 1 : 0), at: Date.now() };
  }

  // ---------- Copie d'un profil (pour faire des tests sans toucher à l'original)
  // La copie est toujours créée dans « profiles » (local), jamais dans le Steam Cloud.
  duplicate(id, newName) {
    const r = this.resolve(id);
    if (this.isRunning(r.game)) throw new Error(`Ferme ${GAMES[r.game].name} avant de dupliquer un profil.`);
    if (!fs.existsSync(r.dir)) throw new Error('Dossier du profil introuvable.');
    const name = SaveEditor.checkName(newName, 'Le nom de la copie');
    const folder = Buffer.from(name, 'utf8').toString('hex').toUpperCase();
    const dst = path.join(this.gameDir(r.game), 'profiles', folder);
    const taken = PROFILE_DIRS.some(k => fs.existsSync(path.join(this.gameDir(r.game), k, folder)))
      || this.profiles().some(p => p.game === r.game && p.name.toLowerCase() === name.toLowerCase());
    if (taken) throw new Error(`Un profil s'appelle déjà « ${name} ». Choisis un autre nom.`);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(r.dir, dst, { recursive: true });
    try {
      const file = path.join(dst, 'profile.sii');
      const txt = SaveEditor.set(this.editor.read(file), 'profile_name', SaveEditor.encStr(name));
      if (!txt.startsWith('SiiNunit')) throw new Error('Fichier du profil illisible.');
      fs.writeFileSync(file, txt);
    } catch (e) {
      fs.rmSync(dst, { recursive: true, force: true });
      throw new Error('Copie annulée : ' + e.message);
    }
    return { id: `${r.game}/profiles/${folder}`, name };
  }

  gameDir(game) { return path.join(this.docs, GAMES[game].folder); }

  // Le nom du dossier d'un profil est le nom du profil écrit en hexadécimal.
  static decodeName(folder) {
    if (/^[0-9a-fA-F]+$/.test(folder) && folder.length % 2 === 0) {
      try { const s = Buffer.from(folder, 'hex').toString('utf8'); if (s && !/[\u0000-\u001f]/.test(s)) return s; } catch {}
    }
    return folder;
  }

  isRunning(game) {
    if (process.platform !== 'win32') return false;
    try {
      const out = execFileSync('tasklist', ['/FI', `IMAGENAME eq ${GAMES[game].exe}`, '/NH'], { encoding: 'utf8', windowsHide: true });
      return out.toLowerCase().includes(GAMES[game].exe);
    } catch { return false; }
  }

  status() {
    return Object.fromEntries(Object.keys(GAMES).map(g => [g, { installed: fs.existsSync(this.gameDir(g)), running: this.isRunning(g) }]));
  }

  profiles() {
    const out = [];
    for (const game of Object.keys(GAMES)) {
      for (const kind of PROFILE_DIRS) {
        const dir = path.join(this.gameDir(game), kind);
        let entries = [];
        try { entries = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()); } catch { continue; }
        for (const e of entries) {
          const full = path.join(dir, e.name);
          let mtime = 0;
          try { mtime = fs.statSync(path.join(full, 'profile.sii')).mtimeMs; } catch { try { mtime = fs.statSync(full).mtimeMs; } catch {} }
          // Nom réel : lu dans profile.sii s'il est en texte clair (après un renommage par l'Atelier), sinon déduit du dossier
          let name = Atelier.decodeName(e.name);
          try { const head = fs.readFileSync(path.join(full, 'profile.sii'), 'utf8'); if (head.startsWith('SiiNunit')) { const m = head.match(/^ profile_name: (.*)$/m); if (m) name = SaveEditor.decStr(m[1]) || name; } } catch {}
          out.push({ id: `${game}/${kind}/${e.name}`, game, gameName: GAMES[game].name, kind, folder: e.name, name,
            cloud: kind === 'steam_profiles', modified: mtime, backups: this.listBackups(`${game}/${kind}/${e.name}`) });
        }
      }
    }
    return out.sort((a, b) => b.modified - a.modified);
  }

  resolve(id) {
    const [game, kind, folder] = String(id).split('/');
    if (!GAMES[game] || !PROFILE_DIRS.includes(kind) || !folder || folder.includes('..') || /[\\/]/.test(folder)) throw new Error('Profil inconnu.');
    return { game, kind, folder, dir: path.join(this.gameDir(game), kind, folder), store: path.join(this.backups, game, kind, folder) };
  }

  listBackups(id) {
    let r; try { r = this.resolve(id); } catch { return []; }
    try {
      return fs.readdirSync(r.store, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => {
        let label = ''; try { label = fs.readFileSync(path.join(r.store, e.name, '.etiquette'), 'utf8'); } catch {}
        return { name: e.name, label };
      }).sort((a, b) => b.name.localeCompare(a.name));
    } catch { return []; }
  }

  backup(id, label = 'Sauvegarde manuelle') {
    const r = this.resolve(id);
    if (!fs.existsSync(r.dir)) throw new Error('Dossier du profil introuvable.');
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    const name = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    const dst = path.join(r.store, name);
    fs.mkdirSync(dst, { recursive: true });
    fs.cpSync(r.dir, dst, { recursive: true });
    fs.writeFileSync(path.join(dst, '.etiquette'), label);
    return name;
  }

  restore(id, backupName) {
    const r = this.resolve(id);
    if (this.isRunning(r.game)) throw new Error(`Ferme ${GAMES[r.game].name} avant de restaurer.`);
    if (!/^[0-9_-]+$/.test(backupName)) throw new Error('Sauvegarde inconnue.');
    const src = path.join(r.store, backupName);
    if (!fs.existsSync(src)) throw new Error('Sauvegarde introuvable.');
    if (fs.existsSync(r.dir)) this.backup(id, 'Avant restauration');   // filet de sécurité (sauf profil supprimé)
    fs.rmSync(r.dir, { recursive: true, force: true });
    fs.cpSync(src, r.dir, { recursive: true });
    fs.rmSync(path.join(r.dir, '.etiquette'), { force: true });
    return true;
  }

  // ---------- Suppression
  // Supprime une copie faite par le Hub (ne touche pas au profil du jeu).
  deleteBackup(id, backupName) {
    const r = this.resolve(id);
    if (!/^[0-9_-]+$/.test(String(backupName))) throw new Error('Sauvegarde inconnue.');
    const dir = path.join(r.store, backupName);
    if (!fs.existsSync(dir)) throw new Error('Sauvegarde introuvable.');
    fs.rmSync(dir, { recursive: true, force: true });
    try { if (!fs.readdirSync(r.store).length) fs.rmdirSync(r.store); } catch {}
    return true;
  }

  // Supprime un profil du jeu. Une copie « Avant suppression » est gardée dans les sauvegardes du Hub :
  // le profil apparaît alors dans « Profils supprimés » et peut être restauré.
  deleteProfile(id) {
    const r = this.resolve(id);
    if (this.isRunning(r.game)) throw new Error(`Ferme ${GAMES[r.game].name} avant de supprimer un profil.`);
    if (r.kind === 'steam_profiles') throw new Error('Ce profil est synchronisé par Steam Cloud : supprime-le depuis le jeu (choix du profil), sinon Steam risque de le remettre.');
    if (!fs.existsSync(r.dir)) throw new Error('Dossier du profil introuvable.');
    const backupName = this.backup(id, 'Avant suppression');
    fs.rmSync(r.dir, { recursive: true, force: true });
    return { backupName };
  }

  // Profils supprimés dont il reste des copies dans les sauvegardes du Hub.
  deletedProfiles() {
    const out = [];
    for (const game of Object.keys(GAMES)) for (const kind of PROFILE_DIRS) {
      let entries = []; try { entries = fs.readdirSync(path.join(this.backups, game, kind), { withFileTypes: true }).filter(e => e.isDirectory()); } catch { continue; }
      for (const e of entries) {
        const id = `${game}/${kind}/${e.name}`;
        let r; try { r = this.resolve(id); } catch { continue; }
        if (fs.existsSync(r.dir)) continue;
        const backups = this.listBackups(id);
        if (!backups.length) continue;
        let name = Atelier.decodeName(e.name);
        try { const head = fs.readFileSync(path.join(r.store, backups[0].name, 'profile.sii'), 'utf8'); if (head.startsWith('SiiNunit')) { const m = head.match(/^ profile_name: (.*)$/m); if (m) name = SaveEditor.decStr(m[1]) || name; } } catch {}
        out.push({ id, game, gameName: GAMES[game].name, kind, folder: e.name, name, cloud: kind === 'steam_profiles', backups });
      }
    }
    return out.sort((a, b) => b.backups[0].name.localeCompare(a.backups[0].name));
  }

  // Efface toutes les copies d'un profil déjà supprimé (définitif).
  purgeDeleted(id) {
    const r = this.resolve(id);
    if (fs.existsSync(r.dir)) throw new Error('Ce profil existe encore : supprime d\'abord le profil.');
    if (!fs.existsSync(r.store)) throw new Error('Aucune copie à effacer.');
    fs.rmSync(r.store, { recursive: true, force: true });
    return true;
  }

  // ---------- Console de développement (config.cfg)
  configPath(game) { return path.join(this.gameDir(game), 'config.cfg'); }

  consoleState(game) {
    let txt; try { txt = fs.readFileSync(this.configPath(game), 'utf8'); } catch { return { found: false, enabled: false }; }
    const val = k => { const m = txt.match(new RegExp(`^\\s*uset\\s+${k}\\s+"?(\\d)"?`, 'm')); return m ? m[1] === '1' : false; };
    return { found: true, enabled: val('g_developer') && val('g_console') };
  }

  setConsole(game, on) {
    if (this.isRunning(game)) throw new Error(`Ferme ${GAMES[game].name} d'abord : le jeu réécrit ce réglage en quittant.`);
    const file = this.configPath(game);
    let txt = fs.readFileSync(file, 'utf8');
    fs.copyFileSync(file, file + '.avant-truck-coach-hub');
    for (const k of ['g_developer', 'g_console']) {
      const re = new RegExp(`^(\\s*uset\\s+${k}\\s+)"?\\d"?`, 'm');
      txt = re.test(txt) ? txt.replace(re, `$1"${on ? 1 : 0}"`) : txt + `\nuset ${k} "${on ? 1 : 0}"`;
    }
    fs.writeFileSync(file, txt);
    return this.consoleState(game);
  }
}

module.exports = { Atelier, GAMES };
