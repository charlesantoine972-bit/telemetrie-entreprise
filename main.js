const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme, screen, systemPreferences, safeStorage, session, utilityProcess } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Telemetry } = require('./src/telemetry');
const { mergeSavedSettings, mergeHudSettings, validateSettingsPatch, lireReglages, ecrireReglages } = require('./src/settings');
const installer = require('./src/plugin-installer');
const { Atelier } = require('./src/atelier');
const carte = require('./src/map');
const gameContent = require('./src/game-content');
const steam = require('./src/steam');
const { DiscordPresence } = require('./src/discord-presence');
const coach = require('./src/coach');
const gameSettings = require('./src/game-settings');
const { steamNews } = require('./src/steam-news');
const acces = require('./src/acces/fournisseur');
const accesVtc = require('./src/acces/vtc');
const rangs = require('./src/acces/rangs');
let contentPending = null;
let atelier;
let discordPresence;
carte.registerScheme();

/* ---------- Dossier de données : garde l'historique malgré le changement de nom ---------- */
// Version bêta (numéro « x.y.z-beta.n ») : appli séparée, installable à côté de la version normale.
const IS_BETA = /-beta/i.test(app.getVersion());
(function pinUserData() {
  const appData = app.getPath('appData');
  const stableDir = path.join(appData, 'Truck and Coach Hub');
  const dir = IS_BETA ? path.join(appData, 'Truck and Coach Hub Beta') : stableDir;
  try {
    fs.mkdirSync(dir, { recursive: true });
    // La bêta démarre avec une copie de tes données et réglages de la version normale (sans les modifier)
    if (IS_BETA) for (const f of ['donnees.json', 'reglages.json']) {
      const src = path.join(stableDir, f), dst = path.join(dir, f);
      if (!fs.existsSync(dst) && fs.existsSync(src)) fs.copyFileSync(src, dst);
    }
    if (!IS_BETA) for (const old of ['Telemetrie Entreprise', 'telemetrie-entreprise']) {
      for (const f of ['donnees.json', 'reglages.json']) {
        const src = path.join(appData, old, f), dst = path.join(dir, f);
        if (!fs.existsSync(dst) && fs.existsSync(src)) fs.copyFileSync(src, dst);
      }
    }
  } catch (e) { console.error('Migration des données :', e.message); }
  app.setPath('userData', dir);
})();

let win;
let telemetry;
let pluginStatus = [];
let updateState = { state: app.isPackaged ? 'idle' : 'dev', version: null };
const STEAM_IDS = { ets2: 227300, ats: 270880 };
const LINKS = {
  truckersmp: 'https://truckersmp.com',
  trucky: 'https://truckyapp.com',
  trucksbook: 'https://trucksbook.eu',
  haulmp: 'https://haulmp.com',
  github: 'https://github.com/charlesantoine972-bit/telemetrie-entreprise/releases'
};

/* ---------- Réglages ---------- */
const DEFAULTS = { atelier: false, showSoon: false, autoTelemetry: true, look: { theme: 'systeme', accent: 'defaut', vision: 'normale', zoom: '100', contrast: false, motion: false }, vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5, customGamePaths: [], mapTilesets: {}, coachVehicles: [], pseudo: '', steamId: '', discordClientId: '', modules: { hud: false }, hud: { truck: { style: 'navigation', position: 'haut', logo: true, opacity: 82, scale: 100 }, bus: { style: 'navigation', position: 'haut', logo: true, opacity: 82, scale: 100 } }, addons: { tablette: false, gps: false } };
const settingsFile = () => path.join(app.getPath('userData'), 'reglages.json');
let settings = { ...DEFAULTS };
function sanitizeLook(l) {
  const pick = (v, list, d) => list.includes(String(v)) ? String(v) : d;
  const accent = /^#[0-9a-f]{6}$/i.test(String(l.accent)) ? String(l.accent).toUpperCase() : pick(l.accent, ['defaut', 'windows'], 'defaut');
  return { theme: pick(l.theme, ['sombre', 'clair', 'systeme'], 'systeme'), accent, vision: pick(l.vision, ['normale', 'rg', 'by'], 'normale'),
    zoom: pick(l.zoom, ['100', '115', '130'], '100'), contrast: !!l.contrast, motion: !!l.motion };
}
function windowBackground(st) {
  const th = st.look && ['sombre', 'clair'].includes(st.look.theme) ? st.look.theme : 'systeme';
  const t = th === 'systeme' ? (nativeTheme.shouldUseDarkColors ? 'sombre' : 'clair') : th;
  return { sombre: '#202020', clair: '#F3F3F3' }[t];
}
// Réglages illisibles au démarrage (G5) : le fichier abîmé est mis de côté, jamais écrasé ; l'utilisateur est prévenu.
let reglagesRecuperes = null;
function loadSettings() {
  const lu = lireReglages(settingsFile());
  if (lu.etat === 'restaure' || lu.etat === 'defaut') {
    console.error('Réglages illisibles, fichier mis de côté :', lu.fichierAbime);
    reglagesRecuperes = lu;
  }
  const saved = lu.saved;
  settings = mergeSavedSettings(DEFAULTS, saved);
  if (!settings.mapTilesets || typeof settings.mapTilesets !== 'object' || Array.isArray(settings.mapTilesets)) settings.mapTilesets = {};
  else settings.mapTilesets = Object.fromEntries(Object.entries(settings.mapTilesets).filter(([game, dir]) =>
    ['ets2', 'ats'].includes(game) && typeof dir === 'string'));
  carte.loadTilesets(settings.mapTilesets);
  // Bêta : réglages de jeu séparés pour ETS2 et ATS (repris des réglages actuels au premier lancement)
  gameSettings.initGameSettings(settings);
}
// Écriture atomique (G12) : fichier .tmp puis renommage.
function saveSettings() {
  ecrireReglages(settingsFile(), settings);
}
function integrationSecretsFile() {
  return path.join(app.getPath('userData'), 'integrations.json');
}
// Clé Steam chiffrée par le système (DPAPI sous Windows) avec les fonctions ASYNCHRONES de safeStorage
// (Electron 45+). Les fonctions synchrones sont dépréciées en Electron 45 et supprimées en 46 : elles ne
// servent plus qu'en secours, pour relire une clé enregistrée par une ancienne version de l'appli
// (elle est alors rechiffrée avec la nouvelle méthode).
async function chiffrementDisponible() {
  try { return await safeStorage.isAsyncEncryptionAvailable(); } catch { return false; }
}
async function readSteamApiKey() {
  const file = integrationSecretsFile();
  if (!fs.existsSync(file)) return '';
  if (!(await chiffrementDisponible())) throw new Error('Le stockage chiffré du système est indisponible.');
  const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!stored.steamApiKey) return '';
  const encrypted = Buffer.from(stored.steamApiKey, 'base64');
  let key, rechiffrer = false;
  try {
    const r = await safeStorage.decryptStringAsync(encrypted);
    key = r.result; rechiffrer = !!r.shouldReEncrypt;
  } catch (e) {
    // Secours : clé écrite par une version précédente (méthode synchrone), tant qu'Electron la fournit encore.
    if (typeof safeStorage.decryptString !== 'function') throw e;
    key = safeStorage.decryptString(encrypted); rechiffrer = true;
  }
  if (rechiffrer && key) { try { await writeSteamApiKey(key); } catch {} }
  return key;
}
async function writeSteamApiKey(apiKey) {
  if (!(await chiffrementDisponible())) throw new Error('Le stockage chiffré du système est indisponible.');
  const file = integrationSecretsFile();
  const encrypted = (await safeStorage.encryptStringAsync(apiKey)).toString('base64');
  let stored = {};
  if (fs.existsSync(file)) stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  stored.steamApiKey = encrypted;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(stored, null, 2));
}
function clearSteamApiKey() {
  const file = integrationSecretsFile();
  if (!fs.existsSync(file)) return;
  const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete stored.steamApiKey;
  if (Object.keys(stored).length) fs.writeFileSync(file, JSON.stringify(stored, null, 2));
  else fs.unlinkSync(file);
}

