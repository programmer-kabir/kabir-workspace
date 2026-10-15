const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, session, desktopCapturer, screen, powerMonitor, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');

let mainWindow = null;
let tray = null;
let hasShownTrayTip = false;
let injectorProcess = null;
app.isQuitting = false;

// Inactivity & Mouse Watchdog State
let inactivityInterval = null;
let lastCursorPos = { x: 0, y: 0 };
let sameCursorSeconds = 0;
let isCurrentlyIdle = false;
let currentActiveWindow = { process: '', title: '', pid: 0 };
let currentRunningApps = [];
let appsPollInterval = null;

function startInjector() {
  if (injectorProcess) return;
  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, 'input_injector.exe')
    : path.join(__dirname, 'input_injector.exe');
  try {
    injectorProcess = spawn(exePath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    injectorProcess.on('error', (err) => console.error('Injector process error:', err));
    injectorProcess.on('exit', () => { 
      injectorProcess = null;
      if (appsPollInterval) {
        clearInterval(appsPollInterval);
        appsPollInterval = null;
      }
    });

    let stdoutBuffer = '';
    injectorProcess.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop(); // keep trailing incomplete chunk

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith('ACTIVE_WINDOW:')) {
          try {
            const data = JSON.parse(line.substring('ACTIVE_WINDOW:'.length));
            if (data && (data.process !== currentActiveWindow.process || data.title !== currentActiveWindow.title)) {
              currentActiveWindow = data;
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('active-window-changed', currentActiveWindow);
              }
            }
          } catch (e) {}
        } else if (line.startsWith('RUNNING_APPS:')) {
          try {
            const data = JSON.parse(line.substring('RUNNING_APPS:'.length));
            if (Array.isArray(data)) {
              currentRunningApps = data;
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('running-apps-changed', currentRunningApps);
              }
            }
          } catch (e) {}
        }
      }
    });

    // Request running applications list periodically every 20 seconds
    sendInputCommand('APPS');
    if (!appsPollInterval) {
      appsPollInterval = setInterval(() => {
        sendInputCommand('APPS');
      }, 20000);
    }
  } catch (err) {
    console.error('Failed to spawn input_injector:', err);
  }
}

function sendInputCommand(cmd) {
  if (!injectorProcess) startInjector();
  if (injectorProcess && injectorProcess.stdin && injectorProcess.stdin.writable) {
    injectorProcess.stdin.write(cmd + '\n');
  }
}

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    startInjector();

    // Auto-start with Windows on system boot in background
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: process.execPath,
        args: ['--silent']
      });
    } catch (e) {
      console.warn('Failed to configure login item settings:', e);
    }

    // Launch 5-minute inactivity & mouse watchdog
    startInactivityWatchdog();

    // Silently auto-grant all permissions (display-capture, media, geolocation, notifications)
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(true);
    });

    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
      return true;
    });

    // Auto-authorize prompt-free desktop screen capture without native OS picker
    if (session.defaultSession.setDisplayMediaRequestHandler) {
      session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
          if (sources.length > 0) {
            callback({ video: sources[0] });
          } else {
            callback({});
          }
        }).catch(err => {
          console.error('Display media error:', err);
          callback({});
        });
      }, { useSystemPicker: false });
    }

    // Bypass CORS by injecting authorized origin header for backend API
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['Origin'] = 'https://staff.creativecomputeracademy.com';
      details.requestHeaders['Referer'] = 'https://staff.creativecomputeracademy.com/';
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

// ── Inactivity & Mouse Watchdog Engine ─────────────────────────────────────────
function startInactivityWatchdog() {
  if (inactivityInterval) return;

  inactivityInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    try {
      // 1. Windows native system idle duration (seconds without keyboard or mouse input)
      const systemIdleSeconds = powerMonitor ? powerMonitor.getSystemIdleTime() : 0;

      // 2. Track global cursor coordinate stability on screen
      const currentPos = screen.getCursorScreenPoint();
      if (currentPos.x === lastCursorPos.x && currentPos.y === lastCursorPos.y) {
        sameCursorSeconds += 10;
      } else {
        sameCursorSeconds = 0;
        lastCursorPos = currentPos;
      }

      // Effective idle is the maximum of system idle and static cursor duration
      const effectiveIdleSeconds = Math.max(systemIdleSeconds, sameCursorSeconds);

      // Threshold: 300 seconds = 5 minutes
      const IDLE_THRESHOLD = 300;

      if (effectiveIdleSeconds >= IDLE_THRESHOLD) {
        if (!isCurrentlyIdle) {
          isCurrentlyIdle = true;
          console.log(`[Watchdog] Inactivity alert threshold reached: ${effectiveIdleSeconds}s`);
          mainWindow.webContents.send('inactivity-status-changed', {
            isIdle: true,
            idleSeconds: effectiveIdleSeconds
          });
        }
      } else if (isCurrentlyIdle && effectiveIdleSeconds < 20) {
        // User has resumed activity (moved cursor or pressed a key)
        isCurrentlyIdle = false;
        console.log('[Watchdog] User activity resumed.');
        mainWindow.webContents.send('inactivity-status-changed', {
          isIdle: false,
          idleSeconds: effectiveIdleSeconds
        });
      }
    } catch (err) {
      console.error('Inactivity watchdog tick error:', err);
    }
  }, 10000); // Poll every 10 seconds
}

