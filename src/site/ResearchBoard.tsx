import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'motion/react';
import { FileText, FolderGit2, Newspaper, Paperclip } from 'lucide-react';
import { formatDate, posts, site } from '../lib/content';
import { allPubs } from '../lib/publications';
import { allProjects } from '../lib/projects';
import '../styles/research.css';

/* An investigation board: every research interest is a case file, the work that backs it up is listed as exhibits (blacked out until you
   look closer), and red string joins the files that share evidence. Everything is worked out from the site's own content. */

interface Exhibit { id: string; kind: 'paper' | 'project' | 'post'; label: string; to: string; meta: string }
const STOP = new Set(['and', 'the', 'with', 'for', 'btw', 'use', 'that', 'from']);
// a word of five letters or more matches by its first five (adaptive finds adaptation); shorter words must match whole, so "arch" never finds "archives"
const matcher = (w: string) => (w.length >= 5 ? new RegExp(`\\b${w.slice(0, 5)}`) : new RegExp(`\\b${w}\\b`));

function exhibitsFor(interest: string): Exhibit[] {
  const tokens = [...new Set(interest.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w)))].map(matcher);
  if (!tokens.length) return [];
  const score = (hay: string) => tokens.filter((t) => t.test(hay)).length;
  const out: (Exhibit & { s: number })[] = [];
  for (const p of allPubs) {
    const s = score(`${p.title} ${p.tagList.join(' ')} ${p.abstract ?? ''}`.toLowerCase());
    if (s) out.push({ id: `pub:${p.slug}`, kind: 'paper', label: p.title, to: `/publications/${p.slug}`, meta: `${p.status} · ${p.year}`, s: s + 0.3 });
  }
  for (const p of allProjects) {
    const s = score(`${p.name} ${p.description} ${p.tagList.join(' ')}`.toLowerCase());
    if (s) out.push({ id: `proj:${p.slug}`, kind: 'project', label: p.name, to: `/projects/${p.slug}`, meta: p.status ?? p.langs.slice(0, 2).join(' · '), s });
  }
  for (const p of posts) {
    const s = score(`${p.title} ${p.summary} ${p.tags.join(' ')}`.toLowerCase());
    if (s) out.push({ id: `post:${p.slug}`, kind: 'post', label: p.title, to: `/blog/${p.slug}`, meta: formatDate(p.date), s: s - 0.2 });
  }
  return out.sort((a, b) => b.s - a.s).map(({ s: _s, ...e }) => e);
}

const ICON = { paper: FileText, project: FolderGit2, post: Newspaper } as const;
const hash = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const LETTER = 'ABCDEFGH';

