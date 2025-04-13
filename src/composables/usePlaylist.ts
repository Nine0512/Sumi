import { ref } from 'vue'; 
import { useMediaMetadata } from './useMediaMetadata';
import type { Song, ElectronFile } from '../types/electron';

export function usePlaylist() {
  const { processFiles } = useMediaMetadata();
  
  const playlist = ref<Song[]>([]);
  const currentSong = ref<Song | null>(null);
  const isLoading = ref(false);
  const musicLoaded = ref(false);
  
  // Handle folder selection - update to accept File array
  const loadMusicFolder = async (files: ElectronFile[] | FileList) => {
    const audioFiles = Array.isArray(files) ? files : Array.from(files);
    
    isLoading.value = true;
    
    const processedFiles = await processFiles(audioFiles);
    
    // Convert to Song objects
    playlist.value = processedFiles.map(file => ({
      file: file as ElectronFile,
      metadata: (file as any).metadata
    }));
    
    if (playlist.value.length > 0) {
      currentSong.value = playlist.value[0];
      musicLoaded.value = true;
    }
    
    isLoading.value = false;
    return playlist.value;
  };
  
  // Update other methods to use Song objects
  const getNextSong = () => {
    if (!currentSong.value || playlist.value.length <= 1) return currentSong.value;
    
    const currentIndex = playlist.value.findIndex(song => song === currentSong.value);
    const nextIndex = (currentIndex + 1) % playlist.value.length;
    return playlist.value[nextIndex];
  };
  
  const getPreviousSong = () => {
    if (!currentSong.value || playlist.value.length <= 1) return currentSong.value;
    
    const currentIndex = playlist.value.findIndex(song => song === currentSong.value);
    const previousIndex = (currentIndex - 1 + playlist.value.length) % playlist.value.length;
    return playlist.value[previousIndex];
  };
  
  // Update to accept Song object
  const selectSong = (song: Song) => {
    currentSong.value = song;
    return currentSong.value;
  };

  return {
    playlist,
    currentSong,
    isLoading,
    musicLoaded,
    loadMusicFolder,
    getNextSong,
    getPreviousSong,
    selectSong
  };
}