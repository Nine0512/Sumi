import { ref } from 'vue'; 
import type { Ref } from 'vue';
import { useMediaMetadata } from './useMediaMetadata';
import type { Song, ElectronFile } from '../types/electron';

// Add parameters to accept external state
export function usePlaylist(
  externalPlaylist?: Ref<Song[]>,
  externalCurrentSong?: Ref<Song | null>,
  externalIsLoading?: Ref<boolean>,
  externalMusicLoaded?: Ref<boolean>
) {
  const { processFiles } = useMediaMetadata();
  
  // Use external refs if provided, otherwise create new ones
  const playlist = externalPlaylist || ref<Song[]>([]);
  const currentSong = externalCurrentSong || ref<Song | null>(null);
  const isLoading = externalIsLoading || ref(false);
  const musicLoaded = externalMusicLoaded || ref(false);
  
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