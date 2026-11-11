import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes, scrollBehavior } from './router.js'
import './styles/main.css'

// Old links used hash routing (…/#/species/indian-cobra). Rewrite them to the clean URL before the router starts.
if (!import.meta.env.SSR && typeof location !== 'undefined' && location.hash.startsWith('#/')) {
  history.replaceState(null, '', import.meta.env.BASE_URL + location.hash.slice(2))
}

// Pre-renders every page to HTML at build time (vite-ssg build), and runs as a normal SPA in the browser.
export const createApp = ViteSSG(App, { routes, scrollBehavior, base: import.meta.env.BASE_URL })
