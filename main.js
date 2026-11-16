const { app, BrowserWindow, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1000,
    minHeight: 680,
    backgroundColor: '#0F1720',
    title: 'Télémétrie Entreprise',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'), { query: { v: app.getVersion() } });
}

/* ---------- Mises à jour automatiques (GitHub Releases) ---------- */
function setupUpdates() {
  if (!app.isPackaged) return; // pas de mise à jour en mode développement
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

app.whenReady().then(() => {
  createWindow();
  setupUpdates();
});
app.on('window-all-closed', () => app.quit());
