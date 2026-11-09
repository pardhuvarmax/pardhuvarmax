import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, Check, Copy, Download, FileText, Link2, Quote, Search, X } from 'lucide-react';
import { safeHref } from '../lib/content';
import { CITE_FORMATS, allBibtex, allPubs, copyText, downloadText, type Pub } from '../lib/publications';
import { glow, Reveal } from './Reveal';
import '../styles/pubs.css';

/** One small button that shows a tick for a moment after it worked. */
function useDone() {
  const [done, setDone] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return [done, (k: string) => { setDone(k); clearTimeout(timer.current); timer.current = setTimeout(() => setDone(''), 1600); }] as const;
}

export function PubCard({ p, flash = false }: { p: Pub; flash?: boolean }) {
  const [open, setOpen] = useState<'' | 'cite' | 'abstract'>('');
  const [fmt, setFmt] = useState<(typeof CITE_FORMATS)[number]['id']>('bibtex');
  const [done, mark] = useDone();
  const citation = CITE_FORMATS.find((f) => f.id === fmt)!.make(p);
  const permalink = () => `${location.origin}/publications#${p.slug}`;
  const toggle = (k: 'cite' | 'abstract') => setOpen((o) => (o === k ? '' : k));

  return (
    <li id={p.slug} className={`pub glow pub-card ${flash ? 'pub-flash' : ''}`} onPointerMove={glow}>
      <div className="pub-top">
        <span className={`tag ${p.status === 'Preprint' ? 'tag-ok' : ''}`}>{p.status}</span>
        <span className="pub-year">{p.year}</span>
      </div>
      <h3>
        {p.title}
        <button className="pub-anchor" onClick={() => copyText(permalink()).then((ok) => ok && mark('link'))} aria-label="Copy link to this paper" title="Copy link to this paper">
          {done === 'link' ? <Check size={15} /> : <Link2 size={15} />}
        </button>
      </h3>
      <p>{p.authors}. {p.venue}.</p>
      {p.tagList.length > 0 && <div className="pub-tags">{p.tagList.map((t) => <span key={t} className="chip">{t}</span>)}</div>}

      <div className="pub-actions">
        <a className="link-arrow" href={safeHref(p.url)} target="_blank" rel="noopener noreferrer">{p.linkLabel} <ArrowUpRight size={15} /></a>
        {p.pdfUrl && <a className="pub-pill" href={safeHref(p.pdfUrl)} target="_blank" rel="noopener noreferrer"><FileText size={14} /> PDF</a>}
        {p.doiUrl && <a className="pub-pill" href={safeHref(p.doiUrl)} target="_blank" rel="noopener noreferrer">DOI</a>}
        {p.codeUrl && <a className="pub-pill" href={safeHref(p.codeUrl)} target="_blank" rel="noopener noreferrer">Code</a>}
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
    </li>
  );
}

/** The Publications page: big counters that double as filters, one search line, papers grouped by year, and citation export. */
export function PublicationsExplorer() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const search = useRef<HTMLInputElement>(null);
  const [done, mark] = useDone();
  const q = params.get('q') ?? '';
  const status = params.get('status');
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    setParams(next, { replace: true });
  };

  // "/" jumps to the search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key === '/' && !(el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)))) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const statuses = useMemo(() => [...new Set(allPubs.map((p) => p.status).filter(Boolean))], []);
  const count = (s: string) => allPubs.filter((p) => p.status === s).length;

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allPubs.filter((p) => (!status || p.status === status) && (!needle || `${p.title} ${p.authors} ${p.venue} ${p.year} ${p.status} ${p.tagList.join(' ')} ${p.abstract ?? ''}`.toLowerCase().includes(needle)));
  }, [q, status]);
  const years = useMemo(() => {
    const ys = [...new Set(shown.map((p) => p.year))].sort((a, b) => Number(b) - Number(a));
    return ys.map((y) => ({ year: y, list: shown.filter((p) => p.year === y) }));
  }, [shown]);

  // opening /publications#some-paper scrolls to it and gives it a short highlight
  const target = hash.slice(1);
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
