const { contextBridge, ipcRenderer } = require('electron');

// Log that preload script is running
console.log('Preload script running');

// Expose protected methods to renderer
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    readAudioFile: (path) => ipcRenderer.invoke('file:readAudio', path),
  });
  console.log('electronAPI exposed to renderer');

  contextBridge.exposeInMainWorld('electron', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    dragWindow: () => ipcRenderer.send('drag-window')
  });
} catch (error) {
  console.error('Failed to expose electronAPI:', error);
}