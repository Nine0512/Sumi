<script setup lang="ts">
import { toRefs } from 'vue';

const props = defineProps<{
  volume: number;
  lightTheme?: boolean;
}>();

defineEmits<{
  'update:volume': [value: number];
}>();

const { volume, lightTheme } = toRefs(props);
</script>

<template>
  <div class="flex items-center justify-center mt-8">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
    <input 
      type="range" 
      min="0" 
      max="1" 
      step="0.01" 
      :value="volume"
      @input="$emit('update:volume', parseFloat(($event.target as HTMLInputElement).value))"
      :class="['w-24', lightTheme ? 'accent-blue-500' : 'accent-white']" 
    />
  </div>
</template>