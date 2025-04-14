import { ref } from 'vue';
import type { ElectronFileInfo } from '../types/electron';

declare global {
  interface Window {
    electronAPI?: {
      openDirectory: () => Promise<{
        canceled: boolean;
        files: ElectronFileInfo[];
      }>;
      readAudioFile: (path: string) => Promise<{ 
        success: boolean; 
        buffer?: ArrayBuffer;
        error?: string; 
      }>;
    };
  }
}

export function useElectronFileSystem() {
  const isElectron = ref(!!window.electronAPI);
  
  // Select folder using Electron's dialog
  const selectFolder = async () => {
    if (!isElectron.value) {
      console.error('Not running in Electron');
      return { canceled: true, files: [] };
    }
    
    try {
      return await window.electronAPI?.openDirectory() || { canceled: true, files: [] };
    } catch (error) {
      console.error('Error selecting folder:', error);
      return { canceled: true, files: [] };
    }
  };
  
  // Read audio file using Electron's fs
  const readAudioFile = async (filePath: string): Promise<Blob | null> => {
    if (!isElectron.value) {
      console.error('Not running in Electron');
      return null;
    }
    
    try {
      const result = await window.electronAPI?.readAudioFile(filePath);
      if (result?.success && result.buffer) {
        return new Blob([result.buffer]);
      }
      return null;
    } catch (error) {
      console.error('Error reading audio file:', error);
      return null;
    }
  };
  
  return {
    isElectron,
    selectFolder,
    readAudioFile
  };
}