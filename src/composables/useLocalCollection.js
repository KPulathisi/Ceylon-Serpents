import { ref, watch } from 'vue'

/** Detect whether localStorage actually works (private mode, blocked site data, etc.) */
function storageWorks() {
  try {
    const k = '__cs_test__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

const available = storageWorks()

function read(key, fallback) {
  if (!available) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function persist(key, value) {
  if (!available) return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota or blocked */ }
}

// Shared module-level state so every component sees the same collection
const saved = ref(read('cs-saved', { species: [], articles: [] }))
const compare = ref(read('cs-compare', []))

watch(saved, (v) => persist('cs-saved', v), { deep: true })
watch(compare, (v) => persist('cs-compare', v), { deep: true })

export function useLocalCollection() {
  const isSaved = (type, id) => saved.value[type].includes(id)

  function toggleSaved(type, id) {
    const list = saved.value[type]
    const i = list.indexOf(id)
    if (i === -1) list.push(id)
    else list.splice(i, 1)
  }

  function clearSaved() {
    saved.value = { species: [], articles: [] }
  }

  const inCompare = (id) => compare.value.includes(id)

  function toggleCompare(id) {
    const i = compare.value.indexOf(id)
    if (i !== -1) compare.value.splice(i, 1)
    else if (compare.value.length < 3) compare.value.push(id)
  }

  function setCompare(ids) {
    compare.value = ids.slice(0, 3)
  }

  return { saved, compare, isSaved, toggleSaved, clearSaved, inCompare, toggleCompare, setCompare, storageAvailable: available }
}
