<script setup>
// Topographic contour lines, generated once. Drawn on by the hero animation.
const lines = []
for (let i = 0; i < 9; i++) {
  const y = 80 + i * 70
  const a = 26 + (i % 3) * 10
  let d = `M-50,${y}`
  for (let x = 0; x <= 1500; x += 150) {
    const yy = y + Math.sin(x / 210 + i * 0.7) * a + Math.cos(x / 95 + i) * 8
    d += ` S${x - 75},${yy - a * 0.4} ${x},${yy}`
  }
  lines.push(d)
}
</script>

<template>
  <svg viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path v-for="(d, i) in lines" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
path { fill: none; stroke: rgba(214, 220, 198, 0.22); stroke-width: 1.2; stroke-dasharray: 1600; stroke-dashoffset: 0; }
</style>
