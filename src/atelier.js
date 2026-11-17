// Atelier (outils avancés, expérimental) : sauvegarde / restauration des profils et console de développement.
// Rien ici ne modifie une sauvegarde sans copie de secours préalable.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GAMES = {
  ets2: { name: 'Euro Truck Simulator 2', folder: 'Euro Truck Simulator 2', exe: 'eurotrucks2.exe' },
  ats: { name: 'American Truck Simulator', folder: 'American Truck Simulator', exe: 'amtrucks.exe' }
};
const PROFILE_DIRS = ['profiles', 'steam_profiles'];

class Atelier {
  constructor(documentsDir, backupsDir) {
    this.docs = documentsDir;
    this.backups = backupsDir;
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
          out.push({ id: `${game}/${kind}/${e.name}`, game, gameName: GAMES[game].name, kind, folder: e.name, name: Atelier.decodeName(e.name),
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
    this.backup(id, 'Avant restauration');           // filet de sécurité
    fs.rmSync(r.dir, { recursive: true, force: true });
    fs.cpSync(src, r.dir, { recursive: true });
    fs.rmSync(path.join(r.dir, '.etiquette'), { force: true });
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
