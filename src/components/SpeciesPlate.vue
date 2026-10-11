<script setup>
/**
 * Field-journal style illustration generated from a species' plate data.
 * Used where no verified photograph exists. It is labelled as an illustration and is a
 * stylised pattern guide, not an accurate portrait.
 */
import { computed, useId } from 'vue'

const props = defineProps({
  plate: { type: Object, required: true },
  build: { type: String, default: 'medium' },
  head: { type: String, default: 'rounded' },
  label: { type: String, default: '' }
})

const uid = useId()
const W = 600, H = 220
const widths = { tiny: 9, slender: 12, small: 22, medium: 30, stout: 44 }

const geo = computed(() => {
  const bw = widths[props.build] ?? 30
  const amp = props.build === 'tiny' ? 30 : props.build === 'stout' ? 46 : 54
  const N = 140
  const spine = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = 70 + t * 500
    const y = 110 + amp * Math.sin(t * Math.PI * 2.3 + 0.5) * (0.55 + 0.45 * (1 - t))
    spine.push({ t, x, y })
  }
  // tangents and normals
  spine.forEach((p, i) => {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(N, i + 1)]
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1
    p.tx = dx / len; p.ty = dy / len; p.nx = -p.ty; p.ny = p.tx
    p.ang = Math.atan2(dy, dx) * 180 / Math.PI
  })
  const profile = (t) => {
    let v
    if (t < 0.05) v = 0.72
    else if (t < 0.16) v = 0.72 + 0.28 * ((t - 0.05) / 0.11)
    else if (t < 0.58) v = 1
    else v = 1 - Math.pow((t - 0.58) / 0.42, 1.5) * 0.94
    if (props.plate.hood && t > 0.02 && t < 0.14) v *= 1 + 0.75 * Math.sin(((t - 0.02) / 0.12) * Math.PI)
    return v
  }
  spine.forEach((p) => (p.hw = (bw / 2) * profile(p.t)))
  const left = spine.map((p) => [p.x + p.nx * p.hw, p.y + p.ny * p.hw])
  const right = spine.map((p) => [p.x - p.nx * p.hw, p.y - p.ny * p.hw]).reverse()
  const body = 'M' + [...left, ...right].map((q) => q.map((n) => n.toFixed(1)).join(',')).join(' L') + ' Z'
  return { spine, body, bw, N }
})

const at = (t) => {
  const { spine, N } = geo.value
  return spine[Math.min(N, Math.max(0, Math.round(t * N)))]
}

// Deterministic pseudo-random so the plate looks identical on every render
const rnd = (i) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s) }

const marks = computed(() => {
  const { plate } = props
  const out = { bands: [], ellipses: [], rects: [], zig: '', belly: '' }
  const quad = (t, w, ext = 1.3) => {
    const a = at(t), b = at(t + w)
    return `M${a.x + a.nx * a.hw * ext},${a.y + a.ny * a.hw * ext} L${b.x + b.nx * b.hw * ext},${b.y + b.ny * b.hw * ext} L${b.x - b.nx * b.hw * ext},${b.y - b.ny * b.hw * ext} L${a.x - a.nx * a.hw * ext},${a.y - a.ny * a.hw * ext} Z`
  }
  switch (plate.pattern) {
    case 'thin-bands':
      for (let t = 0.12; t < 0.97; t += 0.042) out.bands.push(quad(t, 0.007), quad(t + 0.012, 0.005))
      break
    case 'wide-bands':
      for (let t = 0.1; t < 0.97; t += 0.07) out.bands.push(quad(t, 0.03))
      break
    case 'rear-bars':
      for (let t = 0.45; t < 0.97; t += 0.035) out.bands.push(quad(t, 0.012))
      break
    case 'chain':
      for (let t = 0.12, i = 0; t < 0.9; t += 0.058, i++) {
        const p = at(t)
        out.ellipses.push({ cx: p.x, cy: p.y, rx: 13, ry: p.hw * 0.5, ang: p.ang, ring: true })
        const s = at(t + 0.029)
        for (const side of [1, -1]) out.ellipses.push({ cx: s.x + s.nx * s.hw * 0.86 * side, cy: s.y + s.ny * s.hw * 0.86 * side, rx: 7, ry: s.hw * 0.26, ang: s.ang, ring: true })
      }
      break
    case 'check':
      for (let t = 0.1, i = 0; t < 0.95; t += 0.024, i++) {
        const p = at(t), off = (i % 2 ? 0.45 : -0.45) * p.hw
        out.rects.push({ x: p.x + p.nx * off, y: p.y + p.ny * off, s: Math.max(3, p.hw * 0.42), ang: p.ang })
      }
      break
    case 'blotch':
      for (let t = 0.1, i = 0; t < 0.92; t += 0.05 + rnd(i) * 0.02, i++) {
        const p = at(t), off = (rnd(i + 7) - 0.5) * p.hw * 0.5
        out.ellipses.push({ cx: p.x + p.nx * off, cy: p.y + p.ny * off, rx: 8 + rnd(i + 3) * 9, ry: p.hw * (0.45 + rnd(i + 5) * 0.35), ang: p.ang + (rnd(i) - 0.5) * 30, ring: false })
      }
      break
    case 'zigzag': {
      const pts = []
      for (let t = 0.07, i = 0; t < 0.95; t += 0.018, i++) {
        const p = at(t), off = (i % 2 ? 0.55 : -0.55) * p.hw
        pts.push(`${(p.x + p.nx * off).toFixed(1)},${(p.y + p.ny * off).toFixed(1)}`)
      }
      out.zig = 'M' + pts.join(' L')
      break
    }
  }
  // pale belly edge, gives the body some volume
  const bp = []
  for (let t = 0.04; t <= 0.97; t += 0.01) { const p = at(t); bp.push(`${(p.x - p.nx * p.hw * 0.68).toFixed(1)},${(p.y - p.ny * p.hw * 0.68).toFixed(1)}`) }
  out.belly = 'M' + bp.join(' L')
  return out
})

