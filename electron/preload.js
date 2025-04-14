const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script running');

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