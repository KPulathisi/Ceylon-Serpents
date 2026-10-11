<script setup>
import { useLanguage } from '../composables/useLanguage.js'
const { lang, t, LANGS } = useLanguage()
</script>

<template>
  <div class="lang" role="group" :aria-label="t('nav.language')">
    <button
      v-for="l in LANGS"
      :key="l.code"
      :lang="l.code"
      :aria-pressed="lang === l.code"
      :title="l.label"
      @click="lang = l.code"
    >
      <span aria-hidden="true">{{ l.short }}</span>
      <span class="sr-only">{{ l.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.lang { display: flex; border: 1px solid var(--line); border-radius: 999px; padding: 2px; background: var(--paper); }
button { border: 0; background: none; font: 600 0.85rem/1 var(--sans); padding: .5rem .7rem; border-radius: 999px; cursor: pointer; color: var(--ink-soft); }
button[lang='si'] { font-family: 'Noto Sans Sinhala', sans-serif; }
button[lang='ta'] { font-family: 'Noto Sans Tamil', sans-serif; }
button[aria-pressed='true'] { background: var(--forest); color: var(--paper); }
</style>
