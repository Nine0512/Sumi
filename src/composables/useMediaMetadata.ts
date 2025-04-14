import * as musicMetadata from 'music-metadata-browser';
import { ref } from 'vue';
import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

export function useMediaMetadata() {
  const isLoading = ref(false);
  
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const extractMetadata = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const metadata = await musicMetadata.parseBlob(new Blob([arrayBuffer]));

      const coverBlob = metadata.common.picture?.[0]
        ? new Blob([metadata.common.picture[0].data], { type: metadata.common.picture[0].format })
        : null;

      return {
        title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album || 'Unknown Album',
        duration: formatDuration(metadata.format.duration || 0),
        durationSeconds: metadata.format.duration || 0,
        cover: coverBlob
          ? URL.createObjectURL(coverBlob)
          : '',
      };
    } catch (err) {
      console.error(`Failed to parse metadata for ${file.name}`, err);
      return {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: '0:00',
        durationSeconds: 0,
        cover: '',
      };
    }
  };

  const processFiles = async (files: File[]) => {
    isLoading.value = true;
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    const processedFiles = await Promise.all(
      audioFiles.map(async (file) => {
        const fileMetadata = await extractMetadata(file);
        return Object.assign(file, { metadata: fileMetadata });
      })
    );
    
    isLoading.value = false;
    return processedFiles;
  };

  return {
    isLoading,
    formatDuration,
    extractMetadata,
    processFiles
  };
}