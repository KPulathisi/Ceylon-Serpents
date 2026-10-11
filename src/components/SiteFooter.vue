<script setup>
import { useLanguage } from '../composables/useLanguage.js'
const { t } = useLanguage()
</script>

<template>
  <footer class="footer">
    <div class="wrap inner">
      <div>
        <p class="brand">Ceylon Serpents</p>
        <p class="tag">{{ t('tagline') }}</p>
      </div>
      <div class="notes">
        <p>{{ t('footer.note') }}</p>
        <p class="links">
          <RouterLink to="/safety">{{ t('nav.bite') }}</RouterLink>
          <RouterLink to="/sources">{{ t('nav.sources') }}</RouterLink>
        </p>
        <p class="small">{{ t('footer.made') }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer { background: var(--forest-deep); color: var(--sage-soft); padding-block: 3rem; margin-top: 2rem; }
.inner { display: grid; grid-template-columns: 1fr 1.4fr; gap: 2rem; }
.brand { font-family: 'Abhaya Libre', serif; font-weight: 800; font-size: var(--step-2); color: var(--paper); margin: 0; }
.tag { margin: 0; }
.notes p { margin: 0 0 .5rem; }
.footer a { color: var(--paper); }
.links { display: flex; gap: 1.25rem; flex-wrap: wrap; }
.small { font-size: var(--step--1); opacity: .8; }
@media (max-width: 700px) { .inner { grid-template-columns: 1fr; } }
</style>
