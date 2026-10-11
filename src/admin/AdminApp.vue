<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Bug, BookOpen, Sparkles, HelpCircle, Map, Link2, Film, ArrowLeft } from 'lucide-vue-next'
import SpeciesEditor from './SpeciesEditor.vue'
import CollectionEditor from './CollectionEditor.vue'
import MovementEditor from './MovementEditor.vue'
import { store, loadAll } from './store.js'

const props = defineProps({ section: { type: String, default: 'species' }, id: { type: String, default: '' } })
const toast = ref('')
const dirty = ref(false)
let tt = 0
function showToast(msg) { toast.value = msg; clearTimeout(tt); tt = setTimeout(() => (toast.value = ''), 2600) }

const nav = [
  { key: 'species', label: 'Species', icon: Bug },
  { key: 'folklore', label: 'Folklore & stories', icon: Sparkles },
  { key: 'myths', label: 'Myths & facts', icon: HelpCircle },
  { key: 'articles', label: 'Articles', icon: BookOpen },
  { key: 'habitats', label: 'Habitats', icon: Map },
  { key: 'movement', label: 'Movement videos', icon: Film },
  { key: 'sources', label: 'Sources', icon: Link2 }
]

const warn = (e) => { if (dirty.value) { e.preventDefault(); e.returnValue = '' } }
onMounted(() => { loadAll(); window.addEventListener('beforeunload', warn); document.title = 'Admin · Ceylon Serpents' })
onBeforeUnmount(() => window.removeEventListener('beforeunload', warn))
</script>

<template>
  <div class="admin">
    <header class="top">
      <div class="brand"><strong>Ceylon Serpents</strong><span>Admin, local only</span></div>
      <nav>
        <RouterLink v-for="n in nav" :key="n.key" :to="`/admin/${n.key}`" :class="{ on: (section || 'species') === n.key }"><component :is="n.icon" />{{ n.label }}</RouterLink>
      </nav>
      <a href="#/" class="back"><ArrowLeft />View site</a>
    </header>

    <main class="body">
      <p v-if="store.error" class="fatal">Couldn't load the data: {{ store.error }}. The admin only works while <code>npm run dev</code> is running.</p>
      <p v-else-if="!store.loaded">Loading…</p>
      <template v-else>
        <SpeciesEditor v-if="(section || 'species') === 'species'" :id="id" @toast="showToast" @dirty="dirty = $event" />
        <MovementEditor v-else-if="section === 'movement'" @toast="showToast" />
        <CollectionEditor v-else :key="section" :section="section" :id="id" @toast="showToast" @dirty="dirty = $event" />
      </template>
      <section class="help">
        <h3>Publishing your changes</h3>
        <p>Edits are written straight into <code>src/data/*.json</code>, <code>public/images</code> and <code>public/videos</code>. Check the site, then commit and push. GitHub Actions rebuilds the live site automatically.</p>
        <pre>git add -A
git commit -m "Update content"
git push</pre>
      </section>
    </main>

    <Transition name="toast"><div v-if="toast" class="toast" role="status">{{ toast }}</div></Transition>
  </div>
</template>

<style scoped>
.admin { min-height: 100vh; background: var(--parchment); }
.top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 1.5rem; padding: .6rem 1.5rem; background: var(--forest-deep); color: var(--paper); flex-wrap: wrap; }
.brand { display: grid; line-height: 1.1; }
.brand strong { font-family: var(--serif); font-size: 1.15rem; }
.brand span { font-size: .72rem; opacity: .75; }
.top nav { display: flex; gap: .2rem; flex-wrap: wrap; flex: 1; }
.top nav a, .back { display: inline-flex; align-items: center; gap: .35rem; color: var(--sage-soft); text-decoration: none; padding: .4rem .7rem; border-radius: 999px; font-size: .85rem; }
.top nav a:hover, .back:hover { background: rgba(255,255,255,.08); color: #fff; }
.top nav a.on { background: var(--paper); color: var(--forest-deep); }
.top svg { width: 15px; height: 15px; }
.body { padding: 1rem 1.5rem 3rem; max-width: 1400px; margin: 0 auto; display: grid; gap: 2rem; }
.fatal { color: var(--alert); font-weight: 600; }
.help { border-top: 1px solid var(--line); padding-top: 1rem; font-size: .88rem; color: var(--ink-soft); }
.help h3 { font-size: 1rem; margin-bottom: .3rem; }
.help pre { background: #fff; border: 1px solid var(--line); padding: .7rem; border-radius: 4px; display: inline-block; font-size: .82rem; }
.toast { position: fixed; bottom: 1.2rem; left: 50%; transform: translateX(-50%); background: var(--forest-deep); color: #fff; padding: .7rem 1.2rem; border-radius: 999px; box-shadow: 0 6px 20px rgba(0,0,0,.25); z-index: 60; }
.toast-enter-active, .toast-leave-active { transition: opacity .25s, transform .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }
</style>
