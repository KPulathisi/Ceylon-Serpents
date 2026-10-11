/**
 * Image classification hook.
 *
 * No validated Sri Lankan snake classifier exists for this project, so MODEL is null and the
 * identification page runs the transparent guided matcher instead. Nothing here simulates AI output.
 *
 * To add a genuine model later (see README → "Adding a real model"):
 *   1. Train and evaluate on licensed, labelled Sri Lankan images, including an "unknown" class.
 *   2. Export to TensorFlow.js / ONNX and place it under public/model/.
 *   3. Set MODEL below with its documented metrics, and implement classify() so it lazy-loads
 *      the runtime only when the visitor opens the identification page.
 */
export const MODEL = null

export function useClassifier() {
  return {
    available: MODEL !== null,
    async classify() {
      throw new Error('No validated classification model is configured.')
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
