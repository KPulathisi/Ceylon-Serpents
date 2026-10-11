import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import adminPlugin from './admin/vite-admin-plugin.js'

// base './' + hash routing = works on GitHub Pages, Cloudflare Pages and Vercel without rewrites.
// adminPlugin only runs under `npm run dev`; it is never part of the production build.
export default defineConfig({
  base: './',
  plugins: [vue(), adminPlugin()],
  build: { chunkSizeWarningLimit: 900 }
})
