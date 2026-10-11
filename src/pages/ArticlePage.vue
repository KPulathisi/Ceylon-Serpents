<script setup>
import { computed } from 'vue'
import { ArrowLeft, Bookmark, BookmarkCheck } from 'lucide-vue-next'
import { useData, imageSet } from '../composables/useData.js'
import { useLanguage } from '../composables/useLanguage.js'
import { useLocalCollection } from '../composables/useLocalCollection.js'

const props = defineProps({ id: { type: String, required: true } })
const { t, l, lang } = useLanguage()
const { getArticle, getSource } = useData()
const { isSaved, toggleSaved } = useLocalCollection()
const a = computed(() => getArticle(props.id))
const img = computed(() => (a.value ? imageSet(a.value.image) : null))
const refs = computed(() => a.value?.refs.map(getSource).filter(Boolean) ?? [])
</script>

<template>
  <article v-if="a" class="article">
    <div class="wrap narrow">
      <RouterLink to="/knowledge" class="back"><ArrowLeft aria-hidden="true" />{{ t('knowledge.title') }}</RouterLink>
      <h1>{{ l(a.title) }}</h1>
      <p class="lede" lang="en">{{ a.lede }}</p>
      <p v-if="lang !== 'en'" class="tnote">{{ t('common.englishOnly') }}</p>
      <button class="btn small ghost" :aria-pressed="isSaved('articles', a.id)" @click="toggleSaved('articles', a.id)">
        <component :is="isSaved('articles', a.id) ? BookmarkCheck : Bookmark" aria-hidden="true" />{{ isSaved('articles', a.id) ? t('common.saved') : t('common.save') }}
      </button>
    </div>
    <img :src="img.src" :srcset="img.srcset" sizes="100vw" alt="" class="hero" />
    <div class="wrap narrow prose" lang="en">
      <p v-for="(p, i) in a.body" :key="i">{{ p }}</p>
      <h3>{{ t('common.references') }}</h3>
      <ol class="refs"><li v-for="r in refs" :key="r.id"><a :href="r.url" target="_blank" rel="noopener">{{ r.title }}</a>, {{ r.publisher }}</li></ol>
    </div>
  </article>
  <div v-else class="wrap section"><p>{{ t('profile.notFound') }}</p></div>
</template>

<style scoped>
.narrow { max-width: 760px; }
.article { padding-block: 2rem 4rem; }
.back { display: inline-flex; gap: .35rem; align-items: center; font-size: var(--step--1); margin-bottom: 1.5rem; }
.back svg { width: 1em; }
.hero { width: 100%; max-height: 60vh; object-fit: cover; margin-block: 2rem; }
.prose p { font-family: var(--serif); font-size: 1.28rem; line-height: 1.65; }
.refs { font-size: var(--step--1); }
</style>
