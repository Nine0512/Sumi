<script setup lang="ts">
import { toRefs } from 'vue';

const props = defineProps<{
  currentTime: string;
  duration: string;
  progress: number;
  lightTheme?: boolean;
}>();

const emit = defineEmits<{
  seek: [percentage: number];
}>();

const { currentTime, duration, progress, lightTheme } = toRefs(props);

const handleSeek = (event: MouseEvent) => {
  const progressBar = event.currentTarget as HTMLElement;
  const rect = progressBar.getBoundingClientRect();
  const clickPosition = event.clientX - rect.left;
  const percentage = (clickPosition / rect.width) * 100;
  emit('seek', percentage);
};
</script>

<template>
  <div class="w-full mb-4">
    <div class="relative h-1 rounded-full cursor-pointer group" 
         :class="lightTheme ? 'bg-gray-200' : 'bg-white/20'"
         @click="handleSeek">
      <div class="absolute top-0 left-0 h-1 rounded-full"
           :class="lightTheme ? 'bg-blue-500' : 'bg-white'"
           :style="{ width: `${progress}%` }"></div>
      <div class="h-3 w-3 rounded-full absolute top-1/2 -translate-y-1/2 shadow-md opacity-100"
           :class="lightTheme ? 'bg-blue-500' : 'bg-white'"
           :style="{ left: `calc(${progress}% - 6px)` }"></div>
    </div>
    <div class="flex justify-between mt-2 text-sm"
         :class="lightTheme ? 'text-gray-600' : 'text-gray-300'">
      <span>{{ currentTime }}</span>
      <span>{{ duration }}</span>
    </div>
  </div>
</template>