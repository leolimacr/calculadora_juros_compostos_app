import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // <--- ISSO É O QUE CONSERTA A TELA BRANCA NO ANDROID
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});