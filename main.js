const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { Telemetry } = require('./src/telemetry');
const installer = require('./src/plugin-installer');
const { Atelier } = require('./src/atelier');
const carte = require('./src/map');
let atelier;
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
const DEFAULTS = { atelier: false, showSoon: false, look: { theme: 'base', vision: 'normale', zoom: '100', contrast: false, motion: false }, vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5, customGamePaths: [], pseudo: '', modules: { hud: false }, hud: { style: 'bandeau', position: 'haut', logo: true, opacity: 82 }, addons: { tablette: false, gps: false } };
const settingsFile = () => path.join(app.getPath('userData'), 'reglages.json');
let settings = { ...DEFAULTS };
function sanitizeLook(l) {
  const pick = (v, list, d) => list.includes(String(v)) ? String(v) : d;
  return { theme: pick(l.theme, ['base', 'sombre', 'clair', 'systeme'], 'base'), vision: pick(l.vision, ['normale', 'rg', 'by'], 'normale'),
    zoom: pick(l.zoom, ['100', '115', '130'], '100'), contrast: !!l.contrast, motion: !!l.motion };
}
function windowBackground(st) {
  const t = st.look && st.look.theme === 'systeme' ? (nativeTheme.shouldUseDarkColors ? 'sombre' : 'clair') : (st.look && st.look.theme) || 'base';
  return { base: '#0F1720', sombre: '#202020', clair: '#F3F3F3' }[t] || '#0F1720';
}
function loadSettings() {
  try { settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }; } catch { settings = { ...DEFAULTS }; }
  // Ancien réglage « theme » (avant la 0.8) : l'ancien « sombre » est devenu le thème « de base »
  if (settings.theme) { const t = settings.theme; delete settings.theme; settings.look = { ...DEFAULTS.look, theme: t === 'sombre' ? 'base' : t }; }
  settings.look = { ...DEFAULTS.look, ...(settings.look || {}) };
}
function saveSettings() {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
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
const HUD_W = 820, HUD_H = 240;
function hudBounds() {
  const wa = screen.getPrimaryDisplay().bounds;
  const bas = settings.hud && settings.hud.position === 'bas';
  return { x: Math.round(wa.x + (wa.width - HUD_W) / 2), y: bas ? wa.y + wa.height - HUD_H - 100 : wa.y + 4, width: HUD_W, height: HUD_H };
}
function hudData() {
  const sn = telemetry.snapshot();
  const test = Date.now() < hudTestUntil;
  if (test && !sn.connected) {
    const t = Date.now() / 1000;
    sn.live = { speed: (88 + Math.sin(t) * 8) / 3.6, speedLimit: 90 / 3.6, navDistance: 214000 };
    sn.job = { loaded: 38.4, mode: 'réel', overPct: 1.2 };
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
  // ----- Carte
  const mapCache = () => path.join(app.getPath('userData'), 'Carte (cache)');
  ipcMain.handle('map:info', () => carte.MAPS);
  ipcMain.handle('map:history', () => telemetry.mapHistory());
  ipcMain.handle('map:cache', () => carte.cacheSize(mapCache()));
  ipcMain.handle('map:clearCache', () => carte.clearCache(mapCache()));
  // ----- Atelier (outils avancés) : chaque appel renvoie { ok, data | error }
  const safe = (fn) => async (_e, ...a) => { try { return { ok: true, data: await fn(...a) }; } catch (e) { return { ok: false, error: e.message }; } };
  ipcMain.handle('atelier:status', safe(() => atelier.status()));
  ipcMain.handle('atelier:profiles', safe(() => atelier.profiles()));
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
  ipcMain.handle('settings:set', (_e, patch) => {
    const allowed = ['vehicleType', 'limitTruck', 'limitCar', 'racePct', 'pseudo', 'look', 'atelier', 'hud', 'showSoon'];
    for (const k of allowed) if (k in patch) settings[k] = patch[k];
    if (patch.look) settings.look = sanitizeLook({ ...settings.look, ...patch.look });
    if (patch.modules) settings.modules = { ...DEFAULTS.modules, ...settings.modules, ...patch.modules };
    if (patch.hud) settings.hud = { ...DEFAULTS.hud, ...settings.hud, ...patch.hud };
    saveSettings();
    if (patch.modules || patch.hud) syncHud();
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
    const decryptExe = process.env.TCH_DECRYPT || (app.isPackaged
      ? path.join(process.resourcesPath, 'tools', 'decrypt_truck.exe')
      : path.join(__dirname, 'resources', 'tools', process.platform === 'win32' ? 'decrypt_truck.exe' : 'decrypt_truck'));
    atelier = new Atelier(app.getPath('documents'), path.join(app.getPath('userData'), 'Sauvegardes de profils'), decryptExe);
    telemetry.start();
    carte.setup(path.join(app.getPath('userData'), 'Carte (cache)'));
    installPlugin();
    setupIpc();
    createWindow();
    setupUpdates();
    syncHud();
  });

  app.on('before-quit', () => { if (telemetry) telemetry.stop(); });
  app.on('window-all-closed', () => app.quit());
}
