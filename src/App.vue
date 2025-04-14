<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePlaylist } from './composables/usePlaylist';
import { useAudioPlayer } from './composables/useAudioPlayer';
import { useElectronFileSystem } from './composables/useElectronFileSystem';
import MusicPlayer from './components/MusicPlayer.vue';
import PlaylistSidebar from './components/PlaylistSidebar.vue';
import type { Song, ElectronFile } from './types/electron';

const playlist = ref<Song[]>([]);
const currentSong = ref<Song | null>(null);
const isLoading = ref(false);
const musicLoaded = ref(false);
const showPlaylist = ref(false);

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

const handleSelectFolder = async () => {
  const result = await selectFolder();
  if (!result.canceled && result.files.length > 0) {
    isLoading.value = true;
    const electronFiles = await Promise.all(result.files.map(async (fileInfo) => {
      const blob = await readAudioFile(fileInfo.path);
      if (!blob) {
        console.error(`Failed to read file: ${fileInfo.path}`);
        return null;
      }
      
      const file = new File([blob], fileInfo.name, {
        lastModified: fileInfo.lastModified,
        type: getFileType(fileInfo.name)
      }) as ElectronFile;
      
      file.path = fileInfo.path;
      
      return file;
    }));
    
    const validFiles = electronFiles.filter(file => file !== null) as ElectronFile[];
    
    await loadMusicFolder(validFiles);
  }
};

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

const handleSelectSong = async (song: Song) => {
  selectSong(song);
  await playSong(song);
};

const handleWebFileInput = async (files: FileList) => {
  await loadMusicFolder(files);
  if (playlist.value.length > 0) {
    playSong(playlist.value[0]);
  }
};

const togglePlaylistSidebar = () => {
  showPlaylist.value = !showPlaylist.value;
};

const handleStartPlayback = () => {
  if (playlist.value.length > 0) {
    selectSong(playlist.value[0]);
  }
};

const handleMinimize = () => {
  if (window.electron) {
    window.electron.minimizeWindow();
  }
};

const handleMaximize = () => {
  if (window.electron) {
    window.electron.maximizeWindow();
  }
};

const handleClose = () => {
  if (window.electron) {
    window.electron.closeWindow();
  }
};

const handleDragWindow = () => {
  if (window.electron) {
    window.electron.dragWindow();
  }
};
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden flex flex-col">
    <div 
      class="absolute inset-0 transition-all duration-1000"
      :class="musicLoaded ? '' : 'bg-white'"
      :style="backgroundStyle"
    ></div>
    
    <div 
      v-if="musicLoaded" 
      class="absolute inset-0 backdrop-blur-xl bg-black/50"
    ></div>

    <div class="absolute top-0 left-0 right-0 z-30 h-10 window-title-bar flex items-center justify-between" @mousedown="handleDragWindow">
      <div class="px-4 select-none">
      </div>
      
      <!-- Window Control Buttons -->
      <div class="flex p-2 space-x-1 mr-2">
        <button 
          @click="handleMinimize" 
          class="modern-window-btn" 
          title="Minimize"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button 
          @click="handleMaximize" 
          class="modern-window-btn" 
          title="Maximize"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="1"></rect>
          </svg>
        </button>
        <button 
          @click="handleClose" 
          class="modern-window-btn close-btn" 
          title="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="relative z-10 flex flex-col w-full h-full pt-10">
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
      
      <div class="w-full h-full flex flex-col relative">
        <button 
          v-if="!showPlaylist"
          @click="togglePlaylistSidebar"
          class="absolute left-6 z-20 p-2 rounded-full"
          :class="musicLoaded ? 'text-white hover:bg-white/10' : 'hover:bg-gray-100'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        <div v-if="isLoading" 
          class="absolute top-4 right-6 z-20 flex items-center p-2 rounded-full"
          :class="musicLoaded ? 'text-white bg-white/10' : 'text-gray-700 bg-gray-100'">
          <div class="animate-spin mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          </div>
          <span class="text-sm font-medium">Loading music...</span>
        </div>
        
        <MusicPlayer
          :current-song="currentSong"
          :is-playing="isPlaying"
          :volume="volume"
          :current-time="currentTime"
          :duration="duration"
          :cover-image="coverImage"
          :progress-percentage="progressPercentage"
          :music-loaded="musicLoaded"
          :playlist="playlist"
          :is-loading="isLoading"
          @previous="playPrevious"
          @toggle-play="togglePlayPause"
          @next="playNext"
          @seek="seek"
          @update:volume="setVolume"
          @select-folder="handleSelectFolder"
          @start-playback="handleStartPlayback"
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

.window-title-bar {
  -webkit-app-region: drag;
  user-select: none;
}

.modern-window-btn {
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 20px;
  background: transparent;
  color: rgb(158, 158, 158);
  transition: all 0.2s;
}

.modern-window-btn:hover {
  background-color: rgba(150, 150, 150, 0.2);
  color: #333;
}

.modern-window-btn.close-btn:hover {
  background-color: #e81123;
  color: white;
}

.backdrop-blur-xl .modern-window-btn {
  color: rgba(255, 255, 255, 0.7);
}

.backdrop-blur-xl .modern-window-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.backdrop-blur-xl .modern-window-btn.close-btn:hover {
  background-color: #e81123;
  color: white;
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