<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Dices, Plus, Trash2, User, Cpu, RotateCcw, Play, Check, X, ExternalLink, LifeBuoy, BookOpen, ArrowRight, Info, Trophy } from 'lucide-vue-next'
import GameBoard from '../components/game/GameBoard.vue'
import MedicalBadge from '../components/MedicalBadge.vue'
import LocalName from '../components/LocalName.vue'
import { useData, imageSet, orderedImages } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'
import { useSeo } from '../composables/useSeo.js'
import { useSnakesLadders, softLanding, game, COLORS } from '../composables/useSnakesLadders.js'

const { t, l, lang } = useLanguage()
useSeo('play')
const router = useRouter()
const { getSpecies } = useData()

const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const { state, notebook, saved, current, busy, cardTarget, restore, start, resume, quit, roll, answer, resolveCard, clearNotebook } = useSnakesLadders({ reduced })

// ---------- helpers
const sp = (id) => getSpecies(id)
const photo = (s) => (s?.images?.length ? imageSet(orderedImages(s)[0].file) : null)
const thumb = (s) => (s?.images?.length ? `${import.meta.env.BASE_URL}images/${orderedImages(s)[0].file}-sm.webp` : '')
const KEEP_CAPS = ['Sri', 'Indian', "Russell's"]
function spName(s) {
  if (!s) return ''
  if (lang.value !== 'en' && s.names[lang.value]?.text) return s.names[lang.value].text
  const n = s.names.en
  return lang.value === 'en' && !KEEP_CAPS.some((w) => n.startsWith(w)) ? n.charAt(0).toLowerCase() + n.slice(1) : n
}
const displayName = (s) => (lang.value !== 'en' && s?.names[lang.value]?.text) || s?.names.en || ''
const msg = computed(() => (state.message ? t(state.message.key, state.message.vars) : ''))
const profileHref = (id) => router.resolve(`/species/${id}`).href
const safetyHref = computed(() => router.resolve('/safety').href)

// ---------- setup
const setup = ref([{ name: '', kind: 'human' }, { name: '', kind: 'computer' }])
function defaultName(i) {
  const kind = setup.value[i].kind
  const n = setup.value.slice(0, i + 1).filter((p) => p.kind === kind).length
  return t(kind === 'human' ? 'game.player' : 'game.computer', { n })
}
const humans = computed(() => setup.value.filter((p) => p.kind === 'human').length)
const addPlayer = () => setup.value.length < 4 && setup.value.push({ name: '', kind: 'human' })
const removePlayer = (i) => setup.value.length > 1 && setup.value.splice(i, 1)
function begin() {
  if (!humans.value) return
  start(setup.value.map((p, i) => ({ name: p.name.trim() || defaultName(i), kind: p.kind })))
  nextTick(() => document.getElementById('game')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }))
}
function changePlayers() { quit() }
function again() {
  start(state.players.map((p) => ({ name: p.name, kind: p.kind })))
}

onMounted(restore)

// ---------- card dialog
const dialog = ref(null)
const card = computed(() => state.card)
const cardSpecies = computed(() => (card.value ? sp(card.value.data.species) : null))
const cardPlayer = computed(() => (card.value ? state.players[card.value.player] : null))
const cpuCard = computed(() => cardPlayer.value?.kind === 'computer')

watch(() => state.phase, async (ph) => {
  await nextTick()
  const d = dialog.value
  if (!d) return
  if ((ph === 'card' || ph === 'won') && !d.open) {
    d.showModal?.()
    d.querySelector('.opt:not([disabled]), .primary')?.focus()
  } else if (ph !== 'card' && ph !== 'won' && d.open) d.close()
})
watch(() => card.value?.picked, async (v) => {
  if (v === null || v === undefined) return
  await nextTick()
  dialog.value?.querySelector('.primary')?.focus()
})

// ---------- game summary
const seenSnakes = computed(() => {
  const byId = new Map()
  for (const h of state.history) if (h.type === 'snake') byId.set(h.id, { id: h.id, correct: byId.get(h.id)?.correct || h.correct, data: game.snakes.find((s) => s.id === h.id) })
  return [...byId.values()]
})
const seenLadders = computed(() => [...new Set(state.history.filter((h) => h.type === 'ladder').map((h) => h.id))].map((id) => game.ladders.find((x) => x.id === id)))
const winner = computed(() => (state.winner !== null ? state.players[state.winner] : null))

