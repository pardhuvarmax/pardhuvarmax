// Pulls stars, languages and weekly commit activity for every GitHub project, once per build (and every 15 minutes in dev),
// and writes them to /data/github-stats.json. Visitors never call GitHub themselves. If GitHub is unreachable the file is simply
// empty and the site shows no numbers.
import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import type { Plugin } from 'vite'

interface Repo { stars: number; forks: number; issues: number; pushed: string; languages: { name: string; pct: number }[]; weeks: number[] }

const repoOf = (url: string) => {
  const m = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/i.exec(url || '')
  return m ? `${m[1]}/${m[2].replace(/\.git$/, '')}` : null
}

// GITHUB_TOKEN on Vercel; on a laptop, fall back to the GitHub CLI login so local runs do not hit the anonymous 60-an-hour limit
let cliToken: string | null | undefined
async function token(): Promise<string | null> {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  if (cliToken === undefined) cliToken = await new Promise((res) => execFile('gh', ['auth', 'token'], { timeout: 4000 }, (e, out) => res(e ? null : out.trim() || null)))
  return cliToken
}

async function gh(p: string, useToken: boolean) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-stats', 'X-GitHub-Api-Version': '2022-11-28' }
  const t = useToken ? await token() : null
  if (t) headers.Authorization = `Bearer ${t}`
  return fetch('https://api.github.com' + p, { headers, signal: AbortSignal.timeout(9000) })
}
// the CMS token may not suit every request; fall back to anonymous access (fine for public repos)
async function get(p: string) {
  let r = await gh(p, true)
  if (r.status === 401 || r.status === 403) r = await gh(p, false)
  return r
}

async function one(repo: string): Promise<Repo | null> {
  try {
    const info = await get(`/repos/${repo}`)
    if (!info.ok) return null
    const j = (await info.json()) as { stargazers_count: number; forks_count: number; open_issues_count: number; pushed_at: string }
    let languages: Repo['languages'] = []
    const lr = await get(`/repos/${repo}/languages`)
    if (lr.ok) {
      const bytes = (await lr.json()) as Record<string, number>
      const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1
      languages = Object.entries(bytes)
        .sort((a, b) => b[1] - a[1])
        .map(([name, n]) => ({ name, pct: Math.round((n / total) * 1000) / 10 }))
        .filter((l) => l.pct >= 0.5)
    }
    let weeks: number[] = []
    for (let i = 0; i < 2 && !weeks.length; i++) {
      const pr = await get(`/repos/${repo}/stats/participation`)
      if (pr.status === 202) { await new Promise((r) => setTimeout(r, 1500)); continue } // GitHub is still computing it
      if (pr.ok) weeks = ((await pr.json()) as { all?: number[] }).all ?? []
      break
    }
    return { stars: j.stargazers_count, forks: j.forks_count, issues: j.open_issues_count, pushed: j.pushed_at, languages, weeks }
  } catch {
    return null
  }
}

export async function buildStats() {
  const file = path.resolve('src/content/projects.json')
  const items = (JSON.parse(fs.readFileSync(file, 'utf8')).items ?? []) as { url?: string }[]
  const repos = [...new Set(items.map((p) => repoOf(p.url ?? '')).filter(Boolean) as string[])]
  const out: Record<string, Repo> = {}
  await Promise.all(repos.map(async (r) => { const v = await one(r); if (v) out[r] = v }))
  return { generatedAt: new Date().toISOString(), repos: out }
}

export function githubStatsPlugin(): Plugin {
  let outDir = 'dist'
  let cached: { at: number; data: unknown } | null = null
  return {
    name: 'github-stats',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir) },
    configureServer(server) {
      server.middlewares.use('/data/github-stats.json', async (_req, res) => {
        if (!cached || Date.now() - cached.at > 15 * 60 * 1000) {
          const data = await buildStats()
          cached = Object.keys(data.repos).length ? { at: Date.now(), data } : null // never keep an empty answer (rate limit, offline)
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify(data))
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(cached.data))
      })
    },
    async closeBundle() {
      if (!fs.existsSync(outDir)) return
      const data = await buildStats()
      fs.mkdirSync(path.join(outDir, 'data'), { recursive: true })
      fs.writeFileSync(path.join(outDir, 'data', 'github-stats.json'), JSON.stringify(data))
      console.log(`github-stats: ${Object.keys(data.repos).length} repo(s)`)
    },
  }
}
