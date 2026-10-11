<script setup>
/**
 * Shows a species' photos (primary first) as a gently cross-fading slideshow when there is
 * more than one, or the generated plate illustration when there are none.
 */
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import SpeciesPlate from './SpeciesPlate.vue'
import { imageSet, orderedImages } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'

const props = defineProps({
  species: { type: Object, required: true },
  index: { type: Number, default: null },     // optional v-model:index for external thumbnails
  sizes: { type: String, default: '(min-width: 900px) 33vw, 100vw' },
  eager: Boolean,
  showTag: { type: Boolean, default: true },
  interval: { type: Number, default: 5200 },
  autoplay: { type: Boolean, default: true }
})
const emit = defineEmits(['update:index'])
const { t } = useLanguage()

const images = computed(() => orderedImages(props.species))
const inner = ref(0)
const current = computed({
  get: () => (props.index ?? inner.value) % Math.max(1, images.value.length),
  set: (v) => { inner.value = v; emit('update:index', v) }
})
watch(() => props.species.id, () => (current.value = 0))

const root = ref(null)
let timer = 0, observer, visible = false, hovering = false
const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function schedule() {
  clearTimeout(timer)
  if (!props.autoplay || reduced || images.value.length < 2) return
  // stagger cards so a grid doesn't change all at once
  const jitter = (props.species.id.length * 337) % 1800
  timer = setTimeout(() => {
    if (visible && !hovering && !document.hidden) current.value = (current.value + 1) % images.value.length
    schedule()
  }, props.interval + jitter)
}
onMounted(() => {
  observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0.3 })
  if (root.value) observer.observe(root.value)
  schedule()
})
onBeforeUnmount(() => { clearTimeout(timer); observer?.disconnect() })
watch(images, schedule)
</script>

<template>
  <figure ref="root" class="media" @mouseenter="hovering = true" @mouseleave="hovering = false">
    <template v-if="images.length">
      <img
        v-for="(img, i) in images"
        :key="img.file"
        :src="imageSet(img.file).src"
        :srcset="imageSet(img.file).srcset"
        :sizes="sizes"
        :alt="i === current ? img.alt : ''"
        :aria-hidden="i !== current"
        :class="{ on: i === current }"
        width="1290"
        height="860"
        :loading="eager && i === 0 ? 'eager' : 'lazy'"
        decoding="async"
      />
      <div v-if="images.length > 1" class="dots" aria-hidden="true">
        <i v-for="(img, i) in images" :key="img.file" :class="{ on: i === current }"></i>
      </div>
    </template>
    <SpeciesPlate
      v-else
      :plate="species.plate"
      :build="species.traits.build"
      :head="species.traits.head"
      :label="`${t('common.illustration')} ${species.names.en}, ${species.scientificName}`"
    />
    <figcaption v-if="showTag && !images.length" class="tag">{{ t('common.illustration') }}</figcaption>
  </figure>
</template>

<style scoped>
.media { margin: 0; position: relative; aspect-ratio: 3 / 2; overflow: hidden; background: var(--paper); }
.media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1.1s ease; }
.media img.on { opacity: 1; }
.media :deep(svg) { width: 100%; height: 100%; }
.dots { position: absolute; right: .6rem; bottom: .55rem; display: flex; gap: 4px; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(245, 240, 224, .55); box-shadow: 0 0 0 1px rgba(0,0,0,.2); }
.dots i.on { background: var(--paper); }
.tag { position: absolute; left: .6rem; bottom: .5rem; font-size: .72rem; color: var(--ink-soft); background: rgba(245, 240, 224, .85); padding: .1rem .45rem; border-radius: 2px; }
</style>
