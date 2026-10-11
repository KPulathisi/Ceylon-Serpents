<script setup>
import { computed, ref, watch } from 'vue'
import { ArrowLeft, Bookmark, BookmarkCheck, Columns3, Eye, Sparkles } from 'lucide-vue-next'
import SpeciesMedia from '../components/SpeciesMedia.vue'
import SpeciesCard from '../components/SpeciesCard.vue'
import MedicalBadge from '../components/MedicalBadge.vue'
import LocalName from '../components/LocalName.vue'
import SafetyNotice from '../components/SafetyNotice.vue'
import { useData } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'
import { useLocalCollection } from '../composables/useLocalCollection.js'

const props = defineProps({ id: { type: String, required: true } })
const { t, l, lang } = useLanguage()
const { getSpecies, getHabitat, getSource, getCredit, getLocomotion, behavior } = useData()
const { isSaved, toggleSaved, inCompare, toggleCompare, compare } = useLocalCollection()

const s = computed(() => getSpecies(props.id))
const active = ref(0)
watch(() => props.id, () => (active.value = 0))

const summary = computed(() => {
  if (!s.value) return { text: '', draft: false }
  if (lang.value !== 'en' && s.value[lang.value]?.summary) return { text: s.value[lang.value].summary, draft: true }
  return { text: s.value.en.summary, draft: false }
})
const sections = ['appearance', 'variation', 'ecology', 'behaviour', 'defence', 'distribution']
const refs = computed(() => s.value?.references.map(getSource).filter(Boolean) ?? [])
const similar = computed(() => s.value?.similar.map(getSpecies).filter(Boolean) ?? [])
const moveName = (id) => {
  const m = getLocomotion(id)
  return m ? l(m.name) : l(behavior.extraLocomotion[id] || { en: id })
}
const thumb = (f) => `${import.meta.env.BASE_URL}images/${f}-sm.webp`
const credit = computed(() => {
  const img = s.value?.images[active.value]
  return img ? getCredit(img.credit) : null
})
</script>

<template>
  <div v-if="s" class="species">
    <div class="wrap crumbs">
      <RouterLink to="/library"><ArrowLeft aria-hidden="true" />{{ t('library.title') }}</RouterLink>
    </div>

    <section class="wrap top">
      <div class="gallery">
        <SpeciesMedia :key="active" :species="s" :index="active" eager sizes="(min-width: 900px) 60vw, 100vw" />
        <div v-if="s.images.length > 1" class="thumbs" role="group" :aria-label="t('profile.gallery')">
          <button v-for="(img, i) in s.images" :key="img.file" :aria-pressed="active === i" :aria-label="img.alt" @click="active = i">
            <img :src="thumb(img.file)" alt="" width="120" height="80" loading="lazy" />
          </button>
        </div>
        <p v-if="credit" class="credit">{{ t('common.photo') }}: {{ credit.creator }}. {{ credit.licence }}.</p>
      </div>

      <aside class="field-label label">
        <div class="fl-head">
          <span class="latin big-latin">{{ s.scientificName }}</span>
        </div>
        <h1>{{ lang === 'en' ? s.names.en : (s.names[lang].text || s.names.en) }}</h1>
        <dl>
          <dt>English</dt><dd>{{ s.names.en }}</dd>
          <dt>සිංහල</dt><dd><LocalName :name="s.names.si" code="si" /></dd>
          <dt>தமிழ்</dt><dd><LocalName :name="s.names.ta" code="ta" /></dd>
          <dt>{{ t('profile.family') }}</dt><dd>{{ s.family }}</dd>
          <dt>{{ t('library.status') }}</dt><dd>{{ s.status === 'endemic' ? t('common.endemic') : t('common.native') }}</dd>
          <dt>{{ t('profile.size') }}</dt><dd>{{ s.size }}</dd>
        </dl>
        <div class="badges">
          <MedicalBadge :level="s.medical" />
          <span class="act">{{ t('activity.' + s.activity) }}</span>
        </div>
        <div class="btns">
          <button class="btn small" :aria-pressed="isSaved('species', s.id)" @click="toggleSaved('species', s.id)">
            <component :is="isSaved('species', s.id) ? BookmarkCheck : Bookmark" aria-hidden="true" />{{ isSaved('species', s.id) ? t('common.saved') : t('common.save') }}
          </button>
          <button class="btn small ghost" :disabled="!inCompare(s.id) && compare.length >= 3" @click="toggleCompare(s.id)">
            <Columns3 aria-hidden="true" />{{ inCompare(s.id) ? t('common.inCompare') : t('common.compare') }}
          </button>
        </div>
      </aside>
    </section>

    <section class="wrap body">
      <div class="main prose">
        <p class="lede">{{ summary.text }}</p>
        <p v-if="summary.draft" class="tnote">{{ t('common.draft') }}</p>
        <p v-if="lang !== 'en'" class="tnote">{{ t('common.englishOnly') }}</p>

        <template v-for="k in sections" :key="k">
          <h3>{{ t('profile.' + k) }}</h3>
          <p lang="en">{{ s.en[k] }}</p>
        </template>

        <div class="limits">
          <h3><Eye aria-hidden="true" />{{ t('profile.limitations') }}</h3>
          <p lang="en">{{ s.en.limitations }}</p>
          <p class="strong">{{ t('profile.limitationsNote') }}</p>
        </div>

        <div class="folk">
          <h3><Sparkles aria-hidden="true" />{{ t('profile.folklore') }}</h3>
          <p v-if="s.en.folklore" lang="en">{{ s.en.folklore }}</p>
          <p v-else class="muted">{{ t('profile.noFolklore') }}</p>
          <template v-if="s.en.fact">
            <h4>{{ t('profile.fact') }}</h4>
            <p lang="en">{{ s.en.fact }}</p>
          </template>
        </div>
      </div>

      <aside class="side">
        <div class="side-block">
          <h3>{{ t('profile.habitats') }}</h3>
          <ul class="tags">
            <li v-for="h in s.habitats" :key="h"><RouterLink :to="`/habitats/${h}`">{{ l(getHabitat(h).name) }}</RouterLink></li>
          </ul>
        </div>
        <div class="side-block">
          <h3>{{ t('profile.movement') }}</h3>
          <ul class="tags"><li v-for="m in s.locomotion" :key="m"><RouterLink to="/knowledge#movement">{{ moveName(m) }}</RouterLink></li></ul>
        </div>
        <div class="side-block">
          <h3>{{ t('profile.conservation') }}</h3>
          <p class="muted">{{ s.conservation.status || s.conservation.note }}</p>
        </div>
        <div class="side-block">
          <h3>{{ t('common.references') }}</h3>
          <ol class="refs">
            <li v-for="r in refs" :key="r.id"><a :href="r.url" target="_blank" rel="noopener">{{ r.title }}</a> <span class="muted">{{ r.publisher }}, accessed {{ r.accessed }}</span></li>
          </ol>
          <p class="muted small">{{ t('common.lastReviewed') }}: {{ s.lastReviewed }}</p>
        </div>
        <SafetyNotice />
      </aside>
    </section>

    <section v-if="similar.length" class="section wrap">
      <h2>{{ t('profile.similar') }}</h2>
      <div class="grid-auto">
        <SpeciesCard v-for="x in similar" :key="x.id" :species="x" />
      </div>
      <RouterLink :to="{ path: '/compare', query: { ids: [s.id, ...s.similar].slice(0, 3).join(',') } }" class="btn ghost cmp">
        <Columns3 aria-hidden="true" />{{ t('compare.title') }}
      </RouterLink>
    </section>
  </div>

  <div v-else class="wrap section">
    <p>{{ t('profile.notFound') }}</p>
    <RouterLink to="/library" class="btn">{{ t('common.seeAll') }}</RouterLink>
  </div>
