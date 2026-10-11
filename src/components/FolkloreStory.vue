<script setup>
import { computed } from 'vue'
import { useLanguage } from '../composables/useLanguage.js'
import { useData } from '../composables/useData.js'

const props = defineProps({ story: { type: Object, required: true }, index: { type: Number, default: 0 } })
const { t, l, lang } = useLanguage()
const { getSpecies } = useData()
const linked = computed(() => props.story.species.map(getSpecies).filter(Boolean))
const nm = (s) => (lang.value === 'en' ? s.names.en : s.names[lang.value]?.text || s.names.en)
</script>

<template>
  <article :class="['story', story.kind]">
    <header>
      <span class="kind">{{ t('knowledge.folk.' + story.kind) }}</span>
      <span class="trad">{{ story.tradition }}</span>
    </header>
    <h3>{{ l(story.title) }}</h3>
    <p class="body" lang="en">{{ story.story }}</p>
    <p class="note" lang="en">{{ story.note }}</p>
    <footer>
      <span v-if="linked.length" class="sp">
        <RouterLink v-for="s in linked" :key="s.id" :to="`/species/${s.id}`">{{ nm(s) }}</RouterLink>
      </span>
      <span v-if="story.refs?.length" class="refs">
        {{ t('knowledge.sources') }}:
        <template v-for="(r, i) in story.refs" :key="r.url"><a :href="r.url" target="_blank" rel="noopener">{{ r.title }}</a><span v-if="i < story.refs.length - 1">; </span></template>
      </span>
    </footer>
  </article>
</template>

<style scoped>
.story { background: var(--paper); border: 1px solid var(--line); padding: clamp(1.25rem, 3vw, 2rem); display: flex; flex-direction: column; gap: .6rem; position: relative; }
.story::after { content: ''; position: absolute; top: 0; left: clamp(1.25rem, 3vw, 2rem); width: 48px; height: 4px; background: var(--leaf); }
.story.belief::after { background: var(--bark); }
.story.tradition::after { background: var(--forest); }
header { display: flex; flex-wrap: wrap; gap: .3rem .9rem; font-size: .8rem; color: var(--ink-soft); margin-top: .4rem; }
.kind { font-weight: 600; color: var(--bark); }
h3 { font-size: var(--step-2); margin: 0; }
.body { font-family: var(--serif); font-size: 1.15rem; line-height: 1.6; margin: 0; }
.note { font-size: var(--step--1); color: var(--ink-soft); font-style: italic; margin: 0; }
footer { display: grid; gap: .4rem; font-size: var(--step--1); margin-top: auto; padding-top: .6rem; border-top: 1px dashed var(--line); }
.sp { display: flex; flex-wrap: wrap; gap: .4rem; }
.sp a { padding: .2rem .6rem; border: 1px solid var(--line); border-radius: 999px; text-decoration: none; background: var(--parchment); }
.refs { color: var(--ink-soft); }
</style>
