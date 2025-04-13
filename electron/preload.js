import { contextBridge, ipcRenderer } from 'electron';

// Log that preload script is running
console.log('Preload script running');

// Expose protected methods to renderer
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    readAudioFile: (path) => ipcRenderer.invoke('file:readAudio', path),
  });
  console.log('electronAPI exposed to renderer');
} catch (error) {
  console.error('Failed to expose electronAPI:', error);
}