import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, FileText, FolderGit2, Newspaper, Paperclip, X } from 'lucide-react';
import { formatDate, posts, site } from '../lib/content';
import { allPubs } from '../lib/publications';
import { allProjects } from '../lib/projects';
import { glow, Reveal } from './Reveal';
import '../styles/research.css';

/* Every research interest is a regular card. Open one and it becomes a case file: the work that backs it up is listed as exhibits that
   are declassified as the file opens, with red string to the files that share evidence. All of it is worked out from the site's own content. */

interface Exhibit { id: string; kind: 'paper' | 'project' | 'post'; label: string; to: string; meta: string }
const STOP = new Set(['and', 'the', 'with', 'for', 'btw', 'use', 'that', 'from']);
// a word of five letters or more matches by its first five (adaptive finds adaptation); shorter words must match whole, so "arch" never finds "archives"
const matcher = (w: string) => (w.length >= 5 ? new RegExp(`\\b${w.slice(0, 5)}`) : new RegExp(`\\b${w}\\b`));

// A card is named by any part of its title ("trustworthy", "linux internals"), so reordering, adding or removing cards never moves an exhibit to the wrong one.
const listed = (cards: string | undefined, title: string) => {
  const t = title.toLowerCase();
  return (cards ?? '').split(',').map((x) => x.trim().toLowerCase()).some((x) => x.length >= 3 && t.includes(x));
};

/** Papers and projects say which cards they belong under (the "Research cards" field); posts are matched by their words, needing two. */
function exhibitsFor(interest: string): Exhibit[] {
  const out: Exhibit[] = [];
  for (const p of allPubs) if (listed(p.cards, interest)) out.push({ id: `pub:${p.slug}`, kind: 'paper', label: p.title, to: `/publications/${p.slug}`, meta: `${p.status} · ${p.year}` });
  for (const p of allProjects) if (listed(p.cards, interest)) out.push({ id: `proj:${p.slug}`, kind: 'project', label: p.name, to: `/projects/${p.slug}`, meta: p.status ?? p.langs.slice(0, 2).join(' · ') });
  const tokens = [...new Set(interest.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w)))].map(matcher);
  for (const p of posts) {
    const hay = `${p.title} ${p.summary} ${p.tags.join(' ')}`.toLowerCase();
    if (tokens.filter((t) => t.test(hay)).length >= 2) out.push({ id: `post:${p.slug}`, kind: 'post', label: p.title, to: `/blog/${p.slug}`, meta: formatDate(p.date) });
  }
  return out;
}

const ICON = { paper: FileText, project: FolderGit2, post: Newspaper } as const;
const hash = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const LETTER = 'ABCDEFGH';

interface File { title: string; ex: Exhibit[] }

function Dossier({ files, at, onGo, onClose, extra }: { files: File[]; at: number; onGo: (i: number) => void; onClose: () => void; extra?: (title: string) => ReactNode }) {
  const f = files[at];
  const box = useRef<HTMLElement>(null);
  const shown = f.ex.slice(0, 4);
  const ids = new Set(shown.map((e) => e.id));
  const refs = files.map((o, i) => ({ o, i })).filter(({ o, i }) => i !== at && o.ex.slice(0, 4).some((e) => ids.has(e.id)));

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.focus();
    document.documentElement.classList.add('nf-lock');
    return () => { document.documentElement.classList.remove('nf-lock'); prev?.focus?.(); };
  }, []);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onGo((at + 1) % files.length);
      else if (e.key === 'ArrowLeft') onGo((at - 1 + files.length) % files.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [at, files.length, onClose, onGo]);

  return createPortal(
    <div className="dossier-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <article key={at} ref={box} tabIndex={-1} className="case dossier" role="dialog" aria-modal="true" aria-label={`File ${at + 1}: ${f.title}`} style={{ ['--tilt' as string]: `${((hash(f.title) % 21) - 10) / 10}deg` }}>
        <i className="case-tape" aria-hidden="true" />
        <header className="case-top">
          <span className="case-no"><Paperclip size={13} /> FILE {String(at + 1).padStart(2, '0')} / {String(files.length).padStart(2, '0')}</span>
          <span className="case-status">{shown.length ? 'OPEN' : 'COLD'}</span>
          <button className="dossier-x" onClick={onClose} aria-label="Close file"><X size={16} /></button>
        </header>
        <h3>{f.title}</h3>
        {extra?.(f.title)}
        <div className="case-line">
          <p className="case-by">Filed by {site.name.split(' ').slice(0, 1)} · {String(site.location || '').split(',')[0] || 'Hyderabad'}</p>
          <span className="case-stamp" aria-hidden="true">{shown.length ? 'DECLASSIFIED' : 'PENDING'}</span>
        </div>

        {shown.length > 0 ? (
          <ol className="case-ex" aria-label="Exhibits">
            {shown.map((e, i) => {
              const Icon = ICON[e.kind];
              return (
                <li key={e.id} style={{ ['--i' as string]: i }}>
                  <Link to={e.to} onClick={onClose}>
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
          <p className="case-empty">No exhibits filed yet. This line of inquiry is still open.</p>
        )}
        {f.ex.length > shown.length && <p className="case-sealed">{f.ex.length - shown.length} more {f.ex.length - shown.length === 1 ? 'exhibit is' : 'exhibits are'} sealed.</p>}

        {refs.length > 0 && (
          <section className="case-xref" aria-label="Cross-references">
            <h4>Cross-references</h4>
            <div>
              {refs.map(({ o, i }) => (
                <button key={o.title} onClick={() => onGo(i)}><i aria-hidden="true" />{o.title}<em>FILE {String(i + 1).padStart(2, '0')}</em></button>
              ))}
            </div>
          </section>
        )}

        <footer className="case-foot">
          <button onClick={() => onGo((at - 1 + files.length) % files.length)} aria-label="Previous file"><ArrowLeft size={14} /> Prev</button>
          <span>{f.ex.length} {f.ex.length === 1 ? 'exhibit' : 'exhibits'} on file · REF-{hash(f.title) % 9000 + 1000}</span>
          <button onClick={() => onGo((at + 1) % files.length)} aria-label="Next file">Next <ArrowRight size={14} /></button>
        </footer>
        <i className="case-scan" aria-hidden="true" />
      </article>
    </div>,
    document.body,
  );
}

/** The research cards as they were; opening one pulls out its case file. */
export function ResearchBoard({ extra }: { extra?: (title: string) => ReactNode }) {
  const interests = site.interests as string[];
  const files = useMemo<File[]>(() => interests.map((t) => ({ title: t, ex: exhibitsFor(t) })), [interests]);
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const key = (i: number) => (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(i); } };
  return (
    <>
      <div className="bento">
        {files.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.06} className={`bento-cell ${i === 0 || i === 3 ? 'wide' : ''}`}>
            <div className="glow bento-card" onPointerMove={glow} role="button" tabIndex={0} onClick={() => setOpen(i)} onKeyDown={key(i)} aria-haspopup="dialog" aria-label={`Open file: ${f.title}`}>
              <span className="bento-n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{f.title}</h3>
              <span className="bento-arrow" aria-hidden="true"><ArrowUpRight size={18} strokeWidth={2.6} /></span>
            </div>
            {extra?.(f.title)}
          </Reveal>
        ))}
      </div>
      {open !== null && <Dossier files={files} at={open} onGo={setOpen} onClose={close} extra={extra ? (t) => <span className="dossier-extra">{extra(t)}</span> : undefined} />}
    </>
  );
}
