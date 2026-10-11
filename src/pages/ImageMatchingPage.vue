<script setup>
import { ref, reactive, computed, onBeforeUnmount, nextTick } from 'vue'
import { Upload, ImageOff, RotateCcw, LifeBuoy, Lock, Columns3, Cpu, Sparkles, LoaderCircle } from 'lucide-vue-next'
import SafetyNotice from '../components/SafetyNotice.vue'
import SpeciesMedia from '../components/SpeciesMedia.vue'
import MedicalBadge from '../components/MedicalBadge.vue'
import { useData } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'
import { useClassifier, suggestColour } from '../composables/useClassifier.js'

const { t, lang } = useLanguage()
const { species, getSpecies } = useData()
const classifier = useClassifier()

const MAX = 10 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

const file = ref(null)
const preview = ref('')
const error = ref('')
const consent = ref(false)
const step = ref(1)
const hint = ref(null)
const imgEl = ref(null)
const fileInput = ref(null)

const ai = reactive({ state: 'idle', result: null, error: '' })

function choose() { fileInput.value?.click() }

function onFile(e) {
  error.value = ''
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  if (!TYPES.includes(f.type)) { error.value = t('identify.errType'); return }
  if (f.size > MAX) { error.value = t('identify.errSize'); return }
  clearPhoto(false)
  file.value = f
  preview.value = URL.createObjectURL(f) // stays local: object URL never leaves the browser
  consent.value = false
}

function clearPhoto(resetStep = true) {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = ''
  file.value = null
  hint.value = null
  consent.value = false
  ai.state = 'idle'; ai.result = null; ai.error = ''
  if (resetStep) step.value = 1
}
onBeforeUnmount(() => preview.value && URL.revokeObjectURL(preview.value))

async function proceed(useAi = false) {
  consent.value = true
  await nextTick()
  const img = imgEl.value
  const done = () => {
    if (!img.naturalWidth) { error.value = t('identify.errRead'); return }
    hint.value = suggestColour(img)
    if (hint.value && !answers.colour) answers.colour = hint.value
    step.value = 2
    if (useAi) runAi(img)
  }
  if (img.complete) done()
  else { img.onload = done; img.onerror = () => (error.value = t('identify.errRead')) }
}

async function runAi(img) {
  ai.state = 'loading'; ai.result = null; ai.error = ''
  try {
    ai.result = await classifier.classify(img, species, lang.value)
    ai.state = 'done'
  } catch (e) {
    ai.state = 'error'
    ai.error = String(e.message || e)
  }
}
const aiCards = computed(() => (ai.result?.candidates || []).map((c) => ({ ...c, sp: c.id !== 'other' ? getSpecies(c.id) : null })))

function skipPhoto() { clearPhoto(false); step.value = 2 }

const questions = {
  build: ['tiny', 'small', 'slender', 'medium', 'stout'],
  colour: ['green', 'brown', 'dark', 'banded'],
  pattern: ['plain', 'bands', 'chain', 'checkered', 'blotches', 'zigzag'],
  head: ['triangular', 'pointed', 'rounded'],
  setting: ['tree', 'ground', 'water', 'buildings', 'coast']
}
const answers = reactive({ build: '', colour: '', pattern: '', head: '', setting: '' })
const answered = computed(() => Object.entries(answers).filter(([, v]) => v && v !== 'unsure'))
const showResults = ref(false)

function traitMatches(s, q, v) {
  const tv = s.traits[q]
  return Array.isArray(tv) ? tv.includes(v) : tv === v
}

const results = computed(() => {
  const total = answered.value.length
  const scored = species.map((s) => ({ s, m: answered.value.filter(([q, v]) => traitMatches(s, q, v)).length }))
    .filter((x) => x.m > 0)
    .sort((a, b) => b.m - a.m || a.s.names.en.localeCompare(b.s.names.en))
  const top = scored[0]?.m ?? 0
  const tied = scored.filter((x) => x.m === top).length
  // Honest uncertainty: if the best fit misses more than one answer, or too many species tie, say so
  const unclear = !top || top < total - 1 || tied > 4
  // Always show a short ranked list, never a single 'answer'
  return { total, list: scored.slice(0, 4), unclear }
})

function run() {
  showResults.value = true
  step.value = 3
  nextTick(() => document.getElementById('results')?.focus())
}
function restart() {
  Object.keys(answers).forEach((k) => (answers[k] = ''))
  showResults.value = false
  clearPhoto()
}
const name = (s) => (lang.value === 'en' ? s.names.en : s.names[lang.value]?.text || s.names.en)
const compareIds = computed(() => results.value.list.slice(0, 3).map((x) => x.s.id).join(','))
</script>

