import { ref } from 'vue'; 
import type { Ref } from 'vue';
import { useMediaMetadata } from './useMediaMetadata';
import type { Song, ElectronFile } from '../types/electron';

export function usePlaylist(
  externalPlaylist?: Ref<Song[]>,
  externalCurrentSong?: Ref<Song | null>,
  externalIsLoading?: Ref<boolean>,
  externalMusicLoaded?: Ref<boolean>
) {
  const { processFiles } = useMediaMetadata();
  
  const playlist = externalPlaylist || ref<Song[]>([]);
  const currentSong = externalCurrentSong || ref<Song | null>(null);
  const isLoading = externalIsLoading || ref(false);
  const musicLoaded = externalMusicLoaded || ref(false);
  
  const loadMusicFolder = async (files: ElectronFile[] | FileList) => {
    const audioFiles = Array.isArray(files) ? files : Array.from(files);
    
    isLoading.value = true;
    
    const processedFiles = await processFiles(audioFiles);
    
    playlist.value = processedFiles.map(file => ({
      file: 'path' in file ? file as ElectronFile : file as File,
      metadata: (file as any).metadata
    }));
    
    if (playlist.value.length > 0) {
      currentSong.value = playlist.value[0];
      musicLoaded.value = true;
    }
    
    isLoading.value = false;
    return playlist.value;
  };
  
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