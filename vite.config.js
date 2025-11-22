import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
    // Proxy /api requests to the backend to avoid CORS issues during development.
    // Update the target to match your backend/ngrok URL if it changes.
    proxy: {
      '/api': {
        target: 'https://thioacetic-danny-postpositively.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
