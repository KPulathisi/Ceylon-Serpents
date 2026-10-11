<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Save, Trash2, Undo2, ExternalLink } from 'lucide-vue-next'
import FieldEditor from './FieldEditor.vue'
import ImageManager from './ImageManager.vue'
import { speciesSchema, newSpecies } from './schemas.js'
import { store, persist, refreshFiles } from './store.js'
import { slugify, deleteFile } from './api.js'

const props = defineProps({ id: { type: String, default: '' } })
const emit = defineEmits(['toast', 'dirty'])
const router = useRouter()

const q = ref('')
const list = computed(() => [...store.species].sort((a, b) => a.names.en.localeCompare(b.names.en)).filter((s) => !q.value || `${s.names.en} ${s.scientificName} ${s.names.si?.text || ''} ${s.names.ta?.text || ''}`.toLowerCase().includes(q.value.toLowerCase())))

const draft = ref(null)
const isNew = ref(false)
const dirty = ref(false)
const removedFiles = ref([])
const addedFiles = ref([])

// Photos uploaded during an edit that was then discarded are cleaned up
function dropUnsavedUploads() {
  for (const f of addedFiles.value) if (!stillUsed(f)) { deleteFile(`images/${f}.webp`).catch(() => {}); deleteFile(`images/${f}-sm.webp`).catch(() => {}) }
  addedFiles.value = []
}
watch(dirty, (d) => emit('dirty', d))

function open(id) {
  dropUnsavedUploads()
  const s = store.species.find((x) => x.id === id)
  draft.value = s ? structuredClone(JSON.parse(JSON.stringify(s))) : null
  isNew.value = false
  dirty.value = false
  removedFiles.value = []
}
watch(() => props.id, (id) => { if (!isNew.value || id) open(id) }, { immediate: true })

function select(id) {
  if (dirty.value && !confirm('Discard unsaved changes?')) return
  router.push(`/admin/species/${id}`)
}

function create() {
  if (dirty.value && !confirm('Discard unsaved changes?')) return
  const name = prompt('English name of the new species:')
  if (!name) return
  let id = slugify(name)
  while (store.species.some((s) => s.id === id)) id += '-2'
  draft.value = newSpecies(id)
  draft.value.names.en = name
  isNew.value = true
  dirty.value = true
  removedFiles.value = []
}

const errors = computed(() => {
  if (!draft.value) return []
  const e = []
  if (!draft.value.names.en?.trim()) e.push('English name is required.')
  if (!draft.value.scientificName?.trim()) e.push('Scientific name is required.')
  if (draft.value.images.length && !draft.value.images.some((i) => i.primary)) e.push('Choose a primary photo.')
  return e
})

function stillUsed(file) {
  return store.species.some((s) => s.images.some((i) => i.file === file)) || store.articles.some((a) => a.image === file) || store.habitats.some((h) => h.image === file)
}

async function save() {
  if (errors.value.length) return
  const d = JSON.parse(JSON.stringify(draft.value))
  const i = store.species.findIndex((s) => s.id === d.id)
  if (i === -1) store.species.push(d)
  else store.species[i] = d
  await persist('species')
  for (const f of removedFiles.value) {
    if (!stillUsed(f)) { await deleteFile(`images/${f}.webp`).catch(() => {}); await deleteFile(`images/${f}-sm.webp`).catch(() => {}) }
  }
  removedFiles.value = []
  addedFiles.value = []
  await refreshFiles()
  dirty.value = false
  emit('toast', `Saved ${d.names.en}`)
  if (isNew.value) { isNew.value = false; router.replace(`/admin/species/${d.id}`) }
}

async function remove() {
  if (!confirm(`Delete ${draft.value.names.en} and its photos? This can't be undone (a backup of species.json is kept in .admin-backups).`)) return
  const sp = draft.value
  store.species = store.species.filter((s) => s.id !== sp.id)
  store.species.forEach((s) => (s.similar = s.similar.filter((x) => x !== sp.id)))
  await persist('species')
  for (const im of sp.images) if (!stillUsed(im.file)) { await deleteFile(`images/${im.file}.webp`).catch(() => {}); await deleteFile(`images/${im.file}-sm.webp`).catch(() => {}) }
  await refreshFiles()
  dirty.value = false
  draft.value = null
  emit('toast', `Deleted ${sp.names.en}`)
  router.push('/admin/species')
}

function revert() { if (confirm('Discard unsaved changes?')) open(props.id) }
const markToday = () => { draft.value.lastReviewed = new Date().toISOString().slice(0, 10); dirty.value = true }
</script>

