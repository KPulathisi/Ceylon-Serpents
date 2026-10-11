<script setup>
/** Shows the movement video when one has been added (via the admin panel), otherwise the animated diagram. */
import { computed, ref } from 'vue'
import BehaviorDiagram from './BehaviorDiagram.vue'
import { useLanguage } from '../composables/useLanguage.js'
import { useData } from '../composables/useData.js'

const props = defineProps({ mode: { type: Object, required: true } })
const { t, l, lang } = useLanguage()
const { getSpecies } = useData()
const failed = ref(false)
const src = computed(() => (props.mode.video ? `${import.meta.env.BASE_URL}${props.mode.video}` : ''))
const example = computed(() => getSpecies(props.mode.example))
const exName = computed(() => (example.value ? (lang.value === 'en' ? example.value.names.en : example.value.names[lang.value]?.text || example.value.names.en) : ''))
const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
</script>

<template>
  <figure v-if="src && !failed" class="vid">
    <video :src="src" :autoplay="!reduced" muted loop playsinline controls preload="metadata" :aria-label="mode.alt" @error="failed = true"></video>
    <figcaption>
      <span>{{ l(mode.name) }}</span>
      <span v-if="example">{{ t('knowledge.example') }}: <RouterLink :to="`/species/${example.id}`">{{ exName }}</RouterLink></span>
      <span v-if="mode.videoAi" class="ai">{{ t('knowledge.videoAi') }}</span>
    </figcaption>
  </figure>
  <div v-else>
    <BehaviorDiagram :mode="mode" />
    <p v-if="example" class="ex">{{ t('knowledge.example') }}: <RouterLink :to="`/species/${example.id}`">{{ exName }}</RouterLink></p>
  </div>
</template>

<style scoped>
.vid { margin: 0; border: 1px solid var(--line); background: var(--paper); }
video { width: 100%; display: block; aspect-ratio: 16 / 9; object-fit: cover; background: #1b2a20; }
figcaption { display: flex; flex-wrap: wrap; gap: .3rem 1rem; padding: .6rem .8rem; font-size: var(--step--1); border-top: 1px solid var(--line); }
.ai { color: var(--bark); font-style: italic; }
.ex { font-size: var(--step--1); margin: .5rem 0 0; color: var(--ink-soft); }
</style>
