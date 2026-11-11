<script setup>
/**
 * The 10×10 board, drawn in SVG. Each snake is painted from its species' plate colours and pattern
 * (species.json), with a head shape for its group: triangular for vipers, hooded for the cobra,
 * rounded for the rest. Square numbers sit on top of everything so they are always readable.
 */
import { computed } from 'vue'
import { cellXY, game } from '../../composables/useSnakesLadders.js'
import { useData } from '../../composables/useData.js'

const props = defineProps({
  players: { type: Array, default: () => [] },
  sliding: Boolean,
  label: { type: String, default: '' }
})
const { getSpecies } = useData()

const snakeHeads = new Set(game.snakes.map((s) => s.head))
const ladderFeet = new Set(game.ladders.map((l) => l.from))
const cells = Array.from({ length: 100 }, (_, i) => {
  const n = i + 1
  const { x, y } = cellXY(n)
  const kind = n === 100 ? 'goal' : snakeHeads.has(n) ? 'snake' : ladderFeet.has(n) ? 'ladder' : (Math.floor(i / 10) + i) % 2 === 0 ? 'a' : 'b'
  return { n, x: x - 5, y: y - 5, kind }
})

const f = (v) => v.toFixed(2)
const pt = (p) => `${f(p[0])} ${f(p[1])}`
const line = (pts) => 'M' + pts.map(pt).join(' L')

/** Centre line, outline polygon and normals of a gently waving, tail-tapered body from head a to tail b */
function body(a, b, W) {
  const dx = b.x - a.x, dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const nx = -dy / len, ny = dx / len
  const waves = Math.max(1, Math.round((len / 13) * 2) / 2)
  const amp = Math.min(2.2, len * 0.12)
  const N = Math.round(len * 3)
  const c = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const env = Math.min(1, Math.sin(Math.PI * t) * 2.5)
    const off = amp * Math.sin(t * Math.PI * 2 * waves) * env
    c.push([a.x + dx * t + nx * off, a.y + dy * t + ny * off, t])
  }
  const width = (t) => (t < 0.55 ? 1 : 1 - Math.pow((t - 0.55) / 0.45, 1.5) * 0.9)
  const norms = c.map((p, i) => {
    const q = c[Math.min(i + 1, N)], o = c[Math.max(i - 1, 0)]
    const tx = q[0] - o[0], ty = q[1] - o[1], m = Math.hypot(tx, ty)
    return [-ty / m, tx / m]
  })
  const L = c.map((p, i) => [p[0] + norms[i][0] * (W / 2) * width(p[2]), p[1] + norms[i][1] * (W / 2) * width(p[2])])
  const R = c.map((p, i) => [p[0] - norms[i][0] * (W / 2) * width(p[2]), p[1] - norms[i][1] * (W / 2) * width(p[2])])
  const outline = line(L) + ' L' + [...R].reverse().map(pt).join(' L') + ' Z'
  const angle = (Math.atan2(c[0][1] - c[4][1], c[0][0] - c[4][0]) * 180) / Math.PI
  return { c, norms, outline, angle, width }
}

/** Pattern overlay drawn inside the body (clipped), loosely following the species' plate pattern */
function pattern(kind, g, W, mark) {
  const { c, norms, width } = g
  const along = (from = 0) => line(c.filter((p) => p[2] >= from))
  switch (kind) {
    case 'thin-bands': return [{ d: along(0.12), stroke: mark, w: W * 2, dash: '0.55 2.1' }]
    case 'wide-bands': return [{ d: along(0.12), stroke: mark, w: W * 2, dash: '1.6 1.6' }]
    case 'rear-bars': return [{ d: along(0.45), stroke: mark, w: W * 2, dash: '0.6 2.2' }]
    case 'chain': return [{ d: along(0.14), stroke: mark, w: W * 0.55, dash: '0.9 1.9', cap: 'round' }, { d: along(0.14), stroke: '#f0e2c4', w: W * 0.2, dash: '0.9 1.9', cap: 'round' }]
    case 'blotch': return [{ d: along(0.14), stroke: mark, w: W * 0.7, dash: '1.3 1.7', cap: 'round' }]
    case 'check': return [{ d: along(0.12), stroke: mark, w: W * 2, dash: '0.7 1.1' }]
    case 'zigzag': {
      const pts = []
      for (let i = 6, k = 0; i < c.length; i += 3, k++) {
        const s = (k % 2 ? 1 : -1) * 0.3 * W * width(c[i][2])
        pts.push([c[i][0] + norms[i][0] * s, c[i][1] + norms[i][1] * s])
      }
      return [{ d: line(pts), stroke: mark, w: W * 0.28, cap: 'round' }]
    }
    default: return []
  }
}

