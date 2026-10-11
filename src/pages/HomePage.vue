<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Camera, BookOpen } from 'lucide-vue-next'
import SpeciesCard from '../components/SpeciesCard.vue'
import HabitatMap from '../components/HabitatMap.vue'
import BehaviorDiagram from '../components/BehaviorDiagram.vue'
import MythFactCard from '../components/MythFactCard.vue'
import SafetyNotice from '../components/SafetyNotice.vue'
import ContourLines from '../components/ContourLines.vue'
import { useData, imageSet } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'

gsap.registerPlugin(ScrollTrigger)
const { t, l, lang } = useLanguage()
const { getSpecies, habitats, behavior, myths, getArticle } = useData()

const featured = ['green-pit-viper', 'green-vine-snake', 'indian-cobra', 'russells-viper', 'hump-nosed-viper', 'common-krait'].map(getSpecies)
const hero = imageSet('green-pit-viper')
const vine = imageSet('vine-snake-sinharaja')
const forest = imageSet('rainforest-light')
const tennent = imageSet('tennent-ceylon')
const merian = imageSet('merian-plate')
const article = getArticle('island-of-endemics')
const homeMyths = ['eye-plucker', 'rat-snake-cobra', 'charmer-music'].map((id) => myths.find((m) => m.id === id))
const mode = ref(behavior.locomotion[0])
const hoverHabitat = ref('')

const heroEl = ref(null)
let ctx
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = gsap.context(() => {
    // One orchestrated entrance: photo settles, headline rises, field label is "pinned" on
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.hero-img', { scale: 1.12, duration: 1.8 })
      .from('.hero-title .ln', { yPercent: 105, duration: 1, stagger: 0.12 }, 0.25)
      .from('.hero-lede, .hero-ctas', { opacity: 0, y: 16, duration: 0.8, stagger: 0.1 }, 0.8)
      .from('.hero .field-label', { opacity: 0, rotate: -6, y: 30, duration: 0.9 }, 1)
      .from('.hero .contours path', { strokeDashoffset: 1600, duration: 2.2, stagger: 0.05, ease: 'power1.out' }, 0)
    gsap.to('.hero-img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: heroEl.value, start: 'top top', end: 'bottom top', scrub: true } })
  }, heroEl.value)
})
onBeforeUnmount(() => ctx?.revert())

// split title into lines on the full stop / natural break for the reveal
const titleLines = () => {
  const s = t('home.title')
  const words = s.split(' ')
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}
</script>