<template>
  <div>
    <header class="page-head wrap head">
      <div>
        <h1>{{ t('identify.title') }}</h1>
        <p class="lede">{{ classifier.available ? t('identify.ledeAi') : t('identify.lede') }}</p>
      </div>
      <RouterLink to="/safety" class="bitten"><LifeBuoy aria-hidden="true" />{{ t('safety.bitten') }}</RouterLink>
    </header>

    <div class="wrap layout">
      <ol class="steps" aria-label="Progress">
        <li :aria-current="step === 1 ? 'step' : null" :class="{ done: step > 1 }">{{ t('identify.step1') }}</li>
        <li :aria-current="step === 2 ? 'step' : null" :class="{ done: step > 2 }">{{ t('identify.step2') }}</li>
        <li :aria-current="step === 3 ? 'step' : null">{{ t('identify.step3') }}</li>
      </ol>

      <SafetyNotice />

      <p class="model"><Cpu aria-hidden="true" /><span>{{ classifier.available ? t('identify.aiNote') : t('identify.modelNote') }}</span></p>

      <div class="work">
        <!-- Photo panel -->
        <section class="photo-panel" :aria-label="t('identify.step1')">
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" @change="onFile" />
          <div v-if="!preview" class="drop">
            <Upload class="ic" aria-hidden="true" />
            <button class="btn" @click="choose">{{ t('identify.drop') }}</button>
            <p class="hint">{{ t('identify.dropHint') }}</p>
            <button v-if="step === 1" class="linkish" @click="skipPhoto">{{ t('identify.noPhoto') }}</button>
          </div>
          <div v-else class="preview">
            <img ref="imgEl" :src="preview" :alt="file?.name || ''" />
            <div class="pv-actions">
              <button class="btn small ghost" @click="choose">{{ t('identify.replace') }}</button>
              <button class="btn small ghost" @click="clearPhoto()"><ImageOff aria-hidden="true" />{{ t('identify.remove') }}</button>
            </div>
            <div v-if="!consent && classifier.available" class="privacy">
              <Lock aria-hidden="true" />
              <p>{{ t('identify.aiPrivacy') }}</p>
              <div class="privacy-actions">
                <button class="btn small" @click="proceed(true)"><Sparkles aria-hidden="true" />{{ t('identify.aiRun') }}</button>
                <button class="btn small ghost" @click="proceed(false)">{{ t('identify.localOnly') }}</button>
              </div>
            </div>
            <div v-else-if="!consent" class="privacy">
              <Lock aria-hidden="true" />
              <p>{{ t('identify.privacy') }}</p>
              <button class="btn small" @click="proceed(false)">{{ t('identify.privacyAgree') }}</button>
            </div>
          </div>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </section>

        <!-- Questions -->
        <div v-if="step >= 2" class="right">
        <section v-if="ai.state !== 'idle'" class="ai" aria-live="polite">
          <h2 class="ai-title"><Sparkles aria-hidden="true" />{{ t('identify.aiTitle') }}</h2>
          <p v-if="ai.state === 'loading'" class="loading"><LoaderCircle class="spin" aria-hidden="true" />{{ t('identify.aiLoading') }}</p>
          <p v-else-if="ai.state === 'error'" class="unclear">{{ ai.error === 'quota_exceeded' || ai.error === 'rate_limited' ? t('identify.aiQuota') : t('identify.aiError') }}</p>
          <template v-else-if="ai.result">
            <p v-if="ai.result.is_snake === 'no'" class="unclear">{{ t('identify.aiNotSnake') }}</p>
            <template v-else>
              <p v-if="ai.result.is_snake === 'unclear'" class="unclear">{{ t('identify.aiUnclear') }}</p>
              <p v-if="ai.result.image_quality === 'poor'" class="unclear">{{ t('identify.aiPoor') }}</p>
              <p v-if="!aiCards.length" class="unclear">{{ t('identify.aiNone') }}</p>
              <ul class="ai-list">
                <li v-for="c in aiCards" :key="c.scientific_name" :class="['ai-card', c.match]">
                  <SpeciesMedia v-if="c.sp" :species="c.sp" sizes="160px" :show-tag="false" :autoplay="false" class="ai-thumb" />
                  <div>
                    <p class="ai-match">{{ t('identify.match.' + c.match) }}</p>
                    <h3 v-if="c.sp"><RouterLink :to="`/species/${c.sp.id}`">{{ name(c.sp) }}</RouterLink></h3>
                    <h3 v-else class="latin">{{ c.scientific_name }}</h3>
                    <p class="latin">{{ c.sp ? c.sp.scientificName : t('identify.notInLibrary') }}</p>
                    <p class="feat">{{ c.visible_features }}</p>
                  </div>
                </li>
              </ul>
              <p v-if="ai.result.notes" class="feat">{{ ai.result.notes }}</p>
            </template>
            <p class="by">{{ t('identify.aiBy', { m: ai.result.model }) }}</p>
          </template>
          <SafetyNotice compact />
        </section>
        <section class="questions" :aria-label="t('identify.step2')">
          <h2 v-if="ai.state !== 'idle'" class="ai-title">{{ t('identify.refine') }}</h2>
          <p v-if="hint" class="tnote">{{ t('identify.colourHint', { c: t('identify.a.' + hint) }) }}</p>
          <fieldset v-for="(opts, q) in questions" :key="q">
            <legend>{{ t('identify.q.' + q) }}</legend>
            <div class="opts">
              <label v-for="o in [...opts, 'unsure']" :key="o" :class="['opt', { on: answers[q] === o }]">
                <input v-model="answers[q]" type="radio" :name="q" :value="o" class="sr-only" />
                {{ t('identify.a.' + o) }}
              </label>
            </div>
          </fieldset>
          <p v-if="answered.length < 2" class="hint">{{ t('identify.tooFew') }}</p>
          <div class="q-actions">
            <button class="btn" :disabled="answered.length < 2" @click="run">{{ t('identify.run') }}</button>
            <button class="btn ghost" @click="restart"><RotateCcw aria-hidden="true" />{{ t('identify.again') }}</button>
          </div>
        </section>
        </div>
      </div>

      <!-- Results -->
      <section v-if="showResults" id="results" class="results" tabindex="-1" aria-live="polite">
        <h2>{{ t('identify.resultsTitle') }}</h2>
        <p v-if="results.unclear" class="unclear">{{ t('identify.unclear') }}</p>
        <p v-else class="lede">{{ t('identify.resultsLede') }}</p>
        <div class="res-grid">
          <article v-for="r in results.list" :key="r.s.id" class="res">
            <div class="res-media">
              <img v-if="preview" :src="preview" alt="" class="yours" />
              <SpeciesMedia :species="r.s" sizes="300px" />
            </div>
            <div class="res-body">
              <h3><RouterLink :to="`/species/${r.s.id}`">{{ name(r.s) }}</RouterLink></h3>
              <p class="latin">{{ r.s.scientificName }}</p>
              <p class="score">{{ t('identify.matched', { m: r.m, t: results.total }) }}</p>
              <MedicalBadge :level="r.s.medical" />
              <p class="lim" lang="en">{{ r.s.en.limitations }}</p>
              <RouterLink :to="`/species/${r.s.id}`" class="btn small ghost">{{ t('common.viewProfile') }}</RouterLink>
            </div>
          </article>
        </div>
        <RouterLink v-if="results.list.length > 1" :to="{ path: '/compare', query: { ids: compareIds } }" class="btn"><Columns3 aria-hidden="true" />{{ t('identify.compareThese') }}</RouterLink>
        <SafetyNotice class="again" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: end; gap: 1.5rem; flex-wrap: wrap; }
