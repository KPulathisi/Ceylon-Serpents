<script setup>
import { computed } from 'vue'
import { Bookmark, BookmarkCheck, Columns3 } from 'lucide-vue-next'
import SpeciesMedia from './SpeciesMedia.vue'
import MedicalBadge from './MedicalBadge.vue'
import LocalName from './LocalName.vue'
import { useLanguage } from '../composables/useLanguage.js'
import { useLocalCollection } from '../composables/useLocalCollection.js'

const props = defineProps({ species: { type: Object, required: true }, layout: { type: String, default: 'gallery' }, actions: { type: Boolean, default: true }, sizes: { type: String, default: '' } })
const { t, lang } = useLanguage()
const { isSaved, toggleSaved, inCompare, toggleCompare, compare } = useLocalCollection()
const s = computed(() => props.species)
const primary = computed(() => {
  if (lang.value === 'en') return { text: s.value.names.en, lang: 'en' }
  const n = s.value.names[lang.value]
  return n?.text ? { text: n.text, lang: lang.value } : { text: s.value.names.en, lang: 'en' }
})
const secondary = computed(() => (lang.value === 'en' ? s.value.names.si : null))
</script>

<template>
  <article :class="['card', layout]">
    <RouterLink :to="`/species/${s.id}`" class="media-link" tabindex="-1" aria-hidden="true">
      <SpeciesMedia :species="s" :sizes="sizes || (layout === 'list' ? '160px' : '(min-width: 900px) 30vw, 100vw')" />
    </RouterLink>
    <div class="body">
      <h3>
        <RouterLink :to="`/species/${s.id}`" :lang="primary.lang">{{ primary.text }}</RouterLink>
      </h3>
      <p class="latin">{{ s.scientificName }}</p>
      <p v-if="secondary" class="alt"><LocalName :name="secondary" code="si" /></p>
      <div class="meta">
        <MedicalBadge :level="s.medical" />
        <span v-if="s.status === 'endemic'" class="endemic">{{ t('common.endemic') }}</span>
      </div>
      <div v-if="actions" class="actions">
        <button class="mini" :aria-pressed="isSaved('species', s.id)" @click="toggleSaved('species', s.id)">
          <component :is="isSaved('species', s.id) ? BookmarkCheck : Bookmark" aria-hidden="true" />
          {{ isSaved('species', s.id) ? t('common.saved') : t('common.save') }}
          <span class="sr-only">{{ s.names.en }}</span>
        </button>
        <button class="mini" :aria-pressed="inCompare(s.id)" :disabled="!inCompare(s.id) && compare.length >= 3" @click="toggleCompare(s.id)">
          <Columns3 aria-hidden="true" />
          {{ inCompare(s.id) ? t('common.inCompare') : t('common.compare') }}
          <span class="sr-only">{{ s.names.en }}</span>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card { background: var(--paper); border: 1px solid var(--line); display: flex; flex-direction: column; position: relative; transition: border-color .2s; }
.card:hover { border-color: var(--forest); }
.media-link { display: block; }
.body { padding: 1rem 1.1rem 1.1rem; display: flex; flex-direction: column; gap: .2rem; flex: 1; }
h3 { margin: 0; font-size: var(--step-1); }
h3 a { color: var(--forest-deep); text-decoration: none; }
h3 a:hover { text-decoration: underline; }
.latin { margin: 0; color: var(--ink-soft); }
.alt { margin: 0; font-size: var(--step--1); color: var(--ink-soft); }
.meta { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .55rem; align-items: center; }
.endemic { font-size: .78rem; font-weight: 600; color: var(--leaf); border-bottom: 1.5px dotted var(--leaf); }
.actions { display: flex; gap: .4rem; margin-top: auto; padding-top: .9rem; }
.mini { display: inline-flex; align-items: center; gap: .3rem; font: 600 .78rem/1 var(--sans); padding: .45rem .65rem; border: 1px solid var(--line); background: transparent; border-radius: 999px; cursor: pointer; color: var(--charcoal); }
.mini svg { width: 1em; height: 1em; }
.mini[aria-pressed='true'] { background: var(--forest); color: var(--paper); border-color: var(--forest); }
.mini:disabled { opacity: .4; cursor: not-allowed; }

.card.list { flex-direction: row; align-items: stretch; }
.card.list .media-link { width: 160px; flex: none; }
.card.list :deep(.media) { height: 100%; aspect-ratio: auto; min-height: 120px; }
.card.list .body { padding: .8rem 1rem; }
@media (max-width: 520px) { .card.list .media-link { width: 110px; } }
</style>
