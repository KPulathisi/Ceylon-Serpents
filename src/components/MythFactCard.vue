<script setup>
import { ref, computed } from 'vue'
import { useLanguage } from '../composables/useLanguage.js'
import { useData } from '../composables/useData.js'

const props = defineProps({ myth: { type: Object, required: true }, detailed: Boolean })
const { t, l, lang } = useLanguage()
const { getSource } = useData()
const open = ref(false)
const refs = computed(() => props.myth.refs.map(getSource).filter(Boolean))
</script>

<template>
  <article :class="['myth', myth.kind, { open }]">
    <span class="kind">{{ t('knowledge.kinds.' + myth.kind) }}</span>
    <h3 class="claim">“{{ l(myth.claim) }}”</h3>
    <button class="toggle" :aria-expanded="open" @click="open = !open">
      {{ open ? t('common.back') : t('knowledge.evidence') }}
    </button>
    <div v-show="open" class="answer">
      <p v-if="lang !== 'en'" class="tnote">{{ t('common.englishOnly') }}</p>
      <template v-if="detailed">
        <h4>{{ t('knowledge.context') }}</h4>
        <p>{{ myth.context }}</p>
      </template>
      <h4>{{ t('knowledge.evidence') }}</h4>
      <p>{{ myth.evidence }}</p>
      <h4>{{ t('knowledge.plain') }}</h4>
      <p>{{ myth.explanation }}</p>
      <p v-if="refs.length" class="refs">
        {{ t('common.references') }}:
        <template v-for="(r, i) in refs" :key="r.id"><a :href="r.url" target="_blank" rel="noopener">{{ r.publisher }}</a><span v-if="i < refs.length - 1">, </span></template>
      </p>
    </div>
  </article>
</template>

<style scoped>
.myth { background: var(--paper); border: 1px solid var(--line); padding: 1.25rem 1.25rem 1.1rem; display: flex; flex-direction: column; gap: .6rem; position: relative; }
.myth::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 4px; background: var(--sage); }
.myth.unsupported::before { background: var(--bark); }
.myth.cultural::before { background: var(--leaf); }
.myth.folklore::before { background: var(--forest); }
.kind { font-size: .78rem; font-weight: 600; color: var(--ink-soft); }
.claim { font-family: var(--serif); font-size: var(--step-1); font-weight: 600; margin: 0; line-height: 1.25; }
.toggle { align-self: flex-start; font: 600 var(--step--1)/1 var(--sans); background: none; border: 0; border-bottom: 1.5px solid var(--forest); color: var(--forest); padding: .2rem 0; cursor: pointer; }
.answer h4 { font-family: var(--sans); font-size: .8rem; font-weight: 600; color: var(--bark); margin: .8rem 0 .2rem; }
.answer p { margin: 0; font-size: var(--step--1); }
.refs { margin-top: .8rem !important; color: var(--ink-soft); }
</style>
