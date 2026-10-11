<script setup>
import { useLanguage } from '../composables/useLanguage.js'
const { t } = useLanguage()
const logo = `${import.meta.env.BASE_URL}logo-mark-192.png`
</script>

<template>
  <footer class="footer">
    <div class="wrap inner">
      <div class="id">
        <img :src="logo" alt="" class="logo" width="96" height="96" loading="lazy" />
        <div>
          <p class="brand">Ceylon Serpents</p>
          <p class="tag">{{ t('tagline') }}</p>
        </div>
      </div>
      <div class="notes">
        <p>{{ t('footer.note') }}</p>
        <p class="links">
          <RouterLink to="/safety">{{ t('nav.bite') }}</RouterLink>
          <RouterLink to="/sources">{{ t('nav.sources') }}</RouterLink>
        </p>
        <p class="small">{{ t('footer.credit') }}</p>
        <p class="small inat"><a href="https://www.inaturalist.org/" target="_blank" rel="noopener">{{ t('footer.inat') }}</a></p>
        <p class="small">{{ t('footer.made') }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer { background: var(--forest-deep); color: var(--sage-soft); padding-block: 3rem; margin-top: 2rem; }
.inner { display: grid; grid-template-columns: 1fr 1.4fr; gap: 2rem; }
.id { display: flex; align-items: center; gap: 1rem; align-self: start; }
.logo { width: 96px; height: 96px; object-fit: contain; flex: none; }
.brand { font-family: 'Abhaya Libre', serif; font-weight: 800; font-size: var(--step-2); color: var(--paper); margin: 0; }
.tag { margin: 0; }
.notes p { margin: 0 0 .5rem; }
.footer a { color: var(--paper); }
.links { display: flex; gap: 1.25rem; flex-wrap: wrap; }
.small { font-size: var(--step--1); opacity: .8; }
@media (max-width: 700px) { .inner { grid-template-columns: 1fr; } }
</style>
