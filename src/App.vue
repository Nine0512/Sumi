<script setup lang="ts">
import { ref, computed } from 'vue';
import PlaylistSidebar from './components/PlaylistSidebar.vue';
import MusicPlayer from './components/MusicPlayer.vue';
import { useAudioPlayer } from './composables/useAudioPlayer';
import { usePlaylist } from './composables/usePlaylist';
import { useElectronFileSystem } from './composables/useElectronFileSystem';
import type { ElectronFile, ElectronFileInfo, Song } from './types/electron';


const { isElectron, selectFolder } = useElectronFileSystem();

// Initialize composables
const {
  playlist,
  currentSong,
  isLoading,
  musicLoaded,
  loadMusicFolder,
  selectSong
} = usePlaylist();

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
} = useAudioPlayer();

// UI state
const showPlaylist = ref(true);

// Background style computed property
const backgroundStyle = computed(() => {
  if (coverImage.value && currentSong.value) {
    return {
      backgroundImage: `url(${coverImage.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return {
    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
  };
});

// Handle folder selection - update to accept both FileList and File arrays
const handleLoadFolder = async (files: FileList | ElectronFile[]) => {
  if (Array.isArray(files)) {
    // Handle array of Files (from Electron)
    await loadMusicFolder(files);
  } else {
    // Handle FileList (from web browser)
    await loadMusicFolder(Array.from(files));
  }
};

// Handle song selection from playlist - update to accept Song objects
const handleSelectSong = async (song: Song) => {
  selectSong(song);
  await playSong(song.file); // Pass the File object to playSong
};

// Toggle playlist visibility
const togglePlaylist = () => {
  showPlaylist.value = !showPlaylist.value;
};

// Update openFolderPicker function
const openFolderPicker = async () => {
  if (isElectron.value) {
    // Use Electron's folder picker
    const result = await selectFolder();
    if (!result.canceled && result.files.length > 0) {
      // Convert Electron file objects to File objects
      const fileList = await Promise.all(
        result.files.map(async (file: ElectronFileInfo) => {
          // For Electron, create File objects from file paths
          const electronFile = new File([new Blob()], file.name, {
            lastModified: file.lastModified,
            type: getFileType(file.name)
          }) as ElectronFile;
          
          // Add path property (custom for Electron)
          electronFile.path = file.path;
          
          return electronFile;
        })
      );
      handleLoadFolder(fileList);
    }
  } else {
    // Use browser's file input for web version
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files) {
        handleLoadFolder(files);
      }
    };
    
    input.click();
  }
};

const getFileType = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3': return 'audio/mp3';
    case 'flac': return 'audio/flac';
    case 'wav': return 'audio/wav';
    case 'ogg': return 'audio/ogg';
    case 'm4a': return 'audio/m4a';
    case 'aac': return 'audio/aac';
    default: return 'audio/mp3';
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col relative overflow-hidden">
    <!-- Background with blur effect -->
    <div class="absolute inset-0 z-0" :style="backgroundStyle"></div>
    <div class="absolute inset-0 z-0" 
         :class="[musicLoaded ? 'backdrop-blur-xl bg-black/50' : 'bg-gray-50']"></div>

    <!-- Main content -->
    <div class="z-10 flex flex-1 relative">
      <!-- Playlist Sidebar -->
      <PlaylistSidebar 
        :playlist="playlist"
        :current-song="currentSong"
        :is-loading="isLoading"
        :show-playlist="showPlaylist"
        :music-loaded="musicLoaded"
        @toggle-playlist="togglePlaylist"
        @select-song="handleSelectSong"
        @load-folder="handleLoadFolder"
      />

      <div class="flex-1 flex flex-col">
        <!-- Header with toggle playlist button -->
        <div class="p-6 flex items-center">
          <button v-if="!showPlaylist" @click="togglePlaylist"
            :class="[
              'p-2 rounded-full transition-colors',
              musicLoaded ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'
            ]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

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
          @select-folder="openFolderPicker"
        />
      </div>
    </div>
  </div>
</template>

<style>
/* Custom scrollbar styling */
.scrollbar::-webkit-scrollbar {
  width: 6px;
}

.scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
</style>