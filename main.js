const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme, screen, systemPreferences, safeStorage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { Telemetry } = require('./src/telemetry');
const { mergeSavedSettings, validateSettingsPatch } = require('./src/settings');
const installer = require('./src/plugin-installer');
const { Atelier } = require('./src/atelier');
const carte = require('./src/map');
const gameContent = require('./src/game-content');
const steam = require('./src/steam');
const { DiscordPresence } = require('./src/discord-presence');
let contentPending = null;
let atelier;
let discordPresence;
carte.registerScheme();

/* ---------- Dossier de données : garde l'historique malgré le changement de nom ---------- */
(function pinUserData() {
  const appData = app.getPath('appData');
  const dir = path.join(appData, 'Truck and Coach Hub');
  try {
    fs.mkdirSync(dir, { recursive: true });
    for (const old of ['Telemetrie Entreprise', 'telemetrie-entreprise']) {
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
const DEFAULTS = { atelier: false, showSoon: false, look: { theme: 'base', accent: 'defaut', vision: 'normale', zoom: '100', contrast: false, motion: false }, vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5, customGamePaths: [], mapTilesets: {}, pseudo: '', steamId: '', discordClientId: '', modules: { hud: false }, hud: { style: 'navigation', position: 'haut', logo: true, opacity: 82 }, addons: { tablette: false, gps: false } };
const settingsFile = () => path.join(app.getPath('userData'), 'reglages.json');
let settings = { ...DEFAULTS };
function sanitizeLook(l) {
  const pick = (v, list, d) => list.includes(String(v)) ? String(v) : d;
  const accent = /^#[0-9a-f]{6}$/i.test(String(l.accent)) ? String(l.accent).toUpperCase() : pick(l.accent, ['defaut', 'windows'], 'defaut');
  return { theme: pick(l.theme, ['base', 'sombre', 'clair', 'systeme'], 'base'), accent, vision: pick(l.vision, ['normale', 'rg', 'by'], 'normale'),
    zoom: pick(l.zoom, ['100', '115', '130'], '100'), contrast: !!l.contrast, motion: !!l.motion };
}
function windowBackground(st) {
  const t = st.look && st.look.theme === 'systeme' ? (nativeTheme.shouldUseDarkColors ? 'sombre' : 'clair') : (st.look && st.look.theme) || 'base';
  return { base: '#0F1720', sombre: '#202020', clair: '#F3F3F3' }[t] || '#0F1720';
}
function loadSettings() {
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    if (error instanceof SyntaxError) console.error('Réglages illisibles :', error.message);
  }
  settings = mergeSavedSettings(DEFAULTS, saved);
  if (!settings.mapTilesets || typeof settings.mapTilesets !== 'object' || Array.isArray(settings.mapTilesets)) settings.mapTilesets = {};
  else settings.mapTilesets = Object.fromEntries(Object.entries(settings.mapTilesets).filter(([game, dir]) =>
    ['ets2', 'ats'].includes(game) && typeof dir === 'string'));
  carte.loadTilesets(settings.mapTilesets);
}
function saveSettings() {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
}
function integrationSecretsFile() {
  return path.join(app.getPath('userData'), 'integrations.json');
}
function readSteamApiKey() {
  const file = integrationSecretsFile();
  if (!fs.existsSync(file)) return '';
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Le stockage chiffré du système est indisponible.');
  const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!stored.steamApiKey) return '';
  return safeStorage.decryptString(Buffer.from(stored.steamApiKey, 'base64'));
}
function writeSteamApiKey(apiKey) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Le stockage chiffré du système est indisponible.');
  const file = integrationSecretsFile();
  let stored = {};
  if (fs.existsSync(file)) stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  stored.steamApiKey = safeStorage.encryptString(apiKey).toString('base64');
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
    minWidth: 1000,
    minHeight: 680,
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
}

/* ---------- HUD : bandeau transparent par-dessus le jeu ----------
   Fenêtre sans cadre, toujours au premier plan et traversée par la souris.
   Visible seulement quand le jeu envoie des données (ou pendant un test).
   Le jeu doit être en mode fenêtré plein écran (sans bordures) : un plein écran exclusif passe au-dessus. */
let hudWin = null, hudTimer = null, hudTestUntil = 0;
const HUD_W = 980, HUD_H = 440;
function hudBounds() {
  const wa = screen.getPrimaryDisplay().bounds;
  const width = Math.min(HUD_W, wa.width), height = Math.min(HUD_H, wa.height);
  const bas = settings.hud && settings.hud.position === 'bas';
  return { x: Math.round(wa.x + (wa.width - width) / 2), y: bas ? wa.y + Math.max(0, wa.height - height - 24) : wa.y + 4, width, height };
}
function hudData() {
  const sn = telemetry.snapshot();
  const test = Date.now() < hudTestUntil;
  if (test && !sn.connected) {
    const t = Date.now() / 1000;
    sn.live = { speed: (88 + Math.sin(t) * 8) / 3.6, speedLimit: 90 / 3.6, odometer: 154320.5, navDistance: 214000, navTime: 10800, localScale: 19, gameTime: 1400, job: { 'delivery.time': 1460 } };
    sn.job = { from: 'Paris', to: 'Lyon', cargo: 'Électronique', mass: 18000, loaded: 38.4, mode: 'réel', overPct: 1.2 };
  }
  // Affiché seulement quand on joue vraiment : jeu au premier plan (pas d'Alt+Tab, pas le bureau),
  // pas en pause (menu Échap), et données fraîches (le jeu n'envoie plus rien quand il est réduit).
  const L = sn.live || {};
  const fresh = Date.now() - telemetry.lastPacket < 700;
  const playing = sn.connected && fresh && !L.paused && L.focused !== false;
  return { ...sn, jobs: undefined, options: settings.hud, show: playing || test };
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
    return { connected: sn.connected, plugin: l && l.plugin, localScale: !!(l && l.localScale > 0), busJob: !!(l && l.busJob), busFields: l && l.busJob ? Object.keys(l.busJob) : [], busFieldsDocumented: false };
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
  ipcMain.handle('integration:status', () => ({
    steamKeyConfigured: fs.existsSync(integrationSecretsFile()) && !!JSON.parse(fs.readFileSync(integrationSecretsFile(), 'utf8')).steamApiKey,
    discordClientId: settings.discordClientId || ''
  }));
  ipcMain.handle('steam:key:set', (_e, key) => {
    if (!steam.validApiKey(key)) throw new Error('La clé Steam Web API doit contenir 32 caractères hexadécimaux.');
    writeSteamApiKey(key);
    return { configured: true };
  });
  ipcMain.handle('steam:key:clear', () => { clearSteamApiKey(); return { configured: false }; });
  ipcMain.handle('steam:profile', async () => {
    const key = readSteamApiKey();
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
  ipcMain.handle('map:cache', () => carte.cacheSize(mapCache()));
  ipcMain.handle('map:clearCache', () => carte.clearCache(mapCache()));
  // ----- Atelier (outils avancés) : chaque appel renvoie { ok, data | error }
  const safe = (fn) => async (_e, ...a) => { try { return { ok: true, data: await fn(...a) }; } catch (e) { return { ok: false, error: e.message }; } };
  ipcMain.handle('atelier:status', safe(() => atelier.status()));
  ipcMain.handle('atelier:profiles', safe(() => atelier.profiles()));
  ipcMain.handle('atelier:duplicate', safe((id, name) => atelier.duplicate(id, name)));
  ipcMain.handle('atelier:analyze', safe((id) => atelier.analyze(id)));
  ipcMain.handle('atelier:backup', safe((id) => atelier.backup(id)));
  ipcMain.handle('atelier:restore', safe((id, name) => atelier.restore(id, name)));
  ipcMain.handle('atelier:openBackups', safe(async () => { fs.mkdirSync(atelier.backups, { recursive: true }); await shell.openPath(atelier.backups); return true; }));
  ipcMain.handle('atelier:console', safe((game) => atelier.consoleState(game)));
  ipcMain.handle('atelier:editorInfo', safe(() => atelier.editorInfo()));
  ipcMain.handle('atelier:slots', safe((id) => atelier.saveSlots(id)));
  ipcMain.handle('atelier:summary', safe((id, slot) => atelier.saveSummary(id, slot)));
  ipcMain.handle('atelier:apply', safe((id, slot, edits) => atelier.saveApply(id, slot, edits)));
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
    // isSilent = true : pas d'assistant Windows ; isForceRunAfter = true : l'appli se relance toute seule
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
    const allowed = ['vehicleType', 'limitTruck', 'limitCar', 'racePct', 'pseudo', 'look', 'atelier', 'hud', 'showSoon', 'steamId', 'discordClientId'];
    validateSettingsPatch(patch);
    if ('steamId' in patch && patch.steamId && !steam.validSteamId(patch.steamId)) throw new Error('Saisis un SteamID64 valide (17 chiffres).');
    if ('discordClientId' in patch && patch.discordClientId && !/^\d{17,20}$/.test(String(patch.discordClientId))) throw new Error('Saisis un ID d’application Discord valide (17 à 20 chiffres).');
    for (const k of allowed) if (k in patch) settings[k] = patch[k];
    if (patch.look) settings.look = sanitizeLook({ ...settings.look, ...patch.look });
    if (patch.modules) settings.modules = { ...DEFAULTS.modules, ...settings.modules, ...patch.modules };
    if (patch.hud) settings.hud = { ...DEFAULTS.hud, ...settings.hud, ...patch.hud };
    saveSettings();
    if (patch.modules || patch.hud) syncHud();
    if ('discordClientId' in patch && discordPresence) await discordPresence.setClientId(settings.discordClientId);
    return settings;
  });
}

/* ---------- Mises à jour (GitHub Releases), entièrement dans l'appli ---------- */
// Vérification automatique ; le téléchargement se lance avec le bouton « Mettre à jour » ;
// l'installation est silencieuse (pas d'assistant Windows) et l'appli redémarre toute seule.
function setupUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
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
    loadSettings();
    telemetry = new Telemetry(app.getPath('userData'), () => settings);
    discordPresence = new DiscordPresence();
    discordPresence.setClientId(settings.discordClientId).catch((e) => console.error('Discord Rich Presence :', e.message));
    const decryptExe = process.env.TCH_DECRYPT || (app.isPackaged
      ? path.join(process.resourcesPath, 'tools', 'decrypt_truck.exe')
      : path.join(__dirname, 'resources', 'tools', process.platform === 'win32' ? 'decrypt_truck.exe' : 'decrypt_truck'));
    atelier = new Atelier(app.getPath('documents'), path.join(app.getPath('userData'), 'Sauvegardes de profils'), decryptExe);
    telemetry.start();
    setInterval(() => {
      if (discordPresence && telemetry) discordPresence.update(telemetry.snapshot()).catch((e) => console.error('Discord Rich Presence :', e.message));
    }, 10000);
    carte.setup(path.join(app.getPath('userData'), 'Carte (cache)'));
    installPlugin();
    setupIpc();
    createWindow();
    if (process.platform === 'win32') systemPreferences.on('accent-color-changed', () => { if (win) win.webContents.send('system:accent', systemAccent()); });
    setupUpdates();
    syncHud();
  });

  app.on('before-quit', () => {
    if (telemetry) telemetry.stop();
    if (discordPresence) discordPresence.disconnect().catch((e) => console.error('Discord Rich Presence :', e.message));
  });
  app.on('window-all-closed', () => app.quit());
}
