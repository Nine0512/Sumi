<script setup lang="ts">
import { toRefs } from 'vue';

const props = defineProps<{
  isPlaying: boolean;
  lightTheme?: boolean;
}>();

const emit = defineEmits<{
  previous: [];
  togglePlay: [];
  next: [];
}>();

const { isPlaying, lightTheme } = toRefs(props);
</script>

<template>
  <div class="flex items-center justify-center space-x-6 mt-4">
    <!-- Previous Button -->
    <button @click="$emit('previous')" 
            :class="[
              'p-3 rounded-full transition-colors',
              lightTheme ? 'hover:bg-gray-100' : 'hover:bg-white/10'
            ]"
            aria-label="Previous">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="19 20 9 12 19 4 19 20"></polygon>
        <line x1="5" y1="19" x2="5" y2="5"></line>
      </svg>
    </button>

    <!-- Play/Pause Button -->
    <button @click="$emit('togglePlay')"
      :class="[
        'p-4 rounded-full transition-colors',
        lightTheme ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white text-black hover:bg-gray-200'
      ]"
      aria-label="Play/Pause">
      <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>
    </button>

    <!-- Next Button -->
    <button @click="$emit('next')" 
            :class="[
              'p-3 rounded-full transition-colors',
              lightTheme ? 'hover:bg-gray-100' : 'hover:bg-white/10'
            ]" 
            aria-label="Next">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 4 15 12 5 20 5 4"></polygon>
        <line x1="19" y1="5" x2="19" y2="19"></line>
      </svg>
    </button>
  </div>
</template>