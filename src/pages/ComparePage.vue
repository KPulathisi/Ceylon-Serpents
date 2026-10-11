<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { X, TriangleAlert } from 'lucide-vue-next'
import SpeciesMedia from '../components/SpeciesMedia.vue'
import MedicalBadge from '../components/MedicalBadge.vue'
import { useData } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'
import { useLocalCollection } from '../composables/useLocalCollection.js'

const route = useRoute()
const router = useRouter()
const { t, l, lang } = useLanguage()
const { species, getSpecies, getHabitat } = useData()
const { compare, setCompare } = useLocalCollection()

// URL is the source of truth so comparisons can be shared; fall back to the saved selection
const ids = computed(() => {
  const q = (route.query.ids || '').toString().split(',').filter((id) => getSpecies(id))
  return q.length ? q.slice(0, 3) : compare.value
})
watch(() => ids.value.join(','), () => { if (ids.value.join(',') !== compare.value.join(',')) setCompare(ids.value) }, { immediate: true })
const list = computed(() => ids.value.map(getSpecies))
const update = (next) => router.replace({ query: { ids: next.join(',') } })
const add = (e) => { if (e.target.value) update([...ids.value, e.target.value]); e.target.value = '' }
const remove = (id) => update(ids.value.filter((x) => x !== id))

const rows = [
  { key: 'build', label: 'identify.q.build', get: (s) => t('identify.a.' + s.traits.build) },
  { key: 'pattern', label: 'identify.q.pattern', get: (s) => s.traits.pattern.map((p) => t('identify.a.' + p)).join(', ') },
  { key: 'appearance', label: 'profile.appearance', get: (s) => s.en.appearance, en: true },
  { key: 'variation', label: 'profile.variation', get: (s) => s.en.variation, en: true },
  { key: 'habitats', label: 'profile.habitats', get: (s) => s.habitats.map((h) => l(getHabitat(h).name)).join(', ') },
  { key: 'behaviour', label: 'profile.behaviour', get: (s) => s.en.behaviour, en: true },
  { key: 'distribution', label: 'profile.distribution', get: (s) => s.en.distribution, en: true },
  { key: 'limitations', label: 'profile.limitations', get: (s) => s.en.limitations, en: true }
]
const name = (s) => (lang.value === 'en' ? s.names.en : s.names[lang.value]?.text || s.names.en)
</script>

<template>
  <div>
    <header class="page-head wrap">
      <h1>{{ t('compare.title') }}</h1>
      <p class="lede">{{ t('compare.lede') }}</p>
    </header>

    <section class="wrap section-sm">
      <p class="warn"><TriangleAlert aria-hidden="true" />{{ t('compare.warning') }}</p>
      <p v-if="lang !== 'en'" class="tnote">{{ t('common.englishOnly') }}</p>

      <label v-if="ids.length < 3" class="field picker">{{ t('compare.pick') }}
        <select @change="add">
          <option value="">…</option>
          <option v-for="s in species.filter((x) => !ids.includes(x.id))" :key="s.id" :value="s.id">{{ name(s) }} ({{ s.scientificName }})</option>
        </select>
      </label>

      <p v-if="list.length < 2" class="empty">{{ t('compare.empty') }}</p>

      <div v-if="list.length" class="table-wrap">
        <table :style="{ '--cols': list.length }">
          <thead>
            <tr>
              <td></td>
              <th v-for="s in list" :key="s.id" scope="col">
                <SpeciesMedia :species="s" sizes="300px" />
                <RouterLink :to="`/species/${s.id}`" class="nm">{{ name(s) }}</RouterLink>
                <span class="latin">{{ s.scientificName }}</span>
                <MedicalBadge :level="s.medical" />
                <button class="rm" @click="remove(s.id)"><X aria-hidden="true" />{{ t('compare.remove') }}<span class="sr-only"> {{ s.names.en }}</span></button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.key" :class="r.key">
              <th scope="row">{{ t(r.label) }}</th>
              <td v-for="s in list" :key="s.id" :lang="r.en ? 'en' : null">{{ r.get(s) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-sm { padding-block: 2rem 4rem; }
.warn { display: flex; gap: .6rem; align-items: flex-start; background: var(--paper); border-left: 5px solid var(--bark); padding: .9rem 1rem; max-width: none; }
.warn svg { width: 1.2rem; flex: none; color: var(--bark); margin-top: .15rem; }
.picker { max-width: 380px; margin: 1.5rem 0; }
.empty { color: var(--ink-soft); }
.table-wrap { overflow-x: auto; margin-top: 1rem; }
table { border-collapse: collapse; width: 100%; min-width: calc(160px + var(--cols) * 240px); table-layout: fixed; }
thead th { vertical-align: top; text-align: left; padding: 0 .75rem 1rem; font-weight: 400; }
thead th > * { display: block; margin-top: .4rem; }
thead :deep(.media) { margin-top: 0; border: 1px solid var(--line); }
thead td { width: 160px; }
.nm { font-family: var(--serif); font-weight: 800; font-size: var(--step-1); color: var(--forest-deep); text-decoration: none; }
thead :deep(.badge) { display: inline-flex; }
.rm { display: inline-flex !important; align-items: center; gap: .25rem; background: none; border: 0; color: var(--ink-soft); font-size: .8rem; cursor: pointer; padding: 0; }
.rm svg { width: .9em; }
tbody th { text-align: left; font-size: var(--step--1); font-weight: 600; color: var(--bark); padding: .9rem .75rem .9rem 0; vertical-align: top; }
tbody td { padding: .9rem .75rem; vertical-align: top; font-size: var(--step--1); border-top: 1px solid var(--line); }
tbody tr th { border-top: 1px solid var(--line); }
tr.limitations td { background: #f3e9db; }
</style>