// ---------- die faces
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }

// ---------- legend
const legendSnakes = game.snakes.map((s) => ({ ...s, sp: sp(s.species) })).sort((a, b) => b.head - a.head)
const legendLadders = [...game.ladders].sort((a, b) => a.from - b.from)
</script>

<template>
  <div class="snl">
    <header class="page-head wrap">
      <p class="eyebrow">{{ t('game.eyebrow') }}</p>
      <h1>{{ t('game.title') }}</h1>
      <p class="lede">{{ t('game.lede') }}</p>
      <p class="respect"><Info aria-hidden="true" />{{ t('game.respect') }}</p>
    </header>

    <!-- Learning circle -->
    <section class="wrap circle" aria-labelledby="circle-h">
      <h2 id="circle-h">{{ t('game.circleTitle') }}</h2>
      <ol>
        <li v-for="(c, i) in t('game.circle')" :key="i">
          <span class="step">{{ i + 1 }}</span>
          <strong>{{ c.t }}</strong>
          <span>{{ c.d }}</span>
        </li>
      </ol>
    </section>

    <section id="game" class="wrap play" :class="{ setup: state.phase === 'setup' }">
      <!-- Setup -->
      <div v-if="state.phase === 'setup'" class="setup-card field-label">
        <div class="fl-head"><h2>{{ t('game.setupTitle') }}</h2><span class="fl-no">{{ setup.length }}/4</span></div>
        <button v-if="saved" class="btn ghost resume" @click="resume"><RotateCcw aria-hidden="true" />{{ t('game.resume') }}</button>
        <ul class="players-setup">
          <li v-for="(p, i) in setup" :key="i">
            <span class="swatch" :style="{ background: COLORS[i] }" aria-hidden="true">{{ i + 1 }}</span>
            <label class="sr-only" :for="`pname-${i}`">{{ t('game.name') }} {{ i + 1 }}</label>
            <input :id="`pname-${i}`" v-model="p.name" type="text" maxlength="18" :placeholder="defaultName(i)" />
            <div class="kind" role="group" :aria-label="defaultName(i)">
              <button type="button" :aria-pressed="p.kind === 'human'" @click="p.kind = 'human'"><User aria-hidden="true" />{{ t('game.human') }}</button>
              <button type="button" :aria-pressed="p.kind === 'computer'" @click="p.kind = 'computer'"><Cpu aria-hidden="true" />{{ t('game.cpu') }}</button>
            </div>
            <button v-if="setup.length > 1" type="button" class="icon" :aria-label="t('game.remove', { name: p.name || defaultName(i) })" @click="removePlayer(i)"><Trash2 aria-hidden="true" /></button>
          </li>
        </ul>
        <button v-if="setup.length < 4" type="button" class="add" @click="addPlayer"><Plus aria-hidden="true" />{{ t('game.add') }}</button>
        <p v-if="!humans" class="err" role="alert">{{ t('game.needHuman') }}</p>
        <button class="btn start" :disabled="!humans" @click="begin"><Play aria-hidden="true" />{{ t('game.start') }}</button>
      </div>

      <!-- Board + controls -->
      <template v-else>
        <div class="board-col">
          <GameBoard :players="state.players" :sliding="state.sliding" :label="t('game.boardLabel')" />
        </div>
        <aside class="panel">
          <div class="turn field-label" :style="{ '--pc': current?.color }">
            <p class="who"><span class="dot" aria-hidden="true">{{ state.turn + 1 }}</span>{{ t('game.turn', { name: current?.name }) }}</p>
            <div class="dice-row">
              <div :class="['die', { rolling: state.rolling }]" aria-hidden="true">
                <span v-for="k in 9" :key="k" :class="{ on: PIPS[state.die].includes(k - 1) }"></span>
              </div>
              <button v-if="current?.kind === 'human'" class="btn roll" :disabled="busy" @click="roll">
                <Dices aria-hidden="true" />{{ state.rolling ? t('game.rolling') : t('game.roll') }}
              </button>
              <p v-else class="cpu-note"><Cpu aria-hidden="true" />{{ t('game.thinking', { name: current?.name }) }}</p>
            </div>
            <p class="msg" role="status" aria-live="polite">{{ msg }}</p>
          </div>

          <ol class="standings">
            <li v-for="(p, i) in state.players" :key="i" :class="{ now: i === state.turn }">
              <span class="dot" :style="{ background: p.color }" aria-hidden="true">{{ i + 1 }}</span>
              <span class="pn">{{ p.name }}<Cpu v-if="p.kind === 'computer'" class="cpu-i" :aria-label="t('game.cpu')" /></span>
              <span class="pos">{{ p.pos ? t('game.square', { n: p.pos }) : t('game.start0') }}</span>
              <span v-if="p.asked" class="sc"><Check aria-hidden="true" />{{ p.correct }}/{{ p.asked }}</span>
            </li>
          </ol>

          <button class="btn ghost small" @click="changePlayers"><RotateCcw aria-hidden="true" />{{ t('game.newGame') }}</button>
        </aside>
      </template>
    </section>

    <!-- Field notebook -->
    <section class="wrap notebook" aria-labelledby="nb-h">
      <div class="nb-head">
        <div>
          <h2 id="nb-h"><BookOpen aria-hidden="true" />{{ t('game.notebook') }}</h2>
          <p>{{ t('game.notebookLede') }}</p>
        </div>
        <p class="counts">
          <span>{{ t('game.metSnakes', { n: notebook.snakes.length, t: game.snakes.length }) }}</span>
          <span>{{ t('game.metHabits', { n: notebook.ladders.length, t: game.ladders.length }) }}</span>
        </p>
      </div>
      <p v-if="!notebook.snakes.length && !notebook.ladders.length" class="empty">{{ t('game.notebookEmpty') }}</p>
      <ul class="nb-grid">
        <li v-for="s in game.snakes" :key="s.id" :class="{ met: notebook.snakes.includes(s.id) }">
          <template v-if="notebook.snakes.includes(s.id)">
            <img v-if="thumb(sp(s.species))" :src="thumb(sp(s.species))" alt="" width="160" height="107" loading="lazy" />
            <RouterLink :to="`/species/${s.species}`">{{ displayName(sp(s.species)) }}</RouterLink>
            <em class="latin">{{ sp(s.species)?.scientificName }}</em>
          </template>
          <template v-else>
            <span class="locked" aria-hidden="true">?</span>
            <span class="sr-only">{{ t('game.notebookEmpty') }}</span>
          </template>
        </li>
      </ul>
      <ul class="habits">
        <li v-for="h in game.ladders" :key="h.id" :class="{ met: notebook.ladders.includes(h.id) }">
          <Check v-if="notebook.ladders.includes(h.id)" aria-hidden="true" /><span v-else class="q" aria-hidden="true">?</span>
          <span v-if="notebook.ladders.includes(h.id)">{{ l(h.habit) }}</span>
          <span v-else class="hidden-habit">· · ·</span>
        </li>
      </ul>
      <button v-if="notebook.snakes.length || notebook.ladders.length" class="link" @click="clearNotebook">{{ t('game.clearNotebook') }}</button>
    </section>

    <!-- Legend: also what search engines and screen readers read -->
    <section class="wrap legend">
      <div>
        <h2>{{ t('game.legendSnakes') }}</h2>
        <ul>
          <li v-for="s in legendSnakes" :key="s.id">
            <span class="sq">{{ s.head }} → {{ s.tail }}</span>
            <span>
              <RouterLink :to="`/species/${s.species}`"><strong>{{ s.sp?.names.en }}</strong></RouterLink>
              {{ " " }}<em class="latin">{{ s.sp?.scientificName }}</em>
              <template v-if="s.sp?.names.si?.text"> · <span lang="si">{{ s.sp.names.si.text }}</span></template>
              <template v-if="s.sp?.names.ta?.text"> · <span lang="ta">{{ s.sp.names.ta.text }}</span></template>
              <br /><span class="why">{{ l(s.risk) }}</span>
            </span>
          </li>
        </ul>
      </div>
      <div>
        <h2>{{ t('game.legendLadders') }}</h2>
        <ul>
          <li v-for="h in legendLadders" :key="h.id">
            <span class="sq up">{{ h.from }} → {{ h.to }}</span>
            <span><strong>{{ l(h.habit) }}</strong><br /><span class="why">{{ l(h.fact) }}</span></span>
          </li>
        </ul>
      </div>
      <p v-if="lang !== 'en'" class="tnote draft">{{ t('game.draft') }}</p>
    </section>

    <!-- Card / win dialog -->
    <dialog ref="dialog" class="card-dialog" :aria-labelledby="'dlg-h'" @cancel.prevent>
      <template v-if="card && card.type === 'snake'">
        <header class="dh snake" :style="{ '--pc': cardPlayer?.color }">
          <span class="dot" aria-hidden="true">{{ card.player + 1 }}</span>
          <h2 id="dlg-h">{{ t('game.snakeTitle', { n: card.data.head }) }}</h2>
        </header>
        <div class="sp-block">
          <img v-if="photo(cardSpecies)" :src="photo(cardSpecies).src" :srcset="photo(cardSpecies).srcset" sizes="(min-width: 640px) 240px, 100vw" :alt="orderedImages(cardSpecies)[0].alt" class="sp-photo" />
          <div class="sp-meta">
            <h3>{{ cardSpecies?.names.en }}</h3>
            <p class="latin">{{ cardSpecies?.scientificName }}</p>
            <dl>
              <dt>සිංහල</dt><dd><LocalName :name="cardSpecies.names.si" code="si" /></dd>
              <dt>தமிழ்</dt><dd><LocalName :name="cardSpecies.names.ta" code="ta" /></dd>
            </dl>
            <MedicalBadge :level="cardSpecies.medical" />
          </div>
        </div>
        <div class="risk">
          <p class="lbl">{{ t('game.riskLabel') }}</p>
          <p>{{ l(card.data.risk) }}</p>
        </div>
        <fieldset class="quiz">
          <legend><span class="lbl">{{ t('game.quizLabel') }}</span>{{ l(card.data.question).replace('{name}', spName(cardSpecies)) }}</legend>
          <p v-if="cpuCard" class="cpu-note"><Cpu aria-hidden="true" />{{ card.picked === null ? t('game.thinking', { name: cardPlayer.name }) : t('game.cpuChose', { name: cardPlayer.name }) }}</p>
          <button
            v-for="i in card.order"
            :key="i"
            type="button"
            :class="['opt', { right: card.picked !== null && i === card.data.answer, wrong: card.picked === i && !card.correct, picked: card.picked === i }]"
            :disabled="card.picked !== null || cpuCard"
            @click="answer(i)"
          >
            <Check v-if="card.picked !== null && i === card.data.answer" aria-hidden="true" />
            <X v-else-if="card.picked === i" aria-hidden="true" />
            <span>{{ l(card.data.options[i]) }}</span>
          </button>
          <div v-if="card.picked !== null" class="feedback" :class="card.correct ? 'ok' : 'no'" role="status">
            <p><strong>{{ card.correct ? t('game.correct', { to: cardTarget, full: card.data.tail }) : t('game.wrong', { to: cardTarget }) }}</strong></p>
            <p>{{ l(card.data.explain) }}</p>
          </div>
        </fieldset>
        <footer class="df">
          <a :href="profileHref(card.data.species)" target="_blank" rel="noopener">{{ t('game.profile') }}<ExternalLink aria-hidden="true" /><span class="sr-only"> ({{ t('game.newTab') }})</span></a>
          <button class="btn primary" :disabled="card.picked === null" @click="resolveCard">{{ t('game.continue') }}<ArrowRight aria-hidden="true" /></button>
        </footer>
      </template>

      <template v-else-if="card && card.type === 'ladder'">
        <header class="dh ladder" :style="{ '--pc': cardPlayer?.color }">
          <span class="dot" aria-hidden="true">{{ card.player + 1 }}</span>
          <h2 id="dlg-h">{{ t('game.ladderTitle', { n: card.data.from }) }}</h2>
        </header>
        <div class="habit">
          <p class="lbl">{{ t('game.habitLabel') }}</p>
          <p class="big">{{ l(card.data.habit) }}</p>
          <p class="lbl">{{ t('game.whyLabel') }}</p>
          <p>{{ l(card.data.fact) }}</p>
        </div>
        <footer class="df">
          <a v-if="card.data.link" :href="safetyHref" target="_blank" rel="noopener"><LifeBuoy aria-hidden="true" />{{ t('game.safety') }}<span class="sr-only"> ({{ t('game.newTab') }})</span></a>
          <a v-else-if="card.data.species" :href="profileHref(card.data.species)" target="_blank" rel="noopener">{{ t('game.profile') }}<ExternalLink aria-hidden="true" /><span class="sr-only"> ({{ t('game.newTab') }})</span></a>
          <span v-else></span>
          <button class="btn primary" @click="resolveCard">{{ t('game.climb', { to: card.data.to }) }}<ArrowRight aria-hidden="true" /></button>
        </footer>
      </template>

      <template v-else-if="state.phase === 'won' && winner">
        <header class="dh won" :style="{ '--pc': winner.color }">
          <Trophy aria-hidden="true" class="trophy" />
          <h2 id="dlg-h">{{ t('game.won', { name: winner.name }) }}</h2>
        </header>
        <p class="won-lede">{{ t('game.wonLede') }}</p>
        <ul class="scores">
          <li v-for="(p, i) in state.players" :key="i">
            <span class="dot" :style="{ background: p.color }" aria-hidden="true">{{ i + 1 }}</span>
            <strong>{{ p.name }}</strong>
            <span>{{ p.asked ? t('game.score', { c: p.correct, a: p.asked }) : t('game.noQuiz') }}</span>
          </li>
        </ul>
        <ul v-if="seenSnakes.length" class="seen">
          <li v-for="h in seenSnakes" :key="h.id">
            <img v-if="thumb(sp(h.data.species))" :src="thumb(sp(h.data.species))" alt="" width="64" height="43" />
            <span>
              <a :href="profileHref(h.data.species)" target="_blank" rel="noopener">{{ displayName(sp(h.data.species)) }}</a>
              <small>{{ l(h.data.explain) }}</small>
            </span>
            <Check v-if="h.correct" class="ok" :aria-label="t('game.correct', { to: '', full: '' }).split('!')[0]" />
          </li>
        </ul>
        <ul v-if="seenLadders.length" class="seen habits-seen">
          <li v-for="h in seenLadders" :key="h.id"><Check aria-hidden="true" class="ok" /><span>{{ l(h.habit) }}</span></li>
        </ul>
        <footer class="df">
          <button class="btn ghost" @click="changePlayers">{{ t('game.changePlayers') }}</button>
          <button class="btn primary" @click="again"><RotateCcw aria-hidden="true" />{{ t('game.playAgain') }}</button>
        </footer>
      </template>
    </dialog>
  </div>
