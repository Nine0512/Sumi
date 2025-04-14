import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Store from 'electron-store';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup store for app preferences
const store = new Store();

// Add global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 800,
    frame: false,
    transparent: true,
    roundedCorners: true,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#121212',
    title: 'Sumi'
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = !app.isPackaged;
  
  console.log('Running in', isDev ? 'development' : 'production', 'mode');
  
  try {
    if (isDev) {
      console.log('Loading from dev server');
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    } else {
      let indexPath = path.join(__dirname, '../dist/index.html');
      console.log('Trying to load from:', indexPath);
      
      if (!fs.existsSync(indexPath)) {
        console.log('File not found, trying alternative path');
        indexPath = path.join(process.resourcesPath, 'app.asar/dist/index.html');
        console.log('Alternative path:', indexPath);
      }
      
      if (!fs.existsSync(indexPath)) {
        console.log('Still not found, trying direct dist folder');
        indexPath = path.join(app.getAppPath(), 'dist/index.html');
        console.log('Final attempt path:', indexPath);
      }
      
      try {
        const distPath = path.join(app.getAppPath(), 'dist');
        if (fs.existsSync(distPath)) {
          console.log('Contents of dist directory:', fs.readdirSync(distPath));
        } else {
          console.log('dist directory not found');
        }
      } catch (error) {
        console.error('Error reading dist directory:', error);
      }
      
      mainWindow.loadFile(indexPath);
    }
  } catch (error) {
    console.error('Error loading application:', error);
    mainWindow.webContents.loadURL(`data:text/html,
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h2>Error Loading Application</h2>
          <p>${error.message}</p>
          <pre>${error.stack}</pre>
        </body>
      </html>
    `);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (canceled) {
    return { canceled: true, files: [] };
  }
  
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

ipcMain.handle('file:readAudio', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return { success: true, buffer: buffer.buffer };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
});

ipcMain.on('drag-window', () => {
});