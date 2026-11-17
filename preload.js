const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tel', {
  snapshot: () => ipcRenderer.invoke('snapshot'),
  pluginStatus: () => ipcRenderer.invoke('plugin:status'),
  installPlugin: () => ipcRenderer.invoke('plugin:install'),
  chooseGameFolder: () => ipcRenderer.invoke('plugin:choose'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  updateStatus: () => ipcRenderer.invoke('update:status'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  launchGame: (game) => ipcRenderer.invoke('game:launch', game),
  openLink: (key) => ipcRenderer.invoke('link:open', key),
  atelier: {
    status: () => ipcRenderer.invoke('atelier:status'),
    profiles: () => ipcRenderer.invoke('atelier:profiles'),
    backup: (id) => ipcRenderer.invoke('atelier:backup', id),
    restore: (id, name) => ipcRenderer.invoke('atelier:restore', id, name),
    openBackups: () => ipcRenderer.invoke('atelier:openBackups'),
    consoleState: (game) => ipcRenderer.invoke('atelier:console', game),
    setConsole: (game, on) => ipcRenderer.invoke('atelier:setConsole', game, on)
  }
});
