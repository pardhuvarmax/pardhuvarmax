// Build step: link previews, RSS, sitemap, robots.
// Social crawlers do not run JavaScript, so every page gets its own static HTML with the right <title> and preview tags
// (Vercel serves a real file before it applies the SPA rewrite). The React app still takes over in the browser.
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { parsePost } from './src/lib/frontmatter.ts'
import { pubSlug } from './src/lib/pubslug.ts'

const SITE = (process.env.SITE_URL || 'https://pardhuvarma.tech').replace(/\/+$/, '')
const read = (f: string) => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'))
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (s: string, n = 160) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…')
const abs = (u: string) => (/^https?:/i.test(u) ? u : SITE + (u.startsWith('/') ? u : '/' + u))

interface PubItem { title: string; authors: string; year: string; url: string; venue: string; status: string; doi?: string; pdf?: string; abstract?: string }
interface Page { url: string; title: string; description: string; image: string; type: 'website' | 'article'; date?: string; jsonld?: unknown; extra?: string }

function collect(): { pages: Page[]; posts: (Page & { slug: string })[]; projects: (Page & { slug: string })[]; papers: (Page & { slug: string; item: PubItem })[] } {
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
  const slugify = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const projects: (Page & { slug: string })[] = (read('src/content/projects.json').items ?? []).map((p: { name: string; description: string; cover?: string; date?: string }) => ({
    slug: slugify(p.name),
    url: `/projects/${slugify(p.name)}`,
    title: `${p.name} | ${name}`,
    description: clip(p.description || `${p.name}, a project by ${name}.`),
    image: p.cover || photo,
    type: 'website' as const,
    date: undefined,
  }))
  // one page per paper, with the tags Google Scholar and Zotero look for
  const papers = ((read('src/content/publications.json').items ?? []) as PubItem[]).map((it) => {
    const slug = pubSlug(it.title)
    const arxiv = (it.venue.match(/arXiv:\s*(\d{4}\.\d{4,5})/i) ?? it.url.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/i))?.[1]
    const doi = (it.doi?.trim() || it.venue.match(/doi:\s*(10\.\S+?)(?:[.,;]?\s|[.,;]?$)/i)?.[1] || '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    const pdf = it.pdf?.trim() || (arxiv ? `https://arxiv.org/pdf/${arxiv}` : '')
    const url = `/publications/${slug}`
    const who = it.authors.split(/\s+and\s+|;|&|,\s*(?=[A-Z])/i).map((a) => a.trim()).filter(Boolean)
    const meta = (n: string, v: string) => `<meta name="${n}" content="${esc(v)}" data-seo />`
    const extra = [
      meta('citation_title', it.title),
      ...who.map((a) => { const t = a.split(/\s+/); return meta('citation_author', t.length > 1 ? `${t[t.length - 1]}, ${t.slice(0, -1).join(' ')}` : a) }),
      meta('citation_publication_date', it.year),
      ...(doi ? [meta('citation_doi', doi)] : []),
      ...(arxiv ? [meta('citation_arxiv_id', arxiv)] : []),
      ...(pdf ? [meta('citation_pdf_url', pdf)] : []),
      meta('citation_abstract_html_url', SITE + url),
    ].join('\n    ')
    return { slug, url, item: it, title: `${it.title} | ${name}`, description: clip(it.abstract || `${it.authors}. ${it.venue}.`), image: photo, type: 'article' as const, extra }
  })

  // machine-readable list of the papers, so search engines can show them as scholarly articles
  const pubItems: { title: string; authors: string; year: string; url: string; venue: string; status: string }[] = read('src/content/publications.json').items ?? []
  const pubLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: pubItems.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'ScholarlyArticle',
        headline: p.title,
        name: p.title,
        author: p.authors.split(/\s+and\s+|;|&|,\s*(?=[A-Z])/i).map((a) => ({ '@type': 'Person', name: a.trim() })).filter((a) => a.name),
        datePublished: p.year,
        url: p.url,
        description: p.venue,
        ...(p.status === 'In preparation' ? { creativeWorkStatus: 'Draft' } : {}),
      },
    })),
  }
  const firstCover = cassette.albums?.[0]?.cover || cassette.albums?.[0]?.tracks?.[0]?.cover || photo
  const pages: Page[] = [
    { url: '/', title: `${name} | Researcher`, description: clip(`${site.role}. ${site.headline}`), image: photo, type: 'website' },
    { url: '/me', title: `Me | ${name}`, description: clip(site.bio?.[0] || site.headline), image: photo, type: 'website' },
    { url: '/research', title: `Research | ${name}`, description: clip(site.researchStatement?.[0] || site.headline), image: photo, type: 'website' },
    { url: '/publications', title: `Publications | ${name}`, description: `Publications and preprints by ${name}.`, image: photo, type: 'website', jsonld: pubLd },
    { url: '/projects', title: `Projects | ${name}`, description: `Open-source systems and research code by ${name}.`, image: photo, type: 'website' },
    { url: '/blog', title: `Writing | ${name}`, description: `Working notes and writing by ${name}.`, image: photo, type: 'website' },
    { url: '/cassette', title: `Cassette | ${name}`, description: clip(cassette.intro || `Music on repeat, ${name}.`), image: firstCover, type: 'website' },
  ]
  return { pages, posts, projects, papers }
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
  if (p.extra) tags.push(p.extra)
  if (p.url === '/publications') tags.push(`<link rel="alternate" type="application/rss+xml" title="Publications" href="${SITE}/publications.xml" data-seo />`)
  if (p.jsonld) tags.push(`<script type="application/ld+json" data-seo>${JSON.stringify(p.jsonld).replace(/</g, '\\u003c')}</script>`)
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
      const { pages, posts, projects, papers } = collect()

      // the main page gets the tags in place; every other page gets its own folder with an index.html
      fs.writeFileSync(indexPath, renderRoute(base, pages[0], site))
      for (const p of [...pages.slice(1), ...posts, ...projects, ...papers]) {
        const dir = path.join(outDir, p.url)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), renderRoute(base, p, site))
      }

      const today = new Date().toISOString().slice(0, 10)
      const urls = [
        ...pages.map((p) => ({ loc: SITE + (p.url === '/' ? '/' : p.url), lastmod: today })),
        ...posts.map((p) => ({ loc: SITE + p.url, lastmod: p.date || today })),
        ...projects.map((p) => ({ loc: SITE + p.url, lastmod: today })),
        ...papers.map((p) => ({ loc: SITE + p.url, lastmod: today })),
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
      fs.writeFileSync(
        path.join(outDir, 'publications.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>${esc(site.name)}: Publications</title>\n  <link>${SITE}/publications</link>\n  <description>${esc(`Papers and preprints by ${site.name}.`)}</description>\n  <language>en</language>\n  <atom:link href="${SITE}/publications.xml" rel="self" type="application/rss+xml" />\n${papers
          .map((p) => `  <item>\n    <title>${esc(p.item.title)}</title>\n    <link>${SITE}${p.url}</link>\n    <guid isPermaLink="true">${SITE}${p.url}</guid>\n    <pubDate>${rfc(`${p.item.year}-01-01`)}</pubDate>\n    <description>${esc(`${p.item.authors}. ${p.item.venue}.${p.item.abstract ? ' ' + p.item.abstract : ''}`)}</description>\n  </item>`)
          .join('\n')}\n</channel>\n</rss>\n`,
      )
      fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`)
    },
  }
}
