const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tel', {
  snapshot: () => ipcRenderer.invoke('snapshot'),
  pluginStatus: () => ipcRenderer.invoke('plugin:status'),
  installPlugin: () => ipcRenderer.invoke('plugin:install'),
  chooseGameFolder: () => ipcRenderer.invoke('plugin:choose'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  integrationStatus: () => ipcRenderer.invoke('integration:status'),
  setSteamApiKey: (key) => ipcRenderer.invoke('steam:key:set', key),
  clearSteamApiKey: () => ipcRenderer.invoke('steam:key:clear'),
  steamProfile: () => ipcRenderer.invoke('steam:profile'),
  testDiscordPresence: (clientId) => ipcRenderer.invoke('discord:test', clientId),
  systemAccent: () => ipcRenderer.invoke('system:accent'),
  onSystemAccent: (cb) => ipcRenderer.on('system:accent', (_e, c) => cb(c)),
  updateStatus: () => ipcRenderer.invoke('update:status'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  launchGame: (game) => ipcRenderer.invoke('game:launch', game),
  openLink: (key) => ipcRenderer.invoke('link:open', key),
  testHud: () => ipcRenderer.invoke('hud:test'),
  onHud: (cb) => ipcRenderer.on('hud', (_e, d) => cb(d)),
  gameContent: () => ipcRenderer.invoke('game:content'),
  telemetryCapabilities: () => ipcRenderer.invoke('telemetry:capabilities'),
  map: {
    info: () => ipcRenderer.invoke('map:info'),
    history: () => ipcRenderer.invoke('map:history'),
    cache: () => ipcRenderer.invoke('map:cache'),
    clearCache: () => ipcRenderer.invoke('map:clearCache')
  },
  atelier: {
    status: () => ipcRenderer.invoke('atelier:status'),
    profiles: () => ipcRenderer.invoke('atelier:profiles'),
    duplicate: (id, name) => ipcRenderer.invoke('atelier:duplicate', id, name),
    analyze: (id) => ipcRenderer.invoke('atelier:analyze', id),
    backup: (id) => ipcRenderer.invoke('atelier:backup', id),
    restore: (id, name) => ipcRenderer.invoke('atelier:restore', id, name),
    openBackups: () => ipcRenderer.invoke('atelier:openBackups'),
    consoleState: (game) => ipcRenderer.invoke('atelier:console', game),
    editorInfo: () => ipcRenderer.invoke('atelier:editorInfo'),
    slots: (id) => ipcRenderer.invoke('atelier:slots', id),
    summary: (id, slot) => ipcRenderer.invoke('atelier:summary', id, slot),
    apply: (id, slot, edits) => ipcRenderer.invoke('atelier:apply', id, slot, edits),
    setConsole: (game, on) => ipcRenderer.invoke('atelier:setConsole', game, on)
  }
});
