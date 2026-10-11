// Talks to the local admin API (admin/vite-admin-plugin.js). Only works under `npm run dev`.

async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const loadData = (name) => req('GET', `/__admin/data/${name}`)
export const saveData = (name, value) => req('PUT', `/__admin/data/${name}`, value)
export const listFiles = (dir) => req('GET', `/__admin/files/${dir}`)
export const deleteFile = (rel) => req('DELETE', `/__admin/file?path=${encodeURIComponent(rel)}`)

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result).split(',')[1])
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable_image')) }
    img.src = url
  })
}

function resizeToWebp(img, max, quality) {
  const scale = Math.min(1, max / img.naturalWidth)
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * scale)
  c.height = Math.round(img.naturalHeight * scale)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return new Promise((resolve) => c.toBlob(resolve, 'image/webp', quality))
}

/**
 * Turn any photo into the site's two WebP sizes (name.webp at 1600px and name-sm.webp at 720px)
 * and save both into public/images. Returns the base name used in the data files.
 */
export async function uploadPhoto(file, baseName) {
  const { img, url } = await loadImage(file)
  try {
    const full = await resizeToWebp(img, 1600, 0.82)
    const small = await resizeToWebp(img, 720, 0.78)
    await req('POST', '/__admin/upload', { dir: 'images', name: baseName, ext: '.webp', data: await blobToBase64(full) })
    await req('POST', '/__admin/upload', { dir: 'images', name: `${baseName}-sm`, ext: '.webp', data: await blobToBase64(small) })
    return baseName
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function uploadVideo(file, baseName) {
  const ext = file.name.toLowerCase().endsWith('.webm') ? '.webm' : '.mp4'
  const r = await req('POST', '/__admin/upload', { dir: 'videos', name: baseName, ext, data: await blobToBase64(file) })
  return r.path
}

export const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}
export function setPath(obj, path, value) {
  const keys = path.split('.')
  let o = obj
  keys.slice(0, -1).forEach((k) => { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k] })
  o[keys.at(-1)] = value
}