function systemAccent() {
  try {
    if (!systemPreferences.getAccentColor) return null;
    const c = systemPreferences.getAccentColor();
    return /^[0-9a-f]{6}/i.test(c || '') ? '#' + c.slice(0, 6).toUpperCase() : null;
  } catch { return null; }
}

/* ---------- Plugin ---------- */
function bundledDll() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'plugin', installer.DLL_NAME)
    : path.join(__dirname, 'resources', 'plugin', installer.DLL_NAME);
}
function installPlugin() {
  if (process.platform !== 'win32') { pluginStatus = []; return pluginStatus; }
  pluginStatus = installer.install(bundledDll(), settings.customGamePaths);
  return pluginStatus;
}

/* ---------- Fenêtre ---------- */
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: windowBackground(settings),
    title: 'Truck & Coach Hub',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.on('closed', () => { win = null; app.quit(); });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'), { query: { v: app.getVersion() } });
  // Liens externes : toujours dans le navigateur, jamais dans l'appli
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  lockDown(win.webContents);
}

/* ---------- HUD : bandeau transparent par-dessus le jeu ----------
   Fenêtre sans cadre, toujours au premier plan et traversée par la souris.
   Visible seulement quand le jeu envoie des données (ou pendant un test).
   Le jeu doit être en mode fenêtré plein écran (sans bordures) : un plein écran exclusif passe au-dessus. */
let hudWin = null, hudTimer = null, hudTestUntil = 0;

