import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Check, ChevronDown, Copy, Download, FileText, Link2, Quote, Search, X } from 'lucide-react';
import { safeHref } from '../lib/content';
import { CITE_FORMATS, allBibtex, allPubs, copyText, downloadText, type Pub } from '../lib/publications';
import { glow, Reveal } from './Reveal';
import '../styles/pubs.css';

/** A small button label that shows a tick for a moment after it worked. */
function useDone() {
  const [done, setDone] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return [done, (k: string) => { setDone(k); clearTimeout(timer.current); timer.current = setTimeout(() => setDone(''), 1600); }] as const;
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
const COLOURS = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--accent-4)'];

/** A book cover drawn from the title, so every paper has its own face: same paper, same cover, every time. */
export function Cover({ p, mini = false }: { p: Pub; mini?: boolean }) {
  const h = hash(p.title);
  const kind = (h >> 4) % 4;
  const bits = (n: number) => (h >> n) & 1;
  const ink = 'var(--ink)';
  let art;
  if (kind === 0) art = [6, 14, 22].map((r) => <circle key={r} cx={30} cy={32} r={r} fill="none" stroke={ink} strokeWidth={3} />);
  else if (kind === 1) art = [0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={-6} y1={8 + i * 11} x2={66} y2={-22 + i * 11} stroke={ink} strokeWidth={bits(i + 8) ? 6 : 3} />);
  else if (kind === 2) art = Array.from({ length: 9 }, (_, i) => <rect key={i} x={8 + (i % 3) * 15} y={8 + Math.floor(i / 3) * 15} width={13} height={13} fill={bits(i + 6) ? ink : 'none'} stroke={ink} strokeWidth={2} />);
  else art = Array.from({ length: 20 }, (_, i) => <circle key={i} cx={9 + (i % 4) * 14} cy={10 + Math.floor(i / 4) * 10} r={bits(i + 3) ? 4 : 2} fill={ink} />);
  return (
    <svg className={`pub-cover ${mini ? 'mini' : ''}`} viewBox={mini ? '0 0 60 62' : '0 0 60 80'} aria-hidden="true">
      <rect width={60} height={80} fill={COLOURS[(h >>> 9) % 4]} />
      {art}
      {!mini && (
        <>
          <rect x={0} y={62} width={60} height={18} fill={ink} />
          <text x={30} y={74.5} textAnchor="middle" fontSize={8.5} fontWeight={700} letterSpacing={1} fill="var(--bg)" fontFamily="'JetBrains Mono', ui-monospace, monospace">{p.year}</text>
        </>
      )}
      <rect x={1} y={1} width={58} height={mini ? 70 : 78} fill="none" stroke={ink} strokeWidth={2} />
    </svg>
  );
}

const STAGES = ['Draft', 'Preprint', 'Peer review', 'Published'];
// "Preprint" has to be checked before "In preparation": both start with "prep"
const stageOf = (status: string) => (/preprint/i.test(status) ? 1 : /prep|draft/i.test(status) ? 0 : /review/i.test(status) ? 2 : /publish/i.test(status) ? 3 : 1);

/** A slim four-step track: draft, preprint, peer review, published. */
function Lifecycle({ status }: { status: string }) {
  const at = stageOf(status);
  return (
    <div className="pub-life" role="img" aria-label={`Stage ${at + 1} of ${STAGES.length}: ${STAGES[at]}`}>
      <span className="pub-life-track">{STAGES.map((n, k) => <i key={n} className={k <= at ? 'on' : ''} title={n} />)}</span>
      <span className="pub-life-text">{at + 1} / {STAGES.length}</span>
    </div>
  );
}

/** How many other works cite it, from OpenAlex. Asked once per DOI per tab and kept quietly: nothing is shown if it fails or is zero. */
function useCited(p: Pub) {
  const key = p.doi || (p.arxiv ? `10.48550/arXiv.${p.arxiv}` : '');
  const [n, setN] = useState<number | null>(() => {
    try { const v = sessionStorage.getItem(`pubcited:${key}`); return v === null ? null : Number(v); } catch { return null; }
  });
  useEffect(() => {
    if (!key || n !== null) return;
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 6000);
    fetch(`https://api.openalex.org/works/doi:${encodeURIComponent(key)}?select=cited_by_count`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.cited_by_count === 'number') {
          try { sessionStorage.setItem(`pubcited:${key}`, String(j.cited_by_count)); } catch { /* private mode */ }
          setN(j.cited_by_count);
        }
      })
      .catch(() => undefined)
      .finally(() => clearTimeout(t));
    return () => { ac.abort(); clearTimeout(t); };
  }, [key, n]);
  return { n, href: key ? `https://openalex.org/works/doi:${key}` : '' };
}

