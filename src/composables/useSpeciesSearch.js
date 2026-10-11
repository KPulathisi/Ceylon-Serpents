import { computed, reactive } from 'vue'

/** Normalise for case- and accent-insensitive matching; Sinhala/Tamil pass through unchanged */
const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').trim()

export function useSpeciesSearch(list) {
  const state = reactive({
    query: '',
    habitat: '',
    status: '',
    group: '',
    medical: ''
  })

  const results = computed(() => {
    const q = norm(state.query)
    return list.filter((s) => {
      if (q) {
        const hay = [s.names.en, s.names.si?.text, s.names.ta?.text, s.scientificName, s.family].map(norm).join(' | ')
        if (!hay.includes(q)) return false
      }
      if (state.habitat && !s.habitats.includes(state.habitat)) return false
      if (state.status && s.status !== state.status) return false
      if (state.group && s.group !== state.group) return false
      if (state.medical && s.medical !== state.medical) return false
      return true
    })
  })

  const active = computed(() => !!(state.query || state.habitat || state.status || state.group || state.medical))

  function reset() {
    Object.assign(state, { query: '', habitat: '', status: '', group: '', medical: '' })
  }

  return { state, results, active, reset }
}
