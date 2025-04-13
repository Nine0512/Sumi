import { ref, computed } from 'vue';
import { useMediaMetadata } from './useMediaMetadata';
import { usePlaylist } from './usePlaylist';

export function useAudioPlayer() {
  const { formatDuration } = useMediaMetadata();
  const { getNextSong, getPreviousSong, currentSong } = usePlaylist();
  
  const audioElement = ref<HTMLAudioElement | null>(null);
  const isPlaying = ref(false);
  const volume = ref(0.8);
  const currentTime = ref('0:00');
  const currentTimeSeconds = ref(0);
  const duration = ref('0:00');
  const coverImage = ref<string | null>(null);
  
  // Computed property for progress percentage
  const progressPercentage = computed(() => {
    if (audioElement.value) {
      return (currentTimeSeconds.value / (audioElement.value.duration || 1)) * 100;
    }
    return 0;
  });

  // Initialize audio for a song
  const initAudio = (file: File) => {
    if (audioElement.value) {
      audioElement.value.pause();
      audioElement.value.src = '';
    }
    
    const audioUrl = URL.createObjectURL(file);
    audioElement.value = new Audio(audioUrl);
    audioElement.value.volume = volume.value;
    
    // Set cover image
    const metadata = (file as any).metadata || {};
    coverImage.value = metadata.cover;
    
    // Update duration when metadata is loaded
    audioElement.value.onloadedmetadata = () => {
      const songDuration = audioElement.value?.duration || 0;
      duration.value = formatDuration(songDuration);
    };
    
    // Update current time during playback
    audioElement.value.ontimeupdate = () => {
      const current = audioElement.value?.currentTime || 0;
      currentTime.value = formatDuration(current);
      currentTimeSeconds.value = current;
    };
    
    // Handle end of song
    audioElement.value.onended = () => {
      playNext();
    };
  };

  // Play a specific song
  const playSong = async (file: File) => {
    initAudio(file);
    
    try {
      await audioElement.value?.play();
      isPlaying.value = true;
    } catch (error) {
      console.error('Failed to play audio:', error);
      isPlaying.value = false;
    }
  };

  // Toggle play/pause
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

  // Play next song
  const playNext = () => {
    const nextSong = getNextSong();
    if (nextSong) {
      playSong(nextSong);
    }
  };

  // Play previous song
  const playPrevious = () => {
    const previousSong = getPreviousSong();
    if (previousSong) {
      playSong(previousSong);
    }
  };

  // Seek to position
  const seek = (percentage: number) => {
    if (audioElement.value) {
      audioElement.value.currentTime = (percentage / 100) * (audioElement.value.duration || 0);
    }
  };

  // Adjust volume
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