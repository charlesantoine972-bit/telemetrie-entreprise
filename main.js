const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { Telemetry } = require('./src/telemetry');
const installer = require('./src/plugin-installer');

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
const DEFAULTS = { theme: 'sombre', vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5, customGamePaths: [], pseudo: '', modules: { hud: false }, addons: { tablette: false, gps: false } };
const settingsFile = () => path.join(app.getPath('userData'), 'reglages.json');
let settings = { ...DEFAULTS };
function loadSettings() {
  try { settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }; } catch { settings = { ...DEFAULTS }; }
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
    backgroundColor: settings.theme === 'clair' ? '#F4F6F9' : '#0F1720',
    title: 'Truck & Coach Hub',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'), { query: { v: app.getVersion() } });
  // Liens externes : toujours dans le navigateur, jamais dans l'appli
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
}

/* ---------- Échanges avec l'interface ---------- */
function setupIpc() {
  ipcMain.handle('snapshot', () => telemetry.snapshot());
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
    const allowed = ['vehicleType', 'limitTruck', 'limitCar', 'racePct', 'pseudo', 'theme'];
    for (const k of allowed) if (k in patch) settings[k] = patch[k];
    if (patch.modules) settings.modules = { ...DEFAULTS.modules, ...settings.modules, ...patch.modules };
    saveSettings();
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
    telemetry.start();
    installPlugin();
    setupIpc();
    createWindow();
    setupUpdates();
  });

  app.on('before-quit', () => { if (telemetry) telemetry.stop(); });
  app.on('window-all-closed', () => app.quit());
}
