<script setup>
/** Procedural, pausable locomotion diagrams. Static frame under reduced motion. */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Play, Pause } from 'lucide-vue-next'
import { useLanguage } from '../composables/useLanguage.js'

const props = defineProps({ mode: { type: Object, required: true } })
const { t, l } = useLanguage()

const W = 640, H = 240
const phase = ref(0.6)
const playing = ref(true)
let raf = 0, last = 0
const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
if (reduced) playing.value = false

function tick(ts) {
  if (last) phase.value += Math.min(0.05, (ts - last) / 1000) * 0.9
  last = ts
  raf = requestAnimationFrame(tick)
}
function start() { if (!raf) { last = 0; raf = requestAnimationFrame(tick) } }
function stop() { cancelAnimationFrame(raf); raf = 0 }
watch(playing, (p) => (p ? start() : stop()))
onMounted(() => playing.value && start())
onBeforeUnmount(stop)

const N = 60
const body = computed(() => {
  const p = phase.value
  const id = props.mode.id
  const pts = []
  let tracks = [], walls = null, pegs = []
  if (id === 'lateral-undulation') {
    const travel = ((p * 60) % (W + 260)) - 200
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1)
      const x = travel + 200 - s * 300
      const y = 120 + 38 * Math.sin(s * Math.PI * 2.2 - p * 5)
      pts.push([x, y])
    }
    pegs = [90, 210, 330, 450, 570].map((x, i) => [x, i % 2 ? 78 : 162])
  } else if (id === 'rectilinear') {
    const travel = ((p * 26) % (W + 300)) - 120
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1)
      const bunch = 3 * Math.sin(s * Math.PI * 6 - p * 6)
      pts.push([travel + 160 - s * 300 + bunch, 130 + 2 * Math.sin(s * 3)])
    }
  } else if (id === 'concertina') {
    walls = true
    const cyc = (p * 0.6) % 1
    const base = ((Math.floor(p * 0.6) * 70) % (W + 120)) - 40
    const ext = cyc < 0.5 ? cyc * 2 : 1
    const pull = cyc < 0.5 ? 0 : (cyc - 0.5) * 2
    const head = base + 120 + ext * 70
    const tail = base + pull * 70
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1)
      const x = head - s * (head - tail)
      const fold = s > 0.35 ? (1 - Math.abs(Math.sin(Math.PI * ext * 0.5))) * 0 + 22 * (1 - ext * 0.6 * (1 - pull)) : 22 * (1 - ext)
      const y = 120 + fold * Math.sin(s * Math.PI * 7)
      pts.push([x, y])
    }
  } else {
    // sidewinding: body as a tilted wave advancing diagonally, leaving J-shaped tracks
    const travel = ((p * 34) % (W + 200)) - 120
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1)
      const x = travel + 140 - s * 200 + 30 * Math.cos(s * Math.PI * 2 - p * 4)
      const y = 60 + s * 120 + 18 * Math.sin(s * Math.PI * 2 - p * 4)
      pts.push([x, y])
    }
    for (let k = -3; k < 8; k++) {
      const x = ((k * 70 + (p * 34) % 70) % (W + 140)) - 70
      if (x < travel + 100) tracks.push(x)
    }
  }
  const d = 'M' + pts.map((q) => q.map((n) => n.toFixed(1)).join(',')).join(' L')
  return { d, head: pts[0], tracks, walls, pegs, ticks: id === 'rectilinear' ? pts.filter((_, i) => i % 3 === 0) : [] }
})
</script>

<template>
  <figure class="diagram">
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="mode.alt">
      <rect :width="W" :height="H" fill="var(--paper)" />
      <g v-if="body.walls" class="walls"><rect x="0" y="72" :width="W" height="8" /><rect x="0" y="160" :width="W" height="8" /></g>
      <g v-for="(pg, i) in body.pegs" :key="i" class="peg"><circle :cx="pg[0]" :cy="pg[1]" r="9" /></g>
      <g v-for="(x, i) in body.tracks" :key="'t' + i" class="track"><path :d="`M${x},70 l60,120 m-60,-120 c-8,0 -12,6 -10,12`" /></g>
      <path :d="body.d" class="snake-outline" />
      <path :d="body.d" class="snake" />
      <g v-for="(tk, i) in body.ticks" :key="'k' + i"><line :x1="tk[0]" :y1="tk[1] + 7" :x2="tk[0]" :y2="tk[1] + 12" class="tick" /></g>
      <circle :cx="body.head[0]" :cy="body.head[1]" r="10" class="snake-head" />
      <path :d="`M${W - 120},${H - 22} h80`" class="arrow" marker-end="url(#arr)" />
      <defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--bark)" /></marker></defs>
    </svg>
    <figcaption>
      <button class="btn small ghost" @click="playing = !playing">
        <component :is="playing ? Pause : Play" aria-hidden="true" />{{ playing ? t('knowledge.pause') : t('knowledge.play') }}
      </button>
      <span>{{ l(mode.name) }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.diagram { margin: 0; border: 1px solid var(--line); background: var(--paper); }
svg { display: block; width: 100%; height: auto; }
.snake { fill: none; stroke: var(--leaf); stroke-width: 16; stroke-linecap: round; stroke-linejoin: round; }
.snake-outline { fill: none; stroke: var(--forest-deep); stroke-width: 19; stroke-linecap: round; stroke-linejoin: round; }
.snake-head { fill: var(--forest-deep); }
.peg circle { fill: var(--sage); stroke: var(--forest); stroke-width: 1.2; }
.walls rect { fill: var(--bark); opacity: .55; }
.track path { fill: none; stroke: var(--bark); stroke-width: 3; opacity: .35; stroke-linecap: round; }
.tick { stroke: var(--forest-deep); stroke-width: 2; }
.arrow { stroke: var(--bark); stroke-width: 2; fill: none; }
figcaption { display: flex; align-items: center; gap: .8rem; padding: .6rem .8rem; border-top: 1px solid var(--line); font-size: var(--step--1); }
</style>