<template>
  <div class="split">
    <aside class="list">
      <div class="list-head">
        <label class="search"><Search /><input v-model="q" type="search" placeholder="Search species" /></label>
        <button class="btn small" @click="create"><Plus />New</button>
      </div>
      <ul>
        <li v-for="s in list" :key="s.id">
          <button :class="{ on: draft?.id === s.id }" @click="select(s.id)">
            <img v-if="s.images.length" :src="`/images/${(s.images.find((i) => i.primary) || s.images[0]).file}-sm.webp`" alt="" />
            <span v-else class="noimg"></span>
            <span><strong>{{ s.names.en }}</strong><em>{{ s.scientificName }}</em><small>{{ s.images.length }} photo{{ s.images.length === 1 ? '' : 's' }}</small></span>
          </button>
        </li>
      </ul>
    </aside>

    <section v-if="draft" class="editor">
      <div class="bar">
        <div>
          <h2>{{ draft.names.en || 'New species' }}</h2>
          <p class="id">id: <code>{{ draft.id }}</code><a v-if="!isNew" :href="`#/species/${draft.id}`" target="_blank"><ExternalLink /> View on site</a></p>
        </div>
        <div class="actions">
          <span v-if="dirty" class="dirty">Unsaved changes</span>
          <button v-if="dirty && !isNew" class="btn small ghost" @click="revert"><Undo2 />Revert</button>
          <button v-if="!isNew" class="btn small ghost danger" @click="remove"><Trash2 />Delete</button>
          <button class="btn small" :disabled="!dirty || errors.length > 0" @click="save"><Save />Save</button>
        </div>
      </div>
      <ul v-if="errors.length" class="errors"><li v-for="e in errors" :key="e">{{ e }}</li></ul>

      <ImageManager :species="draft" @change="dirty = true" @removed="(f) => removedFiles.push(f)" @added="(f) => addedFiles.push(f)" />

      <form class="form" @submit.prevent="save">
        <template v-for="f in speciesSchema" :key="f.key || f.group">
          <h3 v-if="f.group" class="group">{{ f.group }}<small v-if="f.hint">{{ f.hint }}</small></h3>
          <FieldEditor v-else :field="f" :model="draft" :class="{ wide: f.type === 'textarea' || f.type === 'multi' }" @change="dirty = true" />
        </template>
        <button type="button" class="btn small ghost today" @click="markToday">Set "last reviewed" to today</button>
      </form>
    </section>
    <section v-else class="editor empty">
      <p>Choose a species on the left, or create a new one.</p>
    </section>
  </div>
</template>

<style scoped>
.split { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; align-items: start; }
.list { position: sticky; top: 1rem; background: #fff; border: 1px solid var(--line); border-radius: 6px; max-height: calc(100vh - 2rem); display: flex; flex-direction: column; }
.list-head { display: flex; gap: .5rem; padding: .6rem; border-bottom: 1px solid var(--line); }
.search { flex: 1; display: flex; align-items: center; gap: .3rem; border: 1px solid var(--line); border-radius: 4px; padding: 0 .4rem; }
.search svg { width: 16px; color: var(--ink-soft); }
.search input { border: 0; outline: none; padding: .45rem 0; font: inherit; font-size: .88rem; width: 100%; }
.list ul { list-style: none; margin: 0; padding: .3rem; overflow-y: auto; }
.list li button { width: 100%; display: flex; gap: .6rem; align-items: center; text-align: left; border: 0; background: none; padding: .45rem; border-radius: 4px; cursor: pointer; font: inherit; }
.list li button:hover { background: var(--paper); }
.list li button.on { background: var(--sage-soft); }
.list img, .noimg { width: 52px; height: 36px; object-fit: cover; border-radius: 3px; flex: none; background: var(--sage-soft); }
.list strong { display: block; font-size: .88rem; }
.list em { display: block; font-size: .78rem; color: var(--ink-soft); }
.list small { font-size: .7rem; color: var(--bark); }
.editor { display: grid; gap: 1.2rem; }
.editor.empty { color: var(--ink-soft); padding: 3rem 0; }
.bar { position: sticky; top: 0; z-index: 5; background: var(--parchment); padding: .8rem 0; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid var(--line); }
.bar h2 { margin: 0; font-size: 1.7rem; }
.id { margin: 0; font-size: .8rem; color: var(--ink-soft); display: flex; gap: .8rem; align-items: center; }
.id a { display: inline-flex; gap: .2rem; align-items: center; }
.id svg { width: 13px; }
.actions { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
.actions svg, .list-head svg { width: 1em; }
.dirty { font-size: .8rem; color: var(--bark); font-weight: 600; }
.danger { color: var(--alert); border-color: var(--alert); }
.errors { color: var(--alert); margin: 0; font-size: .88rem; }
.form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem 1.2rem; background: #fff; border: 1px solid var(--line); border-radius: 6px; padding: 1.2rem; }
.form .wide { grid-column: 1 / -1; }
.group { grid-column: 1 / -1; margin: 1rem 0 0; font-size: 1.15rem; border-bottom: 1px solid var(--line); padding-bottom: .3rem; display: flex; gap: .6rem; align-items: baseline; }
.group:first-child { margin-top: 0; }
.group small { font-family: var(--sans); font-size: .75rem; font-weight: 400; color: var(--ink-soft); }
.today { grid-column: 1 / -1; justify-self: start; }
@media (max-width: 900px) { .split { grid-template-columns: 1fr; } .list { position: static; max-height: 320px; } .form { grid-template-columns: 1fr; } }
</style>
