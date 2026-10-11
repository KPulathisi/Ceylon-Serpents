<script setup>
import { ref } from 'vue'
import { Upload, Trash2, Save, LoaderCircle } from 'lucide-vue-next'
import { store, persist, refreshFiles } from './store.js'
import { uploadVideo, deleteFile } from './api.js'

const emit = defineEmits(['toast'])
const busy = ref('')
const err = ref('')

async function onVideo(m, e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  if (!/\.(mp4|webm)$/i.test(f.name)) { err.value = 'Use an MP4 or WebM video.'; return }
  if (f.size > 80 * 1024 * 1024) { err.value = 'Keep videos under 80 MB (ideally under 10 MB for fast loading).'; return }
  busy.value = m.id
  err.value = ''
  try {
    const old = m.video
    m.video = await uploadVideo(f, m.id)
    if (old && old !== m.video) await deleteFile(old).catch(() => {})
    await persist('behavior')
    await refreshFiles()
    emit('toast', `Video added for ${m.name.en}`)
  } catch (x) {
    err.value = String(x.message || x)
  } finally {
    busy.value = ''
  }
}
async function removeVideo(m) {
  if (!confirm('Remove this video? The animated diagram will show again.')) return
  await deleteFile(m.video).catch(() => {})
  m.video = ''
  await persist('behavior')
  await refreshFiles()
  emit('toast', 'Video removed')
}
async function saveMeta() {
  await persist('behavior')
  emit('toast', 'Saved')
}
</script>

<template>
  <div class="moves">
    <p class="intro">Each movement shows its video when one is uploaded. Until then, the animated diagram is used. Short, looping, silent MP4s (5–10 s, 1280×720, under 10 MB) work best. Leave "AI-generated" ticked for generated videos so the site labels them honestly.</p>
    <p v-if="err" class="err">{{ err }}</p>
    <article v-for="m in store.behavior.locomotion" :key="m.id" class="move">
      <div class="preview">
        <video v-if="m.video" :src="`/${m.video}`" muted loop autoplay playsinline></video>
        <div v-else class="none">No video yet: diagram shown</div>
      </div>
      <div class="meta">
        <h3>{{ m.name.en }}</h3>
        <label>Sri Lankan example species
          <select v-model="m.example">
            <option v-for="s in store.species" :key="s.id" :value="s.id">{{ s.names.en }}</option>
          </select>
        </label>
        <label class="check"><input v-model="m.videoAi" type="checkbox" /> AI-generated video (adds a label on the site)</label>
        <label>Description (English)<textarea v-model="m.en" rows="3"></textarea></label>
        <div class="btns">
          <label class="btn small upload">
            <component :is="busy === m.id ? LoaderCircle : Upload" :class="{ spin: busy === m.id }" />{{ m.video ? 'Replace video' : 'Upload video' }}
            <input type="file" accept="video/mp4,video/webm" hidden @change="onVideo(m, $event)" />
          </label>
          <button v-if="m.video" class="btn small ghost danger" @click="removeVideo(m)"><Trash2 />Remove video</button>
          <button class="btn small ghost" @click="saveMeta"><Save />Save details</button>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.moves { display: grid; gap: 1.2rem; }
.intro { color: var(--ink-soft); max-width: 80ch; margin: 0; }
.err { color: var(--alert); font-weight: 600; }
.move { display: grid; grid-template-columns: 360px 1fr; gap: 1.2rem; background: #fff; border: 1px solid var(--line); border-radius: 6px; padding: 1rem; }
.preview video, .none { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 4px; background: var(--paper); }
.none { display: grid; place-items: center; color: var(--ink-soft); font-size: .85rem; border: 1px dashed var(--line); }
.meta { display: grid; gap: .6rem; align-content: start; }
.meta h3 { margin: 0; }
label { display: grid; gap: .2rem; font-size: .8rem; color: var(--ink-soft); font-weight: 600; }
.check { display: flex; gap: .4rem; align-items: center; font-weight: 400; color: var(--charcoal); }
select, textarea { font: inherit; font-size: .9rem; padding: .45rem .6rem; border: 1px solid var(--line); border-radius: 4px; }
.btns { display: flex; gap: .5rem; flex-wrap: wrap; }
.btns svg { width: 1em; }
.upload { cursor: pointer; display: inline-flex; color: var(--paper); }
.danger { color: var(--alert); border-color: var(--alert); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 800px) { .move { grid-template-columns: 1fr; } }
</style>
