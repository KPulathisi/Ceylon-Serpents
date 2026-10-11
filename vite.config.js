import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' + hash routing = works on GitHub Pages, Cloudflare Pages and Vercel without rewrites
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: { chunkSizeWarningLimit: 900 }
})
