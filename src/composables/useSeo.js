import { computed, toValue } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import seo from '../data/seo.json'
import { buildMeta, canonicalUrl, imageUrl, verificationCode } from '../seo/meta.js'

export { seo }

/**
 * Sets the page's <title>, description, canonical URL, social-card tags and optional JSON-LD.
 * These are rendered into the static HTML at build time, which is what Google reads.
 *
 * @param source  () => ({ kind, item, noindex?, jsonLd?, type? }) or a page key string
 */
export function useSeo(source) {
  const route = useRoute()
  const opts = computed(() => {
    const v = typeof source === 'string' ? { kind: 'page', item: source } : toValue(source)
    return v || { kind: 'page', item: 'home' }
  })
  const meta = computed(() => (opts.value.item ? buildMeta(seo, opts.value.kind, opts.value.item) : { title: seo.siteName, description: '', image: seo.defaultImage }))
  const url = computed(() => canonicalUrl(seo, route.path))
  const img = computed(() => imageUrl(seo, meta.value.image))
  const ld = computed(() => opts.value.jsonLd?.({ url: url.value, meta: meta.value, image: img.value }) || null)
  const robots = computed(() => (!seo.allowIndexing || opts.value.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'))

  useHead(computed(() => ({
    title: meta.value.title,
    link: [{ rel: 'canonical', href: url.value }],
    meta: [
      { name: 'description', content: meta.value.description },
      { name: 'robots', content: robots.value },
      { property: 'og:type', content: opts.value.type || 'website' },
      { property: 'og:site_name', content: seo.siteName },
      { property: 'og:title', content: meta.value.title },
      { property: 'og:description', content: meta.value.description },
      { property: 'og:url', content: url.value },
      { property: 'og:image', content: img.value },
      { property: 'og:locale', content: 'en_LK' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: meta.value.title },
      { name: 'twitter:description', content: meta.value.description },
      { name: 'twitter:image', content: img.value }
    ],
    script: ld.value ? [{ type: 'application/ld+json', key: 'ld', innerHTML: JSON.stringify(ld.value) }] : []
  })))
  return { meta, url }
}

/** Site-wide tags: language and the Search Console ownership tag */
export function useSiteHead(lang) {
  const code = verificationCode(seo.googleSiteVerification)
  useHead(computed(() => ({
    htmlAttrs: { lang: toValue(lang) },
    meta: code ? [{ name: 'google-site-verification', content: code }] : []
  })))
}

/** Breadcrumb trail for Google ("Home › Snake library › Indian cobra") */
export function breadcrumbs(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: canonicalUrl(seo, path) }))
  }
}
