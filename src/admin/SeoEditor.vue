<script setup>
import { ref, computed, watch } from 'vue'
import { Save, Undo2, Copy, Check, TriangleAlert, CircleCheck, Info, ExternalLink } from 'lucide-vue-next'
import { store, persist } from './store.js'
import { buildMeta, canonicalUrl, verificationCode, fill, speciesVars } from '../seo/meta.js'

const emit = defineEmits(['toast', 'dirty'])

const clone = (v) => JSON.parse(JSON.stringify(v))
/** Drop empty per-species overrides so "nothing typed" never counts as a change */
function normalised(d) {
  const c = clone(d)
  for (const [id, v] of Object.entries(c.species || {})) if (!v.title && !v.description) delete c.species[id]
  return JSON.stringify(c)
}
function withDefaults(src) {
  const d = clone(src)
  d.pages ??= {}
  for (const p of PAGES) d.pages[p.key] ??= { title: '', description: '' }
  d.templates ??= {}
  for (const k of ['species', 'article', 'habitat']) d.templates[k] ??= { title: '', description: '' }
  d.species ??= {}
  for (const sp of store.species) d.species[sp.id] ??= { title: '', description: '' }
  return d
}
const tab = ref('site')
const tabs = [
  { key: 'site', label: 'Site settings' },
  { key: 'pages', label: 'Page titles & descriptions' },
  { key: 'species', label: 'Species pages' },
  { key: 'templates', label: 'Templates' },
  { key: 'console', label: 'Google Search Console' }
]

const PAGES = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'library', label: 'Snake library', path: '/library' },
  { key: 'identify', label: 'Identify a snake', path: '/identify' },
  { key: 'habitats', label: 'Habitats', path: '/habitats' },
  { key: 'knowledge', label: 'Knowledge corner', path: '/knowledge' },
  { key: 'play', label: 'Snakes & ladders game', path: '/play' },
  { key: 'safety', label: 'Snakebite safety', path: '/safety' },
  { key: 'sources', label: 'About & sources', path: '/sources' },
  { key: 'compare', label: 'Compare (not indexed)', path: '/compare', noindex: true },
  { key: 'notFound', label: '404 page (not indexed)', path: '/404', noindex: true }
]
const draft = ref(withDefaults(store.seo))
const snapshot = ref(normalised(draft.value))
const dirty = computed(() => normalised(draft.value) !== snapshot.value)
watch(dirty, (v) => emit('dirty', v), { immediate: true })

// ---- length guidance (Google shows roughly 50–60 characters of a title and 120–160 of a description)
function rate(text, [min, max]) {
  const n = (text || '').length
  if (!n) return { n, cls: 'bad', msg: 'Missing' }
  if (n < min) return { n, cls: 'warn', msg: 'Too short' }
  if (n > max) return { n, cls: 'warn', msg: 'Too long, Google will cut it off' }
  return { n, cls: 'good', msg: 'Good length' }
}
const TITLE = [30, 60]
const DESC = [70, 160]

