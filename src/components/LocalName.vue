<script setup>
import { useLanguage } from '../composables/useLanguage.js'
defineProps({ name: { type: Object, required: true }, code: { type: String, required: true }, inline: Boolean })
const { t } = useLanguage()
</script>

<template>
  <span class="lname" :class="{ inline }">
    <template v-if="name.text">
      <span :lang="code">{{ name.text }}</span>
      <abbr v-if="name.status === 'provisional'" class="flag" :title="t('common.provisional')">*<span class="sr-only">{{ t('common.provisional') }}</span></abbr>
    </template>
    <span v-else class="missing">{{ t('common.unavailable') }}</span>
  </span>
</template>

<style scoped>
.flag { color: var(--bark); text-decoration: none; margin-left: .1em; cursor: help; }
.missing { color: var(--ink-soft); font-style: italic; font-size: .9em; }
</style>
