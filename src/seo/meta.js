/**
 * Pure helpers that turn src/data/seo.json + content data into page titles and descriptions.
 * Shared by the live site (useSeo) and the admin SEO editor's Google preview, so both always agree.
 */

/** Replace {placeholders} and tidy the spacing left behind by empty ones */
export function fill(template, vars) {
  return String(template || '')
    .replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Shorten to `max` characters on a word boundary (Google shows roughly 155–160) */
export function clip(text, max = 160) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[,;:.\s]+$/, '') + '…'
}

/** Add the site-name suffix, unless the title already names the site */
export function withSuffix(seo, title) {
  if (!title) return seo.siteName
  return title.includes(seo.siteName) ? title : title + (seo.titleSuffix || '')
}

export function speciesVars(s) {
  const si = s.names?.si?.text || ''
  const ta = s.names?.ta?.text || ''
  const local = [si && `Sinhala: ${si}`, ta && `Tamil: ${ta}`].filter(Boolean).join(' · ')
  return {
    name: s.names?.en || s.id,
    scientific: s.scientificName || '',
    family: s.family || '',
    summary: s.en?.summary || '',
    si,
    ta,
    localNames: local ? local + '.' : ''
  }
}

const primaryImage = (s) => (s.images?.find((i) => i.primary) || s.images?.[0])?.file || ''

/**
 * @param seo   contents of seo.json
 * @param kind  'page' | 'species' | 'article' | 'habitat'
 * @param item  page key for 'page', otherwise the data record
 * @returns {{ title: string, description: string, image: string, rawTitle: string }}
 */
export function buildMeta(seo, kind, item) {
  if (kind === 'page') {
    const p = seo.pages?.[item] || {}
    const raw = p.title || seo.siteName
    return { rawTitle: raw, title: item === 'home' ? raw : withSuffix(seo, raw), description: clip(p.description), image: p.image || seo.defaultImage }
  }
  if (kind === 'species') {
    const tpl = seo.templates?.species || {}
    const own = seo.species?.[item.id] || {}
    const vars = speciesVars(item)
    const raw = own.title || fill(tpl.title, vars)
    return { rawTitle: raw, title: withSuffix(seo, raw), description: clip(own.description || fill(tpl.description, vars)), image: primaryImage(item) || seo.defaultImage }
  }
  if (kind === 'article') {
    const tpl = seo.templates?.article || {}
    const vars = { title: item.title?.en || '', lede: item.lede || '' }
    const raw = fill(tpl.title, vars)
    return { rawTitle: raw, title: withSuffix(seo, raw), description: clip(fill(tpl.description, vars)), image: item.image || seo.defaultImage }
  }
  if (kind === 'habitat') {
    const tpl = seo.templates?.habitat || {}
    const vars = { name: item.name?.en || '', description: item.en || '' }
    const raw = fill(tpl.title, vars)
    return { rawTitle: raw, title: withSuffix(seo, raw), description: clip(fill(tpl.description, vars)), image: item.image || seo.defaultImage }
  }
  return { rawTitle: seo.siteName, title: seo.siteName, description: '', image: seo.defaultImage }
}

/** Canonical URL for a router path. Non-root pages end in "/" because GitHub Pages serves folder/index.html */
export function canonicalUrl(seo, path = '/') {
  const site = String(seo.siteUrl || '').replace(/\/+$/, '')
  const clean = String(path).split(/[?#]/)[0].replace(/\/+$/, '')
  return clean ? `${site}${clean}/` : `${site}/`
}

export const imageUrl = (seo, file) => (file ? `${String(seo.siteUrl).replace(/\/+$/, '')}/images/${file}.webp` : '')

/** Accept either the bare code or the whole <meta …> tag pasted from Search Console */
export function verificationCode(v) {
  const s = String(v || '').trim()
  const m = s.match(/content=["']([^"']+)["']/i)
  return (m ? m[1] : s).trim()
}
