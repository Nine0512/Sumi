<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import * as musicMetadata from 'music-metadata-browser';
import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }

  interface File {
    metadata?: {
      title: string;
      artist: string;
      duration: string;
      cover: string;
      album?: string;
    };
  }
}

window.Buffer = Buffer;

// State management
const playlist = ref<File[]>([]);
const currentAudio = ref<HTMLAudioElement | null>(null);
const currentSong = ref<File | null>(null);
const currentDuration = ref<string | null>(null);
const currentTime = ref<string>('0:00');
const coverImage = ref<string | null>(null);
const volume = ref<number>(0.8);
const isPlaying = ref<boolean>(false);
const showPlaylist = ref<boolean>(true);
const currentTimeSeconds = ref<number>(0);
const isLoading = ref<boolean>(false);
const musicLoaded = ref<boolean>(false);

// Computed properties for styling
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

const progressPercentage = computed(() => {
  if (currentAudio.value) {
    return (currentTimeSeconds.value / (currentAudio.value.duration || 1)) * 100;
  }
  return 0;
});

// Function to handle folder selection and generate playlist
const handleFolderInput = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;

  isLoading.value = true;

  const folder = input.files;
  const audioFiles = Array.from(folder).filter(file => file.type.startsWith('audio/'));

  // Extract metadata in parallel
  const processedFiles = await Promise.all(
    audioFiles.map(async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const metadata = await musicMetadata.parseBlob(new Blob([arrayBuffer]));

        const coverBlob = metadata.common.picture?.[0]
          ? new Blob([metadata.common.picture[0].data], { type: metadata.common.picture[0].format })
          : null;

        return Object.assign(file, {
          metadata: {
            title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
            artist: metadata.common.artist || 'Unknown Artist',
            album: metadata.common.album || 'Unknown Album',
            duration: formatDuration(metadata.format.duration || 0),
            cover: coverBlob
              ? URL.createObjectURL(coverBlob)
              : '/path/to/default-cover.jpg',
          }
        });
      } catch (err) {
        console.error(`Failed to parse metadata for ${file.name}`, err);
        return Object.assign(file, {
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: '0:00',
            cover: '/path/to/default-cover.jpg',
          }
        });
      }
    })
  );

  playlist.value = processedFiles;

  if (playlist.value.length > 0) {
    const firstSong = playlist.value[0];
    currentSong.value = firstSong;
    coverImage.value = firstSong.metadata?.cover || '/path/to/default-cover.jpg';
    currentDuration.value = firstSong.metadata?.duration || '0:00';
    musicLoaded.value = true;
  }

  isLoading.value = false;
};


// Helper function to format duration
const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

// Function to play a selected song
const playSong = async (file: File) => {
  if (currentAudio.value) {
    currentAudio.value.pause();
  }
  
  const audioUrl = URL.createObjectURL(file);
  currentAudio.value = new Audio(audioUrl);
  currentAudio.value.volume = volume.value;
  
  try {
    await currentAudio.value.play();
    isPlaying.value = true;
  } catch (error) {
    console.error('Failed to play audio:', error);
    isPlaying.value = false;
  }
  
  currentSong.value = file;

  // Update duration when metadata is loaded
  currentAudio.value.onloadedmetadata = () => {
    const duration = currentAudio.value?.duration || 0;
    currentDuration.value = formatDuration(duration);
  };

  // Update current time during playback
  currentAudio.value.ontimeupdate = () => {
    const current = currentAudio.value?.currentTime || 0;
    currentTime.value = formatDuration(current);
    currentTimeSeconds.value = current; // Store the actual seconds for reactive updates
  };

  // Handle end of song
  currentAudio.value.onended = () => {
    playNext();
  };

  // Set cover image
  coverImage.value = file.metadata?.cover || '/path/to/default-cover.jpg';
};

// Function to toggle play/pause
const togglePlayPause = async () => {
  if (!currentAudio.value && currentSong.value) {
    await playSong(currentSong.value);
    return;
  }
  
  if (currentAudio.value) {
    if (currentAudio.value.paused) {
      await currentAudio.value.play();
      isPlaying.value = true;
    } else {
      currentAudio.value.pause();
      isPlaying.value = false;
    }
  }
};

// Function to play the next song
const playNext = () => {
  if (currentSong.value && playlist.value.length > 1) {
    const currentIndex = playlist.value.findIndex(song => song === currentSong.value);
    const nextIndex = (currentIndex + 1) % playlist.value.length;
    playSong(playlist.value[nextIndex]);
  }
};

// Function to play the previous song
const playPrevious = () => {
  if (currentSong.value && playlist.value.length > 1) {
    const currentIndex = playlist.value.findIndex(song => song === currentSong.value);
    const previousIndex = (currentIndex - 1 + playlist.value.length) % playlist.value.length;
    playSong(playlist.value[previousIndex]);
  }
};

// Function to adjust volume
const adjustVolume = (event: Event) => {
  const input = event.target as HTMLInputElement;
  volume.value = parseFloat(input.value);
  if (currentAudio.value) {
    currentAudio.value.volume = volume.value;
  }
};

// Function to seek playback
const seekPlayback = (event: MouseEvent) => {
  if (currentAudio.value) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    currentAudio.value.currentTime = percentage * (currentAudio.value.duration || 0);
  }
};

