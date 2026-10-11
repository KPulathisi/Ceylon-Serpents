<script setup>
import { computed } from 'vue'
import { TriangleAlert, CircleAlert, Info, Leaf } from 'lucide-vue-next'
import { useLanguage } from '../composables/useLanguage.js'

const props = defineProps({ level: { type: String, required: true } })
const { t } = useLanguage()
// Icon shape + text carry the meaning; colour is only reinforcement
const icon = computed(() => ({ high: TriangleAlert, moderate: CircleAlert, low: Info, none: Leaf }[props.level]))
</script>

<template>
  <span :class="['badge', level]">
    <component :is="icon" aria-hidden="true" />
    {{ t('medical.' + level) }}
  </span>
</template>

<style scoped>
.badge { display: inline-flex; align-items: center; gap: .35rem; font-size: .78rem; font-weight: 600; line-height: 1.2; padding: .28rem .6rem; border-radius: 2px; border: 1px solid currentColor; background: var(--paper); }
.badge svg { width: 1em; height: 1em; flex: none; }
.high { color: var(--alert); }
.moderate { color: #8a4b12; }
.low { color: var(--bark); }
.none { color: var(--forest); }
</style>
