// Minimal frontmatter for posts: flat `key: value` lines, plus `[a, b]` lists and booleans.
export interface PostMeta {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
  cover: string;
}

export const EMPTY_META: PostMeta = { title: '', date: '', summary: '', tags: [], draft: true, cover: '' };

export function parsePost(raw: string): { meta: PostMeta; body: string } {
  const text = raw.replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: PostMeta = { ...EMPTY_META, draft: false };
  if (!m) return { meta, body: text };
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim();
    if (key === 'tags') {
      meta.tags = val
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (key === 'draft') {
      meta.draft = val === 'true';
    } else if (key === 'title' || key === 'date' || key === 'summary' || key === 'cover') {
      meta[key] = val.replace(/^(["'])(.*)\1$/, '$2');
    }
  }
  return { meta, body: m[2].replace(/^\n+/, '') };
}

const quote = (v: string) => (/[:#\[\]"']/.test(v) || v !== v.trim() ? JSON.stringify(v) : v);

export function stringifyPost(meta: PostMeta, body: string): string {
  const lines = [
    '---',
    `title: ${quote(meta.title)}`,
    `date: ${meta.date}`,
    `summary: ${quote(meta.summary)}`,
    `tags: [${meta.tags.join(', ')}]`,
    `draft: ${meta.draft}`,
  ];
  if (meta.cover) lines.push(`cover: ${meta.cover}`);
  lines.push('---', '', body.replace(/^\n+/, '').replace(/\s+$/, ''), '');
  return lines.join('\n');
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
