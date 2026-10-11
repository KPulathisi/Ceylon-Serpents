/**
 * Photo identification through Google Gemini, called via our Cloudflare Worker
 * (see /worker). The Gemini key lives only in the Worker as a secret; the site just knows
 * the Worker's URL, supplied at build time as VITE_IDENTIFY_ENDPOINT.
 *
 * Gemini is a general-purpose vision model, not a validated Sri Lankan snake classifier, so
 * results are shown as "AI suggestions" with qualitative match strength, never percentages.
 */
const ENDPOINT = import.meta.env.VITE_IDENTIFY_ENDPOINT || ''

/** Downscale to ≤1024px JPEG. Re-encoding through canvas also drops EXIF/GPS metadata. */
function toJpegBase64(img, max = 1024) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * scale)
  c.height = Math.round(img.naturalHeight * scale)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.85).split(',')[1]
}

export function useClassifier() {
  return {
    available: !!ENDPOINT,
    /**
     * @param {HTMLImageElement} img  loaded preview image
     * @param {Array} species         library species (id, scientificName, names.en)
     * @param {string} lang           'en' | 'si' | 'ta'
     */
    async classify(img, species, lang) {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 45000)
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            image: toJpegBase64(img),
            mimeType: 'image/jpeg',
            lang,
            candidates: species.map((s) => ({ id: s.id, scientificName: s.scientificName, name: s.names.en }))
          })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const err = new Error(data.error || `http_${res.status}`)
          err.detail = data.detail || ''
          console.warn('[Ceylon Serpents] AI identification failed:', res.status, data.error, data.detail || '')
          throw err
        }
        return data
      } finally {
        clearTimeout(timer)
      }
    }
  }
}

/**
 * Real, local image processing: estimates the dominant hue family in the centre of the photo
 * so we can *suggest* an answer to the colour question. The visitor confirms or changes it.
 */
export function suggestColour(img) {
  try {
    const size = 64
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const ctx = c.getContext('2d', { willReadFrequently: true })
    // Sample the central 60% where the subject usually is
    const sw = img.naturalWidth * 0.6
    const sh = img.naturalHeight * 0.6
    ctx.drawImage(img, img.naturalWidth * 0.2, img.naturalHeight * 0.2, sw, sh, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)
    let green = 0, brown = 0, dark = 0, n = 0
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      const l = (max + min) / 2
      n++
      if (l < 45) { dark++; continue }
      const sat = max === 0 ? 0 : (max - min) / max
      if (sat < 0.18) continue
      let h
      if (max === r) h = ((g - b) / (max - min)) % 6
      else if (max === g) h = (b - r) / (max - min) + 2
      else h = (r - g) / (max - min) + 4
      h = (h * 60 + 360) % 360
      if (h >= 65 && h <= 160) green++
      else if (h >= 10 && h < 65) brown++
    }
    // Backgrounds are often dark or leafy: only call it 'dark' when dark pixels dominate,
    // otherwise compare hue families among the remaining, coloured pixels.
    if (dark / n > 0.65) return 'dark'
    const lit = Math.max(1, green + brown)
    if (green / lit > 0.62 && green / n > 0.12) return 'green'
    if (brown / lit > 0.62 && brown / n > 0.12) return 'brown'
    return null
  } catch {
    return null
  }
}