const headShape = computed(() => {
  const p = at(0)
  const hw = geo.value.bw / 2
  const dir = Math.atan2(-p.ty, -p.tx) * 180 / Math.PI
  let d, eye
  if (props.head === 'triangular') { d = `M0,${-hw * 1.15} C${hw * 1.2},${-hw * 1.2} ${hw * 2.1},${-hw * 0.5} ${hw * 2.2},0 C${hw * 2.1},${hw * 0.5} ${hw * 1.2},${hw * 1.2} 0,${hw * 1.15} Z`; eye = [hw * 1.3, -hw * 0.5] }
  else if (props.head === 'pointed') { d = `M0,${-hw * 0.85} C${hw * 1.5},${-hw * 0.9} ${hw * 3.6},${-hw * 0.25} ${hw * 4},0 C${hw * 3.6},${hw * 0.25} ${hw * 1.5},${hw * 0.9} 0,${hw * 0.85} Z`; eye = [hw * 1.5, -hw * 0.38] }
  else { d = `M0,${-hw * 0.82} C${hw * 1},${-hw * 0.9} ${hw * 1.75},${-hw * 0.6} ${hw * 1.8},0 C${hw * 1.75},${hw * 0.6} ${hw * 1},${hw * 0.9} 0,${hw * 0.82} Z`; eye = [hw * 1.1, -hw * 0.42] }
  return { transform: `translate(${p.x},${p.y}) rotate(${dir})`, d, eye, r: Math.max(1.6, hw * 0.16) }
})
</script>

<template>
  <svg class="plate" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="label">
    <defs>
      <clipPath :id="`b${uid}`"><path :d="geo.body" /></clipPath>
    </defs>
    <!-- faint contour ground -->
    <g class="contours" aria-hidden="true">
      <path v-for="i in 5" :key="i" :d="`M0,${30 + i * 34} C150,${10 + i * 34} 300,${60 + i * 30} 600,${24 + i * 36}`" />
    </g>
    <g :transform="headShape.transform">
      <path :d="headShape.d" :fill="plate.base" stroke="#24282a" stroke-width="1.2" />
    </g>
    <path :d="geo.body" :fill="plate.base" />
    <g :clip-path="`url(#b${uid})`">
      <path :d="marks.belly" fill="none" stroke="#f5f0e0" :stroke-width="Math.max(1.5, geo.bw * 0.18)" stroke-linecap="round" opacity=".28" />
      <path v-for="(b, i) in marks.bands" :key="'b' + i" :d="b" :fill="plate.mark" />
      <ellipse v-for="(e, i) in marks.ellipses" :key="'e' + i" :cx="e.cx" :cy="e.cy" :rx="e.rx" :ry="e.ry" :transform="`rotate(${e.ang} ${e.cx} ${e.cy})`" :fill="plate.mark" :stroke="e.ring ? '#14100b' : 'none'" :stroke-width="e.ring ? 2.2 : 0" />
      <rect v-for="(r, i) in marks.rects" :key="'r' + i" :x="r.x - r.s / 2" :y="r.y - r.s / 2" :width="r.s" :height="r.s" :transform="`rotate(${r.ang} ${r.x} ${r.y})`" :fill="plate.mark" />
      <path v-if="marks.zig" :d="marks.zig" fill="none" :stroke="plate.mark" :stroke-width="Math.max(2, geo.bw * 0.16)" stroke-linejoin="round" />
    </g>
    <path :d="geo.body" fill="none" stroke="#24282a" stroke-width="1.2" stroke-linejoin="round" />
    <g :transform="headShape.transform">
      <circle :cx="headShape.eye[0]" :cy="headShape.eye[1]" :r="headShape.r" fill="#14100b" />
    </g>
  </svg>
</template>

<style scoped>
.plate { width: 100%; height: 100%; display: block; background: var(--paper); }
.contours path { fill: none; stroke: var(--sage); stroke-width: 1; opacity: .55; }
</style>