export function PubCard({ p, flash = false }: { p: Pub; flash?: boolean }) {
  const [open, setOpen] = useState<'' | 'cite' | 'abstract'>('');
  const [fmt, setFmt] = useState<(typeof CITE_FORMATS)[number]['id']>('bibtex');
  const [done, mark] = useDone();
  const cited = useCited(p);
  const citation = CITE_FORMATS.find((f) => f.id === fmt)!.make(p);
  const permalink = () => `${location.origin}/publications#${p.slug}`;
  const toggle = (k: 'cite' | 'abstract') => setOpen((o) => (o === k ? '' : k));

  // the "c" shortcut on the page asks the paper under the cursor to open its citation
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent).detail === p.slug) setOpen((o) => (o === 'cite' ? '' : 'cite')); };
    window.addEventListener('pub:cite', on);
    return () => window.removeEventListener('pub:cite', on);
  }, [p.slug]);

  return (
    <li id={p.slug} tabIndex={-1} className={`pub glow pub-card ${flash ? 'pub-flash' : ''} `} onPointerMove={glow}>
      <div className="pub-layout">
        <Cover p={p} />
        <div className="pub-main">
          <div className="pub-top">
            <span className={`tag ${p.status === 'Preprint' ? 'tag-ok' : ''}`}>{p.status}</span>
            <span className="pub-spacer" />
            <span className="pub-year">{p.year}</span>
          </div>
          <h3>
            {p.title}
            <button className="pub-anchor" onClick={() => copyText(permalink()).then((ok) => ok && mark('link'))} aria-label="Copy link to this paper" title="Copy link to this paper">
              {done === 'link' ? <Check size={15} /> : <Link2 size={15} />}
            </button>
          </h3>
          <p>{p.authors}. {p.venue}.</p>
          <Lifecycle status={p.status} />
          {p.tagList.length > 0 && <div className="pub-tags">{p.tagList.map((t) => <span key={t} className="chip">{t}</span>)}</div>}

          <div className="pub-actions">
            <a className="link-arrow" href={safeHref(p.url)} target="_blank" rel="noopener noreferrer">{p.linkLabel} <ArrowUpRight size={15} /></a>
            {p.pdfUrl && <a className="pub-pill" href={safeHref(p.pdfUrl)} target="_blank" rel="noopener noreferrer"><FileText size={14} /> PDF</a>}
            {p.doiUrl && <a className="pub-pill" href={safeHref(p.doiUrl)} target="_blank" rel="noopener noreferrer">DOI</a>}
            {p.codeUrl && <a className="pub-pill" href={safeHref(p.codeUrl)} target="_blank" rel="noopener noreferrer">Code</a>}
            {cited.n !== null && cited.n > 0 && <a className="pub-pill cited" href={cited.href} target="_blank" rel="noopener noreferrer" title="Citation count from OpenAlex">Cited by {cited.n}</a>}
            <span className="pub-spacer" />
            {p.abstract && (
              <button className={`pub-pill ${open === 'abstract' ? 'on' : ''}`} onClick={() => toggle('abstract')} aria-expanded={open === 'abstract'}>
                Abstract <ChevronDown size={14} className="pub-chev" />
              </button>
            )}
            <button className={`pub-pill ${open === 'cite' ? 'on' : ''}`} onClick={() => toggle('cite')} aria-expanded={open === 'cite'}>
              <Quote size={14} /> Cite
            </button>
          </div>

          {open === 'abstract' && p.abstract && <p className="pub-abstract">{p.abstract}</p>}
          {open === 'cite' && (
            <div className="pub-cite">
              <div className="pub-cite-bar" role="tablist" aria-label="Citation format">
                {CITE_FORMATS.map((f) => (
                  <button key={f.id} role="tab" aria-selected={fmt === f.id} className={fmt === f.id ? 'on' : ''} onClick={() => setFmt(f.id)}>{f.label}</button>
                ))}
                <span className="pub-spacer" />
                <button className="pub-copy" onClick={() => copyText(citation).then((ok) => ok && mark('cite'))}>
                  {done === 'cite' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
              <pre className={fmt === 'bibtex' ? 'mono' : ''}>{citation}</pre>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/** The Publications page: counters that filter, one search line, papers grouped by year, and citation export. */
export function PublicationsExplorer() {
  const [params, setParams] = useSearchParams();
  const { hash: urlHash } = useLocation();
  const search = useRef<HTMLInputElement>(null);
  const [done, mark] = useDone();
  const [cursor, setCursor] = useState(-1);
  const q = params.get('q') ?? '';
  const status = params.get('status');
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    setParams(next, { replace: true });
  };

  const statuses = useMemo(() => [...new Set(allPubs.map((p) => p.status).filter(Boolean))], []);
  const count = (s: string) => allPubs.filter((p) => p.status === s).length;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allPubs
      .filter((p) => (!status || p.status === status) && (!needle || `${p.title} ${p.authors} ${p.venue} ${p.year} ${p.status} ${p.tagList.join(' ')} ${p.abstract ?? ''}`.toLowerCase().includes(needle)))
      .sort((a, b) => Number(b.year) - Number(a.year));
  }, [q, status]);
  const years = useMemo(() => [...new Set(shown.map((p) => p.year))].map((year) => ({ year, list: shown.filter((p) => p.year === year) })), [shown]);

  // keyboard: / search, j and k move between papers, c opens the citation of the one you are on
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)))) return;
      const k = e.key.toLowerCase();
      if (k === '/') { e.preventDefault(); search.current?.focus(); return; }
      if (!shown.length) return;
      const move = (to: number) => {
        const i = Math.max(0, Math.min(shown.length - 1, to));
        setCursor(i);
        document.getElementById(shown[i].slug)?.focus();
      };
      if (k === 'j') { e.preventDefault(); move(cursor + 1); }
      else if (k === 'k') { e.preventDefault(); move(cursor < 0 ? 0 : cursor - 1); }
      else if (k === 'c' && cursor >= 0) window.dispatchEvent(new CustomEvent('pub:cite', { detail: shown[cursor].slug }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // opening /publications#some-paper scrolls to it and gives it a short highlight
  const target = urlHash.slice(1);
  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  }, [target]);

  const filtered = !!(q || status);

  return (
    <>
      <div className="pub-tiles" role="group" aria-label="Filter by status">
        <button className={`pub-tile ${!status ? 'on' : ''}`} onClick={() => set({ status: null })} aria-pressed={!status}>
          <b>{allPubs.length}</b><span>{allPubs.length === 1 ? 'Paper' : 'Papers'}</span>
        </button>
        {statuses.map((s) => (
          <button key={s} className={`pub-tile ${status === s ? 'on' : ''}`} onClick={() => set({ status: status === s ? null : s })} aria-pressed={status === s}>
            <b>{count(s)}</b><span>{s}</span>
          </button>
        ))}
      </div>

      <div className="pub-line">
        <label className="pub-find">
          <Search size={16} />
          <input ref={search} value={q} onChange={(e) => set({ q: e.target.value || null })} placeholder="Find a paper  ( / )" aria-label="Search papers" />
          {q && <button type="button" onClick={() => set({ q: null })} aria-label="Clear search"><X size={15} /></button>}
        </label>
        <span className="pub-spacer" />
        <button className="pub-pill" onClick={() => copyText(allBibtex(shown)).then((ok) => ok && mark('all'))} disabled={!shown.length}>
          {done === 'all' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy BibTeX{filtered ? ' (shown)' : ''}</>}
        </button>
        <button className="pub-pill" onClick={() => downloadText('publications.bib', allBibtex(shown), 'application/x-bibtex')} disabled={!shown.length}>
          <Download size={14} /> .bib
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="muted" aria-live="polite">Nothing matches. <button className="pub-reset" onClick={() => setParams({}, { replace: true })}>Clear the filters</button>.</p>
      ) : (
        years.map(({ year, list }) => (
          <section key={year} className="pub-year-group" aria-label={year}>
            <h3 className="pub-year-head"><span>{year}</span><i /><em>{list.length}</em></h3>
            <ol className="pubs">
              {list.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.05}>
                  <PubCard p={p} flash={target === p.slug} />
                </Reveal>
              ))}
            </ol>
          </section>
        ))
      )}
    </>
  );
}
