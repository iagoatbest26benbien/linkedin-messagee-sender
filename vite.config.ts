import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src')
    }
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true
  },
  server: {
    port: 3000,
  },
  root: path.join(__dirname, 'src/renderer')
})
