<script setup>
import { ref } from 'vue'
import BehaviorDiagram from '../components/BehaviorDiagram.vue'
import MythFactCard from '../components/MythFactCard.vue'
import { useData, imageSet } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'

const { t, l, lang } = useLanguage()
const { behavior, myths, articles } = useData()
const kinds = ['all', 'folklore', 'cultural', 'unsupported']
const kind = ref('all')
const img = (f) => imageSet(f)
</script>

<template>
  <div>
    <header class="page-head wrap">
      <h1>{{ t('knowledge.title') }}</h1>
      <p class="lede">{{ t('knowledge.lede') }}</p>
      <nav class="jump">
        <RouterLink :to="{ hash: '#behaviour' }">{{ t('knowledge.behaviour') }}</RouterLink>
        <RouterLink :to="{ hash: '#movement' }">{{ t('knowledge.movement') }}</RouterLink>
        <RouterLink :to="{ hash: '#myths' }">{{ t('knowledge.myths') }}</RouterLink>
        <RouterLink :to="{ hash: '#articles' }">{{ t('knowledge.articles') }}</RouterLink>
      </nav>
    </header>

    <section id="behaviour" class="section wrap">
      <h2>{{ t('knowledge.behaviour') }}</h2>
      <p v-if="lang !== 'en'" class="tnote">{{ t('common.englishOnly') }}</p>
      <div class="topics">
        <article v-for="tp in behavior.topics" :key="tp.id" class="topic">
          <h3>{{ l(tp.title) }}</h3>
          <p lang="en">{{ tp.en }}</p>
        </article>
      </div>
    </section>

    <section id="movement" class="section band">
      <div class="wrap">
        <h2>{{ t('knowledge.movement') }}</h2>
        <p class="note">{{ t('knowledge.movementNote') }}</p>
        <div class="moves">
          <div v-for="m in behavior.locomotion" :key="m.id" class="move">
            <BehaviorDiagram :mode="m" />
            <p>{{ l(m) }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="myths" class="section wrap">
      <h2>{{ t('knowledge.myths') }}</h2>
      <div class="kinds" role="group">
        <button v-for="k in kinds" :key="k" class="chip" :aria-pressed="kind === k" @click="kind = k">{{ k === 'all' ? t('library.any') : t('knowledge.kinds.' + k) }}</button>
      </div>
      <div class="grid-auto">
        <MythFactCard v-for="m in myths.filter((x) => kind === 'all' || x.kind === kind)" :key="m.id" :myth="m" detailed />
      </div>
    </section>

    <section id="articles" class="section wrap">
      <h2>{{ t('knowledge.articles') }}</h2>
      <div class="articles">
        <RouterLink v-for="a in articles" :key="a.id" :to="`/knowledge/${a.id}`" class="art">
          <img :src="img(a.image).src" :srcset="img(a.image).srcset" sizes="(min-width: 900px) 25vw, 100vw" alt="" loading="lazy" />
          <h3>{{ l(a.title) }}</h3>
          <p>{{ a.lede }}</p>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.jump { display: flex; flex-wrap: wrap; gap: .5rem 1.25rem; margin-top: 1.25rem; font-size: var(--step--1); }
.topics { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 0 2.5rem; }
.topic { border-top: 1px solid var(--charcoal); padding-top: .9rem; margin-top: 1.2rem; }
.topic h3 { margin-bottom: .3rem; }
.band { background: var(--sage-soft); }
.note { max-width: 70ch; color: var(--ink-soft); }
.moves { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; margin-top: 1.5rem; }
.move p { margin-top: .8rem; font-size: var(--step--1); }
@media (max-width: 760px) { .moves { grid-template-columns: 1fr; } }
.kinds { display: flex; flex-wrap: wrap; gap: .45rem; margin-bottom: 1.5rem; }
.articles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 1.75rem; }
.art { text-decoration: none; color: var(--charcoal); display: grid; gap: .5rem; align-content: start; }
.art img { aspect-ratio: 4/3; object-fit: cover; width: 100%; }
.art h3 { margin: .4rem 0 0; color: var(--forest-deep); }
.art:hover h3 { text-decoration: underline; }
.art p { font-size: var(--step--1); color: var(--ink-soft); margin: 0; }
</style>
