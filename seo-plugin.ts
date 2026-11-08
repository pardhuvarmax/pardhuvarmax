// Build step: link previews, RSS, sitemap, robots.
// Social crawlers do not run JavaScript, so every page gets its own static HTML with the right <title> and preview tags
// (Vercel serves a real file before it applies the SPA rewrite). The React app still takes over in the browser.
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { parsePost } from './src/lib/frontmatter.ts'

const SITE = (process.env.SITE_URL || 'https://pardhuvarma.tech').replace(/\/+$/, '')
const read = (f: string) => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'))
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (s: string, n = 160) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…')
const abs = (u: string) => (/^https?:/i.test(u) ? u : SITE + (u.startsWith('/') ? u : '/' + u))

interface Page { url: string; title: string; description: string; image: string; type: 'website' | 'article'; date?: string }

function collect(): { pages: Page[]; posts: (Page & { slug: string })[] } {
  const site = read('src/content/site.json')
  const cassette = read('src/content/cassette.json')
  const name: string = site.name
  const photo = '/assets/photo.png'
  const dir = path.resolve('src/content/posts')
  const posts = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
          const { meta } = parsePost(fs.readFileSync(path.join(dir, f), 'utf8'))
          const slug = f.replace(/\.md$/, '')
          return { meta, slug }
        })
        .filter((p) => !p.meta.draft)
        .sort((a, b) => b.meta.date.localeCompare(a.meta.date))
        .map(({ meta, slug }) => ({
          slug,
          url: `/blog/${slug}`,
          title: `${meta.title} | ${name}`,
          description: clip(meta.summary || `${meta.title}: a post by ${name}.`),
          image: meta.cover || photo,
          type: 'article' as const,
          date: meta.date,
        }))
    : []
  const firstCover = cassette.albums?.[0]?.cover || cassette.albums?.[0]?.tracks?.[0]?.cover || photo
  const pages: Page[] = [
    { url: '/', title: `${name} | Researcher`, description: clip(`${site.role}. ${site.headline}`), image: photo, type: 'website' },
    { url: '/me', title: `Me | ${name}`, description: clip(site.bio?.[0] || site.headline), image: photo, type: 'website' },
    { url: '/research', title: `Research | ${name}`, description: clip(site.researchStatement?.[0] || site.headline), image: photo, type: 'website' },
    { url: '/publications', title: `Publications | ${name}`, description: `Publications and preprints by ${name}.`, image: photo, type: 'website' },
    { url: '/projects', title: `Projects | ${name}`, description: `Open-source systems and research code by ${name}.`, image: photo, type: 'website' },
    { url: '/blog', title: `Writing | ${name}`, description: `Working notes and writing by ${name}.`, image: photo, type: 'website' },
    { url: '/cassette', title: `Cassette | ${name}`, description: clip(cassette.intro || `Music on repeat, ${name}.`), image: firstCover, type: 'website' },
  ]
  return { pages, posts }
}

function head(p: Page, site: { name: string }): string {
  const url = SITE + (p.url === '/' ? '/' : p.url)
  const tags = [
    `<meta name="description" content="${esc(p.description)}" data-seo />`,
    `<link rel="canonical" href="${esc(url)}" data-seo />`,
    `<meta property="og:site_name" content="${esc(site.name)}" data-seo />`,
    `<meta property="og:type" content="${p.type}" data-seo />`,
    `<meta property="og:title" content="${esc(p.title)}" data-seo />`,
    `<meta property="og:description" content="${esc(p.description)}" data-seo />`,
    `<meta property="og:url" content="${esc(url)}" data-seo />`,
    `<meta property="og:image" content="${esc(abs(p.image))}" data-seo />`,
    `<meta name="twitter:card" content="summary" data-seo />`,
    `<meta name="twitter:title" content="${esc(p.title)}" data-seo />`,
    `<meta name="twitter:description" content="${esc(p.description)}" data-seo />`,
    `<meta name="twitter:image" content="${esc(abs(p.image))}" data-seo />`,
  ]
  if (p.date) tags.push(`<meta property="article:published_time" content="${esc(p.date)}" data-seo />`)
  return tags.join('\n    ')
}

export function renderRoute(html: string, p: Page, site: { name: string }): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)}</title>`)
    .replace(/\s*<(meta|link)[^>]*data-seo[^>]*>/g, '')
    .replace('</head>', `    ${head(p, site)}\n  </head>`)
}

export function seoPlugin(): Plugin {
  let outDir = 'dist'
  return {
    name: 'seo-pages',
    apply: 'build',
    configResolved(c) {
      outDir = path.resolve(c.root, c.build.outDir)
    },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexPath)) return
      const base = fs.readFileSync(indexPath, 'utf8')
      const site = read('src/content/site.json')
      const { pages, posts } = collect()

      // the main page gets the tags in place; every other page gets its own folder with an index.html
      fs.writeFileSync(indexPath, renderRoute(base, pages[0], site))
      for (const p of [...pages.slice(1), ...posts]) {
        const dir = path.join(outDir, p.url)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), renderRoute(base, p, site))
      }

      const today = new Date().toISOString().slice(0, 10)
      const urls = [
        ...pages.map((p) => ({ loc: SITE + (p.url === '/' ? '/' : p.url), lastmod: today })),
        ...posts.map((p) => ({ loc: SITE + p.url, lastmod: p.date || today })),
      ]
      fs.writeFileSync(
        path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${esc(u.lastmod)}</lastmod></url>`)
          .join('\n')}\n</urlset>\n`,
      )
      const rfc = (d: string) => (isNaN(Date.parse(d)) ? new Date() : new Date(d)).toUTCString()
      fs.writeFileSync(
        path.join(outDir, 'rss.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>${esc(site.name)}: Writing</title>\n  <link>${SITE}/blog</link>\n  <description>${esc(`Working notes and writing by ${site.name}.`)}</description>\n  <language>en</language>\n  <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />\n${posts
          .map(
            (p) =>
              `  <item>\n    <title>${esc(p.title.replace(` | ${site.name}`, ''))}</title>\n    <link>${SITE}${p.url}</link>\n    <guid isPermaLink="true">${SITE}${p.url}</guid>\n    <pubDate>${rfc(p.date || '')}</pubDate>\n    <description>${esc(p.description)}</description>\n  </item>`,
          )
          .join('\n')}\n</channel>\n</rss>\n`,
      )
      fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`)
    },
  }
}
