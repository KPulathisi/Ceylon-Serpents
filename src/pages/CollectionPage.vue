<script setup>
import { computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import SpeciesCard from '../components/SpeciesCard.vue'
import { useData } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'
import { useLocalCollection } from '../composables/useLocalCollection.js'

const { t, l } = useLanguage()
const { getSpecies, getArticle } = useData()
const { saved, clearSaved, storageAvailable } = useLocalCollection()
const sp = computed(() => saved.value.species.map(getSpecies).filter(Boolean))
const ar = computed(() => saved.value.articles.map(getArticle).filter(Boolean))
const empty = computed(() => !sp.value.length && !ar.value.length)
function clearAll() { if (window.confirm(t('collection.confirm'))) clearSaved() }
</script>

<template>
  <div>
    <header class="page-head wrap">
      <h1>{{ t('collection.title') }}</h1>
      <p class="lede">{{ t('collection.lede') }}</p>
      <p v-if="!storageAvailable" class="tnote">{{ t('common.storageOff') }}</p>
    </header>
    <section class="wrap section-sm">
      <div v-if="empty" class="empty">
        <p>{{ t('collection.empty') }}</p>
        <RouterLink to="/library" class="btn">{{ t('home.ctaLibrary') }}</RouterLink>
      </div>
      <template v-else>
        <div v-if="sp.length" class="grid-auto">
          <SpeciesCard v-for="s in sp" :key="s.id" :species="s" />
        </div>
        <ul v-if="ar.length" class="arts">
          <li v-for="a in ar" :key="a.id"><RouterLink :to="`/knowledge/${a.id}`">{{ l(a.title) }}</RouterLink></li>
        </ul>
        <button class="btn ghost clear" @click="clearAll"><Trash2 aria-hidden="true" />{{ t('collection.clearAll') }}</button>
      </template>
    </section>
  </div>
</template>

<style scoped>
.section-sm { padding-block: 2rem 4rem; }
.empty { padding: 2rem 0; }
.arts { margin-top: 2rem; padding-left: 1.2rem; font-family: var(--serif); font-size: var(--step-1); }
.clear { margin-top: 2rem; }
</style>
