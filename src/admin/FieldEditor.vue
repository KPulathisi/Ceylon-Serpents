<script setup>
import { computed } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { getPath, setPath } from './api.js'
import { store } from './store.js'

const props = defineProps({ field: { type: Object, required: true }, model: { type: Object, required: true } })
const emit = defineEmits(['change'])

const value = computed({
  get: () => getPath(props.model, props.field.key),
  set: (v) => { setPath(props.model, props.field.key, v); emit('change') }
})
const options = computed(() => (typeof props.field.options === 'function' ? props.field.options(store) : props.field.options) || [])
const uid = `f-${props.field.key.replace(/\W/g, '-')}`

function toggle(v) {
  const list = Array.isArray(value.value) ? [...value.value] : []
  const i = list.indexOf(v)
  i === -1 ? list.push(v) : list.splice(i, 1)
  value.value = list
}
function setLang(l, v) { value.value = { ...(value.value || {}), [l]: v } }
function editItem(i, v) { const list = [...(value.value || [])]; list[i] = v; value.value = list }
function removeItem(i) { const list = [...(value.value || [])]; list.splice(i, 1); value.value = list }
function addItem(blank) { value.value = [...(value.value || []), blank] }
</script>

<template>
  <div :class="['field', field.type]">
    <label v-if="!['multi', 'i18n', 'paragraphs', 'links', 'bool'].includes(field.type)" :for="uid">
      {{ field.label }}<span v-if="field.required" class="req">*</span>
    </label>
    <p v-else-if="field.type !== 'bool'" class="lbl">{{ field.label }}</p>

    <input v-if="field.type === 'text'" :id="uid" :lang="field.lang" type="text" :value="value ?? ''" @input="value = $event.target.value || (field.key.endsWith('.text') ? null : '')" />
    <input v-else-if="field.type === 'date'" :id="uid" type="date" :value="value ?? ''" @input="value = $event.target.value" />
    <div v-else-if="field.type === 'color'" class="color"><input :id="uid" type="color" :value="value || '#888888'" @input="value = $event.target.value" /><code>{{ value }}</code></div>
    <textarea v-else-if="field.type === 'textarea'" :id="uid" :lang="field.lang" :rows="field.rows || 4" :value="value ?? ''" @input="value = $event.target.value || (field.key === 'en.folklore' ? null : '')"></textarea>
    <select v-else-if="field.type === 'select'" :id="uid" :value="value ?? ''" @change="value = $event.target.value">
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <label v-else-if="field.type === 'bool'" class="check"><input type="checkbox" :checked="!!value" @change="value = $event.target.checked || undefined" /> {{ field.label }}</label>

    <div v-else-if="field.type === 'multi'" class="multi">
      <label v-for="o in options" :key="o.value" :class="{ on: (value || []).includes(o.value) }">
        <input type="checkbox" :checked="(value || []).includes(o.value)" @change="toggle(o.value)" /> {{ o.label }}
      </label>
    </div>

    <div v-else-if="field.type === 'i18n'" class="i18n">
      <label v-for="l in ['en', 'si', 'ta']" :key="l"><span>{{ { en: 'English', si: 'සිංහල', ta: 'தமிழ்' }[l] }}</span><input type="text" :lang="l" :value="value?.[l] ?? ''" @input="setLang(l, $event.target.value)" /></label>
    </div>

    <div v-else-if="field.type === 'paragraphs'" class="list">
      <div v-for="(p, i) in value || []" :key="i" class="row">
        <textarea rows="4" :value="p" @input="editItem(i, $event.target.value)"></textarea>
        <button type="button" class="icon" title="Remove paragraph" @click="removeItem(i)"><Trash2 /></button>
      </div>
      <button type="button" class="add" @click="addItem('')"><Plus /> Add paragraph</button>
    </div>

    <div v-else-if="field.type === 'links'" class="list">
      <div v-for="(r, i) in value || []" :key="i" class="row links">
        <input type="text" placeholder="Title" :value="r.title" @input="editItem(i, { ...r, title: $event.target.value })" />
        <input type="url" placeholder="https://…" :value="r.url" @input="editItem(i, { ...r, url: $event.target.value })" />
        <button type="button" class="icon" title="Remove link" @click="removeItem(i)"><Trash2 /></button>
      </div>
      <button type="button" class="add" @click="addItem({ title: '', url: '' })"><Plus /> Add source</button>
    </div>

    <p v-if="field.hint" class="hint">{{ field.hint }}</p>
  </div>
</template>

<style scoped>
.field { display: grid; gap: .3rem; }
label, .lbl { font-size: .82rem; font-weight: 600; color: var(--ink-soft); margin: 0; }
.req { color: var(--alert); margin-left: .15rem; }
input[type='text'], input[type='url'], input[type='date'], textarea, select { font: inherit; font-size: .92rem; padding: .55rem .7rem; border: 1px solid var(--line); border-radius: 4px; background: #fff; width: 100%; }
textarea { resize: vertical; line-height: 1.5; }
.color { display: flex; align-items: center; gap: .6rem; }
.color input { width: 48px; height: 34px; border: 1px solid var(--line); padding: 0; background: none; }
.check { display: flex; gap: .5rem; align-items: center; font-weight: 400; color: var(--charcoal); }
.multi { display: flex; flex-wrap: wrap; gap: .35rem; }
.multi label { font-weight: 400; color: var(--charcoal); display: inline-flex; gap: .35rem; align-items: center; padding: .3rem .6rem; border: 1px solid var(--line); border-radius: 999px; background: #fff; cursor: pointer; font-size: .82rem; }
.multi label.on { background: var(--sage-soft); border-color: var(--forest); }
.multi input { margin: 0; }
.i18n { display: grid; gap: .35rem; }
.i18n label { display: grid; grid-template-columns: 70px 1fr; align-items: center; gap: .5rem; font-weight: 400; }
.list { display: grid; gap: .5rem; }
.row { display: grid; grid-template-columns: 1fr auto; gap: .4rem; align-items: start; }
.row.links { grid-template-columns: 1fr 1.4fr auto; }
.icon { border: 1px solid var(--line); background: #fff; border-radius: 4px; padding: .4rem; cursor: pointer; color: var(--alert); }
.icon svg, .add svg { width: 16px; height: 16px; }
.add { justify-self: start; display: inline-flex; gap: .3rem; align-items: center; border: 1px dashed var(--forest); background: none; color: var(--forest); padding: .35rem .7rem; border-radius: 4px; cursor: pointer; font-size: .85rem; }
.hint { font-size: .78rem; color: var(--bark); margin: 0; }
</style>
