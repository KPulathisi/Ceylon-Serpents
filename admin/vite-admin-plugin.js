/**
 * Local-only admin API for Ceylon Serpents.
 *
 * Active ONLY under `npm run dev` (apply: 'serve'), and only answers requests from this computer.
 * It reads and writes the JSON files in src/data and saves uploaded images/videos into public/.
 * The production build never contains it, so the live site has no admin and no write access.
 */
import fs from 'node:fs'
import path from 'node:path'

const DATA_FILES = new Set(['species', 'habitats', 'behavior', 'myths', 'articles', 'sources', 'imageCredits', 'folklore'])
const UPLOAD_DIRS = { images: ['.webp', '.jpg', '.jpeg', '.png'], videos: ['.mp4', '.webm'] }
const MAX_BODY = 160 * 1024 * 1024

function isLocal(req) {
  const a = req.socket.remoteAddress || ''
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) { reject(new Error('too_large')); req.destroy() } else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const send = (res, status, data) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

const safeName = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

export default function adminPlugin() {
  let root
  return {
    name: 'ceylon-serpents-admin',
    apply: 'serve',
    configResolved(cfg) { root = cfg.root },
    configureServer(server) {
      const dataDir = path.join(root, 'src', 'data')
      const publicDir = path.join(root, 'public')
      const backupDir = path.join(root, '.admin-backups')

      server.middlewares.use('/__admin', async (req, res) => {
        if (!isLocal(req)) return send(res, 403, { error: 'local_only' })
        const url = new URL(req.url, 'http://localhost')
        const parts = url.pathname.split('/').filter(Boolean)
        try {
          // GET/PUT /__admin/data/:name
          if (parts[0] === 'data' && DATA_FILES.has(parts[1])) {
            const file = path.join(dataDir, `${parts[1]}.json`)
            if (req.method === 'GET') return send(res, 200, JSON.parse(fs.readFileSync(file, 'utf8')))
            if (req.method === 'PUT') {
              const body = JSON.parse(await readBody(req))
              // keep a timestamped backup of the previous version (folder is git-ignored)
              fs.mkdirSync(backupDir, { recursive: true })
              fs.copyFileSync(file, path.join(backupDir, `${parts[1]}-${Date.now()}.json`))
              fs.writeFileSync(file, JSON.stringify(body, null, 2) + '\n')
              return send(res, 200, { ok: true })
            }
          }

          // GET /__admin/files/:dir  → list uploaded files
          if (parts[0] === 'files' && UPLOAD_DIRS[parts[1]] && req.method === 'GET') {
            const dir = path.join(publicDir, parts[1])
            fs.mkdirSync(dir, { recursive: true })
            return send(res, 200, fs.readdirSync(dir).filter((f) => !f.startsWith('.')).sort())
          }

          // POST /__admin/upload  { dir, name, ext, data(base64) }
          if (parts[0] === 'upload' && req.method === 'POST') {
            const { dir, name, ext, data } = JSON.parse(await readBody(req))
            const e = String(ext || '').toLowerCase()
            if (!UPLOAD_DIRS[dir] || !UPLOAD_DIRS[dir].includes(e)) return send(res, 400, { error: 'bad_type' })
            const n = safeName(name)
            if (!n || typeof data !== 'string') return send(res, 400, { error: 'bad_name' })
            const target = path.join(publicDir, dir, n + e)
            fs.mkdirSync(path.dirname(target), { recursive: true })
            fs.writeFileSync(target, Buffer.from(data, 'base64'))
            return send(res, 200, { ok: true, path: `${dir}/${n}${e}` })
          }

          // DELETE /__admin/file?path=images/x.webp
          if (parts[0] === 'file' && req.method === 'DELETE') {
            const rel = url.searchParams.get('path') || ''
            const [dir, file] = rel.split('/')
            if (!UPLOAD_DIRS[dir] || !file || file !== path.basename(file)) return send(res, 400, { error: 'bad_path' })
            const target = path.join(publicDir, dir, file)
            if (fs.existsSync(target)) fs.unlinkSync(target)
            return send(res, 200, { ok: true })
          }

          send(res, 404, { error: 'not_found' })
        } catch (err) {
          send(res, 500, { error: String(err.message || err) })
        }
      })

      server.httpServer?.once('listening', () => {
        setTimeout(() => server.config.logger.info('\n  Admin panel: http://localhost:' + (server.config.server.port || 5173) + '/#/admin\n'), 200)
      })
    }
  }
}
