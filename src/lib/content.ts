import site from '../content/site.json';
import publications from '../content/publications.json';
import projects from '../content/projects.json';
import experience from '../content/experience.json';
import honors from '../content/honors.json';
import skills from '../content/skills.json';
import news from '../content/news.json';
import cassetteData from '../content/cassette.json';
import special from '../content/special.json';
import { parsePost, type PostMeta } from './frontmatter';
import { readingTime } from './markdown';

export { site, publications, projects, experience, honors, skills, news, special };

export interface CassetteTrack { title: string; artist?: string; year?: string; note?: string; fav?: boolean; cover?: string; src: string }
export interface CassetteAlbum { title: string; artist: string; year?: string; cover?: string; note?: string; tracks: CassetteTrack[] }
export const cassette = cassetteData as { intro: string; disclaimer?: string; albums: CassetteAlbum[] };

export interface Post extends PostMeta {
  slug: string;
  body: string;
  minutes: number;
}

const files = import.meta.glob('../content/posts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const all: Post[] = Object.entries(files).map(([file, raw]) => {
  const { meta, body } = parsePost(raw);
  const slug = file.split('/').pop()!.replace(/\.md$/, '');
  return { ...meta, slug, body, minutes: readingTime(body) };
});

/** Published posts, newest first. Drafts are excluded from the public site. */
export const posts: Post[] = all.filter((p) => !p.draft).sort((a, b) => b.date.localeCompare(a.date));

export const allTags: string[] = [...new Set(posts.flatMap((p) => p.tags))].sort();

export const safeHref = (href: string) => {
  if (href.startsWith('/') || href.startsWith('#')) return href;
  try {
    return ['http:', 'https:', 'mailto:'].includes(new URL(href).protocol) ? href : '#';
  } catch {
    return '#';
  }
};

export const formatDate = (d: string) => {
  const dt = new Date(/^\d{4}-\d{2}$/.test(d) ? `${d}-01` : d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-GB', /^\d{4}-\d{2}$/.test(d) ? { month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' });
};
