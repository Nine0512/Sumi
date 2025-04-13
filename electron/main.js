const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Setup store for app preferences
const store = new Store();

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    // Use system default dark/light mode if available
    backgroundColor: '#121212',
    title: 'Sumi Music Player'
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173'); // Default Vite dev server port
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle folder selection
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (canceled) {
    return { canceled: true, files: [] };
  }
  
  // Get all audio files recursively
  const dir = filePaths[0];
  const audioFiles = [];
  
  function scanDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        const ext = path.extname(file).toLowerCase();
        // Check if it's an audio file
        if (['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'].includes(ext)) {
          audioFiles.push({
            path: fullPath,
            name: file,
            size: stat.size,
            lastModified: stat.mtime.getTime()
          });
        }
      }
    }
  }
  
  try {
    scanDirectory(dir);
    return { canceled: false, files: audioFiles };
  } catch (error) {
    console.error('Error scanning directory:', error);
    return { canceled: true, error: error.message };
  }
});

// Handle reading audio file
ipcMain.handle('file:readAudio', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return { success: true, buffer: buffer.buffer };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});