<script setup>
import { ArrowRight, LifeBuoy } from 'lucide-vue-next'
import { useLanguage } from '../composables/useLanguage.js'
import { useSeo } from '../composables/useSeo.js'

const { t } = useLanguage()
useSeo(() => ({ kind: 'page', item: 'notFound', noindex: true }))
</script>

<template>
  <div class="wrap nf">
    <h1>{{ t('notFound.title') }}</h1>
    <p class="lede">{{ t('notFound.lede') }}</p>
    <p class="ctas">
      <RouterLink to="/library" class="btn">{{ t('common.seeAll') }}<ArrowRight aria-hidden="true" /></RouterLink>
      <RouterLink to="/safety" class="btn ghost"><LifeBuoy aria-hidden="true" />{{ t('nav.bite') }}</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.nf { padding-block: clamp(3rem, 10vw, 7rem); }
.ctas { display: flex; gap: .75rem; flex-wrap: wrap; }
</style>
