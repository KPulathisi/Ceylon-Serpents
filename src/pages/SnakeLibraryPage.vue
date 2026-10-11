<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, LayoutGrid, List, Columns3, X } from 'lucide-vue-next'
import SpeciesCard from '../components/SpeciesCard.vue'
import { useData } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'
import { useSpeciesSearch } from '../composables/useSpeciesSearch.js'
import { useLocalCollection } from '../composables/useLocalCollection.js'

const { t, l } = useLanguage()
const { species, habitats } = useData()
const { state, results, active, reset } = useSpeciesSearch(species)
const { compare, setCompare } = useLocalCollection()
const router = useRouter()

function readView() { try { return localStorage.getItem('cs-view') || 'gallery' } catch { return 'gallery' } }
const view = ref(readView())
function setView(v) { view.value = v; try { localStorage.setItem('cs-view', v) } catch { /* ignore */ } }

const groups = ['elapid', 'viper', 'colubrid', 'python', 'blind', 'sea']
const levels = ['high', 'moderate', 'low', 'none']
const goCompare = () => router.push({ path: '/compare', query: { ids: compare.value.join(',') } })
</script>

<template>
  <div>
    <header class="page-head wrap">
      <h1>{{ t('library.title') }}</h1>
      <p class="lede">{{ t('library.lede') }}</p>
    </header>

    <section class="wrap tools" :aria-label="t('library.title')">
      <label class="searchbox">
        <Search aria-hidden="true" />
        <span class="sr-only">{{ t('library.search') }}</span>
        <input v-model="state.query" type="search" :placeholder="t('library.search')" />
      </label>
      <div class="filters">
        <label class="field">{{ t('library.habitat') }}
          <select v-model="state.habitat"><option value="">{{ t('library.any') }}</option><option v-for="h in habitats" :key="h.id" :value="h.id">{{ l(h.name) }}</option></select>
        </label>
        <label class="field">{{ t('library.status') }}
          <select v-model="state.status"><option value="">{{ t('library.any') }}</option><option value="endemic">{{ t('common.endemic') }}</option><option value="native">{{ t('common.native') }}</option></select>
        </label>
        <label class="field">{{ t('library.group') }}
          <select v-model="state.group"><option value="">{{ t('library.any') }}</option><option v-for="g in groups" :key="g" :value="g">{{ t('groups.' + g) }}</option></select>
        </label>
        <label class="field">{{ t('library.medical') }}
          <select v-model="state.medical"><option value="">{{ t('library.any') }}</option><option v-for="m in levels" :key="m" :value="m">{{ t('medical.' + m) }}</option></select>
        </label>
      </div>
      <div class="row">
        <p class="count" aria-live="polite">{{ t('library.count', { n: results.length }) }}</p>
        <button v-if="active" class="btn small ghost" @click="reset"><X aria-hidden="true" />{{ t('library.reset') }}</button>
        <div class="views" role="group">
          <button class="chip" :aria-pressed="view === 'gallery'" @click="setView('gallery')"><LayoutGrid aria-hidden="true" />{{ t('library.gallery') }}</button>
          <button class="chip" :aria-pressed="view === 'list'" @click="setView('list')"><List aria-hidden="true" />{{ t('library.list') }}</button>
        </div>
      </div>
    </section>

    <section class="wrap results">
      <div v-if="results.length" :class="view === 'gallery' ? 'grid-auto' : 'list'">
        <SpeciesCard v-for="s in results" :key="s.id" :species="s" :layout="view" />
      </div>
      <div v-else class="empty">
        <p>{{ t('library.empty') }}</p>
        <button class="btn ghost" @click="reset">{{ t('library.reset') }}</button>
      </div>
    </section>

    <div v-if="compare.length" class="compare-bar" role="region" :aria-label="t('compare.title')">
      <span>{{ t('library.compareHint') }}</span>
      <button class="btn small ghost light-ghost" @click="setCompare([])"><X aria-hidden="true" />{{ t('common.clear') }}</button>
      <button class="btn small light" :disabled="compare.length < 2" @click="goCompare"><Columns3 aria-hidden="true" />{{ t('library.compareBar', { n: compare.length }) }}</button>
    </div>
  </div>
</template>

<style scoped>
.tools { padding-block: 1.5rem; display: grid; gap: 1rem; }
.searchbox { display: flex; align-items: center; gap: .6rem; background: var(--paper); border: 1.5px solid var(--forest); border-radius: 999px; padding: .3rem 1rem; max-width: 640px; }
.searchbox svg { width: 1.2rem; color: var(--forest); flex: none; }
.searchbox input { border: 0; background: transparent; flex: 1; font-size: var(--step-0); padding: .55rem 0; outline: none; }
.searchbox:focus-within { outline: 3px solid var(--leaf); outline-offset: 2px; }
.filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .8rem; }
@media (max-width: 800px) { .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.row { display: flex; align-items: center; gap: .8rem; flex-wrap: wrap; }
.count { margin: 0; font-size: var(--step--1); color: var(--ink-soft); }
.views { margin-left: auto; display: flex; gap: .4rem; }
.views svg { width: 1em; height: 1em; }
.results { padding-bottom: 6rem; }
.list { display: grid; gap: .8rem; }
.empty { padding: 3rem 0; text-align: left; }
.compare-bar { position: fixed; left: 50%; transform: translateX(-50%); bottom: 1rem; z-index: 40; display: flex; align-items: center; gap: .8rem; background: var(--forest-deep); color: var(--paper); padding: .6rem .7rem .6rem 1.1rem; border-radius: 999px; box-shadow: 0 6px 24px rgba(0,0,0,.25); font-size: var(--step--1); max-width: calc(100% - 2rem); flex-wrap: wrap; justify-content: center; }
.light-ghost { color: var(--paper); border-color: rgba(245,240,224,.4); }
@media (max-width: 560px) { .compare-bar span { display: none; } .compare-bar { border-radius: 14px; } }
</style>
