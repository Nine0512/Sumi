import { ref, computed } from 'vue';
import { useMediaMetadata } from './useMediaMetadata';

export function usePlaylist() {
  const { processFiles } = useMediaMetadata();
  
  const playlist = ref<File[]>([]);
  const currentSong = ref<File | null>(null);
  const isLoading = ref(false);
  const musicLoaded = ref(false);
  
  // Handle folder selection
  const loadMusicFolder = async (files: FileList | null) => {
    if (!files) return;
    
    isLoading.value = true;
    const audioFiles = Array.from(files);
    
    playlist.value = await processFiles(audioFiles);
    
    if (playlist.value.length > 0) {
      currentSong.value = playlist.value[0];
      musicLoaded.value = true;
    }
    
    isLoading.value = false;
    return playlist.value;
  };
  
  // Get next song in playlist
  const getNextSong = () => {
    if (!currentSong.value || playlist.value.length <= 1) return currentSong.value;
    
    const currentIndex = playlist.value.findIndex(song => song === currentSong.value);
    const nextIndex = (currentIndex + 1) % playlist.value.length;
    return playlist.value[nextIndex];
  };
  
  // Get previous song in playlist
  const getPreviousSong = () => {
    if (!currentSong.value || playlist.value.length <= 1) return currentSong.value;
    
    const currentIndex = playlist.value.findIndex(song => song === currentSong.value);
    const previousIndex = (currentIndex - 1 + playlist.value.length) % playlist.value.length;
    return playlist.value[previousIndex];
  };
  
  // Select a song from playlist
  const selectSong = (song: File) => {
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