.bitten { display: inline-flex; gap: .5rem; align-items: center; background: var(--alert); color: #fff; padding: .9rem 1.2rem; border-radius: 999px; font-weight: 600; text-decoration: none; }
.bitten:hover { background: #6e2414; color: #fff; }
.bitten svg { width: 1.2em; }
.layout { display: grid; gap: 1.5rem; padding-block: 2rem 4rem; }
.steps { list-style: none; padding: 0; margin: 0; display: flex; gap: .5rem; counter-reset: s; flex-wrap: wrap; }
.steps li { counter-increment: s; display: flex; align-items: center; gap: .5rem; font-size: var(--step--1); color: var(--ink-soft); padding: .4rem .9rem .4rem .4rem; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); }
.steps li::before { content: counter(s); width: 1.6rem; height: 1.6rem; display: grid; place-items: center; border-radius: 50%; background: var(--sage-soft); color: var(--forest-deep); font-weight: 600; }
.steps li[aria-current='step'] { color: var(--forest-deep); border-color: var(--forest); font-weight: 600; }
.steps li[aria-current='step']::before, .steps li.done::before { background: var(--forest); color: var(--paper); }
.model { display: flex; gap: .7rem; align-items: flex-start; font-size: var(--step--1); color: var(--ink-soft); max-width: 80ch; margin: 0; }
.model svg { width: 1.3rem; flex: none; color: var(--forest); }
.work { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 2rem; align-items: start; }
@media (max-width: 860px) { .work { grid-template-columns: 1fr; } }
.photo-panel { position: sticky; top: 90px; }
@media (max-width: 860px) { .photo-panel { position: static; } }
.drop { border: 2px dashed var(--sage); background: var(--paper); padding: 2.5rem 1.5rem; display: grid; justify-items: center; gap: .8rem; text-align: center; }
.drop .ic { width: 2.4rem; height: 2.4rem; color: var(--forest); }
.hint { font-size: var(--step--1); color: var(--ink-soft); margin: 0; }
.linkish { background: none; border: 0; color: var(--forest); text-decoration: underline; cursor: pointer; font: inherit; font-size: var(--step--1); }
.preview { background: var(--paper); border: 1px solid var(--line); padding: .6rem; }
.preview img { width: 100%; max-height: 420px; object-fit: contain; background: #e3dcc6; }
.pv-actions { display: flex; gap: .5rem; margin-top: .6rem; flex-wrap: wrap; }
.privacy { margin-top: .8rem; padding: 1rem; background: var(--sage-soft); display: grid; grid-template-columns: auto 1fr; gap: .2rem .7rem; align-items: start; }
.privacy svg { width: 1.2rem; color: var(--forest); margin-top: .2rem; }
.privacy p { margin: 0; font-size: var(--step--1); }
.privacy .btn { grid-column: 2; justify-self: start; margin-top: .6rem; }
.privacy-actions { grid-column: 2; display: flex; flex-wrap: wrap; gap: .5rem; }
.privacy-actions .btn { margin-top: .6rem; }
.right { display: grid; gap: 2rem; }
.ai { background: var(--paper); border: 1px solid var(--line); padding: 1.25rem; display: grid; gap: .8rem; }
.ai-title { display: flex; align-items: center; gap: .5rem; font-size: var(--step-2); margin: 0; }
.ai-title svg { width: .9em; color: var(--leaf); }
.loading { display: flex; gap: .5rem; align-items: center; margin: 0; }
.spin { width: 1.2em; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.ai-list { list-style: none; padding: 0; margin: 0; display: grid; gap: .8rem; }
.ai-card { display: grid; grid-template-columns: 140px 1fr; gap: 1rem; align-items: start; border-left: 4px solid var(--sage); padding-left: .8rem; }
.ai-card.strong { border-color: var(--forest); }
.ai-card.partial { border-color: var(--leaf); }
.ai-card .ai-thumb { border: 1px solid var(--line); }
.ai-card:not(:has(.ai-thumb)) { grid-template-columns: 1fr; }
.ai-card h3 { margin: 0; font-size: var(--step-1); }
.ai-card h3 a { text-decoration: none; color: var(--forest-deep); }
.ai-card p { margin: 0; }
.ai-match { font-size: .78rem; font-weight: 600; color: var(--bark); }
.feat { font-size: var(--step--1); color: var(--ink-soft); margin: .25rem 0 0; }
.by { font-size: .75rem; color: var(--ink-soft); margin: 0; }
@media (max-width: 520px) { .ai-card { grid-template-columns: 1fr; } }
.error { color: var(--alert); font-weight: 600; margin-top: .6rem; }
fieldset { border: 0; border-top: 1px solid var(--line); padding: 1rem 0 .4rem; margin: 0; }
legend { font-family: var(--serif); font-weight: 800; font-size: var(--step-1); color: var(--forest-deep); padding: 0; margin-bottom: .5rem; float: left; width: 100%; }
.opts { display: flex; flex-wrap: wrap; gap: .45rem; clear: both; }
.opt { padding: .5rem .85rem; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); cursor: pointer; font-size: var(--step--1); }
.opt:hover { border-color: var(--forest); }
.opt.on { background: var(--forest); color: var(--paper); border-color: var(--forest); }
.opt:focus-within { outline: 3px solid var(--leaf); outline-offset: 2px; }
.q-actions { display: flex; gap: .7rem; margin-top: 1.25rem; flex-wrap: wrap; }
.results { border-top: 2px solid var(--forest); padding-top: 2rem; display: grid; gap: 1.25rem; }
.results:focus { outline: none; }
.unclear { background: var(--paper); border-left: 5px solid var(--bark); padding: 1rem; max-width: none; }
.res-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 1.25rem; }
.res { background: var(--paper); border: 1px solid var(--line); }
.res-media { position: relative; }
.yours { position: absolute; right: .5rem; bottom: .5rem; width: 34%; aspect-ratio: 1; object-fit: cover; border: 3px solid var(--paper); z-index: 1; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
.res-body { padding: 1rem; display: grid; gap: .35rem; justify-items: start; }
.res-body h3 { margin: 0; }
.res-body h3 a { text-decoration: none; color: var(--forest-deep); }
.res-body p { margin: 0; }
.score { font-size: var(--step--1); font-weight: 600; color: var(--forest); }
.lim { font-size: var(--step--1); color: var(--ink-soft); }
.again { margin-top: 1rem; }
</style>