</template>

<style scoped>
.eyebrow { font-size: var(--step--1); text-transform: uppercase; letter-spacing: .12em; color: var(--bark); margin: 0 0 .4rem; font-weight: 600; }
.respect { display: flex; gap: .55rem; align-items: flex-start; font-size: var(--step--1); color: var(--ink-soft); max-width: 70ch; margin: 0; }
.respect svg { width: 1.1em; height: 1.1em; flex: none; margin-top: .25em; color: var(--forest); }

/* Learning circle */
.circle { padding-block: clamp(1.75rem, 4vw, 2.75rem); }
.circle h2 { font-size: var(--step-2); }
.circle ol { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; counter-reset: c; position: relative; }
.circle li { position: relative; background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius-m); padding: 1rem 1rem 1.1rem; display: grid; gap: .3rem; align-content: start; font-size: var(--step--1); color: var(--ink-soft); }
.circle li strong { color: var(--forest-deep); font-size: var(--step-0); }
.circle li::after { content: '→'; position: absolute; right: -.85rem; top: 1.1rem; color: var(--bark); font-weight: 700; }
.circle li:last-child::after { content: '↺'; right: .7rem; top: .7rem; font-size: 1.4rem; }
.step { width: 2rem; height: 2rem; border-radius: 50%; background: var(--forest); color: var(--paper); display: grid; place-items: center; font: 800 1rem var(--serif); }
@media (max-width: 860px) {
  .circle ol { grid-template-columns: 1fr 1fr; }
  .circle li:nth-child(2)::after { content: '↓'; right: 1rem; top: auto; bottom: -1.15rem; }
}
@media (max-width: 480px) { .circle ol { grid-template-columns: 1fr; } .circle li::after { content: '↓' !important; right: 1rem !important; top: auto !important; bottom: -1.15rem; font-size: 1rem !important; } .circle li:last-child::after { content: '↺' !important; top: .7rem !important; bottom: auto; } }

