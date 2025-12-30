
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Garante que arquivos em public/ sejam copiados
  server: {
    host: true, 
    port: 5173
  },
  define: {
    'process.env': process.env
  }
});
