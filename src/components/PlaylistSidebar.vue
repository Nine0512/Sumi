<script setup lang="ts">
import { toRefs, computed } from 'vue';
import type { Song } from '../types/electron';

const props = defineProps<{
  playlist: Song[];
  currentSong: Song | null;
  isLoading: boolean;
  showPlaylist: boolean;
  musicLoaded: boolean;
}>();

const emit = defineEmits<{
  'toggle-playlist': [];
  'select-song': [song: Song];
  'load-folder': [files: FileList];
}>();

const { playlist, currentSong, isLoading, showPlaylist, musicLoaded } = toRefs(props);

const isActiveSong = computed(() => (song: Song) => {
  if (!currentSong.value || !song) return false;
  
  const current = currentSong.value;
  
  if ('file' in current && 'file' in song && 
      'path' in current.file && 'path' in song.file) {
    return current.file.path === song.file.path;
  }
  
  const currentMeta = current.metadata;
  const songMeta = song.metadata;
  
  return currentMeta.title === songMeta.title && 
         currentMeta.artist === songMeta.artist && 
         currentMeta.album === songMeta.album &&
         currentMeta.durationSeconds === songMeta.durationSeconds;
});

const handleFolderInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    emit('load-folder', input.files);
  }
};
</script>

<template>
  <div :class="[
    musicLoaded ? 'bg-black/40 backdrop-blur-md text-white' : 'bg-white shadow-md text-gray-800',
    'absolute top-0 bottom-0 left-0 z-30 transition-all duration-300',
    showPlaylist ? 'translate-x-0' : '-translate-x-full'
  ]" style="width: 320px;">
    <div class="p-6" v-if="showPlaylist">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Playlist</h2>
        <button @click="$emit('toggle-playlist')" :class="[
          'p-2 rounded-full transition-colors',
          musicLoaded ? 'hover:bg-white/10' : 'hover:bg-gray-100'
        ]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
      </div>

      <label :class="[
        'flex items-center justify-center w-full p-3 mb-6 border rounded-lg text-sm cursor-pointer transition-colors',
        musicLoaded ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'
      ]">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Select Music Folder
        <input type="file" webkitdirectory directory @change="handleFolderInput" class="hidden" />
      </label>

      <!-- Song list -->
      <div class="overflow-y-auto max-h-[calc(100vh-220px)] pr-2 scrollbar">
        <!-- Loading animation -->
        <div v-if="isLoading" class="py-6 space-y-4">
          <div v-for="i in 3" :key="i" class="flex items-center animate-pulse">
            <div class="w-10 h-10 rounded mr-3" :class="musicLoaded ? 'bg-white/20' : 'bg-gray-200'"></div>
            <div class="flex-1">
              <div class="h-4 rounded w-3/4 mb-2" :class="musicLoaded ? 'bg-white/20' : 'bg-gray-200'"></div>
              <div class="h-3 rounded w-1/2" :class="musicLoaded ? 'bg-white/10' : 'bg-gray-100'"></div>
            </div>
          </div>
        </div>

        <ul v-else class="space-y-2">
          <li v-for="(song, index) in playlist" :key="index" @click="$emit('select-song', song)" :class="[
            'flex items-center p-3 rounded-lg cursor-pointer transition-colors',
            isActiveSong(song)
              ? (musicLoaded ? 'bg-white/30 shadow-lg' : 'bg-blue-50 border border-blue-200') 
              : (musicLoaded ? 'hover:bg-white/10' : 'hover:bg-gray-100')
          ]">
            <div v-if="isActiveSong(song)" class="mr-2 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
              </svg>
            </div>
            
            <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0 mr-3">
              <img :src="song.metadata?.cover" alt="Cover"
                class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ song.metadata?.title }}</p>
              <p class="text-xs truncate" :class="musicLoaded ? 'text-gray-300' : 'text-gray-500'">
                {{ song.metadata?.artist }}
              </p>
            </div>
            <div class="text-xs ml-2" :class="musicLoaded ? 'text-gray-400' : 'text-gray-500'">
              {{ song.metadata?.duration }}
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>