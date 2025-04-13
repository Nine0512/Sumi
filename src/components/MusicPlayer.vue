<script setup lang="ts">
import { toRefs, computed } from 'vue';
import ProgressBar from './ProgressBar.vue';
import SongControls from './SongControls.vue';
import VolumeControl from './VolumeControl.vue';

interface SongFile extends File {
  metadata?: {
    title?: string;
    artist?: string;
  };
}

const props = defineProps<{
  currentSong: SongFile | null;
  isPlaying: boolean;
  volume: number;
  currentTime: string;
  duration: string;
  coverImage: string | null;
  progressPercentage: number;
  musicLoaded: boolean;
}>();

const emit = defineEmits<{
  previous: [];
  togglePlay: [];
  next: [];
  seek: [percentage: number];
  'update:volume': [value: number];
}>();

const { 
  currentSong, isPlaying, volume, currentTime, 
  duration, coverImage, progressPercentage, musicLoaded 
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
        <img :src="coverImage" alt="Album Cover" class="w-full h-full object-cover" />
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

    <!-- No song selected state -->
    <div v-else class="text-center" :class="musicLoaded ? 'text-gray-300' : 'text-gray-500'">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
        class="mx-auto mb-4 opacity-50">
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="10 8 16 12 10 16 10 8"></polygon>
      </svg>
      <p class="text-xl font-medium">No song selected</p>
      <p class="mt-2">Select a music folder to get started</p>
    </div>
  </div>
</template>