import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: './', // Critical for Electron builds
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Ensure sourcemaps for debugging
    sourcemap: true,
    // Minimize risk of path issues
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
