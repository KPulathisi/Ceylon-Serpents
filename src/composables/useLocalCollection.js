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

// Shared module-level state: the species chosen for comparison
const compare = ref(read('cs-compare', []))

watch(compare, (v) => persist('cs-compare', v), { deep: true })

export function useLocalCollection() {
  const inCompare = (id) => compare.value.includes(id)

  function toggleCompare(id) {
    const i = compare.value.indexOf(id)
    if (i !== -1) compare.value.splice(i, 1)
    else if (compare.value.length < 3) compare.value.push(id)
  }

  function setCompare(ids) {
    compare.value = ids.slice(0, 3)
  }

  return { compare, inCompare, toggleCompare, setCompare, storageAvailable: available }
}
