import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext'
  },
  server: {
    proxy: {
      '/api/market': {
        target: 'https://us-central1-financas-pro-invest.cloudfunctions.net/getMarketData',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/market/, '')
      },
      // 👇 NOVO: proxy para o Banco Central
      '/api-bcb': {
        target: 'https://api.bcb.gov.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-bcb/, '')
      }
    }
  }
})