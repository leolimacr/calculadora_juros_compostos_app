import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // A chave da correção está nesta linha:
  build: {
    target: 'esnext' // ✅ Torna o ambiente de build compatível com top-level await
  }
})