// ---------- TCH Map (programme de carte séparé, sous GPL-3, dossier tch-map/) ----------
// L'appli ne contient aucun code de la carte : elle lance tch-map/server.js dans son propre processus et lui
// envoie de simples messages JSON (voir tch-map/PROTOCOLE.md). La page Carte affiche l'adresse locale qu'il renvoie.
const pickTheme = (t) => Object.fromEntries(['bg', 'land', 'border', 'text', 'muted', 'accent', 'trail'].filter(k => t && /^#[0-9a-f]{3,8}$/i.test(String(t[k] || ''))).map(k => [k, t[k]]));
const tchMap = {
  proc: null, url: null, waiting: null, timer: null, lastTrail: 0, game: null,
  start() {
    if (this.url) return Promise.resolve(this.url);
    if (this.waiting) return this.waiting;
    this.waiting = new Promise((resolve, reject) => {
      const dataDir = path.join(app.getPath('userData'), 'TCH Map');
      const p = utilityProcess.fork(path.join(__dirname, 'tch-map', 'server.js'), [dataDir], { serviceName: 'TCH Map', stdio: 'ignore' });
      this.proc = p;
      const fail = setTimeout(() => { reject(new Error('La carte ne répond pas.')); this.stop(); }, 15000);
      p.on('message', (m) => {
        if (!m || m.type !== 'ready') return;
        clearTimeout(fail);
        this.url = /^http:\/\/127\.0\.0\.1:\d+\/[0-9a-f]{48}\/$/.test(m.url) ? m.url : null;
        if (!this.url) { reject(new Error('Adresse de carte invalide.')); return this.stop(); }
        this.post({ type: 'cities', ...tchMapCities() });
        resolve(this.url);
      });
      p.on('exit', () => { this.proc = null; this.url = null; this.waiting = null; clearInterval(this.timer); this.timer = null; });
    });
    return this.waiting;
  },
  post(m) { try { if (this.proc) this.proc.postMessage(m); } catch {} },
  // Envoi en direct seulement quand la page Carte est affichée
  visible(on, opts) {
    clearInterval(this.timer); this.timer = null;
    if (!on || !this.proc) return;
    if (opts.game) { this.game = opts.game === 'ats' ? 'ats' : 'ets2'; this.post({ type: 'config', game: this.game }); this.lastTrail = 0; }
    if (typeof opts.follow === 'boolean') this.post({ type: 'config', follow: opts.follow });
    const tick = () => {
      const sn = telemetry.snapshot(), L = sn.live, game = (L && L.game === 'ats') ? 'ats' : (L && L.game ? 'ets2' : this.game || 'ets2');
      const j = sn.job || sn.busJob || null;
      this.post({ type: 'state', game, connected: !!sn.connected, paused: !!(L && L.paused), x: L ? L.x : null, z: L ? L.z : null, heading: L ? L.heading : 0, speed: L ? L.speed : 0, destId: j && (j.toId || null) });
      if (Date.now() - this.lastTrail > 5000) {
        this.lastTrail = Date.now();
        const h = telemetry.mapHistory();
        const pts = [];
        // null = coupure (nouveau trajet, téléportation) : la carte ne relie pas les deux bouts
        for (const jb of h.jobs || []) if ((jb.game || 'ets2') === game && Array.isArray(jb.path)) pts.push(null, ...jb.path);
        if ((h.game || 'ets2') === game && Array.isArray(h.trail)) pts.push(null, ...h.trail);
        this.post({ type: 'trail', game, points: pts.slice(-20000) });
      }
    };
    tick();
    this.timer = setInterval(tick, 250);
  },
  stop() { try { if (this.proc) this.proc.kill(); } catch {} this.proc = null; this.url = null; this.waiting = null; },
};
// ---------- Carte du jeu : extraction depuis les fichiers du jeu (programme séparé tch-map/extraction, GPL-3) ----------
// Lecture seule des .scs du jeu. Résultat dans userData/TCH Map/<jeu>/<date>/, désigné par userData/TCH Map/<jeu>/courant.txt
// (un nouveau dossier à chaque fois : la carte affichée garde ses fichiers ouverts pendant la mise à jour).
const CARTE_FORMAT = 3; // doit suivre FORMAT de tch-map/outils/extraction/tuiles.ts
const carteJeu = {
  proc: null, game: null, etat: null,
  dir(game) { return path.join(app.getPath('userData'), 'TCH Map', game); },
  jeu(game) { try { return installer.findGames(settings.customGamePaths).find(g => g.id === game) || null; } catch { return null; } },
  empreinte(dir) {
    try { return fs.readdirSync(dir).filter(f => f.endsWith('.scs')).map(f => { const st = fs.statSync(path.join(dir, f)); return [f, st.size, Math.round(st.mtimeMs)]; }); } catch { return null; }
  },
  info(game) {
    try {
      const cur = fs.readFileSync(path.join(this.dir(game), 'courant.txt'), 'utf8').trim();
      if (!/^[0-9a-z-]+$/i.test(cur)) return null;
      return JSON.parse(fs.readFileSync(path.join(this.dir(game), cur, 'info.json'), 'utf8'));
    } catch { return null; }
  },
  statut(game) {
    game = game === 'ats' ? 'ats' : 'ets2';
    if (this.proc && this.game === game) return { game, etat: 'en-cours', ...(this.etat || {}) };
    const g = this.jeu(game), info = this.info(game);
    if (!g) return { game, etat: info ? 'a-jour' : 'sans-jeu', version: info && info.version, date: info && info.date };
    if (!info) return { game, etat: 'a-faire' };
    if (info.format !== CARTE_FORMAT) return { game, etat: 'perimee', version: info.version, date: info.date }; // nouvelle version de la préparation
    const now = JSON.stringify(this.empreinte(g.dir)), avant = JSON.stringify(info.empreinte || null);
    return { game, etat: now === avant ? 'a-jour' : 'perimee', version: info.version, date: info.date, villes: info.villes };
  },
  envoyer(m) { try { if (win && !win.isDestroyed()) win.webContents.send('tchmap:progression', m); } catch {} },
  lancer(game, opts = {}) {
    game = game === 'ats' ? 'ats' : 'ets2';
    if (this.proc) return { ok: false, error: 'Une préparation de carte est déjà en cours.' };
    const g = this.jeu(game);
    if (!g) return { ok: false, error: 'Jeu introuvable : indique son dossier dans Paramètres → Jeu.' };
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const out = path.join(this.dir(game), stamp);
    fs.mkdirSync(out, { recursive: true });
    const ext = path.join(__dirname, 'tch-map', 'extraction').replace('app.asar', 'app.asar.unpacked');
    // Pendant une partie, la préparation se fait discrète : moitié moins de cœurs (et toujours en priorité basse)
    const coeurs = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length;
    const enJeu = !!(telemetry && telemetry.snapshot().connected);
    const fond = path.join(__dirname, 'tch-map', 'viewer', 'fond', game === 'ats' ? 'terres.geojson' : 'terres-ets2.geojson').replace('app.asar', 'app.asar.unpacked');
    const env = { ...process.env, TCH_LANGUE: 'fr_fr', TCH_RESSOURCES: ext, TCH_FOND: fond };
    if (enJeu) env.TCH_OUVRIERS = String(Math.max(1, Math.min(4, Math.floor((coeurs - 2) / 2))));
    if (opts.simple) env.TCH_OUVRIERS = '0'; // secours : tout sur un seul fil
    // Journal de la préparation (dernière tentative), pour comprendre un échec
    const journal = path.join(this.dir(game), 'journal.txt');
    const ecrire = (t) => { try { fs.appendFileSync(journal, t); } catch {} };
    try { fs.writeFileSync(journal, `${new Date().toISOString()} — ${g.dir} — ${coeurs} cœurs, ${Math.round(os.freemem() / 2 ** 20)} Mo libres${enJeu ? ', jeu en cours' : ''}${opts.simple ? ', mode simple' : ''}\n`); } catch {}
    const p = utilityProcess.fork(path.join(ext, 'extraire.cjs'), [g.dir, out], {
      serviceName: 'TCH Map — préparation de la carte', stdio: 'pipe', execArgv: ['--max-old-space-size=4096'], env,
    });
    this.proc = p; this.game = game; this.lanceAuto = !!opts.auto; this.etat = { etape: 'lecture', s: 0, auto: this.lanceAuto };
    let buf = '', fini = false, erreur = null, bloque = false;
    // Sécurité : si plus rien n'avance pendant 3 minutes, on arrête et on recommence en mode simple
    let vu = Date.now();
    const garde = setInterval(() => { if (Date.now() - vu > 180000) { bloque = true; ecrire('Bloquée depuis 3 minutes : arrêt.\n'); try { p.kill(); } catch {} } }, 10000);
    p.stdout.on('data', (d) => {
      vu = Date.now();
      ecrire(d.toString());
      buf += d.toString();
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const l = buf.slice(0, i); buf = buf.slice(i + 1);
        if (!l.startsWith('@TCH ')) continue;
        try {
          const m = JSON.parse(l.slice(5));
          this.etat = { etape: m.etape, s: m.s, mo: m.mo, fait: m.fait, total: m.total, auto: this.lanceAuto, version: m.version || (this.etat && this.etat.version) };
          if (m.etape === 'fini') fini = true;
          if (m.etape === 'erreur') erreur = m.message;
          this.envoyer({ game, ...this.etat });
        } catch {}
      }
    });
    p.stderr && p.stderr.on('data', (d) => { vu = Date.now(); ecrire(d.toString()); });
    p.on('exit', (code) => {
      clearInterval(garde);
      ecrire(`Fin (code ${code})\n`);
      this.proc = null; this.etat = null;
      if (fini && code === 0) {
        fs.writeFileSync(path.join(this.dir(game), 'courant.txt'), stamp);
        this.nettoyer(game, stamp);
        tchMap.post({ type: 'donnees', game, rev: stamp });
        this.envoyer({ game, etape: 'fini', ...this.statut(game) });
        setTimeout(() => this.auto(), 5000); // l'autre jeu ensuite, s'il en a besoin
      } else {
        try { fs.rmSync(out, { recursive: true, force: true }); } catch {}
        // Échec avec plusieurs cœurs (bloquée, ouvrier arrêté…) : on réessaie une fois, tout seul, en mode simple
        if (!opts.simple && !this.annule && (bloque || /ouvrier|worker/i.test(erreur || '') || !erreur)) {
          this.envoyer({ game, etape: 'lecture', s: 0, message: 'Nouvel essai en mode simple…' });
          setTimeout(() => this.lancer(game, { ...opts, simple: true }), 1000);
          return;
        }
        this.envoyer({ game, etape: 'erreur', message: (erreur || `La préparation s'est arrêtée (code ${code}).`) + ` Détails : ${journal}` });
      }
      this.annule = false;
    });
    return { ok: true };
  },
  annuler() { this.annule = !!this.proc; try { if (this.proc) this.proc.kill(); } catch {} },
  // Comme les logiciels qui se mettent à jour en arrière-plan : au lancement, la carte du jeu se prépare toute seule
  // si elle n'existe pas encore ou si le jeu / les DLC ont changé (une fois par mise à jour du jeu).
  auto() {
    if (settings.carteAuto === false || this.proc) return;
    const jeux = [settings.activeGame === 'ats' ? 'ats' : 'ets2', settings.activeGame === 'ats' ? 'ets2' : 'ats'];
    for (const g of jeux) {
      const st = this.statut(g);
      if (st.etat === 'a-faire' || st.etat === 'perimee') { this.lancer(g, { auto: true }); return; }
    }
  },
  // Anciennes cartes : supprimées quand elles ne sont plus utilisées (au pire au prochain lancement)
  nettoyer(game, garder) {
    try { for (const d of fs.readdirSync(this.dir(game))) if (d !== garder && d !== 'courant.txt' && d !== 'journal.txt') fs.rmSync(path.join(this.dir(game), d), { recursive: true, force: true }); } catch {}
  },
};
// ---------- Mods & sauvegarde : analyse par le programme séparé tch-mods/ (GPL-3) ----------
// L'appli lui prépare une demande (dossiers, mods actifs de chaque profil, sauvegarde récente déchiffrée en texte)
// et affiche son rapport. Lecture seule : rien n'est modifié dans les mods, les profils ni le jeu.
const modsAnalyse = {
  proc: null,
  async lancer(game) {
    game = game === 'ats' ? 'ats' : 'ets2';
    if (this.proc) throw new Error('Une analyse est déjà en cours.');
    const envoyer = (m) => { try { if (win && !win.isDestroyed()) win.webContents.send('mods:progression', { game, ...m }); } catch {} };
    const g = (() => { try { return installer.findGames(settings.customGamePaths).find(x => x.id === game) || null; } catch { return null; } })();
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tch-mods-'));
    try {
      envoyer({ etape: 'profils' });
      const profils = [];
      const liste = atelier.profiles().filter(p => p.game === game);
      for (const [i, p] of liste.entries()) {
        const dir = atelier.resolve(p.id).dir;
        let actifs = [];
        try {
          const t = await atelier.editor.readAsync(path.join(dir, 'profile.sii'));
          actifs = [...t.matchAll(/^\s*active_mods\[\d+\]:\s*"([^"|]*)\|?[^"]*"/gm)].map(m => m[1]);
        } catch {}
        const pr = { id: p.id, nom: p.name, actifs };
        // Sauvegarde la plus récente des 3 profils les plus récents (les plus longues à lire)
        if (i < 3) {
          const slot = atelier.editor.slots(dir)[0];
          if (slot) {
            try {
              const txt = await atelier.editor.readAsync(path.join(dir, 'save', slot.slot, 'game.sii'));
              const f = path.join(tmp, `sauvegarde-${i}.sii`);
              fs.writeFileSync(f, txt);
              pr.sauvegarde = f; pr.sauvegardeNom = slot.label;
            } catch {}
          }
        }
        profils.push(pr);
      }
      const dem = {
        jeu: game, documents: atelier.gameDir(game), jeuDossier: g ? g.dir : null,
        workshop: g ? path.join(g.dir, '..', '..', 'workshop', 'content', game === 'ats' ? '270880' : '227300') : null,
        profils,
      };
      const fDem = path.join(tmp, 'demande.json');
      fs.writeFileSync(fDem, JSON.stringify(dem));
      return await new Promise((resolve, reject) => {
        const p = utilityProcess.fork(path.join(__dirname, 'tch-mods', 'analyse.js'), [fDem], { serviceName: 'TCH Mods — analyse', stdio: 'pipe' });
        this.proc = p;
        let buf = '', rapport = null, erreur = null;
        p.stdout.on('data', (d) => {
          buf += d.toString();
          let i;
          while ((i = buf.indexOf('\n')) >= 0) {
            const l = buf.slice(0, i); buf = buf.slice(i + 1);
            if (!l.startsWith('@TCH ')) continue;
            try { const m = JSON.parse(l.slice(5)); if (m.etape === 'fini') rapport = m.rapport; else if (m.etape === 'erreur') erreur = m.message; else envoyer({ etape: m.etape }); } catch {}
          }
        });
        p.stderr && p.stderr.on('data', () => {});
        p.on('exit', () => { this.proc = null; if (rapport) resolve(rapport); else reject(new Error(erreur || 'L’analyse s’est arrêtée.')); });
      });
    } finally {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    }
  },
};
// Villes du jeu (app/data/villes.js, licence MIT) envoyées une fois à la carte
function tchMapCities() {
  try { const s = fs.readFileSync(path.join(__dirname, 'app', 'data', 'villes.js'), 'utf8'); return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1)); } catch { return { ets2: [], ats: [] }; }
}
// Sécurité : une fenêtre de l'appli n'affiche que les pages de l'appli. Toute tentative d'ouvrir une autre
// adresse dans la fenêtre (lien piégé, contenu injecté) est bloquée ; les liens https partent dans le navigateur.
function lockDown(wc){
  wc.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); } });
  wc.on('will-redirect', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
  wc.on('will-attach-webview', (e) => e.preventDefault());
}
const HUD_W = 1440, HUD_H = 440; // assez large pour le Bandeau en taille « Grand » (fenêtre transparente, traversée par la souris)
function activeHudOptions(live = telemetry && telemetry.live, vehicleType = telemetry ? telemetry.vehicleType(live) : settings.vehicleType) {
  const profile = vehicleType === 'car' ? 'bus' : 'truck';
  return settings.hud && settings.hud[profile] || DEFAULTS.hud[profile];
}
function hudBounds() {
  const wa = screen.getPrimaryDisplay().bounds;
  const width = Math.min(HUD_W, wa.width), height = Math.min(HUD_H, wa.height);
  const bas = activeHudOptions().position === 'bas';
  return { x: Math.round(wa.x + (wa.width - width) / 2), y: bas ? wa.y + Math.max(0, wa.height - height - 24) : wa.y + 4, width, height };
}
function hudData() {
  const sn = telemetry.snapshot();
  const test = Date.now() < hudTestUntil;
  if (test && !sn.connected) {
    const t = Date.now() / 1000;
    sn.live = { speed: (88 + Math.sin(t) * 8) / 3.6, speedLimit: 90 / 3.6, odometer: 154320.5, navDistance: 214000, navTime: 10800, localScale: 19, gameTime: 1400, job: { 'delivery.time': 1460 } };
    sn.job = { from: 'Paris', to: 'Lyon', cargo: 'Électronique', mass: 18000, loaded: 38.4, mode: 'réel', overPct: 1.2 };
    sn.truckPreview = true; // exemple du bandeau camion pendant le test
  }
  // Affiché seulement quand on joue vraiment : jeu au premier plan (pas d'Alt+Tab, pas le bureau),
  // pas en pause (menu Échap), et données fraîches (le jeu n'envoie plus rien quand il est réduit).
  const L = sn.live || {};
  const fresh = Date.now() - telemetry.lastPacket < 700;
  const playing = sn.connected && fresh && !L.paused && L.focused !== false;
  return { ...sn, jobs: undefined, options: activeHudOptions(sn.live, sn.vehicleType), units: settings.units === 'imperial' ? 'imperial' : 'metric', game: settings.activeGame, show: playing || test };
}
function syncHud() {
  const on = !!(settings.modules && settings.modules.hud) || Date.now() < hudTestUntil;
  if (!on) { clearInterval(hudTimer); hudTimer = null; if (hudWin) { hudWin.destroy(); hudWin = null; } return; }
  if (!hudWin) {
    hudWin = new BrowserWindow({ ...hudBounds(), frame: false, transparent: true, resizable: false, movable: false, focusable: false,
      skipTaskbar: true, hasShadow: false, alwaysOnTop: true, show: false, backgroundColor: '#00000000',
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, 'preload.js') } });
    hudWin.setAlwaysOnTop(true, 'screen-saver');
    hudWin.setIgnoreMouseEvents(true);
    lockDown(hudWin.webContents);
    hudWin.loadFile(path.join(__dirname, 'app', 'hud.html'));
    hudWin.on('closed', () => { hudWin = null; });
  } else hudWin.setBounds(hudBounds());
  if (!hudTimer) hudTimer = setInterval(() => {
    if (!hudWin) return;
    if (!(settings.modules && settings.modules.hud) && Date.now() >= hudTestUntil) { syncHud(); return; }
    const d = hudData();
    if (d.show) { if (!hudWin.isVisible()) hudWin.showInactive(); hudWin.webContents.send('hud', d); }
    else if (hudWin.isVisible()) hudWin.hide();
  }, 200);
}

