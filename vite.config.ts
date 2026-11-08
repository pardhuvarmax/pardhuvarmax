import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { handleAdmin } from './api/admin.ts'
import { seoPlugin } from './seo-plugin.ts'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

// Dev-only CMS backend: `npm run dev` serves /api/admin and writes straight to disk (no login).
function adminDevApi(): Plugin {
  return {
    name: 'admin-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/admin', (req, res) => {
        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', async () => {
          let body: unknown
          const raw = Buffer.concat(chunks).toString('utf8')
          if (raw) {
            try { body = JSON.parse(raw) } catch { res.statusCode = 400; return res.end('{"error":"Invalid JSON body."}') }
          }
          const url = new URL(req.url ?? '', 'http://localhost')
          const headers: Record<string, string | undefined> = {}
          for (const [k, v] of Object.entries(req.headers)) headers[k] = Array.isArray(v) ? v[0] : v
          const result = await handleAdmin(
            { method: req.method ?? 'GET', query: Object.fromEntries(url.searchParams), body, headers },
            { local: true },
          )
          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json')
          for (const [k, v] of Object.entries(result.headers ?? {})) res.setHeader(k, v)
          res.end(JSON.stringify(result.json))
        })
      })
    },
  }
}

// Serve the standalone ZenRage page (zenrage.html) at /zenrage in dev.
function zenrageRoute(): Plugin {
  return {
    name: 'zenrage-route',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next()
        if (/^\/zenrage\/?(\?.*)?$/.test(req.url)) req.url = '/zenrage.html'
        else if (/^\/zenrage\/?(\?.*)?$/.test(req.url)) req.url = '/zenrage.html'
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    zenrageRoute(),
    react(),
    tailwindcss(),
    adminDevApi(),
    seoPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        zenrage: resolve(__dirname, 'zenrage.html'),
        zenrageMinimal: resolve(__dirname, 'zenrage.html'),
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
