import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { useMediaMetadata } from './useMediaMetadata';
import { usePlaylist } from './usePlaylist';
import type { Song, ElectronFile } from '../types/electron';

export function useAudioPlayer(
  playlist?: Ref<Song[]>,
  currentSongRef?: Ref<Song | null>
) {
  const { formatDuration } = useMediaMetadata();
  const { getNextSong, getPreviousSong, currentSong } = usePlaylist(
    playlist,
    currentSongRef
  );
  
  const audioElement = ref<HTMLAudioElement | null>(null);
  const isPlaying = ref(false);
  const volume = ref(0.8);
  const currentTime = ref('0:00');
  const currentTimeSeconds = ref(0);
  const duration = ref('0:00');
  const coverImage = ref<string | null>(null);
  
  const progressPercentage = computed(() => {
    if (audioElement.value) {
      return (currentTimeSeconds.value / (audioElement.value.duration || 1)) * 100;
    }
    return 0;
  });

  const initAudio = (file: File) => {
    if (audioElement.value) {
      audioElement.value.pause();
      audioElement.value.src = '';
    }
    
    const audioUrl = URL.createObjectURL(file);
    audioElement.value = new Audio(audioUrl);
    audioElement.value.volume = volume.value;
    
    const metadata = (file as any).metadata || {};
    coverImage.value = metadata.cover;
    
    audioElement.value.onloadedmetadata = () => {
      const songDuration = audioElement.value?.duration || 0;
      duration.value = formatDuration(songDuration);
    };
    
    audioElement.value.ontimeupdate = () => {
      const current = audioElement.value?.currentTime || 0;
      currentTime.value = formatDuration(current);
      currentTimeSeconds.value = current;
    };
    
    audioElement.value.onended = () => {
      playNext();
    };
  };

  const playSong = async (songOrFile: Song | ElectronFile) => {
    const file = 'file' in songOrFile ? songOrFile.file : songOrFile;
    
    initAudio(file);
    
    try {
      await audioElement.value?.play();
      isPlaying.value = true;
    } catch (error) {
      console.error('Failed to play audio:', error);
      isPlaying.value = false;
    }
  };

  const togglePlayPause = async () => {
    if (!audioElement.value && currentSong.value) {
      await playSong(currentSong.value);
      return;
    }
    
    if (audioElement.value) {
      if (audioElement.value.paused) {
        await audioElement.value.play();
        isPlaying.value = true;
      } else {
        audioElement.value.pause();
        isPlaying.value = false;
      }
    }
  };

  const playNext = () => {
    const nextSong = getNextSong();
    if (nextSong) {
      if (currentSongRef) {
        currentSongRef.value = nextSong;
      }
      playSong(nextSong);
    }
  };

  const playPrevious = () => {
    const previousSong = getPreviousSong();
    if (previousSong) {
      if (currentSongRef) {
        currentSongRef.value = previousSong;
      }
      playSong(previousSong);
    }
  };

  const seek = (percentage: number) => {
    if (audioElement.value) {
      audioElement.value.currentTime = (percentage / 100) * (audioElement.value.duration || 0);
    }
  };

  const setVolume = (value: number) => {
    volume.value = value;
    if (audioElement.value) {
      audioElement.value.volume = value;
    }
  };

  return {
    audioElement,
    isPlaying,
    volume,
    currentTime,
    currentTimeSeconds,
    duration,
    coverImage,
    progressPercentage,
    playSong,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume
  };
}