/* ---------- Échanges avec l'interface ---------- */
function setupIpc() {
  ipcMain.handle('game:content', () => {
    if (!contentPending) contentPending = gameContent.scan(app.getPath('documents'), settings.customGamePaths).finally(() => { contentPending = null; });
    return contentPending;
  });
  ipcMain.handle('telemetry:capabilities', () => {
    const sn = telemetry.snapshot(), l = sn.live;
    const truck = l && l.truck || null;
    return { connected: sn.connected, plugin: l && l.plugin, localScale: !!(l && l.localScale > 0), busJob: !!(l && l.busJob), busFields: l && l.busJob ? Object.keys(l.busJob) : [], busFieldsDocumented: false,
      // Diagnostic car : ce que le jeu envoie vraiment (le SDK ne documente pas encore bus_job).
      vehicleType: sn.vehicleType, coachVehicle: telemetry.isCoach(l), vehicleId: truck && truck.id || null,
      vehicleName: truck ? `${truck.brand || ''} ${truck.name || ''}`.trim() : '',
      busJobFields: coach.fieldList(l && l.busJob), truckFields: coach.fieldList(truck),
      otherConfigs: Object.keys(telemetry.configs || {}), mandatoryBreak: !!(l && 'mandatoryBreak' in l), coach: sn.coach };
  });
  ipcMain.handle('snapshot', () => telemetry.snapshot());
  ipcMain.handle('hud:test', () => { hudTestUntil = Date.now() + 10000; syncHud(); return true; });
  ipcMain.handle('plugin:status', () => pluginStatus);
  ipcMain.handle('plugin:install', () => installPlugin());
  ipcMain.handle('plugin:choose', async () => {
    const r = await dialog.showOpenDialog(win, {
      title: 'Choisis le dossier du jeu (Euro Truck Simulator 2 ou American Truck Simulator)',
      properties: ['openDirectory']
    });
    if (r.canceled || !r.filePaths[0]) return { ok: false, status: pluginStatus };
    const dir = r.filePaths[0];
    if (!installer.gameBinDir(dir)) return { ok: false, error: 'Ce dossier ne contient pas le jeu.', status: pluginStatus };
    if (!settings.customGamePaths.includes(dir)) settings.customGamePaths.push(dir);
    saveSettings();
    return { ok: true, status: installPlugin() };
  });
  ipcMain.handle('settings:get', () => settings);
  // Réglages par jeu (bêta) : charger ceux d'ETS2 ou d'ATS, copier d'un jeu à l'autre
  ipcMain.handle('settings:game', (_e, game) => { if (gameSettings.switchGame(settings, game)) { saveSettings(); syncHud(); } return settings; });
  ipcMain.handle('settings:gameKey', (_e, game, key, value) => { if (gameSettings.setGameKey(settings, game, key, value)) { saveSettings(); syncHud(); } return settings; });
  ipcMain.handle('settings:copyGame', (_e, from, to) => { if (gameSettings.copyGameSettings(settings, from, to)) { saveSettings(); syncHud(); } return settings; });
  // Accès, rangs et clés d'activation (préparation) : aperçu local tant que le serveur n'existe pas
  let accesP = null;
  const ap = () => accesP || (accesP = acces.createProvider({ dir: app.getPath('userData'), serverUrl: null, getSteamId: () => settings.steamId }));
  const wrap = (fn) => async (_e, ...a) => { try { return { ok: true, value: await fn(...a) }; } catch (e) { return { ok: false, error: e.message }; } };
  ipcMain.handle('acces:info', () => ({ permissions: rangs.PERMISSIONS }));
  ipcMain.handle('acces:session', wrap(() => ap().session()));
  ipcMain.handle('acces:ranks', wrap(() => ap().ranks()));
  ipcMain.handle('acces:saveRank', wrap((r) => ap().saveRank(r)));
  ipcMain.handle('acces:deleteRank', wrap((id) => ap().deleteRank(id)));
  ipcMain.handle('acces:keys', wrap(() => ap().keys()));
  ipcMain.handle('acces:createKeys', wrap((n, g) => ap().createKeys(n, g)));
  ipcMain.handle('acces:revokeKey', wrap((k) => ap().revokeKey(k)));
  ipcMain.handle('acces:redeem', wrap((k) => ap().redeemKey(k)));
  ipcMain.handle('acces:previewAs', wrap((id) => ap().previewAs(id)));
  ipcMain.handle('acces:reset', wrap(() => ap().resetPreview()));
  ipcMain.handle('acces:vtc', wrap(() => accesVtc.truckersmpVtc(settings.steamId)));
  // Page News : annonces officielles Steam d'ETS2 et d'ATS
  ipcMain.handle('news:steam', async (_e, game) => {
    try { return { ok: true, items: await steamNews(game) }; } catch (e) { return { ok: false, error: e.message }; }
  });
  ipcMain.handle('integration:status', () => ({
    steamKeyConfigured: fs.existsSync(integrationSecretsFile()) && !!JSON.parse(fs.readFileSync(integrationSecretsFile(), 'utf8')).steamApiKey,
    discordClientId: settings.discordClientId || ''
  }));
  ipcMain.handle('steam:key:set', async (_e, key) => {
    if (!steam.validApiKey(key)) throw new Error('La clé Steam Web API doit contenir 32 caractères hexadécimaux.');
    await writeSteamApiKey(key);
    return { configured: true };
  });
  ipcMain.handle('steam:key:clear', () => { clearSteamApiKey(); return { configured: false }; });
  ipcMain.handle('steam:profile', async () => {
    const key = await readSteamApiKey();
    if (!key) throw new Error('Enregistre une clé Steam Web API dans les options.');
    return steam.getProfile(key, settings.steamId);
  });
  ipcMain.handle('discord:test', (_e, clientId) => discordPresence.test(clientId));
  // Couleur d'accent choisie dans Windows (Paramètres → Personnalisation → Couleurs), au format #RRGGBB
  ipcMain.handle('system:accent', () => systemAccent());
  // ----- Carte
  const mapCache = () => path.join(app.getPath('userData'), 'Carte (cache)');
  ipcMain.handle('map:info', () => carte.info());
  ipcMain.handle('map:selectTileset', async (_e, game) => {
    if (!['ets2', 'ats'].includes(game)) throw new Error('Jeu de carte inconnu.');
    const r = await dialog.showOpenDialog(win, {
      title: 'Choisis le dossier exporté par TsMap (TileMapInfo.json et Tiles)',
      properties: ['openDirectory']
    });
    if (r.canceled || !r.filePaths[0]) return { canceled: true };
    const previousPath = settings.mapTilesets[game];
    const mapInfo = carte.setTileset(game, r.filePaths[0]);
    settings.mapTilesets[game] = r.filePaths[0];
    try { saveSettings(); }
    catch (e) {
      if (previousPath) {
        settings.mapTilesets[game] = previousPath;
        try { carte.setTileset(game, previousPath); }
        catch (restoreError) { console.error(`Restauration carte ${game} :`, restoreError.message); }
      } else {
        delete settings.mapTilesets[game];
        carte.setTileset(game, null);
      }
      throw e;
    }
    return { canceled: false, info: carte.info(), selected: mapInfo };
  });
  ipcMain.handle('map:useLegacy', (_e, game) => {
    if (!['ets2', 'ats'].includes(game)) throw new Error('Jeu de carte inconnu.');
    const previousPath = settings.mapTilesets[game];
    carte.setTileset(game, null);
    delete settings.mapTilesets[game];
    try { saveSettings(); }
    catch (e) {
      if (previousPath) {
        settings.mapTilesets[game] = previousPath;
        try { carte.setTileset(game, previousPath); }
        catch (restoreError) { console.error(`Restauration carte ${game} :`, restoreError.message); }
      }
      throw e;
    }
    return carte.info();
  });
  ipcMain.handle('map:history', () => telemetry.mapHistory());
  // Nouvelle carte : TCH Map, programme séparé (GPL-3) lancé en arrière-plan, affiché dans la page Carte
  ipcMain.handle('tchmap:start', async () => { try { return { ok: true, url: await tchMap.start() }; } catch (e) { return { ok: false, error: e.message }; } });
  ipcMain.handle('tchmap:visible', (_e, on, opts) => { tchMap.visible(!!on, opts || {}); return true; });
  ipcMain.handle('tchmap:theme', (_e, t) => { tchMap.post({ type: 'theme', ...pickTheme(t) }); return true; });
  ipcMain.handle('tchmap:jeuStatut', (_e, game) => carteJeu.statut(game));
  ipcMain.handle('tchmap:preparer', (_e, game) => carteJeu.lancer(game));
  ipcMain.handle('tchmap:annuler', () => { carteJeu.annuler(); return true; });
  ipcMain.handle('map:cache', () => carte.cacheSize(mapCache()));
  ipcMain.handle('map:clearCache', () => carte.clearCache(mapCache()));
  // ----- Atelier (outils avancés) : chaque appel renvoie { ok, data | error }
  const safe = (fn) => async (_e, ...a) => { try { return { ok: true, data: await fn(...a) }; } catch (e) { return { ok: false, error: e.message }; } };
  ipcMain.handle('mods:analyser', safe((game) => modsAnalyse.lancer(game)));
  ipcMain.handle('mods:ouvrir', (_e, quoi) => {
    // Dossier des mods, ou page Workshop d'un mod (seulement des identifiants numériques)
    if (quoi && /^\d{1,20}$/.test(String(quoi.workshopId || ''))) return shell.openExternal(`https://steamcommunity.com/sharedfiles/filedetails/?id=${quoi.workshopId}`);
    const game = quoi && quoi.game === 'ats' ? 'ats' : 'ets2';
    const dir = path.join(atelier.gameDir(game), 'mod');
    const nom = quoi && typeof quoi.fichier === 'string' ? path.basename(quoi.fichier) : '';
    if (nom && fs.existsSync(path.join(dir, nom))) return shell.showItemInFolder(path.join(dir, nom));
    return shell.openPath(dir);
  });
  ipcMain.handle('atelier:status', safe(() => atelier.status()));
  ipcMain.handle('atelier:profiles', safe(() => atelier.profiles()));
  ipcMain.handle('atelier:duplicate', safe((id, name) => atelier.duplicate(id, name)));
  ipcMain.handle('atelier:analyze', safe((id) => atelier.analyze(id)));
  ipcMain.handle('atelier:backup', safe((id) => atelier.backup(id)));
  ipcMain.handle('atelier:restore', safe((id, name) => atelier.restore(id, name)));
  ipcMain.handle('atelier:deleteBackup', safe((id, name) => atelier.deleteBackup(id, name)));
  ipcMain.handle('atelier:deleteProfile', safe((id) => atelier.deleteProfile(id)));
  ipcMain.handle('atelier:deletedProfiles', safe(() => atelier.deletedProfiles()));
  ipcMain.handle('atelier:purgeDeleted', safe((id) => atelier.purgeDeleted(id)));
  ipcMain.handle('atelier:openBackups', safe(async () => { fs.mkdirSync(atelier.backups, { recursive: true }); await shell.openPath(atelier.backups); return true; }));
  ipcMain.handle('atelier:console', safe((game) => atelier.consoleState(game)));
  ipcMain.handle('atelier:editorInfo', safe(() => atelier.editorInfo()));
  ipcMain.handle('atelier:slots', safe((id) => atelier.saveSlots(id)));
  ipcMain.handle('atelier:summary', safe((id, slot) => atelier.saveSummary(id, slot)));
  ipcMain.handle('atelier:apply', safe((id, slot, edits) => atelier.saveApply(id, slot, edits)));
  ipcMain.handle('atelier:cams', safe((game) => atelier.cams(game)));
  ipcMain.handle('atelier:copyConfig', safe((from, to, files) => atelier.copyConfig(from, to, files)));
  ipcMain.handle('atelier:convoy', safe((game) => atelier.convoyState(game)));
  ipcMain.handle('atelier:setConvoy', safe((game, big) => atelier.setConvoy(game, !!big)));
  ipcMain.handle('atelier:setConsole', safe((game, on) => atelier.setConsole(game, !!on)));
  ipcMain.handle('update:status', () => ({ ...updateState, current: app.getVersion() }));
  ipcMain.handle('update:check', async () => {
    if (!app.isPackaged) return { ...updateState, current: app.getVersion() };
    if (['downloading', 'ready'].includes(updateState.state)) return { ...updateState, current: app.getVersion() };
    try { updateState = { state: 'checking', version: null }; await autoUpdater.checkForUpdates(); }
    catch (e) { updateState = { state: 'error', version: null }; }
    return { ...updateState, current: app.getVersion() };
  });
  ipcMain.handle('update:download', async () => {
    if (!app.isPackaged) return false;
    if (updateState.state === 'available' || updateState.state === 'failed') {
      updateState = { ...updateState, state: 'downloading', progress: 0 };
      autoUpdater.downloadUpdate().catch(() => { updateState = { ...updateState, state: 'failed' }; });
      return true;
    }
    return false;
  });
  ipcMain.handle('update:install', () => {
    if (updateState.state !== 'ready') return false;
    if (telemetry) telemetry.stop();
    // Installation silencieuse puis redémarrage automatique de l'application.
    setTimeout(() => autoUpdater.quitAndInstall(true, true), 1200);
    return true;
  });
  ipcMain.handle('game:launch', async (_e, game) => {
    const id = STEAM_IDS[game];
    if (!id) return { ok: false, error: 'Jeu inconnu.' };
    const status = installPlugin();
    try { await shell.openExternal(`steam://rungameid/${id}`); return { ok: true, status }; }
    catch (e) { return { ok: false, error: 'Steam ne s\'est pas ouvert. Vérifie que Steam est installé.', status }; }
  });
  ipcMain.handle('link:open', async (_e, key) => {
    if (LINKS[key]) { await shell.openExternal(LINKS[key]); return true; }
    if (key === 'mods') {
      const dir = path.join(app.getPath('documents'), 'Euro Truck Simulator 2', 'mod');
      if (!fs.existsSync(dir)) return false;
      await shell.openPath(dir); return true;
    }
    return false;
  });
  ipcMain.handle('settings:set', async (_e, patch) => {
    const allowed = ['vehicleType', 'limitTruck', 'limitCar', 'racePct', 'pseudo', 'look', 'atelier', 'hud', 'showSoon', 'autoTelemetry', 'steamId', 'discordClientId'];
    patch = validateSettingsPatch(patch);   // S9 : chaque clé vérifiée (type, valeurs, longueur), copie nettoyée
    if ('steamId' in patch && patch.steamId && !steam.validSteamId(patch.steamId)) throw new Error('Saisis un SteamID64 valide (17 chiffres).');
    if ('discordClientId' in patch && patch.discordClientId && !/^\d{17,20}$/.test(String(patch.discordClientId))) throw new Error('Saisis un ID d’application Discord valide (17 à 20 chiffres).');
    for (const k of allowed) if (k in patch && k !== 'hud') settings[k] = patch[k];
    if (patch.look) settings.look = sanitizeLook({ ...settings.look, ...patch.look });
    if (patch.modules) settings.modules = { ...DEFAULTS.modules, ...settings.modules, ...patch.modules };
    if (patch.hud) settings.hud = mergeHudSettings(DEFAULTS.hud, settings.hud, patch.hud);
    if ('units' in patch) settings.units = patch.units === 'imperial' ? 'imperial' : 'metric';
    gameSettings.rememberActive(settings);
    saveSettings();
    if (patch.modules || patch.hud) syncHud();
    if ('discordClientId' in patch && discordPresence) await discordPresence.setClientId(settings.discordClientId);
    return settings;
  });
}

