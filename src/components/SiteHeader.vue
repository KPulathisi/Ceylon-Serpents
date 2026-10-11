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

// public/logo.png is used when present; otherwise the drawn mark is shown
const logoSrc = `${import.meta.env.BASE_URL}logo.png`
const logoOk = ref(true)

const links = [
  { to: '/', key: 'home', exact: true },
  { to: '/identify', key: 'identify' },
  { to: '/library', key: 'library' },
  { to: '/habitats', key: 'habitats' },
  { to: '/knowledge', key: 'knowledge' },
  { to: '/sources', key: 'sources' }
]
const isActive = (l) => (l.exact ? route.path === '/' : route.path.startsWith(l.to))
</script>

<template>
  <header :class="['site-header', { long: lang !== 'en' }]">
    <div class="bar wrap">
      <RouterLink to="/" class="brand" aria-label="Ceylon Serpents, home">
        <img v-if="logoOk" :src="logoSrc" alt="" class="logo" @error="logoOk = false" />
        <svg v-else class="mark" viewBox="0 0 40 24" aria-hidden="true"><path d="M2 16c6 0 6-10 12-10s6 10 12 10 6-6 10-6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="36" cy="10" r="2.6" fill="currentColor"/></svg>
        <span class="wordmark">Ceylon<br />Serpents</span>
      </RouterLink>

      <nav :class="['nav', { open }]" :aria-label="t('nav.menu')">
        <ul>
          <li v-for="l in links" :key="l.to">
            <RouterLink :to="l.to" :class="{ 'is-active': isActive(l) }" :aria-current="isActive(l) ? 'page' : null">{{ t('nav.' + l.key) }}</RouterLink>
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
.site-header { position: sticky; top: 0; z-index: 50; background: rgba(236, 229, 207, 0.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }

/* Desktop: one row in English; Sinhala/Tamil labels are longer, so the nav gets its own row instead of disappearing */
.bar { display: grid; grid-template-columns: auto 1fr auto; grid-template-areas: 'brand nav tools'; align-items: center; column-gap: 1.25rem; min-height: 68px; }
.long .bar { grid-template-columns: auto 1fr; grid-template-areas: 'brand tools' 'nav nav'; }
.brand { grid-area: brand; display: flex; align-items: center; gap: .55rem; text-decoration: none; color: var(--forest-deep); }
.logo { height: 44px; width: auto; }
.mark { width: 38px; color: var(--forest); }
.wordmark { font-family: 'Abhaya Libre', serif; font-weight: 800; font-size: 1.02rem; line-height: .95; }
.nav { grid-area: nav; min-width: 0; }
.nav ul { list-style: none; display: flex; gap: .1rem; margin: 0; padding: 0; overflow-x: auto; scrollbar-width: none; }
.nav ul::-webkit-scrollbar { display: none; }
.long .nav ul { padding: .1rem 0 .55rem; margin-left: -.6rem; }
.nav a { display: block; white-space: nowrap; padding: .45rem .65rem; border-radius: 999px; text-decoration: none; color: var(--charcoal); font-size: var(--step--1); }
.nav a:hover { background: var(--sage-soft); color: var(--forest-deep); }
.nav a.is-active { background: var(--forest); color: var(--paper); }
.tools { grid-area: tools; display: flex; align-items: center; gap: .6rem; justify-self: end; }
.bite { display: inline-flex; align-items: center; gap: .4rem; font-size: var(--step--1); font-weight: 600; color: var(--alert); text-decoration: none; padding: .45rem .8rem; border: 1.5px solid var(--alert); border-radius: 999px; background: var(--paper); white-space: nowrap; }
.bite:hover { background: var(--alert); color: var(--paper); }
.bite svg { width: 1.05em; height: 1.05em; }
.menu-btn { display: none; background: none; border: 1px solid var(--line); border-radius: 999px; padding: .45rem; color: var(--forest-deep); cursor: pointer; }
.menu-btn svg { width: 22px; height: 22px; display: block; }
.lang-mobile { display: none; }

/* Mid widths in English: give the nav its own row too */
@media (max-width: 1000px) and (min-width: 761px) {
  .long .nav ul { mask-image: linear-gradient(90deg, #000 90%, transparent); padding-right: 2rem; }
}
@media (max-width: 1180px) {
  .bar { grid-template-columns: auto 1fr; grid-template-areas: 'brand tools' 'nav nav'; }
  .nav ul { padding: .1rem 0 .55rem; margin-left: -.6rem; }
}

/* Phones and small tablets: menu button */
@media (max-width: 760px) {
  .bar, .long .bar { grid-template-columns: auto 1fr; grid-template-areas: 'brand tools'; }
  .menu-btn { display: block; }
  .lang-desktop { display: none; }
  .lang-mobile { display: flex; margin-top: 1rem; }
  .nav { position: absolute; left: 0; right: 0; top: 100%; background: var(--parchment); border-bottom: 1px solid var(--line); padding: 1rem var(--gutter) 1.5rem; display: none; }
  .nav.open { display: block; }
  .nav ul, .long .nav ul { flex-direction: column; overflow: visible; margin: 0; padding: 0; }
  .nav a { font-size: var(--step-0); padding: .6rem .8rem; }
}
@media (max-width: 520px) {
  .bite span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .bite { padding: .5rem; }
  .logo { height: 36px; }
}
</style>