function CaseFile({ n, title, ex, active, dim, onHover, cardRef, extra }: { n: number; title: string; ex: Exhibit[]; active: boolean; dim: boolean; onHover: (on: boolean) => void; cardRef: (el: HTMLElement | null) => void; extra?: ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const tilt = ((hash(title) % 21) - 10) / 10; // between -1 and 1 degrees, like papers pinned by hand
  const shown = ex.slice(0, 4);
  return (
    <article
      ref={(el) => { ref.current = el; cardRef(el); }}
      className={`case ${seen ? 'seen' : ''} ${active ? 'active' : ''} ${dim ? 'dim' : ''} ${n === 1 ? 'wide' : ''}`}
      style={{ ['--tilt' as string]: `${tilt}deg` }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
    >
      <i className="case-tape" aria-hidden="true" />
      <header className="case-top">
        <span className="case-no"><Paperclip size={13} /> FILE {String(n).padStart(2, '0')}</span>
        <span className="case-status">{shown.length ? 'OPEN' : 'COLD'}</span>
      </header>
      <h3>{title}</h3>
      {extra}
      <div className="case-line">
        <p className="case-by">Filed by {site.name.split(' ').slice(0, 1)} · {String(site.location || '').split(',')[0] || 'Hyderabad'}</p>
        <span className="case-stamp" aria-hidden="true">{shown.length ? 'DECLASSIFIED' : 'PENDING'}</span>
      </div>
      {shown.length > 0 ? (
        <ol className="case-ex" aria-label="Exhibits">
          {shown.map((e, i) => {
            const Icon = ICON[e.kind];
            return (
              <li key={e.id}>
                <Link to={e.to}>
                  <b>EXH. {LETTER[i]}</b>
                  <Icon size={14} />
                  <span className="redact"><span>{e.label}</span></span>
                  <em>{e.meta}</em>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="case-empty">No exhibits filed yet.</p>
      )}
      <footer className="case-foot">
        <span>{ex.length} {ex.length === 1 ? 'exhibit' : 'exhibits'} on file{ex.length > shown.length ? `, ${ex.length - shown.length} sealed` : ''}</span>
        <span className="case-ref">REF-{(hash(title) % 9000 + 1000)}</span>
      </footer>
      <i className="case-scan" aria-hidden="true" />
    </article>
  );
}

export function ResearchBoard({ extra }: { extra?: (title: string) => ReactNode }) {
  const interests = site.interests as string[];
  const files = useMemo(() => interests.map((t) => ({ title: t, ex: exhibitsFor(t) })), [interests]);
  const boardRef = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [pins, setPins] = useState<{ x: number; y: number }[]>([]);

  // which files share an exhibit: those get a piece of string between them
  const links = useMemo(() => {
    const out: [number, number][] = [];
    for (let a = 0; a < files.length; a++) for (let b = a + 1; b < files.length; b++) {
      const ids = new Set(files[a].ex.slice(0, 4).map((e) => e.id));
      if (files[b].ex.slice(0, 4).some((e) => ids.has(e.id))) out.push([a, b]);
    }
    return out;
  }, [files]);

  const measure = () => {
    const box = boardRef.current?.getBoundingClientRect();
    if (!box) return;
    setPins(cards.current.map((el) => {
      const r = el?.getBoundingClientRect();
      return r ? { x: r.left - box.left + r.width / 2, y: r.top - box.top + 14 } : { x: 0, y: 0 };
    }));
  };
  useLayoutEffect(measure, [files]);
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (boardRef.current) ro.observe(boardRef.current);
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 900); // after the cards have slid into place
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); clearTimeout(t); };
  }, []);

  const connected = (i: number) => (hover === null ? false : links.some(([a, b]) => (a === hover && b === i) || (b === hover && a === i)));
  return (
    <div className="board" ref={boardRef}>
      <svg className="board-strings" aria-hidden="true">
        {pins.length === files.length && links.map(([a, b]) => {
          const p = pins[a], q = pins[b];
          const sag = Math.max(p.y, q.y) + 46 + Math.abs(p.x - q.x) * 0.08;
          const live = hover === a || hover === b;
          return <path key={`${a}-${b}`} className={`string ${live ? 'live' : ''}`} pathLength={1} d={`M${p.x} ${p.y} Q ${(p.x + q.x) / 2} ${sag} ${q.x} ${q.y}`} />;
        })}
        {pins.length === files.length && pins.map((p, i) => <circle key={i} className={`pin ${hover === i ? 'live' : ''}`} cx={p.x} cy={p.y} r={5} />)}
      </svg>
      <div className="board-grid">
        {files.map((f, i) => (
          <CaseFile key={f.title} n={i + 1} title={f.title} ex={f.ex} active={hover === i} dim={hover !== null && hover !== i && !connected(i)} onHover={(on) => setHover(on ? i : null)} cardRef={(el) => { cards.current[i] = el; }} extra={extra?.(f.title)} />
        ))}
      </div>
    </div>
  );
}

/** The research statement set as a newspaper briefing: byline, dateline, two columns and a drop cap. */
export function Briefing() {
  const paras = site.researchStatement as string[];
  const today = formatDate(new Date().toISOString().slice(0, 10));
  return (
    <article className="briefing">
      <header>
        <span className="brief-kicker">BRIEFING · RESEARCH DESK</span>
        <span className="brief-date">{today}</span>
      </header>
      <h3>The case so far</h3>
      <p className="brief-by">By {site.name} · {String(site.location || '').split(',')[0] || 'Hyderabad'}</p>
      <div className="brief-body">
        {paras.slice(1).map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </article>
  );
}