<template>
  <div class="home">
    <!-- A. Hero -->
    <section ref="heroEl" class="hero">
      <img class="hero-img" :src="hero.src" :srcset="hero.srcset" sizes="100vw" alt="A Sri Lankan green pit viper coiled around a dark branch." width="1290" height="860" fetchpriority="high" />
      <div class="hero-shade" aria-hidden="true"></div>
      <ContourLines class="contours" />
      <div class="wrap hero-inner">
        <div class="hero-copy">
          <h1 class="hero-title" :key="lang">
            <span v-for="(ln, i) in titleLines()" :key="i" class="mask"><span class="ln">{{ ln }}</span></span>
          </h1>
          <p class="hero-lede">{{ t('home.lede') }}</p>
          <div class="hero-ctas">
            <RouterLink to="/library" class="btn light"><BookOpen aria-hidden="true" />{{ t('home.ctaLibrary') }}</RouterLink>
            <RouterLink to="/identify" class="btn outline-light"><Camera aria-hidden="true" />{{ t('home.ctaIdentify') }}</RouterLink>
          </div>
        </div>
        <RouterLink to="/species/green-pit-viper" class="field-label hero-label">
          <div class="fl-head"><span>{{ t('home.plateLabel') }}</span><span class="fl-no">No. 07</span></div>
          <p class="fl-name">{{ lang === 'si' ? 'පලා පොළඟා' : 'Sri Lankan green pit viper' }}</p>
          <p class="latin fl-latin">Craspedocephalus trigonocephalus</p>
          <dl>
            <dt>{{ t('profile.family') }}</dt><dd>Viperidae</dd>
            <dt>{{ t('library.status') }}</dt><dd>{{ t('common.endemic') }}</dd>
            <dt>{{ t('habitats.zones') }}</dt><dd>{{ t('home.plateLocality') }}</dd>
          </dl>
          <p class="fl-note">{{ t('home.plateNote') }}</p>
        </RouterLink>
      </div>
    </section>

    <!-- B. Featured species -->
    <section class="section wrap">
      <div class="section-head split">
        <div>
          <h2>{{ t('home.featuredTitle') }}</h2>
          <p>{{ t('home.featuredText') }}</p>
        </div>
        <RouterLink to="/library" class="more">{{ t('common.seeAll') }} <ArrowRight aria-hidden="true" /></RouterLink>
      </div>
      <div class="featured">
        <SpeciesCard v-for="(s, i) in featured" :key="s.id" :species="s" :class="{ lead: i === 0 }" :sizes="i === 0 ? '(min-width: 900px) 60vw, 100vw' : ''" />
      </div>
    </section>

    <!-- C. Habitats -->
    <section class="section habitats-band">
      <div class="wrap habitats">
        <div class="hab-map">
          <HabitatMap :highlight="hoverHabitat" />
        </div>
        <div>
          <div class="section-head">
            <h2>{{ t('home.habitatTitle') }}</h2>
            <p>{{ t('home.habitatText') }}</p>
          </div>
          <ul class="hab-list">
            <li v-for="h in habitats" :key="h.id">
              <RouterLink :to="`/habitats/${h.id}`" @mouseenter="hoverHabitat = h.zone" @focus="hoverHabitat = h.zone" @mouseleave="hoverHabitat = ''" @blur="hoverHabitat = ''">
                <span>{{ l(h.name) }}</span>
                <small>{{ t('zones.' + h.zone) }}</small>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- D. Behaviour -->
    <section class="section wrap">
      <div class="section-head">
        <h2>{{ t('home.moveTitle') }}</h2>
        <p>{{ t('home.moveText') }}</p>
      </div>
      <div class="move">
        <div class="move-tabs" role="tablist" :aria-label="t('home.moveTitle')">
          <button v-for="m in behavior.locomotion" :key="m.id" role="tab" :aria-selected="mode.id === m.id" class="chip" :aria-pressed="mode.id === m.id" @click="mode = m">{{ l(m.name) }}</button>
        </div>
        <div class="move-stage">
          <BehaviorDiagram :key="mode.id" :mode="mode" />
          <p class="move-text">{{ l(mode) }}</p>
        </div>
      </div>
    </section>

    <!-- E. Myth vs fact -->
    <section class="section myth-band">
      <div class="wrap">
        <div class="section-head">
          <h2>{{ t('home.mythTitle') }}</h2>
          <p>{{ t('home.mythText') }}</p>
        </div>
        <div class="grid-auto">
          <MythFactCard v-for="m in homeMyths" :key="m.id" :myth="m" />
        </div>
      </div>
    </section>

    <!-- F. Featured article -->
    <section class="section wrap">
      <article class="feature-article">
        <img :src="forest.src" :srcset="forest.srcset" sizes="(min-width: 900px) 50vw, 100vw" alt="Sunlight streaming through dense tropical forest." loading="lazy" width="1290" height="860" />
        <div>
          <p class="kicker">{{ t('home.articleTitle') }}</p>
          <h2>{{ l(article.title) }}</h2>
          <p class="lede">{{ article.lede }}</p>
          <RouterLink :to="`/knowledge/${article.id}`" class="btn ghost">{{ t('knowledge.readMore') }}</RouterLink>
        </div>
      </article>
    </section>

    <!-- G. Photo matching intro -->
    <section class="identify-band">
      <img :src="vine.src" :srcset="vine.srcset" sizes="100vw" alt="" loading="lazy" width="1290" height="860" />
      <div class="wrap identify-inner">
        <div class="identify-copy">
          <h2>{{ t('home.identifyTitle') }}</h2>
          <p>{{ t('home.identifyText') }}</p>
          <RouterLink to="/identify" class="btn light"><Camera aria-hidden="true" />{{ t('home.ctaIdentify') }}</RouterLink>
        </div>
      </div>
    </section>

    <!-- H. Respect and safety -->
    <section class="section wrap respect">
      <div>
        <h2>{{ t('home.respectTitle') }}</h2>
        <p class="lede">{{ t('home.respectText') }}</p>
      </div>
      <SafetyNotice />
    </section>

    <!-- I. References / naturalist heritage -->
    <section class="section heritage-band">
      <div class="wrap heritage">
        <figure>
          <img :src="tennent.src" :srcset="tennent.srcset" sizes="(min-width: 900px) 25vw, 50vw" alt="An open copy of Tennent's 1861 Sketches of the Natural History of Ceylon showing an engraving of snakes." loading="lazy" width="1024" height="1404" />
          <figcaption>Tennent, <span class="latin">Sketches of the Natural History of Ceylon</span>, 1861</figcaption>
        </figure>
        <figure>
          <img :src="merian.src" :srcset="merian.srcset" sizes="(min-width: 900px) 35vw, 100vw" alt="An open natural history book with a hand-coloured plate of a red-banded snake and a caiman." loading="lazy" width="1290" height="860" />
          <figcaption>Maria Sibylla Merian, 18th-century plate</figcaption>
        </figure>
        <div>
          <h2>{{ l({ en: 'Built on sources, not guesswork', si: 'අනුමාන මත නොව මූලාශ්‍ර මත ගොඩනැගූ', ta: 'ஊகங்களில் அல்ல, ஆதாரங்களில் உருவானது' }) }}</h2>
          <p>{{ l({ en: 'Naturalists have documented Sri Lanka\'s snakes for centuries. Every profile here cites the medical, scientific and local sources it relies on, and flags anything that is still provisional.', si: 'ස්වභාවවේදීන් සියවස් ගණනාවක් තිස්සේ ශ්‍රී ලංකාවේ සර්පයින් ලේඛනගත කර ඇත. මෙහි සෑම පැතිකඩකම එය පදනම් වූ මූලාශ්‍ර දක්වා, තවමත් තාවකාලික දේ සලකුණු කරයි.', ta: 'இயற்கையியலாளர்கள் பல நூற்றாண்டுகளாக இலங்கைப் பாம்புகளை ஆவணப்படுத்தியுள்ளனர். இங்குள்ள ஒவ்வொரு விவரமும் தான் சார்ந்துள்ள ஆதாரங்களைக் குறிப்பிட்டு, இன்னும் தற்காலிகமானவற்றைக் குறிக்கிறது.' }) }}</p>
          <RouterLink to="/sources" class="btn ghost">{{ t('nav.sources') }}</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero */
