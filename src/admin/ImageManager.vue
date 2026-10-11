<script setup>
import { ref } from 'vue'
import { ArrowUp, ArrowDown, Trash2, Star, Upload, LoaderCircle } from 'lucide-vue-next'
import { uploadPhoto } from './api.js'
import { refreshFiles } from './store.js'

const props = defineProps({ species: { type: Object, required: true } })
const emit = defineEmits(['change', 'removed', 'added'])
const busy = ref(false)
const err = ref('')
const input = ref(null)
const bust = ref(Date.now())

const thumb = (f) => `/images/${f}-sm.webp?v=${bust.value}`

async function onFiles(e) {
  const files = [...(e.target.files || [])]
  e.target.value = ''
  if (!files.length) return
  busy.value = true
  err.value = ''
  try {
    for (const [i, f] of files.entries()) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { err.value = `${f.name}: use JPEG, PNG or WebP.`; continue }
      const name = `${props.species.id}-${Date.now().toString(36)}${i}`
      await uploadPhoto(f, name)
      emit('added', name)
      props.species.images.push({ file: name, alt: '', primary: props.species.images.length === 0, creator: '', source: '', licence: 'Not verified' })
    }
    await refreshFiles()
    bust.value = Date.now()
    emit('change')
  } catch (x) {
    err.value = String(x.message || x)
  } finally {
    busy.value = false
  }
}

function makePrimary(i) {
  props.species.images.forEach((im, j) => (im.primary = i === j))
  emit('change')
}
function move(i, d) {
  const list = props.species.images
  const j = i + d
  if (j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
  emit('change')
}
function remove(i) {
  if (!confirm('Remove this photo? The files are deleted when you save.')) return
  const [im] = props.species.images.splice(i, 1)
  if (im.primary && props.species.images[0]) props.species.images[0].primary = true
  emit('removed', im.file)
  emit('change')
}
</script>

<template>
  <section class="imgs">
    <div class="head">
      <h3>Photos</h3>
      <button type="button" class="btn small" :disabled="busy" @click="input.click()">
        <component :is="busy ? LoaderCircle : Upload" :class="{ spin: busy }" />{{ busy ? 'Processing…' : 'Add photos' }}
      </button>
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden @change="onFiles" />
    </div>
    <p class="hint">Photos are resized to WebP automatically (1600px and 720px). The primary photo appears first and on the hero; with two or more photos, the site cross-fades between them. Record the photographer and licence for every photo.</p>
    <p class="hint inat">From <strong>iNaturalist</strong>: paste the observation link in "Source", the observer's name (as shown on iNaturalist) in "Photographer", and the photo's licence (shown under the photo, e.g. CC BY-NC). The site then credits it as "© Name, some rights reserved (CC BY-NC). Via iNaturalist". Only use photos licensed CC0, CC BY, CC BY-SA or CC BY-NC, or ones you have permission for; never "All rights reserved".</p>
    <datalist id="licences"><option value="CC0 1.0" /><option value="CC BY 4.0" /><option value="CC BY-SA 4.0" /><option value="CC BY-NC 4.0" /><option value="CC BY-NC-SA 4.0" /><option value="Used with permission" /><option value="Not verified" /></datalist>
    <p v-if="err" class="err">{{ err }}</p>
    <p v-if="!species.images.length" class="empty">No photos yet. The site shows the generated illustration until you add one.</p>
    <ol class="grid">
      <li v-for="(im, i) in species.images" :key="im.file" :class="{ primary: im.primary }">
        <img :src="thumb(im.file)" :alt="im.alt" />
        <div class="ctl">
          <button type="button" :class="['pri', { on: im.primary }]" :title="im.primary ? 'Primary photo' : 'Make primary'" @click="makePrimary(i)"><Star /> {{ im.primary ? 'Primary' : 'Make primary' }}</button>
          <span class="mv">
            <button type="button" title="Move earlier" @click="move(i, -1)"><ArrowUp /></button>
            <button type="button" title="Move later" @click="move(i, 1)"><ArrowDown /></button>
            <button type="button" class="del" title="Remove" @click="remove(i)"><Trash2 /></button>
          </span>
        </div>
        <label>Alt text (describe the photo)<input v-model="im.alt" type="text" @input="emit('change')" /></label>
        <label>Photographer<input v-model="im.creator" type="text" @input="emit('change')" /></label>
        <label>Source / link<input v-model="im.source" type="url" placeholder="https://www.inaturalist.org/observations/…" @input="emit('change')" /></label>
        <label>Licence<input v-model="im.licence" type="text" list="licences" placeholder="e.g. CC BY-NC 4.0" @input="emit('change')" /></label>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.imgs { border: 1px solid var(--line); background: #fff; padding: 1rem; border-radius: 6px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.head h3 { margin: 0; font-size: 1.2rem; }
.btn svg { width: 1em; }
.hint { font-size: .8rem; color: var(--ink-soft); margin: .4rem 0 .8rem; max-width: none; }
.err { color: var(--alert); font-weight: 600; }
.inat { background: var(--sage-soft); padding: .5rem .7rem; border-radius: 4px; }
.empty { color: var(--ink-soft); font-style: italic; }
.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .9rem; }
.grid li { border: 1px solid var(--line); border-radius: 6px; padding: .5rem; display: grid; gap: .4rem; background: var(--paper); }
.grid li.primary { border: 2px solid var(--forest); }
.grid img { width: 100%; aspect-ratio: 3/2; object-fit: cover; border-radius: 3px; }
.ctl { display: flex; justify-content: space-between; align-items: center; gap: .3rem; }
.ctl button { border: 1px solid var(--line); background: #fff; border-radius: 4px; padding: .25rem .4rem; cursor: pointer; display: inline-flex; align-items: center; gap: .25rem; font-size: .75rem; }
.ctl svg { width: 14px; height: 14px; }
.pri.on { background: var(--forest); color: #fff; border-color: var(--forest); }
.mv { display: flex; gap: .25rem; }
.del { color: var(--alert); }
label { display: grid; gap: .15rem; font-size: .72rem; color: var(--ink-soft); }
label input { font: inherit; font-size: .82rem; padding: .35rem .5rem; border: 1px solid var(--line); border-radius: 4px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