/* Play area */
.play { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 340px); gap: clamp(1rem, 3vw, 2rem); align-items: start; padding-bottom: clamp(2rem, 5vw, 3.5rem); scroll-margin-top: 90px; }
.play.setup { grid-template-columns: minmax(0, 620px); justify-content: center; }
.board-col { max-width: 720px; width: 100%; justify-self: center; }

.setup-card { display: grid; gap: .9rem; padding: 1.25rem 1.4rem 1.4rem; font-size: var(--step-0); }
.setup-card h2 { margin: 0; font-size: var(--step-2); }
.players-setup { list-style: none; margin: 0; padding: 0; display: grid; gap: .6rem; }
.players-setup li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; gap: .5rem; align-items: center; }
.swatch, .dot { width: 1.9rem; height: 1.9rem; border-radius: 50%; color: #fff; font: 700 .85rem var(--sans); display: grid; place-items: center; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--line); flex: none; }
.players-setup input { width: 100%; }
.kind { display: flex; border: 1px solid var(--line); border-radius: 999px; padding: 2px; background: #fff; }
.kind button { display: inline-flex; gap: .3rem; align-items: center; border: 0; background: none; padding: .4rem .65rem; border-radius: 999px; cursor: pointer; font: 600 .8rem var(--sans); color: var(--ink-soft); }
.kind button[aria-pressed='true'] { background: var(--forest); color: var(--paper); }
.kind svg { width: 1em; height: 1em; }
.icon { border: 1px solid var(--line); background: #fff; border-radius: 50%; padding: .45rem; cursor: pointer; color: var(--alert); display: grid; }
.icon svg { width: 16px; height: 16px; }
.add { justify-self: start; display: inline-flex; gap: .35rem; align-items: center; border: 1px dashed var(--forest); background: none; color: var(--forest); padding: .45rem .8rem; border-radius: 999px; cursor: pointer; font: 600 var(--step--1) var(--sans); }
.add svg { width: 1em; height: 1em; }
.start { justify-self: start; }
.resume { justify-self: start; }
.err { color: var(--alert); margin: 0; font-size: var(--step--1); }
@media (max-width: 520px) {
  .players-setup li { grid-template-columns: auto minmax(0, 1fr) auto; }
  .players-setup .kind { grid-column: 2 / 3; justify-self: start; }
}

.panel { display: grid; gap: 1rem; position: sticky; top: 90px; }
.turn { border-left: 6px solid var(--pc, var(--forest)); display: grid; gap: .8rem; padding: 1rem 1.1rem; }
.who { display: flex; gap: .55rem; align-items: center; margin: 0; font: 800 var(--step-1) var(--serif); color: var(--forest-deep); }
.who .dot { background: var(--pc); }
.dice-row { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
.die { width: 64px; height: 64px; background: #fff; border: 2px solid var(--charcoal); border-radius: 12px; box-shadow: 2px 2px 0 var(--charcoal); display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); padding: 8px; gap: 2px; flex: none; }
.die span { border-radius: 50%; margin: 2px; }
.die span.on { background: var(--charcoal); }
.die.rolling { animation: shake .12s linear infinite; }
@keyframes shake { 0% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } 100% { transform: rotate(-8deg); } }
.roll { font-size: var(--step-0); }
.cpu-note { display: flex; gap: .4rem; align-items: center; color: var(--ink-soft); margin: 0; font-size: var(--step--1); }
.cpu-note svg { width: 1.1em; height: 1.1em; }
.msg { margin: 0; min-height: 3em; font-size: var(--step--1); color: var(--charcoal); }
.standings { list-style: none; margin: 0; padding: 0; display: grid; gap: .35rem; }
.standings li { display: grid; grid-template-columns: auto 1fr auto auto; gap: .55rem; align-items: center; padding: .45rem .6rem; border-radius: var(--radius-s); background: var(--paper); border: 1px solid transparent; font-size: var(--step--1); }
.standings li.now { border-color: var(--charcoal); }
.standings .dot { width: 1.6rem; height: 1.6rem; font-size: .75rem; }
.pn { font-weight: 600; display: inline-flex; gap: .3rem; align-items: center; min-width: 0; overflow-wrap: anywhere; }
.cpu-i { width: .95em; height: .95em; color: var(--ink-soft); }
.pos { color: var(--ink-soft); white-space: nowrap; }
.sc { display: inline-flex; gap: .2rem; align-items: center; color: var(--forest); font-weight: 600; }
.sc svg { width: .95em; height: .95em; }
.panel > .btn { justify-self: start; }
@media (max-width: 900px) {
  .play { grid-template-columns: 1fr; }
  .panel { position: static; order: -1; }
}

/* Notebook */
.notebook { padding-block: clamp(2rem, 5vw, 3rem); border-top: 1px solid var(--line); }
.nb-head { display: flex; justify-content: space-between; align-items: end; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.nb-head h2 { display: flex; align-items: center; gap: .5rem; font-size: var(--step-2); margin-bottom: .2rem; }
.nb-head h2 svg { width: .9em; height: .9em; color: var(--bark); }
.nb-head p { margin: 0; color: var(--ink-soft); }
.counts { display: grid; gap: .1rem; text-align: right; font-size: var(--step--1); font-weight: 600; color: var(--forest-deep) !important; }
.empty { color: var(--ink-soft); font-style: italic; }
.nb-grid { list-style: none; margin: 0 0 1rem; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: .75rem; }
.nb-grid li { background: var(--paper); border: 1px dashed var(--line); border-radius: var(--radius-m); padding: .5rem; display: grid; gap: .2rem; align-content: start; min-height: 150px; font-size: var(--step--1); }
.nb-grid li.met { border-style: solid; border-color: var(--charcoal); box-shadow: 2px 2px 0 var(--charcoal); }
.nb-grid img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 4px; }
.nb-grid a { font-weight: 600; }
.nb-grid em { font-size: .8em; color: var(--ink-soft); }
.locked { display: grid; place-items: center; height: 100%; min-height: 130px; font: 800 2.4rem var(--serif); color: var(--sage); }
.habits { list-style: none; margin: 0 0 .8rem; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: .4rem .9rem; font-size: var(--step--1); }
.habits li { display: flex; gap: .45rem; align-items: flex-start; color: var(--ink-soft); }
.habits li.met { color: var(--charcoal); }
.habits svg { width: 1.1em; height: 1.1em; color: var(--leaf); flex: none; margin-top: .15em; }
.habits .q { width: 1.1em; text-align: center; color: var(--sage); font-weight: 800; flex: none; }
.hidden-habit { letter-spacing: .3em; color: var(--sage); }
.link { background: none; border: 0; padding: 0; color: var(--forest); text-decoration: underline; cursor: pointer; font: inherit; font-size: var(--step--1); }

/* Legend */
.legend { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(1.5rem, 4vw, 3rem); padding-block: clamp(2rem, 5vw, 3rem) clamp(3rem, 6vw, 4rem); border-top: 1px solid var(--line); }
.legend h2 { font-size: var(--step-2); }
.legend ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .8rem; }
.legend li { display: grid; grid-template-columns: 5.2rem 1fr; gap: .8rem; font-size: var(--step--1); line-height: 1.5; }
.sq { font: 700 .85rem var(--sans); color: var(--alert); background: var(--paper); border: 1px solid currentColor; border-radius: 3px; padding: .15rem .4rem; height: fit-content; text-align: center; }
.sq.up { color: var(--forest); }
.why { color: var(--ink-soft); }
.draft { grid-column: 1 / -1; }
@media (max-width: 760px) { .legend { grid-template-columns: 1fr; } }

/* Dialog */
.card-dialog { width: min(640px, calc(100vw - 1.5rem)); max-height: calc(100dvh - 1.5rem); padding: 0; border: 1.5px solid var(--charcoal); border-radius: var(--radius-m); background: var(--paper); color: var(--charcoal); box-shadow: 6px 6px 0 var(--charcoal); overflow: auto; }
.card-dialog::backdrop { background: rgba(20, 42, 31, .55); backdrop-filter: blur(2px); }
.card-dialog[open] { animation: pop .22s ease-out; }
@keyframes pop { from { transform: translateY(12px) scale(.98); opacity: 0; } }
.dh { display: flex; align-items: center; gap: .6rem; padding: .9rem 1.2rem; border-bottom: 1px solid var(--charcoal); }
.dh h2 { margin: 0; font-size: var(--step-2); }
.dh .dot { background: var(--pc); }
.dh.snake { background: #f3dcd3; }
.dh.ladder { background: var(--sage-soft); }
.dh.won { background: #f6e7b8; }
.trophy { width: 1.8rem; height: 1.8rem; color: #8a6200; }
.sp-block { display: grid; grid-template-columns: 240px 1fr; gap: 1rem; padding: 1rem 1.2rem 0; align-items: start; }
.sp-photo { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 6px; border: 1px solid var(--line); }
.sp-meta h3 { margin: 0; font-size: var(--step-1); }
.sp-meta .latin { margin: 0 0 .5rem; color: var(--ink-soft); }
.sp-meta dl { display: grid; grid-template-columns: auto 1fr; gap: .15rem .7rem; margin: 0 0 .6rem; font-size: var(--step--1); }
.sp-meta dt { color: var(--ink-soft); }
.sp-meta dd { margin: 0; }
@media (max-width: 560px) { .sp-block { grid-template-columns: 1fr; } }
.risk, .habit { padding: .9rem 1.2rem 0; }
.lbl { display: block; font-size: .72rem; text-transform: uppercase; letter-spacing: .1em; color: var(--bark); font-weight: 700; margin: 0 0 .2rem; }
.risk p:last-child { margin: 0; font-weight: 600; }
.habit .big { font: 800 var(--step-1) / 1.3 var(--serif); color: var(--forest-deep); }
.quiz { border: 0; margin: 0; padding: 1rem 1.2rem 0; display: grid; gap: .5rem; }
.quiz legend { font-weight: 600; font-size: var(--step-0); padding: 0; margin-bottom: .5rem; float: left; width: 100%; }
.opt { display: flex; gap: .55rem; align-items: center; text-align: left; font: inherit; font-size: var(--step--1); background: #fff; border: 1.5px solid var(--line); border-radius: var(--radius-s); padding: .7rem .85rem; cursor: pointer; color: var(--charcoal); }
.opt:hover:not([disabled]) { border-color: var(--forest); background: var(--sage-soft); }
.opt[disabled] { cursor: default; }
.opt svg { width: 1.1em; height: 1.1em; flex: none; }
.opt.right { border-color: var(--forest); background: #dcebd2; color: var(--forest-deep); font-weight: 600; }
.opt.wrong { border-color: var(--alert); background: #f6dcd5; color: var(--alert); }
.feedback { border-radius: var(--radius-s); padding: .7rem .9rem; font-size: var(--step--1); }
.feedback p { margin: 0 0 .35rem; }
.feedback p:last-child { margin: 0; }
.feedback.ok { background: #e3eedb; }
.feedback.no { background: #f7e6e0; }
.df { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 1rem 1.2rem 1.2rem; }
.df a { display: inline-flex; gap: .35rem; align-items: center; font-size: var(--step--1); }
.df a svg { width: 1em; height: 1em; }
.won-lede { padding: 1rem 1.2rem 0; margin: 0; color: var(--ink-soft); }
.scores, .seen { list-style: none; margin: 0; padding: .8rem 1.2rem 0; display: grid; gap: .5rem; }
.scores li { display: grid; grid-template-columns: auto auto 1fr; gap: .6rem; align-items: center; font-size: var(--step--1); }
.scores li span:last-child { color: var(--ink-soft); }
.seen li { display: grid; grid-template-columns: auto 1fr auto; gap: .7rem; align-items: start; font-size: var(--step--1); }
.seen img { width: 64px; height: 43px; object-fit: cover; border-radius: 4px; }
.seen small { display: block; color: var(--ink-soft); line-height: 1.45; }
.seen .ok { width: 1.2em; height: 1.2em; color: var(--leaf); }
.habits-seen li { grid-template-columns: auto 1fr; }
</style>