const snakes = game.snakes.map((s) => {
  const sp = getSpecies(s.species)
  const plate = sp?.plate || { base: '#6b5232', mark: '#3b2c1b', pattern: 'plain' }
  const head = plate.hood ? 'cobra' : sp?.group === 'viper' ? 'viper' : 'round'
  const W = plate.slender || plate.tiny ? 2.1 : head === 'cobra' ? 3.1 : 2.9
  const a = cellXY(s.head), b = cellXY(s.tail)
  const g = body(a, b, W)
  return { id: s.id, head, W, a, angle: g.angle, outline: g.outline, base: plate.base, mark: plate.mark, overlay: pattern(plate.pattern, g, W, plate.mark) }
})

const ladders = game.ladders.map((l) => {
  const a = cellXY(l.from), b = cellXY(l.to)
  const dx = b.x - a.x, dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const nx = (-dy / len) * 1.9, ny = (dx / len) * 1.9
  // rails run a little past the square centres so the ends read clearly
  const ex = (dx / len) * 1.8, ey = (dy / len) * 1.8
  const rungs = []
  const count = Math.round(len / 3.1)
  for (let i = 1; i < count; i++) {
    const t = i / count
    const cx = a.x + dx * t, cy = a.y + dy * t
    rungs.push({ x1: cx - nx, y1: cy - ny, x2: cx + nx, y2: cy + ny })
  }
  const rail = (s) => ({ x1: a.x - ex + s * nx, y1: a.y - ey + s * ny, x2: b.x + ex + s * nx, y2: b.y + ey + s * ny })
  return { id: l.id, r1: rail(-1), r2: rail(1), rungs }
})

const OFFSETS = [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]]
const tokens = computed(() =>
  props.players
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.pos > 0)
    .map((p) => {
      const { x, y } = cellXY(p.pos)
      const [ox, oy] = OFFSETS[p.i]
      return { ...p, x: x + ox, y: y + oy }
    })
)
</script>

