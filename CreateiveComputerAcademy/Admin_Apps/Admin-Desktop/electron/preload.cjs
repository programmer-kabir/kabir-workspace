const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeToTray: () => ipcRenderer.send('window-close-to-tray'),
  closeWindow: () => ipcRenderer.send('window-close'),
  quitApp: () => ipcRenderer.send('app-quit'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external-url', url),
  getSystemUptime: () => ipcRenderer.invoke('get-system-uptime'),
  isElectron: true
});
