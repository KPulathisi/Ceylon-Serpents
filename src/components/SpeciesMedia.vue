<script setup>
import { computed } from 'vue'
import SpeciesPlate from './SpeciesPlate.vue'
import { imageSet } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'

const props = defineProps({
  species: { type: Object, required: true },
  index: { type: Number, default: 0 },
  sizes: { type: String, default: '(min-width: 900px) 33vw, 100vw' },
  eager: Boolean,
  showTag: { type: Boolean, default: true }
})
const { t } = useLanguage()
const img = computed(() => props.species.images[props.index])
const set = computed(() => (img.value ? imageSet(img.value.file) : null))
</script>

<template>
  <figure class="media">
    <img
      v-if="img"
      :src="set.src"
      :srcset="set.srcset"
      :sizes="sizes"
      :alt="img.alt"
      width="1290"
      height="860"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
    />
    <SpeciesPlate
      v-else
      :plate="species.plate"
      :build="species.traits.build"
      :head="species.traits.head"
      :label="`${t('common.illustration')} ${species.names.en}, ${species.scientificName}`"
    />
    <figcaption v-if="showTag && !img" class="tag">{{ t('common.illustration') }}</figcaption>
  </figure>
</template>

<style scoped>
.media { margin: 0; position: relative; aspect-ratio: 3 / 2; overflow: hidden; background: var(--paper); }
.media img, .media :deep(svg) { width: 100%; height: 100%; object-fit: cover; }
.tag { position: absolute; left: .6rem; bottom: .5rem; font-size: .72rem; color: var(--ink-soft); background: rgba(245, 240, 224, .85); padding: .1rem .45rem; border-radius: 2px; }
</style>
