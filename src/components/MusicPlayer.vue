<script setup lang="ts">
import { toRefs, computed } from 'vue';
import ProgressBar from './ProgressBar.vue';
import SongControls from './SongControls.vue';
import VolumeControl from './VolumeControl.vue';
import type { Song } from '../types/electron';

const props = defineProps<{
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: string;
  duration: string;
  coverImage: string | null;
  progressPercentage: number;
  musicLoaded: boolean;
  playlist?: Song[];
  isLoading?: boolean;
}>();

defineEmits<{
  previous: [];
  togglePlay: [];
  next: [];
  seek: [percentage: number];
  'update:volume': [value: number];
  'select-folder': [];
  'start-playback': [];
}>();

const { 
  currentSong, isPlaying, volume, currentTime, 
  duration, coverImage, progressPercentage, musicLoaded,
  playlist, isLoading
} = toRefs(props);

// Determine if we should use the light theme
const lightTheme = computed(() => !musicLoaded.value);
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center p-6"
       :class="musicLoaded ? 'text-white' : 'text-gray-800'">
    <div v-if="currentSong" class="w-full max-w-md text-center">
      <!-- Album Art -->
      <div class="w-64 h-64 mx-auto mb-8 rounded-lg overflow-hidden"
           :class="musicLoaded ? 'shadow-2xl' : 'shadow-md border border-gray-200'">
        <img v-if="coverImage" :src="coverImage" alt="Album Cover" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-black/50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
            class="opacity-40">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
      </div>

      <!-- Song Info -->
      <h2 class="text-2xl font-bold mb-1 truncate">{{ currentSong.metadata?.title }}</h2>
      <p :class="musicLoaded ? 'text-gray-300' : 'text-gray-600'" class="mb-6">
        {{ currentSong.metadata?.artist }}
      </p>

      <!-- Progress Bar -->
      <ProgressBar 
        :current-time="currentTime" 
        :duration="duration" 
        :progress="progressPercentage"
        :light-theme="lightTheme"
        @seek="percentage => $emit('seek', percentage)"
      />

      <!-- Controls -->
      <SongControls 
        :is-playing="isPlaying"
        :light-theme="lightTheme"
        @previous="$emit('previous')"
        @toggle-play="$emit('togglePlay')"
        @next="$emit('next')"
      />

      <!-- Volume Control -->
      <VolumeControl 
        :volume="volume"
        :light-theme="lightTheme"
        @update:volume="value => $emit('update:volume', value)"
      />
    </div>

    <!-- Enhanced default display when no song is selected -->
    <div v-else class="flex flex-col items-center justify-center w-full max-w-md">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center">
        <div class="w-64 h-64 mx-auto mb-8 rounded-lg overflow-hidden flex items-center justify-center animate-pulse"
             :class="musicLoaded ? 'bg-white/10' : 'bg-gray-100 border border-gray-200'">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
            class="opacity-40 animate-spin">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        </div>

        <h2 class="text-2xl font-bold mb-2">Loading your music</h2>
        <p class="mb-6 text-center" :class="musicLoaded ? 'text-gray-300' : 'text-gray-600'">
          Processing audio files, please wait...
        </p>
      </div>

      <!-- Empty state / welcome -->
      <div v-else>
        <div class="w-64 h-64 mx-auto mb-8 rounded-lg overflow-hidden flex items-center justify-center"
             :class="[
               musicLoaded ? 'bg-white/10' : 'bg-gray-100 border border-gray-200',
               'transition-all duration-300'
             ]">
          <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
            class="opacity-40">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>

        <h2 class="text-2xl font-bold mb-2 text-center">Welcome to Sumi Player</h2>
        <p class="mb-6 text-center" :class="musicLoaded ? 'text-gray-300' : 'text-gray-600'">
          Your personal music experience begins by selecting a music folder
        </p>

        <div class="flex space-x-4 justify-center">
          <button @click="$emit('select-folder')" 
                class="flex items-center px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                :class="musicLoaded ? 
                  'bg-white/20 hover:bg-white/30 text-white' : 
                  'bg-blue-500 hover:bg-blue-600 text-white'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Select Music Folder
          </button>

          <button v-if="playlist && playlist.length > 0" 
                @click="$emit('start-playback')" 
                class="flex items-center px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                :class="musicLoaded ? 
                  'bg-white/20 hover:bg-white/30 text-white' : 
                  'bg-green-500 hover:bg-green-600 text-white'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
              class="mr-2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play Music
          </button>
        </div>
        
        <div class="mt-8 text-center px-6 py-4 rounded-lg"
             :class="musicLoaded ? 'bg-white/5' : 'bg-gray-50'">
          <h3 class="font-medium mb-2">Supported formats</h3>
          <p class="text-sm" :class="musicLoaded ? 'text-gray-300' : 'text-gray-500'">
            MP3, FLAC, WAV, OGG, AAC and more
          </p>
        </div>
      </div>
    </div>
  </div>
</template>