<script setup>
import { useData } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'
const { t } = useLanguage()
const { sources, imageCredits } = useData()
</script>

<template>
  <div>
    <header class="page-head wrap">
      <h1>{{ t('sources.title') }}</h1>
      <p class="lede">{{ t('sources.lede') }}</p>
    </header>
    <div class="wrap grid">
      <section>
        <p>{{ t('sources.about') }}</p>
        <h2>{{ t('sources.review') }}</h2>
        <p>{{ t('sources.reviewText') }}</p>
        <h2>{{ t('sources.limitations') }}</h2>
        <ul><li v-for="(x, i) in t('sources.limits')" :key="i">{{ x }}</li></ul>
      </section>
      <section>
        <h2>{{ t('sources.references') }}</h2>
        <ol class="refs">
          <li v-for="s in sources" :key="s.id">
            <a :href="s.url" target="_blank" rel="noopener">{{ s.title }}</a>
            <span>{{ s.publisher }}. Accessed {{ s.accessed }}. {{ s.use }}.</span>
          </li>
        </ol>
      </section>
    </div>
    <section class="wrap credits">
      <h2>{{ t('sources.credits') }}</h2>
      <p class="tnote">{{ t('sources.creditNote') }}</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>File</th><th>Subject</th><th>Creator</th><th>Source</th><th>Licence</th></tr></thead>
          <tbody>
            <tr v-for="c in imageCredits" :key="c.id"><td>{{ c.file }}</td><td>{{ c.subject }}</td><td>{{ c.creator }}</td><td>{{ c.source }}</td><td>{{ c.licence }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem, 5vw, 4rem); padding-block: 2.5rem; }
.grid h2, .credits h2 { font-size: var(--step-2); margin-top: 1.5rem; }
.refs { padding-left: 1.2rem; display: grid; gap: .8rem; font-size: var(--step--1); }
.refs span { display: block; color: var(--ink-soft); }
@media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
.credits { padding-bottom: 4rem; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: var(--step--1); min-width: 640px; }
th, td { text-align: left; padding: .6rem .7rem; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--bark); }
</style>
