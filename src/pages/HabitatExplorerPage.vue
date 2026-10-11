<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import HabitatMap from '../components/HabitatMap.vue'
import SpeciesCard from '../components/SpeciesCard.vue'
import { useData, imageSet } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'

const props = defineProps({ id: { type: String, default: '' } })
const router = useRouter()
const { t, l, lang } = useLanguage()
const { habitats, getHabitat, speciesInHabitat } = useData()

const current = computed(() => getHabitat(props.id) || habitats[0])
const list = computed(() => speciesInHabitat(current.value.id))
const desc = computed(() => current.value[lang.value] || current.value.en)
const img = computed(() => (current.value.image ? imageSet(current.value.image) : null))
const select = (id) => router.replace(`/habitats/${id}`)
</script>

<template>
  <div>
    <header class="page-head wrap">
      <h1>{{ t('habitats.title') }}</h1>
      <p class="lede">{{ t('habitats.lede') }}</p>
    </header>

    <section class="wrap explorer">
      <div class="map-col">
        <HabitatMap :highlight="current.zone" />
      </div>
      <div>
        <div class="tabs" role="tablist" :aria-label="t('habitats.title')">
          <button v-for="h in habitats" :key="h.id" role="tab" :aria-selected="current.id === h.id" class="chip" :aria-pressed="current.id === h.id" @click="select(h.id)">{{ l(h.name) }}</button>
        </div>
        <article class="hab" role="tabpanel">
          <img v-if="img" :src="img.src" :srcset="img.srcset" sizes="(min-width: 900px) 50vw, 100vw" alt="" class="hab-img" loading="lazy" />
          <h2>{{ l(current.name) }}</h2>
          <p class="zone">{{ t('zones.' + current.zone) }}</p>
          <p class="lede">{{ desc }}</p>
          <p v-if="lang !== 'en'" class="tnote">{{ t('common.draft') }}</p>
        </article>
      </div>
    </section>

    <section class="wrap section-sm">
      <h2 class="h3">{{ t('habitats.speciesHere') }} ({{ list.length }})</h2>
      <div class="grid-auto">
        <SpeciesCard v-for="s in list" :key="s.id" :species="s" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.explorer { display: grid; grid-template-columns: minmax(200px, .7fr) 1.3fr; gap: clamp(1.5rem, 5vw, 4rem); padding-block: 2rem; align-items: start; }
.map-col { position: sticky; top: 90px; max-width: 320px; }
.tabs { display: flex; flex-wrap: wrap; gap: .45rem; margin-bottom: 1.5rem; }
.hab-img { width: 100%; aspect-ratio: 21/9; object-fit: cover; margin-bottom: 1rem; }
.zone { color: var(--bark); font-weight: 600; font-size: var(--step--1); margin-top: -.3rem; }
.section-sm { padding-block: 1rem 4rem; }
.h3 { font-size: var(--step-2); }
@media (max-width: 800px) { .explorer { grid-template-columns: 1fr; } .map-col { position: static; max-width: 220px; margin-inline: auto; } }
</style>
