<script setup>
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import { useLanguage } from './composables/useLanguage.js'
import { useSiteHead } from './composables/useSeo.js'
import { useRoute } from 'vue-router'
const { t, lang } = useLanguage()
useSiteHead(lang)
const route = useRoute()
</script>

<template>
  <RouterView v-if="route.meta.admin" />
  <template v-else>
  <a class="skip" href="#main" @click.prevent="$refs.main?.focus()">{{ t('common.skip') }}</a>
  <SiteHeader />
  <main id="main" ref="main" tabindex="-1">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </RouterView>
  </main>
  <SiteFooter />
  </template>
</template>

<style>
main:focus { outline: none; }
</style>
