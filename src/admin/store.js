import { reactive } from 'vue'
import { loadData, saveData, listFiles } from './api.js'

const FILES = ['species', 'habitats', 'behavior', 'myths', 'articles', 'sources', 'imageCredits', 'folklore']

export const store = reactive({ loaded: false, error: '', images: [], videos: [], ...Object.fromEntries(FILES.map((f) => [f, null])) })

export async function loadAll() {
  try {
    const results = await Promise.all(FILES.map(loadData))
    FILES.forEach((f, i) => (store[f] = results[i]))
    await refreshFiles()
    store.loaded = true
  } catch (e) {
    store.error = String(e.message || e)
  }
}

export async function refreshFiles() {
  store.images = await listFiles('images')
  store.videos = await listFiles('videos')
}

export async function persist(name) {
  await saveData(name, store[name])
}
