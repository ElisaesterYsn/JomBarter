import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Proxy /api requests to the NestJS backend during development.
      // This means the browser never makes a cross-origin request — Vite
      // forwards it server-side, so no CORS preflight is needed in dev.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy /uploads so uploaded images served by NestJS ServeStaticModule
      // are reachable from the Vite dev server at localhost:3000/uploads/...
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
