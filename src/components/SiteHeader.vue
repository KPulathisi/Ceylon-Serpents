<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, X, LifeBuoy } from 'lucide-vue-next'
import LanguageSwitcher from './LanguageSwitcher.vue'
import { useLanguage } from '../composables/useLanguage.js'

const { t, lang } = useLanguage()
const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => (open.value = false))

const links = [
  { to: '/', key: 'home' },
  { to: '/identify', key: 'identify' },
  { to: '/library', key: 'library' },
  { to: '/habitats', key: 'habitats' },
  { to: '/knowledge', key: 'knowledge' },
  { to: '/collection', key: 'collection' },
  { to: '/sources', key: 'sources' }
]
</script>

<template>
  <header :class="['site-header', { long: lang !== 'en' }]">
    <div class="bar wrap">
      <RouterLink to="/" class="wordmark" aria-label="Ceylon Serpents, home">
        <svg viewBox="0 0 40 24" aria-hidden="true"><path d="M2 16c6 0 6-10 12-10s6 10 12 10 6-6 10-6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="36" cy="10" r="2.6" fill="currentColor"/></svg>
        <span>Ceylon<br />Serpents</span>
      </RouterLink>

      <nav :class="['nav', { open }]" :aria-label="t('nav.menu')">
        <ul>
          <li v-for="l in links" :key="l.to">
            <RouterLink :to="l.to" :exact-active-class="l.to === '/' ? 'is-active' : ''" :active-class="l.to === '/' ? '' : 'is-active'">{{ t('nav.' + l.key) }}</RouterLink>
          </li>
        </ul>
        <LanguageSwitcher class="lang-mobile" />
      </nav>

      <div class="tools">
        <RouterLink to="/safety" class="bite"><LifeBuoy aria-hidden="true" /><span>{{ t('nav.bite') }}</span></RouterLink>
        <LanguageSwitcher class="lang-desktop" />
        <button class="menu-btn" :aria-expanded="open" @click="open = !open">
          <component :is="open ? X : Menu" aria-hidden="true" />
          <span class="sr-only">{{ t('nav.menu') }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header { position: sticky; top: 0; z-index: 50; background: rgba(236, 229, 207, 0.94); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
.bar { display: flex; align-items: center; gap: 1.5rem; min-height: 68px; }
.wordmark { display: flex; align-items: center; gap: .55rem; text-decoration: none; color: var(--forest-deep); font-family: 'Abhaya Libre', serif; font-weight: 800; font-size: 1.02rem; line-height: .95; }
.wordmark svg { width: 38px; color: var(--forest); }
.nav { flex: 1; }
.nav ul { list-style: none; display: flex; gap: .1rem; margin: 0; padding: 0; flex-wrap: nowrap; }
.nav a { display: block; white-space: nowrap; padding: .45rem .6rem; border-radius: 999px; text-decoration: none; color: var(--charcoal); font-size: var(--step--1); }
.nav a:hover { background: var(--sage-soft); color: var(--forest-deep); }
.nav a.is-active { background: var(--forest); color: var(--paper); }
.tools { display: flex; align-items: center; gap: .6rem; }
.bite { display: inline-flex; align-items: center; gap: .4rem; font-size: var(--step--1); font-weight: 600; color: var(--alert); text-decoration: none; padding: .45rem .8rem; border: 1.5px solid var(--alert); border-radius: 999px; background: var(--paper); white-space: nowrap; }
.bite:hover { background: var(--alert); color: var(--paper); }
.bite svg { width: 1.05em; height: 1.05em; }
.menu-btn { display: none; background: none; border: 1px solid var(--line); border-radius: 999px; padding: .45rem; color: var(--forest-deep); cursor: pointer; }
.menu-btn svg { width: 22px; height: 22px; display: block; }
.lang-mobile { display: none; }

@media (max-width: 1300px) {
  .menu-btn { display: block; }
  .lang-desktop { display: none; }
  .lang-mobile { display: flex; margin-top: 1rem; }
  .nav { position: absolute; left: 0; right: 0; top: 100%; background: var(--parchment); border-bottom: 1px solid var(--line); padding: 1rem var(--gutter) 1.5rem; display: none; }
  .nav.open { display: block; }
  .nav ul { flex-direction: column; }
  .nav a { font-size: var(--step-0); padding: .6rem .8rem; }
  .tools { margin-left: auto; }
}
@media (max-width: 1720px) {
  .site-header.long .menu-btn { display: block; }
  .site-header.long .lang-desktop { display: none; }
  .site-header.long .lang-mobile { display: flex; margin-top: 1rem; }
  .site-header.long .nav { position: absolute; left: 0; right: 0; top: 100%; background: var(--parchment); border-bottom: 1px solid var(--line); padding: 1rem var(--gutter) 1.5rem; display: none; }
  .site-header.long .nav.open { display: block; }
  .site-header.long .nav ul { flex-direction: column; }
  .site-header.long .nav a { font-size: var(--step-0); padding: .6rem .8rem; }
  .site-header.long .tools { margin-left: auto; }
}
@media (max-width: 520px) {
  .bite span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .bite { padding: .5rem; }
}
</style>