</template>

<style scoped>
.crumbs { padding-top: 1.5rem; }
.crumbs a { display: inline-flex; align-items: center; gap: .35rem; font-size: var(--step--1); }
.crumbs svg { width: 1em; }
.top { display: grid; grid-template-columns: 1.55fr 1fr; gap: clamp(1.5rem, 4vw, 3rem); padding-block: 1.25rem 2.5rem; align-items: start; }
.gallery :deep(.media) { border: 1px solid var(--line); }
.thumbs { display: flex; gap: .5rem; margin-top: .6rem; }
.thumbs button { padding: 0; border: 2px solid transparent; background: none; cursor: pointer; width: 96px; }
.thumbs button[aria-pressed='true'] { border-color: var(--forest); }
.thumbs img { width: 100%; aspect-ratio: 3/2; object-fit: cover; }
.credit { font-size: .75rem; color: var(--ink-soft); margin-top: .4rem; }
.label { position: sticky; top: 90px; }
.label h1 { font-size: var(--step-3); margin: .2rem 0 .8rem; }
.big-latin { font-size: var(--step-1); }
.badges { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin-top: 1rem; }
.act { font-size: .78rem; color: var(--ink-soft); }
.btns { display: flex; gap: .5rem; margin-top: 1rem; flex-wrap: wrap; }
@media (max-width: 860px) { .top { grid-template-columns: 1fr; } .label { position: static; } }

.body { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: clamp(1.5rem, 4vw, 3rem); padding-bottom: 2rem; }
.main h3 { font-size: var(--step-1); margin: 1.8rem 0 .4rem; }
.limits, .folk { margin-top: 2rem; padding: 1.25rem 1.4rem; background: var(--paper); border: 1px solid var(--line); }
.limits { border-left: 5px solid var(--bark); }
.folk { border-left: 5px solid var(--leaf); }
.limits h3, .folk h3 { margin-top: 0; display: flex; align-items: center; gap: .5rem; }
.limits h3 svg, .folk h3 svg { width: 1.1em; color: var(--bark); }
.folk h4 { font-size: var(--step-0); margin: 1rem 0 .3rem; }
.strong { font-weight: 600; margin: 0; }
.muted { color: var(--ink-soft); }
.small { font-size: var(--step--1); }
.side { display: grid; gap: 1.5rem; align-content: start; }
.side h3 { font-size: var(--step-0); font-family: var(--sans); font-weight: 600; margin-bottom: .5rem; color: var(--bark); }
.tags { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: .4rem; }
.tags a { display: inline-block; padding: .3rem .7rem; border: 1px solid var(--line); border-radius: 999px; font-size: var(--step--1); text-decoration: none; background: var(--paper); }
.tags a:hover { border-color: var(--forest); }
.refs { padding-left: 1.1rem; margin: 0; font-size: var(--step--1); display: grid; gap: .4rem; }
.cmp { margin-top: 1.5rem; }
@media (max-width: 860px) { .body { grid-template-columns: 1fr; } }
</style>
