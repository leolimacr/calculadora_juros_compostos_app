import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Garante caminhos relativos para assets
  server: {
    host: true, // Necessário para ambientes de container/cloud
    port: 5173
  },
  define: {
    'process.env': process.env
  }
});