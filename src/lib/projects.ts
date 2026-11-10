// Projects: slugs, repo parsing, related work, and the optional GitHub numbers fetched at build time.
import { useEffect, useState } from 'react';
import { posts, projects as raw, publications } from './content';

export interface ProjectLink { label: string; href: string }
export interface ProjectInput {
  name: string;
  description: string;
  lang: string;
  url: string;
  private?: boolean; // the repository is private: no link, no GitHub numbers
  status?: string;
  featured?: boolean;
  date?: string;
  tags?: string[];
  cover?: string;
  logo?: string; // engraved plate on the project page
  notes?: Record<string, string>; // code blocks: identifier → explanation shown on hover
  cards?: string; // research cards it belongs under, by any part of the card title, e.g. "trustworthy, linux internals"
  install?: string;
  demo?: string;
  body?: string;
  links?: ProjectLink[];
  relatedPosts?: string[];
}
export interface Project extends ProjectInput {
  slug: string;
  langs: string[];
  tagList: string[]; // explicit tags, lower-case
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const allProjects: Project[] = (raw.items as ProjectInput[]).map((p) => ({
  ...p,
  slug: slugify(p.name),
  langs: (p.lang || '').split(',').map((l) => l.trim()).filter(Boolean),
  tagList: (p.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
}));

export const findProject = (slug: string | undefined) => allProjects.find((p) => p.slug === slug);

/** Featured first (in file order), then the rest. */
export const featuredFirst = (list: Project[]) => [...list.filter((p) => p.featured), ...list.filter((p) => !p.featured)];
/** What the home page shows: the featured ones, or the first three if none are marked. */
export const homeProjects = (): Project[] => {
  const f = allProjects.filter((p) => p.featured);
  return (f.length ? f : allProjects).slice(0, 3);
};

export const repoOf = (url: string): string | null => {
  const m = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/i.exec(url || '');
  return m ? `${m[1]}/${m[2].replace(/\.git$/, '')}` : null;
};

/* ---------- related work ---------- */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function relatedFor(p: Project) {
  const name = norm(p.name);
  const explicit = new Set(p.relatedPosts ?? []);
  const relPosts = posts.filter(
    (post) => explicit.has(post.slug) || norm(`${post.title} ${post.summary} ${post.body}`).includes(name) || post.tags.some((t) => p.tagList.includes(t.toLowerCase())),
  );
  const relPubs = (publications.items as { title: string; venue: string; year: string; url: string; status?: string }[]).filter((x) => norm(x.title).includes(name));
  const relProjects = allProjects
    .filter((o) => o.slug !== p.slug)
    .map((o) => ({ o, score: o.tagList.filter((t) => p.tagList.includes(t)).length * 2 + o.langs.filter((l) => p.langs.includes(l)).length }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.o);
  return { posts: relPosts, pubs: relPubs, projects: relProjects };
}

/* ---------- GitHub numbers (written at build time to /data/github-stats.json) ---------- */
export interface RepoStats {
  stars: number;
  forks: number;
  issues: number;
  pushed: string;
  languages: { name: string; pct: number }[];
  weeks: number[]; // commits per week, last 52 weeks
}
let cache: Record<string, RepoStats> | null = null;
let pending: Promise<Record<string, RepoStats>> | null = null;

export function loadStats(): Promise<Record<string, RepoStats>> {
  if (cache) return Promise.resolve(cache);
  pending ??= fetch('/data/github-stats.json')
    .then((r) => (r.ok ? r.json() : { repos: {} }))
    .then((j) => (cache = (j.repos ?? {}) as Record<string, RepoStats>))
    .catch(() => (cache = {}));
  return pending;
}

export function useGithubStats(): Record<string, RepoStats> {
  const [s, setS] = useState<Record<string, RepoStats>>(cache ?? {});
  useEffect(() => {
    let live = true;
    loadStats().then((r) => live && setS(r));
    return () => { live = false; };
  }, []);
  return s;
}

export function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(days) || days < 0) return '';
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