.hero { position: relative; min-height: min(92vh, 860px); display: flex; align-items: flex-end; overflow: hidden; color: var(--paper); background: var(--forest-deep); }
.hero-img { position: absolute; inset: -6% 0 0; width: 100%; height: 112%; object-fit: cover; object-position: 60% 40%; }
.hero-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(14, 28, 20, .88) 0%, rgba(14, 28, 20, .55) 45%, rgba(14, 28, 20, .1) 75%), linear-gradient(0deg, rgba(14, 28, 20, .7), transparent 45%); }
.contours { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.hero-inner { position: relative; display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 2rem; padding-block: 5rem clamp(2.5rem, 6vw, 4.5rem); }
.hero-title { color: var(--paper); font-size: var(--step-5); line-height: .98; margin-bottom: .35em; max-width: 15ch; }
:lang(si) .hero-title, :lang(ta) .hero-title { font-size: var(--step-4); line-height: 1.25; max-width: 16ch; }
.mask { display: block; overflow: hidden; padding-bottom: .06em; }
.ln { display: inline-block; }
.hero-lede { font-size: var(--step-1); max-width: 44ch; color: #e7e3d2; line-height: 1.5; }
.hero-ctas { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.75rem; }
.hero-label { width: 290px; text-decoration: none; transform: rotate(1.5deg); transition: transform .3s; display: block; }
.hero-label:hover { transform: rotate(0deg) translateY(-3px); color: var(--charcoal); }
.fl-name { font-family: var(--serif); font-weight: 800; font-size: var(--step-1); margin: 0; line-height: 1.15; color: var(--forest-deep); }
.fl-latin { margin: 0 0 .6rem; }
.fl-note { margin: .6rem 0 0; border-top: 1px dashed var(--line); padding-top: .5rem; font-style: italic; }
@media (max-width: 860px) {
  .hero-inner { grid-template-columns: 1fr; }
  .hero-label { width: 100%; max-width: 340px; transform: none; }
  .hero-shade { background: linear-gradient(0deg, rgba(14, 28, 20, .92) 20%, rgba(14, 28, 20, .45) 70%, rgba(14, 28, 20, .2)); }
}

.split { display: flex; justify-content: space-between; align-items: end; gap: 1rem; max-width: none; flex-wrap: wrap; }
.split > div { max-width: 60ch; }
.more { display: inline-flex; gap: .3rem; align-items: center; font-weight: 600; white-space: nowrap; }
.more svg { width: 1em; }

/* Featured: editorial grid, lead specimen larger */
.featured { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(1rem, 2.5vw, 1.75rem); }
.featured .lead { grid-column: span 2; grid-row: span 2; }
.featured .lead :deep(.media-link) { flex: 1; display: flex; }
.featured .lead :deep(.media) { aspect-ratio: auto; flex: 1; min-height: 320px; }
.featured .lead :deep(h3) { font-size: var(--step-2); }
@media (max-width: 900px) { .featured { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .featured { grid-template-columns: 1fr; } .featured .lead { grid-column: auto; grid-row: auto; } }

.habitats-band { background: var(--sage-soft); }
.habitats { display: grid; grid-template-columns: minmax(220px, 0.8fr) 1.2fr; gap: clamp(2rem, 6vw, 5rem); align-items: center; }
.hab-map { max-width: 340px; justify-self: center; width: 100%; }
.hab-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
.hab-list a { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; padding: .95rem .25rem; border-bottom: 1px solid var(--line); text-decoration: none; color: var(--forest-deep); font-family: var(--serif); font-size: var(--step-1); font-weight: 600; transition: padding .2s, background .2s; }
.hab-list a:hover, .hab-list a:focus-visible { padding-left: .8rem; background: rgba(245, 240, 224, .6); }
.hab-list small { font-family: var(--sans); font-size: var(--step--1); color: var(--ink-soft); font-weight: 400; }
@media (max-width: 760px) { .habitats { grid-template-columns: 1fr; } .hab-map { max-width: 240px; } }

.move { display: grid; gap: 1rem; }
.move-tabs { display: flex; flex-wrap: wrap; gap: .5rem; }
.move-stage { display: grid; grid-template-columns: 1.4fr 1fr; gap: 2rem; align-items: center; }
.move-text { font-size: var(--step-1); line-height: 1.5; }
@media (max-width: 860px) { .move-stage { grid-template-columns: 1fr; } }

.myth-band { background: var(--paper); border-block: 1px solid var(--line); }

.feature-article { display: grid; grid-template-columns: 1.1fr 1fr; gap: clamp(1.5rem, 5vw, 4rem); align-items: center; }
.feature-article img { width: 100%; aspect-ratio: 4/3; object-fit: cover; }
.kicker { color: var(--bark); font-weight: 600; font-size: var(--step--1); margin-bottom: .5rem; }
@media (max-width: 800px) { .feature-article { grid-template-columns: 1fr; } }

.identify-band { position: relative; color: var(--paper); overflow: hidden; background: var(--forest-deep); }
.identify-band img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .5; }
.identify-inner { position: relative; padding-block: clamp(4rem, 10vw, 8rem); }
.identify-copy { max-width: 520px; background: rgba(20, 42, 31, .82); padding: clamp(1.5rem, 4vw, 2.5rem); border-left: 4px solid var(--sage); }
.identify-copy h2 { color: var(--paper); }
.identify-copy p { color: #e2dfcf; }

.respect { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; }
@media (max-width: 800px) { .respect { grid-template-columns: 1fr; } }

.heritage-band { background: var(--sage-soft); }
.heritage { display: grid; grid-template-columns: 0.6fr 1fr 1.1fr; gap: clamp(1rem, 3vw, 2.5rem); align-items: center; }
.heritage figure { margin: 0; }
.heritage img { width: 100%; border: 1px solid var(--line); }
.heritage figcaption { font-size: .78rem; color: var(--ink-soft); margin-top: .4rem; }
@media (max-width: 860px) { .heritage { grid-template-columns: 1fr 1fr; } .heritage > div { grid-column: 1 / -1; } }
</style>
