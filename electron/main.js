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
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 800,
    show: false, // Don't show until content is ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#121212',
    title: 'Sumi'
  });

  // Show window when content is ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  const isDev = !app.isPackaged;
  
  console.log('Running in', isDev ? 'development' : 'production', 'mode');
  
  try {
    if (isDev) {
      console.log('Loading from dev server');
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    } else {
      // Try multiple possible paths for production
      let indexPath = path.join(__dirname, '../dist/index.html');
      console.log('Trying to load from:', indexPath);
      
      if (!fs.existsSync(indexPath)) {
        console.log('File not found, trying alternative path');
        // Try alternative path in packaged app
        indexPath = path.join(process.resourcesPath, 'app.asar/dist/index.html');
        console.log('Alternative path:', indexPath);
      }
      
      if (!fs.existsSync(indexPath)) {
        console.log('Still not found, trying direct dist folder');
        // One more attempt
        indexPath = path.join(app.getAppPath(), 'dist/index.html');
        console.log('Final attempt path:', indexPath);
      }
      
      // Log content of dist directory to verify files
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
      
      // Load the file
      mainWindow.loadFile(indexPath);
    }
  } catch (error) {
    console.error('Error loading application:', error);
    // Show error message in app window
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

  // Listen for errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription);
  });

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