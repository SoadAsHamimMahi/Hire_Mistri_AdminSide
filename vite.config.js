import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        // Strip debugger statements so the app never pauses in production
        generatedCode: { constBindings: true },
      },
    },
    esbuild: {
      drop: ['debugger'],
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        // Backend runs on PORT from server .env (default 5000)
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
