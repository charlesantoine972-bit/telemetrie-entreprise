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
  openLink: (key) => ipcRenderer.invoke('link:open', key)
});
