<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePlaylist } from './composables/usePlaylist';
import { useAudioPlayer } from './composables/useAudioPlayer';
import { useElectronFileSystem } from './composables/useElectronFileSystem';
import MusicPlayer from './components/MusicPlayer.vue';
import PlaylistSidebar from './components/PlaylistSidebar.vue';
import type { Song, ElectronFile } from './types/electron';

// Create shared state
const playlist = ref<Song[]>([]);
const currentSong = ref<Song | null>(null);
const isLoading = ref(false);
const musicLoaded = ref(false);
const showPlaylist = ref(false);

// Initialize composables with shared state
const { loadMusicFolder, selectSong } = usePlaylist(
  playlist,
  currentSong,
  isLoading,
  musicLoaded
);

const {
  isPlaying,
  volume,
  currentTime,
  duration,
  coverImage,
  progressPercentage,
  playSong,
  togglePlayPause,
  playNext,
  playPrevious,
  seek,
  setVolume
} = useAudioPlayer(playlist, currentSong);

const { selectFolder, readAudioFile } = useElectronFileSystem();

// Background style with blur based on current cover image
const backgroundStyle = computed(() => {
  if (musicLoaded.value && coverImage.value) {
    return {
      backgroundImage: `url(${coverImage.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return {};
});

// Handle folder selection
const handleSelectFolder = async () => {
  const result = await selectFolder();
  if (!result.canceled && result.files.length > 0) {
    // Convert ElectronFileInfo objects to ElectronFile objects
    const electronFiles = await Promise.all(result.files.map(async (fileInfo) => {
      // Use Electron API to read file content
      const blob = await readAudioFile(fileInfo.path);
      if (!blob) {
        console.error(`Failed to read file: ${fileInfo.path}`);
        return null;
      }
      
      // Create a File-compatible object
      const file = new File([blob], fileInfo.name, {
        lastModified: fileInfo.lastModified,
        type: getFileType(fileInfo.name)
      }) as ElectronFile;
      
      // Add path property
      file.path = fileInfo.path;
      
      return file;
    }));
    
    // Filter out any null values from failed file reads
    const validFiles = electronFiles.filter(file => file !== null) as ElectronFile[];
    
    await loadMusicFolder(validFiles);
    if (playlist.value.length > 0) {
      playSong(playlist.value[0]);
    }
  }
};

// Helper function to determine file type from extension
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'ogg': return 'audio/ogg';
    case 'flac': return 'audio/flac';
    case 'm4a': return 'audio/mp4';
    case 'aac': return 'audio/aac';
    default: return 'audio/mpeg'; // fallback
  }
}

// Handle selecting a specific song
const handleSelectSong = async (song: Song) => {
  selectSong(song);
  await playSong(song);
};

// Load music from Web API (for non-Electron environments)
const handleWebFileInput = async (files: FileList) => {
  await loadMusicFolder(files);
  if (playlist.value.length > 0) {
    playSong(playlist.value[0]);
  }
};

const togglePlaylistSidebar = () => {
  showPlaylist.value = !showPlaylist.value;
};
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden flex flex-col">
    <!-- Background layer with blur effect -->
    <div 
      class="absolute inset-0 transition-all duration-1000"
      :class="musicLoaded ? '' : 'bg-white'"
      :style="backgroundStyle"
    ></div>
    
    <!-- Overlay with blur and gradient -->
    <div 
      v-if="musicLoaded" 
      class="absolute inset-0 backdrop-blur-xl bg-black/50"
    ></div>
    
    <!-- Content layer -->
    <div class="relative z-10 flex flex-col w-full h-full">
      <!-- Playlist Sidebar -->
      <PlaylistSidebar 
        :playlist="playlist"
        :current-song="currentSong"
        :is-loading="isLoading"
        :show-playlist="showPlaylist"
        :music-loaded="musicLoaded"
        @toggle-playlist="togglePlaylistSidebar"
        @select-song="handleSelectSong"
        @load-folder="handleWebFileInput"
      />
      
      <!-- Main Content -->
      <div class="w-full h-full flex flex-col relative">
        <!-- Menu button to show playlist -->
        <button 
          v-if="!showPlaylist"
          @click="togglePlaylistSidebar"
          class="absolute top-6 left-6 z-20 p-2 rounded-full"
          :class="musicLoaded ? 'text-white hover:bg-white/10' : 'hover:bg-gray-100'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        <!-- Music Player Component -->
        <MusicPlayer
          :current-song="currentSong"
          :is-playing="isPlaying"
          :volume="volume"
          :current-time="currentTime"
          :duration="duration"
          :cover-image="coverImage"
          :progress-percentage="progressPercentage"
          :music-loaded="musicLoaded"
          @previous="playPrevious"
          @toggle-play="togglePlayPause"
          @next="playNext"
          @seek="seek"
          @update:volume="setVolume"
          @select-folder="handleSelectFolder"
        />
      </div>
    </div>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

.scrollbar::-webkit-scrollbar {
  width: 6px;
}

.scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.dark .scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>