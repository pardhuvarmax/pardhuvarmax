import { publications } from './content';

interface Raw {
  title: string;
  authors: string;
  venue: string;
  year: string;
  status: string;
  url: string;
  linkLabel: string;
  doi?: string;
  pdf?: string;
  code?: string;
  abstract?: string;
  tags?: string;
}

export interface Pub extends Raw {
  slug: string;
  tagList: string[];
  doiUrl?: string;
  pdfUrl?: string;
  codeUrl?: string;
  arxiv?: string;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function normalise(p: Raw): Pub {
  const arxiv = (p.venue.match(/arXiv:\s*(\d{4}\.\d{4,5})/i) ?? p.url.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/i))?.[1];
  const doi = (p.doi?.trim() || p.venue.match(/doi:\s*(10\.\S+?)(?:[.,;]?\s|[.,;]?$)/i)?.[1] || '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  const pdf = p.pdf?.trim() || (arxiv ? `https://arxiv.org/pdf/${arxiv}` : '');
  const code = p.code?.trim() && p.code.trim() !== p.url ? p.code.trim() : '';
  return {
    ...p,
    slug: slugify(p.title).split('-').slice(0, 8).join('-'),
    tagList: (p.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    arxiv,
    doi,
    doiUrl: doi ? `https://doi.org/${doi}` : undefined,
    pdfUrl: pdf || undefined,
    codeUrl: code || undefined,
  };
}

export const allPubs: Pub[] = (publications.items as Raw[]).map(normalise);
export const findPub = (slug: string) => allPubs.find((p) => p.slug === slug);

/* ---------- citations ---------- */
// "A. B. One, C. Two and D. Three": split on commas that start a new name, on "and", "&" and semicolons
export const names = (authors: string) => authors.split(/\s+and\s+|;|&|,\s*(?=[A-Z])/i).map((a) => a.trim()).filter(Boolean);
const split = (name: string) => {
  const t = name.split(/\s+/);
  return { family: t[t.length - 1] ?? name, given: t.slice(0, -1).join(' ') };
};
const venueOnly = (v: string) => v.replace(/,?\s*\d{4}\s*$/, '').replace(/\.\s*$/, '');
const bibEscape = (s: string) => s.replace(/([&%$#_])/g, '\\$1');

export const bibKey = (p: Pub) => {
  const family = split(names(p.authors)[0] ?? 'anon').family.toLowerCase().replace(/[^a-z]/g, '');
  const word = p.title.toLowerCase().split(/\W+/).find((w) => w.length > 3 && !['the', 'with', 'from', 'that', 'this'].includes(w)) ?? 'paper';
  return `${family}${p.year}${word}`;
};

export function bibtex(p: Pub): string {
  const type = p.status === 'In preparation' ? 'unpublished' : p.arxiv || /preprint/i.test(p.status) ? 'misc' : 'article';
  const f: [string, string | undefined][] = [
    ['author', names(p.authors).map((n) => { const s = split(n); return s.given ? `${s.family}, ${s.given}` : s.family; }).join(' and ')],
    ['title', `{${bibEscape(p.title)}}`],
    type === 'article' ? ['journal', bibEscape(venueOnly(p.venue))] : ['note', bibEscape(venueOnly(p.venue))],
    ['year', p.year],
    ['eprint', p.arxiv],
    ['archivePrefix', p.arxiv ? 'arXiv' : undefined],
    ['doi', p.doi || undefined],
    ['url', p.status === 'In preparation' ? undefined : p.url],
  ];
  const body = f.filter(([, v]) => v).map(([k, v]) => `  ${k.padEnd(13)}= {${v}}`).join(',\n');
  return `@${type}{${bibKey(p)},\n${body}\n}`;
}

export const apa = (p: Pub) => {
  const a = names(p.authors).map((n) => { const s = split(n); return s.given ? `${s.family}, ${s.given}` : s.family; });
  const who = a.length > 1 ? `${a.slice(0, -1).join(', ')}, & ${a[a.length - 1]}` : a[0] ?? '';
  return `${who} (${p.year}). ${p.title}. ${venueOnly(p.venue)}.${p.status === 'In preparation' ? '' : ` ${p.doiUrl ?? p.url}`}`;
};

export const mla = (p: Pub) => {
  const n = names(p.authors).map(split);
  const first = n[0] ? (n[0].given ? `${n[0].family}, ${n[0].given}` : n[0].family) : '';
  const who = n.length > 2 ? `${first}, et al.` : n.length === 2 ? `${first}, and ${n[1].given} ${n[1].family}` : first;
  return `${who}. "${p.title}." ${venueOnly(p.venue)}, ${p.year}${p.status === 'In preparation' ? '' : `, ${p.doiUrl ?? p.url}`}.`;
};

export const CITE_FORMATS = [
  { id: 'bibtex', label: 'BibTeX', make: bibtex },
  { id: 'apa', label: 'APA', make: apa },
  { id: 'mla', label: 'MLA', make: mla },
] as const;

export const allBibtex = (list: Pub[] = allPubs) => list.map(bibtex).join('\n\n') + '\n';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadText(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
