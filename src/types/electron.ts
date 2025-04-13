export interface ElectronFileInfo {
  path: string;
  name: string;
  size: number;
  lastModified: number;
}

export interface ElectronFile extends File {
  path?: string;
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
  file: ElectronFile;
  metadata?: SongMetadata;
}