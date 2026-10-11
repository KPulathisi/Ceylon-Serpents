<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Save, Trash2, Undo2 } from 'lucide-vue-next'
import FieldEditor from './FieldEditor.vue'
import { collections } from './schemas.js'
import { store, persist } from './store.js'
import { slugify } from './api.js'

const props = defineProps({ section: { type: String, required: true }, id: { type: String, default: '' } })
const emit = defineEmits(['toast', 'dirty'])
const router = useRouter()

const cfg = computed(() => collections[props.section])
const items = computed(() => store[cfg.value.file] || [])
const draft = ref(null)
const isNew = ref(false)
const dirty = ref(false)
watch(dirty, (d) => emit('dirty', d))

function open() {
  const x = items.value.find((i) => i.id === props.id)
  draft.value = x ? JSON.parse(JSON.stringify(x)) : null
  isNew.value = false
  dirty.value = false
}
watch(() => [props.section, props.id], open, { immediate: true })

function select(id) {
  if (dirty.value && !confirm('Discard unsaved changes?')) return
  router.push(`/admin/${props.section}/${id}`)
}
function create() {
  if (dirty.value && !confirm('Discard unsaved changes?')) return
  const title = prompt('Short title (used to make the id):')
  if (!title) return
  let id = slugify(title)
  while (items.value.some((i) => i.id === id)) id += '-2'
  draft.value = cfg.value.blank(id)
  isNew.value = true
  dirty.value = true
}
const missing = computed(() => (draft.value ? cfg.value.fields.filter((f) => f.required && !String(draft.value[f.key] ?? '').trim()).map((f) => f.label) : []))

async function save() {
  if (missing.value.length) return
  const d = JSON.parse(JSON.stringify(draft.value))
  const list = store[cfg.value.file]
  const i = list.findIndex((x) => x.id === d.id)
  i === -1 ? list.push(d) : (list[i] = d)
  await persist(cfg.value.file)
  dirty.value = false
  emit('toast', 'Saved')
  if (isNew.value) { isNew.value = false; router.replace(`/admin/${props.section}/${d.id}`) }
}
async function remove() {
  if (!confirm('Delete this entry? (A backup is kept in .admin-backups.)')) return
  store[cfg.value.file] = items.value.filter((x) => x.id !== draft.value.id)
  await persist(cfg.value.file)
  dirty.value = false
  draft.value = null
  emit('toast', 'Deleted')
  router.push(`/admin/${props.section}`)
}
</script>

<template>
  <div class="split">
    <aside class="list">
      <div class="list-head">
        <strong>{{ cfg.label }}</strong>
        <button class="btn small" @click="create"><Plus />New</button>
      </div>
      <ul>
        <li v-for="x in items" :key="x.id"><button :class="{ on: draft?.id === x.id }" @click="select(x.id)">{{ cfg.titleOf(x) }}</button></li>
      </ul>
    </aside>
    <section v-if="draft" class="editor">
      <div class="bar">
        <div><h2>{{ cfg.titleOf(draft) || 'New entry' }}</h2><p class="id">id: <code>{{ draft.id }}</code></p></div>
        <div class="actions">
          <span v-if="dirty" class="dirty">Unsaved changes</span>
          <button v-if="dirty && !isNew" class="btn small ghost" @click="open"><Undo2 />Revert</button>
          <button v-if="!isNew" class="btn small ghost danger" @click="remove"><Trash2 />Delete</button>
          <button class="btn small" :disabled="!dirty || missing.length > 0" @click="save"><Save />Save</button>
        </div>
      </div>
      <p v-if="missing.length" class="errors">Required: {{ missing.join(', ') }}</p>
      <form class="form" @submit.prevent="save">
        <FieldEditor v-for="f in cfg.fields" :key="f.key" :field="f" :model="draft" @change="dirty = true" />
      </form>
    </section>
    <section v-else class="editor empty"><p>Choose an entry on the left, or create a new one.</p></section>
  </div>
</template>

<style scoped>
.split { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; align-items: start; }
.list { position: sticky; top: 1rem; background: #fff; border: 1px solid var(--line); border-radius: 6px; max-height: calc(100vh - 2rem); display: flex; flex-direction: column; }
.list-head { display: flex; justify-content: space-between; align-items: center; gap: .5rem; padding: .6rem .8rem; border-bottom: 1px solid var(--line); }
.list ul { list-style: none; margin: 0; padding: .3rem; overflow-y: auto; }
.list li button { width: 100%; text-align: left; border: 0; background: none; padding: .55rem .6rem; border-radius: 4px; cursor: pointer; font: inherit; font-size: .88rem; }
.list li button:hover { background: var(--paper); }
.list li button.on { background: var(--sage-soft); }
.editor { display: grid; gap: 1rem; }
.editor.empty { color: var(--ink-soft); padding: 3rem 0; }
.bar { position: sticky; top: 0; z-index: 5; background: var(--parchment); padding: .8rem 0; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid var(--line); }
.bar h2 { margin: 0; font-size: 1.5rem; }
.id { margin: 0; font-size: .8rem; color: var(--ink-soft); }
.actions { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
.actions svg, .list-head svg { width: 1em; }
.dirty { font-size: .8rem; color: var(--bark); font-weight: 600; }
.danger { color: var(--alert); border-color: var(--alert); }
.errors { color: var(--alert); margin: 0; }
.form { display: grid; gap: 1rem; background: #fff; border: 1px solid var(--line); border-radius: 6px; padding: 1.2rem; }
@media (max-width: 900px) { .split { grid-template-columns: 1fr; } .list { position: static; max-height: 300px; } }
</style>
