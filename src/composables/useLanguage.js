import { ref, computed, watch } from 'vue'
import en from '../locales/en.json'
import si from '../locales/si.json'
import ta from '../locales/ta.json'

const dictionaries = { en, si, ta }
export const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'si', label: 'සිංහල', short: 'සිං' },
  { code: 'ta', label: 'தமிழ்', short: 'தமிழ்' }
]

function readStored() {
  try {
    const v = localStorage.getItem('cs-lang')
    return dictionaries[v] ? v : 'en'
  } catch {
    return 'en'
  }
}

const lang = ref(readStored())

watch(
  lang,
  (v) => {
    try { localStorage.setItem('cs-lang', v) } catch { /* storage unavailable */ }
    if (typeof document !== 'undefined') document.documentElement.lang = v
  },
  { immediate: true }
)

function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict)
}

export function useLanguage() {
  /** UI string lookup with English fallback and {var} interpolation */
  function t(key, vars) {
    let v = lookup(dictionaries[lang.value], key)
    if (v === undefined) v = lookup(en, key)
    if (v === undefined) return key
    if (typeof v === 'string' && vars) {
      v = v.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
    }
    return v
  }

  /**
   * Pick a localised field from an {en, si, ta} object.
   * Returns { text, fallback } so the UI can flag English shown in place of a missing translation.
   */
  function loc(obj) {
    if (obj == null) return { text: '', fallback: false }
    if (typeof obj === 'string') return { text: obj, fallback: lang.value !== 'en' }
    const v = obj[lang.value]
    if (v) return { text: v, fallback: false }
    return { text: obj.en ?? '', fallback: lang.value !== 'en' }
  }

  /** Shorthand when the fallback flag isn't needed */
  const l = (obj) => loc(obj).text

  const isEnglish = computed(() => lang.value === 'en')

  return { lang, t, loc, l, isEnglish, LANGS }
}
