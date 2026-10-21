const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  setWindowMode: (mode) => ipcRenderer.send('window-set-mode', mode),
  closeToTray: () => ipcRenderer.send('window-close-to-tray'),
  quitApp: () => ipcRenderer.send('app-quit'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onTrayAction: (callback) => {
    const handler = (_, action) => callback(action);
    ipcRenderer.on('tray-action', handler);
    return () => ipcRenderer.removeListener('tray-action', handler);
  },
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  getScreenBounds: () => ipcRenderer.invoke('get-screen-bounds'),
  sendRemoteInput: (cmd) => ipcRenderer.send('remote-input-command', cmd),
  onInactivityStatus: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('inactivity-status-changed', handler);
    return () => ipcRenderer.removeListener('inactivity-status-changed', handler);
  },
  getStartupOnBoot: () => ipcRenderer.invoke('get-startup-on-boot'),
  setStartupOnBoot: (enable) => ipcRenderer.invoke('set-startup-on-boot', enable),
  getActiveWindow: () => ipcRenderer.invoke('get-active-window'),
  getRunningApps: () => ipcRenderer.invoke('get-running-apps'),
  onActiveWindowChange: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('active-window-changed', handler);
    return () => ipcRenderer.removeListener('active-window-changed', handler);
  },
  onRunningAppsChange: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('running-apps-changed', handler);
    return () => ipcRenderer.removeListener('running-apps-changed', handler);
  },
  installUpdate: (url) => ipcRenderer.invoke('download-and-install-update', url),
  openExternal: (url) => ipcRenderer.invoke('open-external-url', url),
  onUpdateProgress: (callback) => {
    const handler = (_, progress) => callback(progress);
    ipcRenderer.on('update-download-progress', handler);
    return () => ipcRenderer.removeListener('update-download-progress', handler);
  },
  getDeviceMetadata: () => ipcRenderer.invoke('get-device-metadata'),
  getSystemUptime: () => ipcRenderer.invoke('get-system-uptime'),
  saveSpoolVideo: (data) => ipcRenderer.invoke('save-spool-video', data),
  listSpoolVideos: () => ipcRenderer.invoke('list-spool-videos'),
  readSpoolVideo: (fileName) => ipcRenderer.invoke('read-spool-video', fileName),
  deleteSpoolVideo: (fileName) => ipcRenderer.invoke('delete-spool-video', fileName),
  openSpoolFolder: () => ipcRenderer.invoke('open-spool-folder'),
  openSpoolVideo: (fileName) => ipcRenderer.invoke('open-spool-video', fileName),
  getSpoolStorageInfo: () => ipcRenderer.invoke('get-spool-storage-info'),
  saveCachedTaskFile: (data) => ipcRenderer.invoke('save-cached-task-file', data),
  getCachedTaskFile: (fileName) => ipcRenderer.invoke('get-cached-task-file', fileName),
  isTaskFileCached: (fileName) => ipcRenderer.invoke('is-task-file-cached', fileName),
  openCachedTaskFile: (fileName) => ipcRenderer.invoke('open-cached-task-file', fileName),
  listCachedTaskFiles: () => ipcRenderer.invoke('list-cached-task-files'),
  isElectron: true
});

