<script setup>
/**
 * Attribution line for a photo, following iNaturalist's recommended format:
 * "© Name, some rights reserved (CC BY-NC)" with links to the observation and to iNaturalist.
 */
import { computed } from 'vue'
import { useLanguage } from '../composables/useLanguage.js'

const props = defineProps({ image: { type: Object, required: true } })
const { t } = useLanguage()

const isUrl = (s) => /^https?:\/\//i.test(s || '')
const fromINat = computed(() => /inaturalist\.(org|ca|lk)|inaturalist/i.test(`${props.image.source} ${props.image.licence}`))
const lic = computed(() => (props.image.licence || '').trim())
const rights = computed(() => {
  const l = lic.value
  if (/^cc0/i.test(l)) return t('credit.noRights', { l })
  if (/^cc[ -]/i.test(l)) return t('credit.someRights', { l })
  if (/all rights reserved/i.test(l)) return t('credit.allRights')
  return l
})
const creator = computed(() => (props.image.creator || '').trim() || t('credit.unknown'))
</script>

<template>
  <p class="credit">
    {{ t('common.photo') }}: {{ /^cc0/i.test(lic) ? '' : '© ' }}<a v-if="isUrl(image.source)" :href="image.source" target="_blank" rel="noopener">{{ creator }}</a><span v-else>{{ creator }}</span><template v-if="rights">, {{ rights }}</template><template v-if="fromINat">. {{ t('credit.via') }} <a href="https://www.inaturalist.org/" target="_blank" rel="noopener">iNaturalist</a></template>.
  </p>
</template>

<style scoped>
.credit { font-size: .75rem; color: var(--ink-soft); margin-top: .4rem; }
.credit a { color: inherit; }
</style>