/* ---------- Mises à jour (GitHub Releases), entièrement dans l'appli ---------- */
// Vérification automatique ; le téléchargement se lance avec le bouton « Mettre à jour » ;
// l'installation est silencieuse (pas d'assistant Windows), puis l'appli redémarre.
function setupUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = false;
  // La bêta suit les pré-versions « beta » ; la version normale ne voit que les versions publiées
  if (IS_BETA) { autoUpdater.allowPrerelease = true; autoUpdater.channel = 'beta'; }
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on('checking-for-update', () => { if (!['downloading', 'ready'].includes(updateState.state)) updateState = { state: 'checking', version: null }; });
  autoUpdater.on('update-not-available', () => { updateState = { state: 'none', version: null }; });
  autoUpdater.on('update-available', (info) => { if (updateState.state !== 'downloading' && updateState.state !== 'ready') updateState = { state: 'available', version: info.version, notes: info.releaseName || '' }; });
  autoUpdater.on('download-progress', (p) => { updateState = { ...updateState, state: 'downloading', progress: Math.round(p.percent || 0) }; });
  autoUpdater.on('update-downloaded', (info) => { updateState = { state: 'ready', version: info.version, progress: 100 }; });
  autoUpdater.on('error', (err) => {
    updateState = { state: updateState.state === 'downloading' ? 'failed' : 'error', version: updateState.version };
    console.error('Mise à jour :', err && err.message);
  });
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => { if (!['downloading', 'ready'].includes(updateState.state)) autoUpdater.checkForUpdates().catch(() => {}); }, 30 * 60 * 1000);
}

