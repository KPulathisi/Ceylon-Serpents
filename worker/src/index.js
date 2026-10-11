/**
 * Ceylon Serpents: identification proxy.
 *
 * The static site sends a downscaled, metadata-free photo plus the list of species in its
 * library. This Worker adds the secret Gemini key, asks Gemini for a structured, cautious
 * answer, sanitises it and returns it. Nothing is stored.
 */

const MAX_BASE64 = 6_000_000 // about 4.5 MB of image data
const MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const LANG_NAMES = { en: 'English', si: 'Sinhala', ta: 'Tamil' }

const schema = {
  type: 'OBJECT',
  properties: {
    is_snake: { type: 'STRING', enum: ['yes', 'no', 'unclear'] },
    image_quality: { type: 'STRING', enum: ['good', 'fair', 'poor'] },
    candidates: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          scientific_name: { type: 'STRING' },
          match: { type: 'STRING', enum: ['strong', 'partial', 'weak'] },
          visible_features: { type: 'STRING' }
        },
        required: ['id', 'scientific_name', 'match', 'visible_features']
      }
    },
    notes: { type: 'STRING' }
  },
  required: ['is_snake', 'image_quality', 'candidates', 'notes']
}

function buildPrompt(candidates, lang) {
  const list = candidates.map((c) => `- id: ${c.id} | ${c.scientificName} | ${c.name}`).join('\n')
  return `You are assisting an EDUCATIONAL field guide to the snakes of Sri Lanka. Look at the photo and suggest which species it may show.

Species in the guide's library:
${list}

Rules:
1. Decide whether the photo shows a snake: "yes", "no" or "unclear".
2. Rate the photo for identification: "good", "fair" or "poor".
3. Suggest at most 3 candidate species, most similar first. Use the library id when the species is in the list. If you believe it is a Sri Lankan species NOT in the list, use id "other" and give its scientific name.
4. For each candidate, rate the visual match as "strong", "partial" or "weak", and briefly list the features you can actually see that support it.
5. Be cautious. Many Sri Lankan snakes look alike (for example kraits and wolf snakes, or the three hump-nosed vipers). If you cannot tell, give weak matches and say why in notes.
6. Never state or imply whether the snake is safe, harmless, venomous or dangerous, and never give first-aid or handling advice.
7. If it is not a snake, or there is no usable view of the animal, return an empty candidates list.
8. Write visible_features and notes in ${LANG_NAMES[lang] || 'English'}. Keep each under 40 words.`
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
    const originOk = allowed.includes(origin)
    const cors = {
      'Access-Control-Allow-Origin': originOk ? origin : allowed[0] || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin'
    }

    if (request.method === 'OPTIONS') return new Response(null, { status: originOk ? 204 : 403, headers: cors })
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors)
    if (!originOk) return json({ error: 'origin_not_allowed' }, 403, cors)
    if (!env.GEMINI_API_KEY) return json({ error: 'not_configured' }, 500, cors)

    if (env.RATE_LIMITER) {
      const key = request.headers.get('CF-Connecting-IP') || 'anon'
      const { success } = await env.RATE_LIMITER.limit({ key })
      if (!success) return json({ error: 'rate_limited' }, 429, cors)
    }

    let body
    try { body = await request.json() } catch { return json({ error: 'bad_json' }, 400, cors) }
    const { image, mimeType, lang = 'en', candidates = [] } = body || {}
    if (typeof image !== 'string' || !image || image.length > MAX_BASE64) return json({ error: 'bad_image' }, 400, cors)
    if (!MIME.has(mimeType)) return json({ error: 'bad_type' }, 400, cors)
    const cands = (Array.isArray(candidates) ? candidates : [])
      .slice(0, 120)
      .filter((c) => c && typeof c.id === 'string' && typeof c.scientificName === 'string')
      .map((c) => ({ id: c.id.slice(0, 60), scientificName: c.scientificName.slice(0, 80), name: String(c.name || '').slice(0, 80) }))
    if (!cands.length) return json({ error: 'no_candidates' }, 400, cors)

    const model = env.GEMINI_MODEL || 'gemini-2.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
    const payload = {
      contents: [{ role: 'user', parts: [{ text: buildPrompt(cands, lang) }, { inline_data: { mime_type: mimeType, data: image } }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: schema }
    }

    let res
    try {
      res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify(payload) })
    } catch {
      return json({ error: 'upstream_unreachable' }, 502, cors)
    }
    if (!res.ok) {
      const status = res.status === 429 ? 429 : 502
      return json({ error: res.status === 429 ? 'quota_exceeded' : 'upstream_error' }, status, cors)
    }

    let parsed
    try {
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '{}'
      parsed = JSON.parse(text)
    } catch {
      return json({ error: 'unreadable_response' }, 502, cors)
    }

    // Sanitise: only known ids or "other", at most 3, plain strings
    const ids = new Set(cands.map((c) => c.id))
    const clean = {
      is_snake: ['yes', 'no', 'unclear'].includes(parsed.is_snake) ? parsed.is_snake : 'unclear',
      image_quality: ['good', 'fair', 'poor'].includes(parsed.image_quality) ? parsed.image_quality : 'poor',
      candidates: (Array.isArray(parsed.candidates) ? parsed.candidates : []).slice(0, 3).map((c) => ({
        id: ids.has(c.id) ? c.id : 'other',
        scientific_name: String(c.scientific_name || '').slice(0, 80),
        match: ['strong', 'partial', 'weak'].includes(c.match) ? c.match : 'weak',
        visible_features: String(c.visible_features || '').slice(0, 400)
      })),
      notes: String(parsed.notes || '').slice(0, 500),
      model
    }
    return json(clean, 200, cors)
  }
}
