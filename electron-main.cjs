const { app, BrowserWindow, shell, dialog, session, desktopCapturer } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// Flags to optimize WebRTC, Low-Latency Audio and Screen Sharing in Electron
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-webrtc-srtp-aes-gcm');
app.commandLine.appendSwitch('high-dpi-support', '1');

let mainWindow = null;
let tunnelProcess = null;
const SERVER_PORT = 3000;

// Resolve correct app directory
const isPackaged = app.isPackaged;
const appDir = isPackaged ? path.join(process.resourcesPath, 'app') : __dirname;
const TUNNEL_FILE = path.join(appDir, '.tunnel-info.json');

// Ensure module resolution finds node_modules in packaged app
try {
  const nodeModulesPath = path.join(appDir, 'node_modules');
  if (module.paths) {
    module.paths.unshift(nodeModulesPath);
    module.paths.unshift(path.join(__dirname, 'node_modules'));
  }
} catch (e) {
  console.warn('[Electron] Module paths setup warning:', e);
}

try {
  process.chdir(appDir);
} catch (e) {
  console.warn('[Electron] Could not chdir:', e);
}

function isServerAlreadyRunning(url) {
  return new Promise((resolve) => {
    const req = http.get(url, () => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(600, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function checkServerReady(url, maxRetries = 90, delay = 300) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const interval = setInterval(() => {
      http.get(url, () => {
        clearInterval(interval);
        resolve();
      }).on('error', () => {
        retries++;
        if (retries >= maxRetries) {
          clearInterval(interval);
          reject(new Error('Servidor demorou para responder'));
        }
      });
    }, delay);
  });
}

async function startInternalServer() {
  const isRunning = await isServerAlreadyRunning(`http://localhost:${SERVER_PORT}`);
  if (isRunning) {
    console.log('[Electron] ⚡ Servidor já em execução na porta 3000.');
    return;
  }

  console.log('[Electron] 🚀 Iniciando servidor interno RIVO...');
  try {
    process.env.NODE_ENV = 'production';
    process.env.PORT = String(SERVER_PORT);

    const candidatePaths = [
      path.join(appDir, 'server.cjs'),
      path.join(__dirname, 'server.cjs'),
      path.join(process.resourcesPath, 'server.cjs'),
    ];

    let loaded = false;
    for (const serverPath of candidatePaths) {
      if (fs.existsSync(serverPath)) {
        require(serverPath);
        console.log(`[Electron] ✅ Servidor carregado com sucesso de: ${serverPath}`);
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      throw new Error(`server.cjs não foi encontrado em nenhum dos caminhos:\n${candidatePaths.join('\n')}`);
    }
  } catch (err) {
    console.error('[Electron] Erro ao carregar servidor interno:', err);
    dialog.showErrorBox('Erro ao Iniciar Servidor RIVO', err.stack || String(err));
  }
}

function startCloudflareTunnel() {
  console.log('[Electron] 🌐 Iniciando túnel Cloudflare automático...');
  
  try {
    if (fs.existsSync(TUNNEL_FILE)) {
      fs.unlinkSync(TUNNEL_FILE);
    }
  } catch {}

  try {
    tunnelProcess = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${SERVER_PORT}`], {
      shell: true,
      cwd: appDir,
    });

    const handleOutput = (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match) {
        const publicUrl = match[0];
        console.log(`\n  ╔════════════════════════════════════════════════════════════╗`);
        console.log(`  ║  🌐 LINK PÚBLICO CLOUDFLARE GERADO:                        ║`);
        console.log(`  ║  👉 ${publicUrl.padEnd(52)} ║`);
        console.log(`  ╚════════════════════════════════════════════════════════════╝\n`);

        try {
          fs.writeFileSync(TUNNEL_FILE, JSON.stringify({ url: publicUrl, timestamp: Date.now() }));
        } catch (err) {
          console.error('[Electron] Erro ao salvar .tunnel-info.json:', err);
        }
      }
    };

    tunnelProcess.stdout?.on('data', handleOutput);
    tunnelProcess.stderr?.on('data', handleOutput);

    tunnelProcess.on('error', (err) => {
      console.warn('[Electron] Aviso no túnel Cloudflare:', err);
    });
  } catch (err) {
    console.warn('[Electron] Erro ao disparar processo do túnel:', err);
  }
}

function setupMediaHandlers() {
  // 1. Auto-grant audio/video/screen capture permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'audioCapture', 'videoCapture', 'desktopCapture', 'notifications'];
    if (allowed.includes(permission)) {
      callback(true);
    } else {
      callback(true);
    }
  });

  // 2. Desktop Screen Share Request Handler (fixes screen share on Electron)
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        fetchWindowIcons: true,
        thumbnailSize: { width: 150, height: 150 },
      });

      // Default to primary entire screen or first available source
      const primaryScreen = sources.find((s) => s.id.startsWith('screen:0')) || sources[0];
      if (primaryScreen) {
        callback({ video: primaryScreen, audio: 'loopback' });
      } else {
        callback({});
      }
    } catch (err) {
      console.warn('[Electron] DisplayMedia handler error:', err);
      callback({});
    }
  });
}

async function createWindow() {
  let iconPath = path.join(appDir, 'public', 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, 'public', 'icon.ico');
  }

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#080810',
    title: 'RIVO — Voz & Comunicação',
    icon: iconPath,
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false, // Prevents audio stuttering when Electron is minimized or in background
    },
  });

  try {
    await checkServerReady(`http://localhost:${SERVER_PORT}`);
    await mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
  } catch (err) {
    console.warn('[Electron] Timeout conectando ao servidor, tentando carregar URL:', err);
    await mainWindow.loadURL(`http://localhost:${SERVER_PORT}`).catch(() => {});
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  setupMediaHandlers();
  await startInternalServer();
  startCloudflareTunnel();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

const cleanupProcesses = () => {
  try {
    if (fs.existsSync(TUNNEL_FILE)) {
      fs.unlinkSync(TUNNEL_FILE);
    }
  } catch {}

  if (tunnelProcess) {
    try {
      tunnelProcess.kill();
    } catch {}
  }
};

app.on('window-all-closed', () => {
  cleanupProcesses();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanupProcesses();
});
