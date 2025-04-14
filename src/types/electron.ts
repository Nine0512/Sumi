export interface ElectronFile extends File {
  path: string;
}

// Interface for files returned by the Electron API
export interface ElectronFileInfo {
  path: string;
  name: string;
  size: number;
  lastModified: number;
}

export interface SongMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: string;
  durationSeconds?: number;
  cover?: string;
}

export interface Song {
  file: ElectronFile | File;
  metadata: {
    title: string;
    artist: string;
    album: string;
    duration: string;
    durationSeconds: number;
    cover: string;
  };
}

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  dragWindow: () => void;
  // Add other electron methods as needed
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}