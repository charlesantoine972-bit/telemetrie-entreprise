const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { Telemetry } = require('./src/telemetry');
const installer = require('./src/plugin-installer');

let win;
let telemetry;
let pluginStatus = [];

/* ---------- Réglages ---------- */
const DEFAULTS = { vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5, customGamePaths: [] };
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
    backgroundColor: '#0F1720',
    title: 'Télémétrie Entreprise',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'), { query: { v: app.getVersion() } });
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
  ipcMain.handle('settings:set', (_e, patch) => {
    const allowed = ['vehicleType', 'limitTruck', 'limitCar', 'racePct'];
    for (const k of allowed) if (k in patch) settings[k] = patch[k];
    saveSettings();
    return settings;
  });
}

/* ---------- Mises à jour automatiques (GitHub Releases) ---------- */
function setupUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-downloaded', async (info) => {
    const { response } = await dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['Redémarrer maintenant', 'Plus tard'],
      defaultId: 0,
      cancelId: 1,
      title: 'Mise à jour disponible',
      message: `La version ${info.version} est prête.`,
      detail: 'Redémarre l\'application pour profiter des nouveautés. Sinon, elle sera installée à la prochaine fermeture.'
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on('error', (err) => console.error('Mise à jour :', err && err.message));
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000);
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
