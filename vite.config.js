import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import adminPlugin from './admin/vite-admin-plugin.js'

const readData = (name) => JSON.parse(fs.readFileSync(path.resolve('src/data', `${name}.json`), 'utf8'))

// The live address comes from src/data/seo.json (editable in the admin's SEO section).
// Its path becomes the build base: https://kpulathisi.github.io/Ceylon-Serpents → /Ceylon-Serpents/
const seo = readData('seo')
const siteUrl = String(process.env.SITE_URL || seo.siteUrl).replace(/\/+$/, '')
const basePath = new URL(siteUrl + '/').pathname

// Pages left out of the sitemap: thin or personal views
const NOT_IN_SITEMAP = new Set(['/404', '/compare'])

/** Every page that gets pre-rendered into real HTML for search engines */
function allRoutes() {
  return [
    '/', '/library', '/compare', '/identify', '/habitats', '/knowledge', '/play', '/safety', '/sources', '/404',
    ...readData('species').map((s) => `/species/${s.id}`),
    ...readData('habitats').map((h) => `/habitats/${h.id}`),
    ...readData('articles').map((a) => `/knowledge/${a.id}`)
  ]
}

function writeSeoFiles(outDir) {
  const today = new Date().toISOString().slice(0, 10)
  const reviewed = Object.fromEntries(readData('species').map((s) => [`/species/${s.id}`, s.lastReviewed]))
  const priority = (r) => (r === '/' ? '1.0' : r.startsWith('/species/') || r === '/library' || r === '/safety' || r === '/play' ? '0.8' : '0.6')
  const urls = allRoutes()
    .filter((r) => !NOT_IN_SITEMAP.has(r))
    .map((r) => {
      const loc = r === '/' ? `${siteUrl}/` : `${siteUrl}${r}/`
      return `  <url><loc>${loc}</loc><lastmod>${reviewed[r] || today}</lastmod><priority>${priority(r)}</priority></url>`
    })
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)

  const robots = seo.allowIndexing
    ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
    : `# Indexing is switched off in the admin SEO settings\nUser-agent: *\nDisallow: /\n`
  fs.writeFileSync(path.join(outDir, 'robots.txt'), robots)

  // GitHub Pages serves 404.html for any unknown address
  const nested = path.join(outDir, '404', 'index.html')
  if (fs.existsSync(nested)) {
    fs.renameSync(nested, path.join(outDir, '404.html'))
    fs.rmSync(path.join(outDir, '404'), { recursive: true, force: true })
  }
  // Prevent GitHub's Jekyll step from hiding files that start with "_"
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '')
}

// adminPlugin only runs under `npm run dev`; it is never part of the production build.
export default defineConfig(({ command, isPreview }) => ({
  // Dev runs at http://localhost:5173/ ; the build (and `npm run preview`) uses the live site's path so nested pages find their assets
  base: command === 'build' || isPreview ? basePath : '/',
  plugins: [vue(), adminPlugin()],
  build: { chunkSizeWarningLimit: 900 },
  ssgOptions: {
    entry: 'src/main.js',
    script: 'async',
    formatting: 'none',
    dirStyle: 'nested',
    includedRoutes: () => allRoutes(),
    onFinished: () => writeSeoFiles(path.resolve('dist'))
  }
}))
