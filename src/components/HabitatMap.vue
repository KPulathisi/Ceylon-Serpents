<script setup>
import { ISLAND, WET, INTERMEDIATE, VIEWBOX } from './islandPaths.js'
import { useLanguage } from '../composables/useLanguage.js'
import { useId } from 'vue'

defineProps({ highlight: { type: String, default: '' } })
const { t } = useLanguage()
const id = useId()
</script>

<template>
  <figure class="map">
    <svg :viewBox="VIEWBOX" role="img" :aria-label="t('habitats.mapAlt')">
      <defs>
        <clipPath :id="'isl' + id"><path :d="ISLAND" /></clipPath>
        <pattern :id="'hatch' + id" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--forest)" stroke-width="2.2" />
        </pattern>
      </defs>
      <!-- sea contour rings -->
      <g class="rings" aria-hidden="true">
        <path v-for="i in 4" :key="i" :d="ISLAND" :transform="`translate(${142 - 142 * (1 + i * 0.07)}, ${245 - 245 * (1 + i * 0.05)}) scale(${1 + i * 0.07}, ${1 + i * 0.05})`" />
      </g>
      <g :clip-path="`url(#isl${id})`">
        <rect width="100%" height="100%" :class="['dry', { dim: highlight === 'wet' }]" />
        <path :d="INTERMEDIATE" :class="['inter', { dim: highlight === 'wet' || highlight === 'dry' }]" />
        <path :d="WET" :class="['wet', { dim: highlight === 'dry' }]" />
        <rect v-if="highlight === 'mixed'" width="100%" height="100%" :fill="`url(#hatch${id})`" class="hatch" />
      </g>
      <path :d="ISLAND" :class="['coast', { on: highlight === 'coast' }]" />
    </svg>
    <figcaption class="legend">
      <span><i class="sw wet"></i>{{ t('habitats.wet') }}</span>
      <span><i class="sw inter"></i>{{ t('habitats.intermediate') }}</span>
      <span><i class="sw dry"></i>{{ t('habitats.dry') }}</span>
      <span><i class="sw coast"></i>{{ t('habitats.coast') }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.map { margin: 0; }
svg { width: 100%; height: auto; max-height: 70vh; display: block; margin-inline: auto; }
.rings path { fill: none; stroke: var(--sage); stroke-width: 1; opacity: .7; }
.dry { fill: #d9c9a0; } .dry, .inter, .wet { transition: opacity .3s; } .dim { opacity: .28; }
.inter { fill: #b9be8e; }
.wet { fill: #7f9f62; }
.hatch { opacity: .22; pointer-events: none; }
.coast { fill: none; stroke: var(--forest-deep); stroke-width: 1.6; }
.coast.on { stroke: #2f6f8f; stroke-width: 6; }
.legend { display: flex; flex-wrap: wrap; gap: .4rem 1rem; justify-content: center; font-size: var(--step--1); margin-top: .8rem; }
.legend span { display: inline-flex; align-items: center; gap: .35rem; }
.sw { width: 14px; height: 14px; display: inline-block; border: 1px solid var(--charcoal); }
.sw.wet { background: #7f9f62; } .sw.inter { background: #b9be8e; } .sw.dry { background: #d9c9a0; } .sw.coast { background: #2f6f8f; }
</style>