function getIconPath() {
  if (app.isPackaged) {
    const resIco = path.join(process.resourcesPath, 'favicon.ico');
    const resPng = path.join(process.resourcesPath, 'logo.png');
    return process.platform === 'win32' ? resIco : resPng;
  }
  const icoPath = path.join(__dirname, '../public/favicon.ico');
  const pngPath = path.join(__dirname, '../public/logo.png');
  return process.platform === 'win32' ? icoPath : pngPath;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    frame: false,
    transparent: false,
    backgroundColor: '#0f172a', // Dark slate background matching CCA Theme
    show: false,
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      devTools: true
    }
  });

  const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
  const prodPath = path.join(__dirname, '../dist/index.html');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5180').catch(() => {
      mainWindow.loadFile(prodPath);
    });
  } else {
    mainWindow.loadFile(prodPath);
  }

  const isSilentStart = process.argv.includes('--silent') || process.argv.includes('--hidden');

  mainWindow.once('ready-to-show', () => {
    if (!isSilentStart) {
      mainWindow.maximize();
      mainWindow.show();
    } else {
      console.log('CCA Attendance launched silently in system tray on system boot.');
    }
  });

  // Minimize to tray on close
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      if (!hasShownTrayTip && Notification.isSupported()) {
        hasShownTrayTip = true;
        const note = new Notification({
          title: 'CCA Attendance',
          body: 'App is running in the background in your System Tray.',
          icon: getIconPath()
        });
        note.show();
      }
    }
  });
}

function createTray() {
  try {
    const icon = getIconPath();
    tray = new Tray(icon);
    tray.setToolTip('CCA Staff Attendance');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Attendance',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Quick Punch',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('tray-action', 'trigger-punch');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Exit Attendance App',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('tray-action', 'confirm-exit');
          } else {
            app.isQuitting = true;
            app.quit();
          }
        }
      }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.error('Failed to create tray', err);
  }
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close-to-tray', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('app-quit', () => {
  app.isQuitting = true;
  app.quit();
});

ipcMain.on('show-notification', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'CCA Attendance',
      body: body || '',
      icon: getIconPath()
    }).show();
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());

// ── Screen Capture & Remote Control Handlers ──────────────────────────────────
ipcMain.handle('get-screen-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    return sources.map(s => ({
      id: s.id,
      name: s.name
    }));
  } catch (err) {
    console.error('get-screen-sources error:', err);
    return [];
  }
});

ipcMain.handle('get-screen-bounds', () => {
  try {
    const primary = screen.getPrimaryDisplay();
    return primary.bounds; // { x, y, width, height }
  } catch (err) {
    return { width: 1920, height: 1080 };
  }
});

ipcMain.on('remote-input-command', (_, cmd) => {
  sendInputCommand(cmd);
});

ipcMain.handle('get-startup-on-boot', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('set-startup-on-boot', (_, enable) => {
  app.setLoginItemSettings({
    openAtLogin: !!enable,
    path: process.execPath,
    args: ['--silent']
  });
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('get-active-window', () => currentActiveWindow);
ipcMain.handle('get-running-apps', () => currentRunningApps);

ipcMain.handle('get-device-metadata', () => {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch()
  };
});

ipcMain.handle('open-external-url', async (_, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.handle('download-and-install-update', async (_, downloadUrl) => {
  return new Promise((resolve, reject) => {
    try {
      if (!downloadUrl) return reject(new Error('Missing download URL'));

      const tempDir = app.getPath('temp');
      const targetPath = path.join(tempDir, `CCA-Attendance-Setup-${Date.now()}.exe`);
      const fileStream = fs.createWriteStream(targetPath);

      const downloadFile = (currentUrl) => {
        const client = currentUrl.startsWith('https') ? https : http;
        const req = client.get(currentUrl, (res) => {
          // Handle HTTP 301/302 Redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let redirectUrl = res.headers.location;
            if (redirectUrl.startsWith('/')) {
              const urlObj = new URL(currentUrl);
              redirectUrl = `${urlObj.origin}${redirectUrl}`;
            }
            downloadFile(redirectUrl);
            return;
          }

          if (res.statusCode !== 200) {
            fileStream.close();
            try { fs.unlinkSync(targetPath); } catch (e) {}
            return reject(new Error(`Server returned HTTP ${res.statusCode}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let transferredBytes = 0;

          res.on('data', (chunk) => {
            transferredBytes += chunk.length;
            fileStream.write(chunk);
            if (totalBytes > 0 && mainWindow && !mainWindow.isDestroyed()) {
              const percent = Math.round((transferredBytes / totalBytes) * 100);
              mainWindow.webContents.send('update-download-progress', {
                percent,
                transferred: transferredBytes,
                total: totalBytes
              });
            }
          });

          res.on('end', () => {
            fileStream.end(() => {
              try {
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('update-download-progress', {
                    percent: 100,
                    transferred: totalBytes || transferredBytes,
                    total: totalBytes || transferredBytes,
                    completed: true
                  });
                }

                // Wait 1.2s to show UI completion state, then run installer & quit
                setTimeout(() => {
                  try {
                    // Try silent installation or fallback to regular NSIS installer execution
                    const child = spawn(targetPath, ['/S'], {
                      detached: true,
                      stdio: 'ignore'
                    });
                    child.unref();
                  } catch (spawnErr) {
                    // Fallback without arguments
                    shell.openPath(targetPath);
                  }

                  app.isQuitting = true;
                  app.quit();
                  resolve({ success: true, targetPath });
                }, 1200);
              } catch (execErr) {
                reject(execErr);
              }
            });
          });
        });

        req.on('error', (err) => {
          fileStream.close();
          try { fs.unlinkSync(targetPath); } catch (e) {}
          reject(err);
        });
      };

      downloadFile(downloadUrl);
    } catch (err) {
      reject(err);
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (appsPollInterval) {
    clearInterval(appsPollInterval);
    appsPollInterval = null;
  }
  if (injectorProcess) {
    try {
      injectorProcess.stdin.write('QUIT\n');
      injectorProcess.kill();
    } catch (e) {}
  }
});