/* ---------- Démarrage ---------- */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

  app.whenReady().then(() => {
    // Sécurité : aucune permission web (caméra, micro, géolocalisation, notifications web…) n'est jamais accordée.
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    loadSettings();
    telemetry = new Telemetry(app.getPath('userData'), () => settings);
    discordPresence = new DiscordPresence();
    discordPresence.setClientId(settings.discordClientId).catch((e) => console.error('Discord Rich Presence :', e.message));
    const decryptExe = (!app.isPackaged && process.env.TCH_DECRYPT) || (app.isPackaged
      ? path.join(process.resourcesPath, 'tools', 'decrypt_truck.exe')
      : path.join(__dirname, 'resources', 'tools', process.platform === 'win32' ? 'decrypt_truck.exe' : 'decrypt_truck'));
    atelier = new Atelier(app.getPath('documents'), path.join(app.getPath('userData'), 'Sauvegardes de profils'), decryptExe);
    // Car vu en service mais pas reconnu par son nom : on le mémorise pour les prochaines fois.
    telemetry.on('notCoachVehicle', (id) => {
      if (!(settings.coachVehicles || []).includes(id)) return;
      settings.coachVehicles = settings.coachVehicles.filter(v => v !== id);
      try { saveSettings(); } catch (e) { console.error('Réglages :', e.message); }
    });
    telemetry.on('coachVehicle', (id) => {
      if ((settings.coachVehicles || []).includes(id)) return;
      settings.coachVehicles = [...(settings.coachVehicles || []), id].slice(-40);
      try { saveSettings(); } catch (e) { console.error('Réglages :', e.message); }
    });
    telemetry.start();
    setTimeout(() => { try { carteJeu.auto(); } catch (e) { console.error('Carte du jeu :', e.message); } }, 20000);
    // Le jeu lancé décide des réglages de jeu chargés (ETS2 ou ATS)
    setInterval(() => {
      const L = telemetry.live; if (!L || !L.game || Date.now() - telemetry.lastPacket > 3000) return;
      if (gameSettings.switchGame(settings, L.game === 'ats' ? 'ats' : 'ets2')) {
        try { saveSettings(); } catch (e) { console.error('Réglages :', e.message); }
        syncHud(); if (win) win.webContents.send('settings:changed', settings);
      }
    }, 2000);
    setInterval(() => {
      if (discordPresence && telemetry) discordPresence.update(telemetry.snapshot()).catch((e) => console.error('Discord Rich Presence :', e.message));
    }, 10000);
    carte.setup(path.join(app.getPath('userData'), 'Carte (cache)'));
    installPlugin();
    setupIpc();
    createWindow();
    if (reglagesRecuperes && win) {
      const msg = reglagesRecuperes.etat === 'restaure'
        ? 'Le fichier de tes réglages était abîmé (coupure de courant, disque plein…). La copie de secours la plus récente a été reprise.'
        : 'Le fichier de tes réglages était abîmé (coupure de courant, disque plein…). L’appli repart avec les réglages par défaut.';
      dialog.showMessageBox(win, { type: 'warning', title: 'Réglages récupérés', message: msg,
        detail: 'Le fichier abîmé n’a pas été effacé : il est gardé à côté sous le nom ' + path.basename(reglagesRecuperes.fichierAbime) + '.' }).catch(() => {});
    }
    if (process.platform === 'win32') systemPreferences.on('accent-color-changed', () => { if (win) win.webContents.send('system:accent', systemAccent()); });
    setupUpdates();
    syncHud();
  });

  app.on('before-quit', () => {
    if (telemetry) telemetry.stop();
    tchMap.stop();
    carteJeu.annuler();
    if (discordPresence) discordPresence.disconnect().catch((e) => console.error('Discord Rich Presence :', e.message));
  });
  app.on('window-all-closed', () => app.quit());
}