// ---- previews
const pageMeta = (key) => buildMeta(draft.value, 'page', key)
const spMeta = (s) => buildMeta(draft.value, 'species', s)
const crumbs = (path) => canonicalUrl(draft.value, path).replace(/^https?:\/\//, '').replace(/\/$/, '').split('/').join(' › ')

// ---- verification
const code = computed(() => verificationCode(draft.value.googleSiteVerification))
function normaliseCode() { draft.value.googleSiteVerification = code.value }

// ---- images for the default share card
const imageBases = computed(() => [...new Set(store.images.filter((f) => f.endsWith('.webp') && !f.endsWith('-sm.webp')).map((f) => f.replace(/\.webp$/, '')))])

// ---- species overrides
const sp = (id) => draft.value.species[id]
const missingAlt = (s) => s.images.filter((i) => !String(i.alt || '').trim()).length

// ---- templates preview
const sampleSpecies = ref(store.species[0]?.id)
const sample = computed(() => store.species.find((s) => s.id === sampleSpecies.value) || store.species[0])
const speciesPlaceholders = computed(() => (sample.value ? speciesVars(sample.value) : {}))

// ---- health check
const issues = computed(() => {
  const out = []
  const d = draft.value
  if (!d.allowIndexing) out.push({ level: 'bad', text: 'Indexing is switched OFF. Google is told not to list any page.' })
  if (!code.value) out.push({ level: 'info', text: 'No Search Console verification code yet. See the "Google Search Console" tab.', tab: 'console' })
  if (!/^https:\/\//.test(d.siteUrl || '')) out.push({ level: 'bad', text: 'The live site address must start with https://', tab: 'site' })
  const titles = new Map()
  for (const p of PAGES.filter((x) => !x.noindex)) {
    const m = pageMeta(p.key)
    const tr = rate(d.pages[p.key]?.title, TITLE)
    const dr = rate(d.pages[p.key]?.description, DESC)
    if (tr.cls !== 'good') out.push({ level: tr.cls, text: `${p.label} title: ${tr.msg} (${tr.n} characters)`, tab: 'pages' })
    if (dr.cls !== 'good') out.push({ level: dr.cls, text: `${p.label} description: ${dr.msg} (${dr.n} characters)`, tab: 'pages' })
    titles.set(m.title, [...(titles.get(m.title) || []), p.label])
  }
  for (const s of store.species) {
    const m = spMeta(s)
    titles.set(m.title, [...(titles.get(m.title) || []), s.names.en])
  }
  for (const [t, who] of titles) if (who.length > 1) out.push({ level: 'warn', text: `Duplicate title "${t}" on: ${who.join(', ')}` })
  const alt = store.species.reduce((n, s) => n + missingAlt(s), 0)
  if (alt) out.push({ level: 'warn', text: `${alt} species photo${alt === 1 ? ' has' : 's have'} no alt text. Alt text helps Google Images and screen-reader users.`, tab: 'species' })
  return out
})
const counts = computed(() => ({ bad: issues.value.filter((i) => i.level === 'bad').length, warn: issues.value.filter((i) => i.level === 'warn').length }))

// ---- save
async function save() {
  normaliseCode()
  draft.value.siteUrl = String(draft.value.siteUrl || '').trim().replace(/\/+$/, '')
  store.seo = JSON.parse(normalised(draft.value))
  await persist('seo')
  snapshot.value = normalised(draft.value)
  emit('toast', 'SEO settings saved. Commit and push to publish them.')
}
function revert() { draft.value = withDefaults(store.seo); snapshot.value = normalised(draft.value) }

// ---- copy helpers
const copied = ref('')
async function copy(text) {
  try { await navigator.clipboard.writeText(text); copied.value = text; setTimeout(() => (copied.value = ''), 1600) } catch { /* clipboard blocked */ }
}
const siteRoot = computed(() => canonicalUrl(draft.value, '/'))
const sitemapUrl = computed(() => siteRoot.value + 'sitemap.xml')
const searchConsole = 'https://search.google.com/search-console'
</script>

<template>
  <div class="seo">
    <div class="bar">
      <div>
        <h2>SEO &amp; Google search</h2>
        <p class="sub">What Google shows for each page. Changes go live after you commit and push.</p>
      </div>
      <div class="actions">
        <span v-if="dirty" class="dirty">Unsaved changes</span>
        <button v-if="dirty" class="btn small ghost" @click="revert"><Undo2 />Revert</button>
        <button class="btn small" :disabled="!dirty" @click="save"><Save />Save</button>
      </div>
    </div>

    <!-- Health -->
    <section class="health" :class="counts.bad ? 'bad' : counts.warn ? 'warn' : 'good'">
      <h3>
        <component :is="counts.bad ? TriangleAlert : counts.warn ? Info : CircleCheck" />
        SEO check: {{ counts.bad ? `${counts.bad} problem${counts.bad > 1 ? 's' : ''}` : counts.warn ? `${counts.warn} suggestion${counts.warn > 1 ? 's' : ''}` : 'all good' }}
      </h3>
      <ul v-if="issues.length">
        <li v-for="(i, n) in issues" :key="n" :class="i.level">
          {{ i.text }}
          <button v-if="i.tab" class="link" @click="tab = i.tab">Fix</button>
        </li>
      </ul>
    </section>

    <nav class="tabs" role="tablist">
      <button v-for="tb in tabs" :key="tb.key" role="tab" :aria-selected="tab === tb.key" @click="tab = tb.key">{{ tb.label }}</button>
    </nav>

    <div class="cols">
      <div class="main">
        <!-- SITE -->
        <section v-if="tab === 'site'" class="card form">
          <label>Site name
            <input v-model="draft.siteName" type="text" />
          </label>
          <label>Title suffix <small>added to the end of every page title except the home page</small>
            <input v-model="draft.titleSuffix" type="text" />
          </label>
          <label>Live site address
            <input v-model="draft.siteUrl" type="url" placeholder="https://kpulathisi.github.io/Ceylon-Serpents" />
            <small class="hint">Used for canonical links, the sitemap and social cards. Only change it if you move to a custom domain (e.g. <code>https://ceylonserpents.lk</code>). If you do, also add the new address to <code>ALLOWED_ORIGINS</code> in <code>worker/wrangler.toml</code> and add a new property in Search Console.</small>
          </label>
          <label>Google verification code
            <input v-model="draft.googleSiteVerification" type="text" placeholder='Paste the whole <meta name="google-site-verification" …> tag or just the code' @blur="normaliseCode" />
            <small v-if="code" class="hint ok"><Check /> Will add <code>&lt;meta name="google-site-verification" content="{{ code }}"&gt;</code> to every page.</small>
            <small v-else class="hint">Get it from Search Console → Add property → URL prefix → HTML tag. See the Google Search Console tab.</small>
          </label>
          <div class="field">
            <span class="lbl">Default share image <small>used on Facebook, WhatsApp, X etc. when a page has no photo of its own</small></span>
            <div class="share">
              <select v-model="draft.defaultImage">
                <option v-for="b in imageBases" :key="b" :value="b">{{ b }}</option>
              </select>
              <img v-if="draft.defaultImage" :src="`/images/${draft.defaultImage}-sm.webp`" alt="" />
            </div>
          </div>
          <label class="check" :class="{ off: !draft.allowIndexing }">
            <input v-model="draft.allowIndexing" type="checkbox" />
            Allow Google and other search engines to list this site
          </label>
          <p v-if="!draft.allowIndexing" class="warnbox"><TriangleAlert /> With this off, every page says <code>noindex</code> and <code>robots.txt</code> blocks crawlers. Use it only while the site isn't ready.</p>
        </section>

        <!-- PAGES -->
        <section v-if="tab === 'pages'" class="stack">
          <article v-for="p in PAGES" :key="p.key" class="card">
            <header class="ph"><h3>{{ p.label }}</h3><code>{{ p.path }}</code></header>
            <p v-if="p.noindex" class="note">This page is marked <code>noindex</code>, so Google won't list it. The title still shows in the browser tab.</p>
            <label>Title
              <input v-model="draft.pages[p.key].title" type="text" />
              <small :class="['count', rate(draft.pages[p.key].title, TITLE).cls]">{{ rate(draft.pages[p.key].title, TITLE).n }} / 60 · {{ rate(draft.pages[p.key].title, TITLE).msg }}<template v-if="p.key !== 'home'"> · suffix "{{ draft.titleSuffix }}" is added</template></small>
            </label>
            <label>Description
              <textarea v-model="draft.pages[p.key].description" rows="3"></textarea>
              <small :class="['count', rate(draft.pages[p.key].description, DESC).cls]">{{ rate(draft.pages[p.key].description, DESC).n }} / 160 · {{ rate(draft.pages[p.key].description, DESC).msg }}</small>
            </label>
            <div class="serp" aria-label="Google preview">
              <span class="u">{{ crumbs(p.path) }}</span>
              <span class="t">{{ pageMeta(p.key).title }}</span>
              <span class="d">{{ pageMeta(p.key).description }}</span>
            </div>
          </article>
        </section>

        <!-- SPECIES -->
        <section v-if="tab === 'species'" class="stack">
          <p class="note">Species pages use the template from the Templates tab. Leave the boxes empty to keep the automatic text, or type your own to override it for one species.</p>
          <article v-for="s in store.species" :key="s.id" class="card">
            <header class="ph">
              <h3>{{ s.names.en }} <em>{{ s.scientificName }}</em></h3>
              <RouterLink :to="`/admin/species/${s.id}`" class="small-link">Edit species</RouterLink>
            </header>
            <p v-if="missingAlt(s)" class="warnline"><TriangleAlert /> {{ missingAlt(s) }} of {{ s.images.length }} photos have no alt text. Add it in the species editor's Photos section.</p>
            <label>Title override
              <input v-model="sp(s.id).title" type="text" :placeholder="fill(draft.templates.species.title, speciesVars(s))" />
              <small v-if="sp(s.id).title" :class="['count', rate(sp(s.id).title, TITLE).cls]">{{ rate(sp(s.id).title, TITLE).n }} / 60 · {{ rate(sp(s.id).title, TITLE).msg }}</small>
            </label>
            <label>Description override
              <textarea v-model="sp(s.id).description" rows="2" :placeholder="fill(draft.templates.species.description, speciesVars(s))"></textarea>
              <small v-if="sp(s.id).description" :class="['count', rate(sp(s.id).description, DESC).cls]">{{ rate(sp(s.id).description, DESC).n }} / 160 · {{ rate(sp(s.id).description, DESC).msg }}</small>
            </label>
            <div class="serp">
              <span class="u">{{ crumbs(`/species/${s.id}`) }}</span>
              <span class="t">{{ spMeta(s).title }}</span>
              <span class="d">{{ spMeta(s).description }}</span>
            </div>
          </article>
        </section>

        <!-- TEMPLATES -->
        <section v-if="tab === 'templates'" class="stack">
          <article class="card">
            <h3>Species pages</h3>
            <p class="note">Placeholders: <code v-for="(v, k) in speciesPlaceholders" :key="k" :title="v">{{ '{' + k + '}' }}</code></p>
            <label>Title template<input v-model="draft.templates.species.title" type="text" /></label>
            <label>Description template<input v-model="draft.templates.species.description" type="text" /></label>
            <label>Preview with
              <select v-model="sampleSpecies"><option v-for="s in store.species" :key="s.id" :value="s.id">{{ s.names.en }}</option></select>
            </label>
            <div v-if="sample" class="serp">
              <span class="u">{{ crumbs(`/species/${sample.id}`) }}</span>
              <span class="t">{{ spMeta(sample).title }}</span>
              <span class="d">{{ spMeta(sample).description }}</span>
            </div>
          </article>
          <article class="card">
            <h3>Articles</h3>
            <p class="note">Placeholders: <code>{title}</code> <code>{lede}</code></p>
            <label>Title template<input v-model="draft.templates.article.title" type="text" /></label>
            <label>Description template<input v-model="draft.templates.article.description" type="text" /></label>
            <div v-if="store.articles[0]" class="serp">
              <span class="u">{{ crumbs(`/knowledge/${store.articles[0].id}`) }}</span>
              <span class="t">{{ buildMeta(draft, 'article', store.articles[0]).title }}</span>
              <span class="d">{{ buildMeta(draft, 'article', store.articles[0]).description }}</span>
            </div>
          </article>
          <article class="card">
            <h3>Habitats</h3>
            <p class="note">Placeholders: <code>{name}</code> <code>{description}</code></p>
            <label>Title template<input v-model="draft.templates.habitat.title" type="text" /></label>
            <label>Description template<input v-model="draft.templates.habitat.description" type="text" /></label>
            <div v-if="store.habitats[0]" class="serp">
              <span class="u">{{ crumbs(`/habitats/${store.habitats[0].id}`) }}</span>
              <span class="t">{{ buildMeta(draft, 'habitat', store.habitats[0]).title }}</span>
              <span class="d">{{ buildMeta(draft, 'habitat', store.habitats[0]).description }}</span>
            </div>
          </article>
        </section>

        <!-- SEARCH CONSOLE -->
        <section v-if="tab === 'console'" class="card console">
          <h3>Get the site into Google with Search Console</h3>
          <p class="note">Search Console is Google's free tool for site owners. It proves the site is yours, takes your sitemap, and shows which searches bring visitors. Do steps 1–4 once.</p>
          <ol class="steps">
            <li>
              <strong>Add the site.</strong> Open <a :href="searchConsole" target="_blank" rel="noopener">Search Console <ExternalLink /></a>, choose <em>Add property</em>, then <strong>URL prefix</strong> (the "Domain" option needs DNS access, which github.io doesn't give you) and enter:
              <span class="copyrow"><code>{{ siteRoot }}</code><button class="btn small ghost" @click="copy(siteRoot)"><component :is="copied === siteRoot ? Check : Copy" />Copy</button></span>
            </li>
            <li>
              <strong>Verify ownership.</strong> Pick the <strong>HTML tag</strong> method and copy the <code>&lt;meta&gt;</code> tag. Paste it into <button class="link" @click="tab = 'site'">Site settings → Google verification code</button>, save, then commit and push. When GitHub Actions has finished (about 2 minutes), go back to Search Console and click <em>Verify</em>.
              <span v-if="code" class="ok"><Check /> Code saved: <code>{{ code }}</code></span>
            </li>
            <li>
              <strong>Submit the sitemap.</strong> In Search Console open <em>Sitemaps</em> and submit:
              <span class="copyrow"><code>{{ sitemapUrl }}</code><button class="btn small ghost" @click="copy(sitemapUrl)"><component :is="copied === sitemapUrl ? Check : Copy" />Copy</button></span>
              It's rebuilt automatically on every deploy, with every species, habitat and article page.
            </li>
            <li>
              <strong>Ask Google to crawl the key pages.</strong> Paste each address into the <em>URL inspection</em> bar at the top and click <em>Request indexing</em>: the home page, <code>/library/</code>, <code>/safety/</code> and <code>/play/</code>. The rest are found through the sitemap and links.
            </li>
            <li>
              <strong>Wait, then check.</strong> New sites usually appear within a few days to a few weeks. Search Google for <code>site:{{ siteRoot.replace(/^https?:\/\//, '') }}</code> to see which pages are listed, and check <em>Indexing → Pages</em> for pages Google skipped and why.
            </li>
            <li>
              <strong>Improve with real data.</strong> After a few weeks, <em>Performance</em> lists the searches people used (for example "නාගයා" or "Russell's viper bite"). Put those words into the page title or description here, or into the page text.
            </li>
          </ol>
          <p class="note">Optional: <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener">Bing Webmaster Tools <ExternalLink /></a> can import your Search Console settings in one click.</p>
        </section>
      </div>

      <!-- Guidelines -->
      <aside class="guide card">
        <h3>SEO guidelines</h3>
        <h4>Titles</h4>
        <ul>
          <li>30–60 characters. Google cuts off longer titles.</li>
          <li>Put the most-searched words first, like <em>"Russell's viper (Daboia russelii)"</em>.</li>
          <li>Give every page a different title.</li>
        </ul>
        <h4>Descriptions</h4>
        <ul>
          <li>70–160 characters, written as a short pitch for the page.</li>
          <li>Include the Sinhala and Tamil names people actually type.</li>
          <li>Google sometimes writes its own snippet from the page text, so good page text matters as much.</li>
        </ul>
        <h4>What really ranks</h4>
        <ul>
          <li>Useful, original page text: full species profiles, folklore, myths.</li>
          <li>Alt text on every photo, for Google Images.</li>
          <li>Links from other sites: schools, wildlife groups, Wikipedia references, social posts.</li>
          <li>Keep addresses stable. Renaming a species id changes its URL.</li>
        </ul>
        <h4>Avoid</h4>
        <ul>
          <li>Repeating keywords ("snake snake Sri Lanka snakes"). Google treats it as spam.</li>
          <li>The old <code>keywords</code> meta tag. Google ignores it, so there's no field for it.</li>
        </ul>
        <h4>Already handled automatically</h4>
        <ul class="done">
          <li><Check />Every page pre-rendered to HTML at build time</li>
          <li><Check />Clean URLs, canonical links</li>
          <li><Check /><code>sitemap.xml</code> and <code>robots.txt</code></li>
          <li><Check />Social cards (Open Graph / X)</li>
          <li><Check />Breadcrumbs and structured data</li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.seo { display: grid; gap: 1rem; }
.bar { position: sticky; top: 52px; z-index: 5; background: var(--parchment); padding: .8rem 0; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid var(--line); }
.bar h2 { margin: 0; font-size: 1.5rem; }
.sub { margin: 0; font-size: .85rem; color: var(--ink-soft); }
.actions { display: flex; gap: .5rem; align-items: center; }
.actions svg { width: 1em; }
.dirty { font-size: .8rem; color: var(--bark); font-weight: 600; }

.health { border: 1px solid var(--line); border-left-width: 5px; border-radius: 6px; background: #fff; padding: .8rem 1rem; }
.health.good { border-left-color: var(--leaf); }
.health.warn { border-left-color: #c08a1e; }
.health.bad { border-left-color: var(--alert); }
.health h3 { display: flex; align-items: center; gap: .45rem; margin: 0; font-size: 1rem; }
.health h3 svg { width: 18px; }
.health ul { margin: .5rem 0 0; padding-left: 1.2rem; font-size: .86rem; display: grid; gap: .2rem; }
.health li.bad { color: var(--alert); font-weight: 600; }
.health li.info { color: var(--ink-soft); }
.link { background: none; border: 0; padding: 0; color: var(--forest); text-decoration: underline; cursor: pointer; font: inherit; margin-left: .3rem; }

.tabs { display: flex; flex-wrap: wrap; gap: .3rem; border-bottom: 1px solid var(--line); }
.tabs button { border: 1px solid var(--line); border-bottom: 0; background: var(--paper); padding: .5rem .9rem; border-radius: 6px 6px 0 0; cursor: pointer; font: inherit; font-size: .86rem; color: var(--ink-soft); }
.tabs button[aria-selected='true'] { background: #fff; color: var(--forest-deep); font-weight: 600; }

.cols { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 1.5rem; align-items: start; }
.stack { display: grid; gap: 1rem; }
.card { background: #fff; border: 1px solid var(--line); border-radius: 6px; padding: 1.1rem 1.2rem; display: grid; gap: .8rem; }
.card h3 { margin: 0; font-size: 1.1rem; }
.card h3 em { font-family: var(--serif); font-weight: 400; color: var(--ink-soft); }
.ph { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
.ph code { font-size: .8rem; color: var(--ink-soft); }
.small-link { font-size: .82rem; }
label, .lbl { display: grid; gap: .3rem; font-size: .82rem; font-weight: 600; color: var(--ink-soft); }
label small, .lbl small { font-weight: 400; }
input[type='text'], input[type='url'], textarea, select { font: inherit; font-size: .92rem; padding: .55rem .7rem; border: 1px solid var(--line); border-radius: 4px; background: #fff; width: 100%; font-weight: 400; color: var(--charcoal); }
textarea { resize: vertical; line-height: 1.5; }
.field { display: grid; gap: .3rem; }
.share { display: flex; gap: .8rem; align-items: center; }
.share select { max-width: 320px; }
.share img { width: 120px; height: 63px; object-fit: cover; border-radius: 4px; border: 1px solid var(--line); }
.check { display: flex; gap: .5rem; align-items: center; color: var(--charcoal); font-weight: 600; }
.check.off { color: var(--alert); }
.hint { color: var(--bark); font-weight: 400; }
.hint code, .note code { font-size: .78rem; }
.ok { color: var(--forest); display: inline-flex; align-items: center; gap: .3rem; flex-wrap: wrap; }
.ok svg, .hint svg { width: 14px; }
.warnbox, .warnline { display: flex; gap: .5rem; align-items: flex-start; color: var(--alert); font-size: .85rem; margin: 0; }
.warnline { color: #8a4b12; }
.warnbox svg, .warnline svg { width: 16px; flex: none; margin-top: .15rem; }
.note { margin: 0; font-size: .85rem; color: var(--ink-soft); max-width: none; }
.note code { margin-right: .3rem; background: var(--paper); padding: .05rem .3rem; border-radius: 3px; cursor: help; }
.count { font-weight: 400; font-size: .76rem; }
.count.good { color: var(--forest); }
.count.warn { color: #9a6200; }
.count.bad { color: var(--alert); }

/* Google result preview */
.serp { font-family: Arial, Helvetica, sans-serif; background: #fff; border: 1px dashed var(--line); border-radius: 6px; padding: .7rem .9rem; display: grid; gap: .15rem; max-width: 640px; }
.serp .u { font-size: 12px; color: #4d5156; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.serp .t { font-size: 19px; color: #1a0dab; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 600px; }
.serp .d { font-size: 13.5px; color: #4d5156; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.console .steps { margin: 0; padding-left: 1.3rem; display: grid; gap: 1rem; font-size: .92rem; }
.console .steps li { line-height: 1.55; }
.console a svg { width: 13px; vertical-align: -1px; }
.copyrow { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; margin-top: .35rem; }
.copyrow code { background: var(--paper); padding: .3rem .5rem; border-radius: 4px; font-size: .82rem; word-break: break-all; }
.copyrow svg { width: 1em; }

.guide { position: sticky; top: 130px; font-size: .85rem; gap: .3rem; }
.guide h4 { margin: .7rem 0 .1rem; font-size: .9rem; font-family: var(--sans); font-weight: 700; color: var(--forest-deep); }
.guide ul { margin: 0; padding-left: 1.1rem; display: grid; gap: .2rem; color: var(--charcoal); }
.guide .done { list-style: none; padding: 0; }
.guide .done li { display: flex; gap: .35rem; align-items: center; }
.guide .done svg { width: 14px; color: var(--leaf); flex: none; }
@media (max-width: 1050px) { .cols { grid-template-columns: 1fr; } .guide { position: static; } }
</style>
