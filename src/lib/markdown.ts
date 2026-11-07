import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

let hooked = false;
function ensureHook() {
  if (hooked) return;
  hooked = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') ?? '';
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });
}

const slug = (t: string) =>
  t
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Render Markdown to sanitized HTML; h2/h3 get ids and are returned as a table of contents. */
export function renderMarkdown(md: string): { html: string; toc: TocItem[] } {
  ensureHook();
  const raw = marked.parse(md, { async: false, gfm: true }) as string;
  const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  const toc: TocItem[] = [];
  const html = clean.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, lvl: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '');
    const id = slug(text) || `s-${toc.length}`;
    toc.push({ id, text, level: Number(lvl) });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });
  return { html, toc };
}

export function readingTime(md: string): number {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 210));
}
