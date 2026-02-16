import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/AgenticBot/',   // <-- important for GitHub Pages
  build: {
    outDir: 'dist',
  },
})