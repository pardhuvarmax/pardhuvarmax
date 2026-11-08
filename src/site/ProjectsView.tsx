import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, LayoutGrid, List, Search, Star, X } from 'lucide-react';
import { safeHref } from '../lib/content';
import { ago, allProjects, featuredFirst, repoOf, useGithubStats, type Project, type RepoStats } from '../lib/projects';
import { glow, Reveal } from './Reveal';
import '../styles/projects.css';

const SEG = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--accent-4)'];

/** Thin bar showing how a repository splits between languages. */
export function LangBar({ langs, legend = false }: { langs: { name: string; pct: number }[]; legend?: boolean }) {
  if (!langs.length) return null;
  return (
    <div className="pj-langs">
      <div className="pj-langbar" role="img" aria-label={langs.map((l) => `${l.name} ${l.pct}%`).join(', ')}>
        {langs.map((l, i) => (
          <i key={l.name} title={`${l.name} ${l.pct}%`} style={{ width: `${l.pct}%`, background: SEG[i % SEG.length], opacity: i < 4 ? 1 : 0.5 }} />
        ))}
      </div>
      {legend && (
        <ul>
          {langs.slice(0, 6).map((l, i) => (
            <li key={l.name}>
              <i style={{ background: SEG[i % SEG.length] }} /> {l.name} <b>{l.pct}%</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A year of weekly commits as little bars. */
export function Sparkline({ weeks, height = 22, label = true }: { weeks: number[]; height?: number; label?: boolean }) {
  const total = weeks.reduce((a, b) => a + b, 0);
  if (!weeks.length || !total) return null;
  const max = Math.max(...weeks, 1);
  return (
    <svg className="pj-spark" width={weeks.length * 3} height={height} viewBox={`0 0 ${weeks.length * 3} ${height}`} role="img" aria-label={`${total} commits in the last year`} shapeRendering="crispEdges">
      {weeks.map((w, i) => {
        const h = w ? Math.max(2, Math.round((w / max) * height)) : 1;
        return <rect key={i} x={i * 3} y={height - h} width={2} height={h} fill="currentColor" opacity={w ? 0.5 + 0.5 * (w / max) : 0.25} />;
      })}
      {label && <title>{`${total} commits in the last year`}</title>}
    </svg>
  );
}

export function ProjectCard({ p, stats, wide = false }: { p: Project; stats?: RepoStats; wide?: boolean }) {
  const repo = safeHref(p.url);
  return (
    <article className={`card glow pj-card ${wide ? 'feat' : ''}`} onPointerMove={glow}>
      {wide && p.cover && <img className="pj-cover" src={safeHref(p.cover)} alt="" loading="lazy" />}
      <div className="card-top">
        <span className="pj-tags">
          {p.status && <em className={`pj-status s-${p.status.toLowerCase()}`}>{p.status}</em>}
          {p.featured && <em className="pj-star">Featured</em>}
        </span>
        <span className="pj-meta">
          {stats && stats.stars > 0 && <span className="pj-stars" title={`${stats.stars} stars on GitHub`}><Star size={13} /> {stats.stars}</span>}
          <a className="pj-ext" href={repo} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} on GitHub`}><ArrowUpRight size={18} /></a>
        </span>
      </div>
      <h3><Link className="pj-link" to={`/projects/${p.slug}`}>{p.name}</Link></h3>
      <p>{p.description}</p>
      <div className="pj-foot">
        {stats?.languages.length ? <LangBar langs={stats.languages.slice(0, 6)} /> : null}
        <span className="langs">{p.langs.slice(0, 4).map((l) => <i key={l}>{l}</i>)}</span>
        {stats && (
          <span className="pj-activity">
            <Sparkline weeks={stats.weeks} />
            {stats.pushed && <small>pushed {ago(stats.pushed)}</small>}
          </span>
        )}
      </div>
    </article>
  );
}

/* ---------- the Projects page: search, filters, sort, two layouts ---------- */
type Sort = 'featured' | 'active' | 'newest' | 'az' | 'stars';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'active', label: 'Recently active' },
  { id: 'newest', label: 'Newest' },
  { id: 'az', label: 'A to Z' },
  { id: 'stars', label: 'Most starred' },
];
const VIEWS = [
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'list', label: 'List', icon: List },
] as const;

export function ProjectsExplorer() {
  const [params, setParams] = useSearchParams();
  const stats = useGithubStats();
  const search = useRef<HTMLInputElement>(null);
  const q = params.get('q') ?? '';
  const lang = params.get('lang');
  const status = params.get('status');
  const sort = (SORTS.some((s) => s.id === params.get('sort')) ? params.get('sort') : 'featured') as Sort;
  const view = (VIEWS.some((v) => v.id === params.get('view')) ? params.get('view') : 'grid') as 'grid' | 'list';

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

  const languages = useMemo(() => [...new Set(allProjects.flatMap((p) => p.langs))].sort(), []);
  const statuses = useMemo(() => [...new Set(allProjects.map((p) => p.status).filter(Boolean) as string[])], []);
  const pushed = (p: Project) => new Date(stats[repoOf(p.url) ?? '']?.pushed ?? p.date ?? 0).getTime() || 0;

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = allProjects.filter(
      (p) =>
        (!lang || p.langs.includes(lang)) &&
        (!status || p.status === status) &&
        (!needle || `${p.name} ${p.description} ${p.lang} ${p.tagList.join(' ')} ${p.status ?? ''}`.toLowerCase().includes(needle)),
    );
    if (sort === 'featured') list = featuredFirst(list);
    else if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'newest') list = [...list].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.name.localeCompare(b.name));
    else if (sort === 'active') list = [...list].sort((a, b) => pushed(b) - pushed(a));
    else if (sort === 'stars') list = [...list].sort((a, b) => (stats[repoOf(b.url) ?? '']?.stars ?? 0) - (stats[repoOf(a.url) ?? '']?.stars ?? 0));
    return list;
  }, [q, lang, status, sort, stats]);

  const filtered = !!(q || lang || status);
  const hasStats = Object.keys(stats).length > 0;

  return (
    <>
      <div className="pj-tools">
        <label className="search">
          <Search size={17} />
          <input ref={search} value={q} onChange={(e) => set({ q: e.target.value || null })} placeholder="Search projects  ( / )" aria-label="Search projects" />
          {q && <button type="button" className="pj-clear" onClick={() => set({ q: null })} aria-label="Clear search"><X size={15} /></button>}
        </label>
        <div className="pj-ctl">
          <select className="pj-sort" value={sort} onChange={(e) => set({ sort: e.target.value === 'featured' ? null : e.target.value })} aria-label="Sort projects">
            {SORTS.filter((s) => s.id !== 'stars' || hasStats).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div className="pj-views" role="group" aria-label="Layout">
            {VIEWS.map((v) => (
              <button key={v.id} className={view === v.id ? 'on' : ''} onClick={() => set({ view: v.id === 'grid' ? null : v.id })} aria-pressed={view === v.id} title={v.label}>
                <v.icon size={16} /> <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chips pj-chips" aria-label="Filter by language">
        <button className={`chip chip-btn ${!lang ? 'on' : ''}`} onClick={() => set({ lang: null })}>All</button>
        {languages.map((l) => <button key={l} className={`chip chip-btn ${lang === l ? 'on' : ''}`} onClick={() => set({ lang: lang === l ? null : l })}>{l}</button>)}
      </div>
      {statuses.length > 0 && (
        <div className="chips pj-chips" aria-label="Filter by status">
          {statuses.map((s) => <button key={s} className={`chip chip-btn ${status === s ? 'on' : ''}`} onClick={() => set({ status: status === s ? null : s })}>{s}</button>)}
        </div>
      )}

      <p className="pj-count" aria-live="polite">{shown.length} of {allProjects.length} projects{filtered && <> · <button className="pj-reset" onClick={() => setParams({}, { replace: true })}>clear filters</button></>}</p>

      {shown.length === 0 ? (
        <p className="muted">Nothing matches. Try another word or <button className="pj-reset" onClick={() => setParams({}, { replace: true })}>clear the filters</button>.</p>
      ) : (
        <div className={view === 'list' ? 'pj-list' : 'cards pj-grid'}>
          {shown.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.05} className={view === 'grid' && p.featured && sort === 'featured' && !filtered ? 'wide' : ''}>
              <ProjectCard p={p} stats={stats[repoOf(p.url) ?? '']} wide={view === 'grid' && p.featured && sort === 'featured' && !filtered} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