// Toggle playlist visibility
const togglePlaylist = () => {
  showPlaylist.value = !showPlaylist.value;
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
      <div :class="[
        musicLoaded ? 'bg-black/40 backdrop-blur-md text-white' : 'bg-white shadow-md text-gray-800',
        'absolute top-0 bottom-0 left-0 z-30 transition-all duration-300',
        showPlaylist ? 'translate-x-0' : '-translate-x-full'
      ]" style="width: 320px;">
        <div class="p-6" v-if="showPlaylist">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold">Playlist</h2>
            <button @click="togglePlaylist" :class="[
              'p-2 rounded-full transition-colors',
              musicLoaded ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            ]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
            </button>
          </div>

          <!-- File input for loading songs -->
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
              <div class="flex items-center animate-pulse">
                <div class="w-10 h-10 rounded mr-3" :class="musicLoaded ? 'bg-white/20' : 'bg-gray-200'"></div>
                <div class="flex-1">
                  <div class="h-4 rounded w-3/4 mb-2" :class="musicLoaded ? 'bg-white/20' : 'bg-gray-200'"></div>
                  <div class="h-3 rounded w-1/2" :class="musicLoaded ? 'bg-white/10' : 'bg-gray-100'"></div>
                </div>
              </div>
              <div class="flex items-center animate-pulse">
                <div class="w-10 h-10 rounded mr-3" :class="musicLoaded ? 'bg-white/20' : 'bg-gray-200'"></div>
                <div class="flex-1">
                  <div class="h-4 rounded w-2/3 mb-2" :class="musicLoaded ? 'bg-white/20' : 'bg-gray-200'"></div>
                  <div class="h-3 rounded w-1/2" :class="musicLoaded ? 'bg-white/10' : 'bg-gray-100'"></div>
                </div>
              </div>
              <div class="flex items-center animate-pulse">
                <div class="w-10 h-10 rounded mr-3" :class="musicLoaded ? 'bg-white/20' : 'bg-gray-200'"></div>
                <div class="flex-1">
                  <div class="h-4 rounded w-4/5 mb-2" :class="musicLoaded ? 'bg-white/20' : 'bg-gray-200'"></div>
                  <div class="h-3 rounded w-1/2" :class="musicLoaded ? 'bg-white/10' : 'bg-gray-100'"></div>
                </div>
              </div>
            </div>

            <!-- Song list (displayed when not loading) -->
            <ul v-else class="space-y-2">
              <li v-for="(song, index) in playlist" :key="index" @click="playSong(song)" :class="[
                'flex items-center p-3 rounded-lg cursor-pointer transition-colors',
                currentSong === song 
                  ? (musicLoaded ? 'bg-white/20' : 'bg-blue-50 border border-blue-200') 
                  : (musicLoaded ? 'hover:bg-white/10' : 'hover:bg-gray-100')
              ]">
                <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0 mr-3">
                  <img :src="song.metadata?.cover || '/path/to/default-cover.jpg'" alt="Cover"
                    class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ song.metadata?.title }}</p>
                  <p class="text-xs truncate" :class="musicLoaded ? 'text-gray-300' : 'text-gray-500'">{{ song.metadata?.artist }}</p>
                </div>
                <div class="text-xs ml-2" :class="musicLoaded ? 'text-gray-400' : 'text-gray-500'">{{ song.metadata?.duration }}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Music Player Section -->
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

        <!-- Music Display -->
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
            <p :class="musicLoaded ? 'text-gray-300' : 'text-gray-600'" class="mb-6">{{ currentSong.metadata?.artist }}</p>

            <!-- Progress Bar -->
            <div class="w-full mb-4">
              <div class="relative h-1 rounded-full cursor-pointer group" 
                   :class="musicLoaded ? 'bg-white/20' : 'bg-gray-200'"
                   @click="seekPlayback">
                <div class="absolute top-0 left-0 h-1 rounded-full"
                     :class="musicLoaded ? 'bg-white' : 'bg-blue-500'"
                     :style="{ width: `${progressPercentage}%` }"></div>
                <div class="h-3 w-3 rounded-full absolute top-1/2 -translate-y-1/2 shadow-md opacity-100"
                     :class="musicLoaded ? 'bg-white' : 'bg-blue-500'"
                     :style="{ left: `calc(${progressPercentage}% - 6px)` }"></div>
              </div>
              <div class="flex justify-between mt-2 text-sm"
                   :class="musicLoaded ? 'text-gray-300' : 'text-gray-600'">
                <span>{{ currentTime }}</span>
                <span>{{ currentDuration }}</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-center space-x-6 mt-4">
              <!-- Previous Button -->
              <button @click="playPrevious" 
                      :class="[
                        'p-3 rounded-full transition-colors',
                        musicLoaded ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      ]"
                      aria-label="Previous">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="19 20 9 12 19 4 19 20"></polygon>
                  <line x1="5" y1="19" x2="5" y2="5"></line>
                </svg>
              </button>

              <!-- Play/Pause Button -->
              <button @click="togglePlayPause"
                :class="[
                  'p-4 rounded-full transition-colors',
                  musicLoaded ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-500 text-white hover:bg-blue-600'
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
              <button @click="playNext" 
                      :class="[
                        'p-3 rounded-full transition-colors',
                        musicLoaded ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      ]" 
                      aria-label="Next">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4"></polygon>
                  <line x1="19" y1="5" x2="19" y2="19"></line>
                </svg>
              </button>
            </div>

            <!-- Volume Control -->
            <div class="flex items-center justify-center mt-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
              <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="adjustVolume"
                :class="['w-24', musicLoaded ? 'accent-white' : 'accent-blue-500']" />
            </div>
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
      </div>
    </div>
  </div>
</template>

<style>
/* Custom scrollbar styling - dynamically applied based on theme */
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