<script setup>
/* Deliberately image-free and light so it loads fast on a poor connection. */
import { Phone, Check, X, ExternalLink } from 'lucide-vue-next'
import { useLanguage } from '../composables/useLanguage.js'
const { t, lang } = useLanguage()
</script>

<template>
  <div class="safety">
    <section class="alert-band">
      <div class="wrap">
        <h1>{{ t('safety.headline') }}</h1>
        <a href="tel:1990" class="call"><Phone aria-hidden="true" />{{ t('safety.call') }}</a>
        <p class="callnote">{{ t('safety.callNote') }}</p>
        <p v-if="lang !== 'en'" class="tnote light">{{ t('common.draft') }}</p>
      </div>
    </section>

    <section class="wrap cols">
      <div class="col do">
        <h2><Check aria-hidden="true" />{{ t('safety.doTitle') }}</h2>
        <ul><li v-for="(x, i) in t('safety.do')" :key="i">{{ x }}</li></ul>
      </div>
      <div class="col dont">
        <h2><X aria-hidden="true" />{{ t('safety.dontTitle') }}</h2>
        <ul><li v-for="(x, i) in t('safety.dont')" :key="i">{{ x }}</li></ul>
      </div>
    </section>

    <section class="wrap more">
      <p class="why">{{ t('safety.why') }}</p>
      <p><a href="https://slma.lk/snakebite-prevention-first-aid/" target="_blank" rel="noopener" class="ext">{{ t('safety.slma') }} <ExternalLink aria-hidden="true" /></a></p>
      <p class="reviewed">{{ t('safety.reviewed') }}</p>
    </section>
  </div>
</template>

<style scoped>
.alert-band { background: var(--alert); color: #fff; padding-block: clamp(2.5rem, 7vw, 4.5rem); }
.alert-band h1 { color: #fff; font-size: var(--step-3); max-width: 22ch; }
.call { display: inline-flex; align-items: center; gap: .7rem; background: #fff; color: var(--alert); font-weight: 600; font-size: var(--step-1); padding: 1rem 1.4rem; border-radius: 999px; text-decoration: none; margin-top: .5rem; }
.call svg { width: 1.3em; }
.callnote { margin-top: .9rem; opacity: .9; font-size: var(--step--1); }
.tnote.light { color: #fbe3d8; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding-block: 3rem 1rem; }
.col h2 { display: flex; align-items: center; gap: .5rem; font-size: var(--step-2); }
.col h2 svg { width: 1em; height: 1em; }
.do h2 { color: var(--forest); }
.dont h2 { color: var(--alert); }
.col ul { padding: 0; margin: 0; list-style: none; display: grid; gap: .7rem; }
.col li { padding: .9rem 1rem; background: var(--paper); border-left: 5px solid; font-size: var(--step-0); }
.do li { border-color: var(--forest); }
.dont li { border-color: var(--alert); }
@media (max-width: 760px) { .cols { grid-template-columns: 1fr; } }
.more { padding-bottom: 4rem; }
.why { font-size: var(--step-1); max-width: 60ch; }
.ext { display: inline-flex; align-items: center; gap: .35rem; font-weight: 600; }
.ext svg { width: 1em; }
.reviewed { font-size: var(--step--1); color: var(--ink-soft); }
</style>
