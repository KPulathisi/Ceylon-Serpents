import HomePage from './pages/HomePage.vue'

// Clean URLs (/species/indian-cobra) so search engines can index every page.
// Each route is pre-rendered to its own HTML file at build time (see ssgOptions in vite.config.js).
export const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/library', name: 'library', component: () => import('./pages/SnakeLibraryPage.vue') },
  { path: '/species/:id', name: 'species', component: () => import('./pages/SpeciesDetailPage.vue'), props: true },
  { path: '/compare', name: 'compare', component: () => import('./pages/ComparePage.vue') },
  { path: '/identify', name: 'identify', component: () => import('./pages/ImageMatchingPage.vue') },
  { path: '/habitats/:id?', name: 'habitats', component: () => import('./pages/HabitatExplorerPage.vue'), props: true },
  { path: '/knowledge', name: 'knowledge', component: () => import('./pages/KnowledgeCornerPage.vue') },
  { path: '/knowledge/:id', name: 'article', component: () => import('./pages/ArticlePage.vue'), props: true },
  { path: '/play', name: 'play', component: () => import('./pages/SnakesLaddersPage.vue') },
  // The safety page is bundled eagerly-small and never depends on images or the matcher
  { path: '/safety', name: 'safety', component: () => import('./pages/EmergencyInformationPage.vue') },
  { path: '/sources', name: 'sources', component: () => import('./pages/SourcesPage.vue') },
  // Local admin panel: only exists in `npm run dev`; removed from the production build
  ...(import.meta.env.DEV ? [{ path: '/admin/:section?/:id?', name: 'admin', component: () => import('./admin/AdminApp.vue'), props: true, meta: { admin: true } }] : []),
  { path: '/404', name: 'not-found-page', component: () => import('./pages/NotFoundPage.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./pages/NotFoundPage.vue') }
]

export function scrollBehavior(to, from, saved) {
  if (saved) return saved
  if (to.hash && to.hash.length > 1) return { el: to.hash }
  return { top: 0 }
}
