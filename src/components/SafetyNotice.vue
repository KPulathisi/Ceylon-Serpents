<script setup>
import { ShieldAlert } from 'lucide-vue-next'
import { useLanguage } from '../composables/useLanguage.js'
const { t, lang } = useLanguage()
defineProps({ compact: Boolean })
</script>

<template>
  <aside class="notice" :class="{ compact }" role="note">
    <ShieldAlert class="icon" aria-hidden="true" />
    <div>
      <p>{{ t('safety.notice') }}</p>
      <p v-if="lang !== 'en'" class="tnote">{{ t('common.draft') }}</p>
      <RouterLink to="/safety" class="link">{{ t('safety.bitten') }}</RouterLink>
    </div>
  </aside>
</template>

<style scoped>
.notice { display: flex; gap: .9rem; padding: 1rem 1.15rem; border: 1.5px solid var(--alert); border-left-width: 6px; background: #f7eadf; border-radius: var(--radius-s); color: var(--charcoal); }
.notice p { margin: 0 0 .5rem; font-size: var(--step--1); max-width: none; }
.icon { flex: none; width: 1.5rem; height: 1.5rem; color: var(--alert); margin-top: .1rem; }
.link { font-weight: 600; color: var(--alert); font-size: var(--step--1); }
</style>