<template>
  <svg class="board" viewBox="-0.5 -0.5 101 101" role="img" :aria-label="label">
    <defs>
      <clipPath v-for="s in snakes" :id="`clip-${s.id}`" :key="s.id"><path :d="s.outline" /></clipPath>
    </defs>

    <g class="cells">
      <rect v-for="c in cells" :key="c.n" :x="c.x" :y="c.y" width="10" height="10" :class="c.kind" />
    </g>

    <g class="ladders" aria-hidden="true">
      <g v-for="l in ladders" :key="l.id">
        <line v-bind="l.r1" class="rail-shadow" /><line v-bind="l.r2" class="rail-shadow" />
        <line v-for="(r, i) in l.rungs" :key="i" v-bind="r" class="rung" />
        <line v-bind="l.r1" class="rail" /><line v-bind="l.r2" class="rail" />
      </g>
    </g>

    <g class="snakes" aria-hidden="true">
      <g v-for="s in snakes" :key="s.id">
        <path :d="s.outline" :fill="s.base" class="body" />
        <g :clip-path="`url(#clip-${s.id})`">
          <path v-for="(o, i) in s.overlay" :key="i" :d="o.d" :stroke="o.stroke" :stroke-width="o.w" :stroke-dasharray="o.dash" :stroke-linecap="o.cap || 'butt'" fill="none" />
        </g>
        <path :d="s.outline" class="edge" />

        <g :transform="`translate(${s.a.x} ${s.a.y}) rotate(${s.angle})`">
          <!-- Indian cobra: spread hood with the pale spectacle mark, small head in front -->
          <template v-if="s.head === 'cobra'">
            <!-- broad shield flaring out from the neck, rounded shoulders, head resting on top -->
            <path d="M-7 -1.55 C-5.6 -2.3 -4.6 -4.5 -2.6 -4.5 C-0.6 -4.5 0.8 -3.1 0.8 -1.6 L0.8 1.6 C0.8 3.1 -0.6 4.5 -2.6 4.5 C-4.6 4.5 -5.6 2.3 -7 1.55 Z" :fill="s.base" class="head" />
            <!-- darker hood edge, as on a real spread hood -->
            <path d="M-6 -1.7 C-4.9 -2.6 -4.2 -3.8 -2.6 -3.8 C-1.1 -3.8 0 -2.8 0.1 -1.6 M-6 1.7 C-4.9 2.6 -4.2 3.8 -2.6 3.8 C-1.1 3.8 0 2.8 0.1 1.6" fill="none" :stroke="s.mark" stroke-width=".55" opacity=".5" />
            <!-- spectacle mark on the back of the hood -->
            <circle cx="-2.6" cy="-1.45" r=".85" class="spectacle" />
            <circle cx="-2.6" cy="1.45" r=".85" class="spectacle" />
            <path d="M-1.85 -1.05 Q-1.2 0 -1.85 1.05" class="spectacle" />
            <path d="M3.7 0 l1.3 -.55 M3.7 0 l1.3 .55" class="tongue" />
            <ellipse cx="2" cy="0" rx="1.8" ry="1.4" :fill="s.base" class="head" />
            <circle cx="2.65" cy="-.75" r=".38" class="eye" />
            <circle cx="2.65" cy=".75" r=".38" class="eye" />
          </template>
          <!-- Vipers: broad triangular head on a narrow neck -->
          <template v-else-if="s.head === 'viper'">
            <path d="M3.6 0 l1.3 -.5 M3.6 0 l1.3 .5" class="tongue" />
            <path d="M3.5 0 Q3.3 -1 1.8 -1.9 Q0.2 -2.5 -0.9 -1.9 Q-1.5 -1.2 -1.4 0 Q-1.5 1.2 -0.9 1.9 Q0.2 2.5 1.8 1.9 Q3.3 1 3.5 0 Z" :fill="s.base" class="head" />
            <path d="M2.6 -.4 L0 -1.3 M2.6 .4 L0 1.3" :stroke="s.mark" stroke-width=".4" fill="none" stroke-linecap="round" opacity=".8" />
            <circle cx="1.5" cy="-1.35" r=".42" class="eye" />
            <circle cx="1.5" cy="1.35" r=".42" class="eye" />
          </template>
          <!-- Kraits, rat snake, sea snake and others: rounded head -->
          <template v-else>
            <path d="M3.3 0 l1.3 -.5 M3.3 0 l1.3 .5" class="tongue" />
            <ellipse cx="1.1" cy="0" rx="2.2" ry="1.6" :fill="s.base" class="head" />
            <circle cx="1.75" cy="-.85" r=".4" class="eye" />
            <circle cx="1.75" cy=".85" r=".4" class="eye" />
          </template>
        </g>
      </g>
    </g>

    <!-- Numbers on top, with a paper-coloured halo, so snakes and ladders never hide them -->
    <g class="nums" aria-hidden="true">
      <text v-for="c in cells" :key="c.n" :x="c.x + 0.8" :y="c.y + 2.7" :class="['num', c.kind]">{{ c.n }}</text>
    </g>

    <g class="tokens">
      <g v-for="p in tokens" :key="p.i" :class="['token', { sliding }]" :style="{ transform: `translate(${p.x}px, ${p.y}px)` }">
        <circle r="2.5" :fill="p.color" class="disc" />
        <text y="1" text-anchor="middle" class="tnum">{{ p.i + 1 }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.board { width: 100%; height: auto; display: block; background: var(--paper); border: 1.5px solid var(--charcoal); box-shadow: 4px 4px 0 var(--charcoal); border-radius: 2px; }
.cells rect { stroke: rgba(36, 40, 42, .08); stroke-width: .15; }
.a { fill: #efe8d2; }
.b { fill: #e1e6d2; }
.snake { fill: #f2d8cc; }
.ladder { fill: #d2e3c2; }
.goal { fill: #f1d98c; }

.num { font: 700 2.2px var(--sans); fill: var(--ink-soft); paint-order: stroke; stroke: #f5f0e0; stroke-width: .7px; stroke-linejoin: round; }
.num.snake { fill: var(--alert); }
.num.ladder { fill: var(--forest); }
.num.goal { font-size: 2.8px; fill: #6b4d00; }

.rail { stroke: #8a6239; stroke-width: .8; stroke-linecap: round; }
.rail-shadow { stroke: rgba(36, 40, 42, .3); stroke-width: 1.6; stroke-linecap: round; }
.rung { stroke: #a77c4f; stroke-width: .65; stroke-linecap: round; }

.body { stroke: none; }
.edge { fill: none; stroke: var(--charcoal); stroke-width: .4; stroke-linejoin: round; }
.head { stroke: var(--charcoal); stroke-width: .4; stroke-linejoin: round; }
.spectacle { fill: none; stroke: #efe3c6; stroke-width: .42; }
.eye { fill: #f5f0e0; stroke: var(--charcoal); stroke-width: .3; }
.tongue { stroke: #b0302a; stroke-width: .32; fill: none; stroke-linecap: round; }

.token { transition: transform .16s ease-out; }
.token.sliding { transition: transform .8s cubic-bezier(.5, 0, .3, 1); }
.disc { stroke: #fff; stroke-width: .6; filter: drop-shadow(0 .4px .5px rgba(0, 0, 0, .45)); }
.tnum { font: 700 2.6px var(--sans); fill: #fff; pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .token, .token.sliding { transition: none; } }
</style>
