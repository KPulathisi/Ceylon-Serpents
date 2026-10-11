import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'

// Hash history keeps direct refreshes working on any static host without rewrite rules.
const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/library', name: 'library', component: () => import('./pages/SnakeLibraryPage.vue') },
  { path: '/species/:id', name: 'species', component: () => import('./pages/SpeciesDetailPage.vue'), props: true },
  { path: '/compare', name: 'compare', component: () => import('./pages/ComparePage.vue') },
  { path: '/identify', name: 'identify', component: () => import('./pages/ImageMatchingPage.vue') },
  { path: '/habitats/:id?', name: 'habitats', component: () => import('./pages/HabitatExplorerPage.vue'), props: true },
  { path: '/knowledge', name: 'knowledge', component: () => import('./pages/KnowledgeCornerPage.vue') },
  { path: '/knowledge/:id', name: 'article', component: () => import('./pages/ArticlePage.vue'), props: true },
  { path: '/collection', name: 'collection', component: () => import('./pages/CollectionPage.vue') },
  // The safety page is bundled eagerly-small and never depends on images or the matcher
  { path: '/safety', name: 'safety', component: () => import('./pages/EmergencyInformationPage.vue') },
  { path: '/sources', name: 'sources', component: () => import('./pages/SourcesPage.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash && to.hash.length > 1 && !to.hash.startsWith('#/')) return { el: to.hash }
    return { top: 0 }
  }
})
