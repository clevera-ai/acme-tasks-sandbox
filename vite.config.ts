import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from https://clevera-ai.github.io/acme-tasks-sandbox/
export default defineConfig({
  base: '/acme-tasks-sandbox/',
  plugins: [react(), tailwindcss()],
})
