import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Copy, FileText, FolderGit2, Home, Moon, Music, Search, Sun, ExternalLink } from 'lucide-react';
import { posts, safeHref, site } from '../lib/content';
import { allProjects } from '../lib/projects';
import { allBibtex, allPubs, bibtex, copyText } from '../lib/publications';
import { albums, player } from '../lib/player';
import '../styles/palette.css';

export const openPalette = () => window.dispatchEvent(new Event('palette:open'));

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: JSX.Element;
  run: () => void;
}

const PAGES: { to: string; label: string; kw: string }[] = [
  { to: '/', label: 'Home', kw: 'main start' },
  { to: '/me', label: 'Me', kw: 'about bio' },
  { to: '/research', label: 'Research', kw: 'interests statement' },
  { to: '/publications', label: 'Publications', kw: 'papers preprints arxiv' },
  { to: '/projects', label: 'Projects & Work', kw: 'code github repositories projects' },
  { to: '/blog', label: 'Writing', kw: 'blog posts essays notes' },
  { to: '/cassette', label: 'Cassette', kw: 'music songs tapes' },
  { to: '/#contact', label: 'Contact', kw: 'email reach hire' },
];

export default function CommandPalette({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [toast, setToast] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  // Ctrl/Cmd+K anywhere; "/" too, except on Projects and Publications where it focuses that page's search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && pathname !== '/projects' && pathname !== '/publications') {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('palette:open', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('palette:open', onOpen);
    };
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 1600);
  };

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => navigate(to);
    const out: Item[] = [];
    for (const p of PAGES) out.push({ id: `page:${p.to}`, group: 'Pages', label: p.label, hint: p.to === '/' ? 'Main page' : p.to.replace('/#', '#'), keywords: `go open ${p.kw}`, icon: p.to === '/' ? <Home size={16} /> : <ArrowRight size={16} />, run: go(p.to) });
    for (const p of allProjects) out.push({ id: `proj:${p.slug}`, group: 'Projects', label: p.name, hint: p.langs.slice(0, 3).join(' · '), keywords: `project open ${p.description} ${p.tagList.join(' ')} ${p.status ?? ''}`, icon: <FolderGit2 size={16} />, run: go(`/projects/${p.slug}`) });
    for (const p of allPubs) {
      out.push({ id: `pub:${p.slug}`, group: 'Publications', label: p.title, hint: `${p.status} · ${p.year}`, keywords: `paper publication preprint read ${p.authors} ${p.tagList.join(' ')} ${p.venue}`, icon: <FileText size={16} />, run: go(`/publications/${p.slug}`) });
      out.push({ id: `bib:${p.slug}`, group: 'Publications', label: `Copy BibTeX: ${p.title}`, hint: 'Citation', keywords: `cite citation bibtex reference copy ${p.authors}`, icon: <Copy size={16} />, run: () => { copyText(bibtex(p)).then((ok) => flash(ok ? 'BibTeX copied' : 'Could not copy')); } });
    }
    out.push({ id: 'act:bib', group: 'Actions', label: 'Copy BibTeX for all papers', hint: 'Citations', keywords: 'cite citation bibtex references export publications all copy', icon: <Copy size={16} />, run: () => { copyText(allBibtex()).then((ok) => flash(ok ? 'BibTeX copied' : 'Could not copy')); } });
    for (const p of posts) out.push({ id: `post:${p.slug}`, group: 'Writing', label: p.title, hint: 'Post', keywords: `post blog read ${p.tags.join(' ')} ${p.summary}`, icon: <FileText size={16} />, run: go(`/blog/${p.slug}`) });
    albums.forEach((al, a) =>
      al.tracks.forEach((t, i) =>
        out.push({ id: `song:${a}:${i}`, group: 'Songs', label: `Play ${t.title}`, hint: t.artist || al.artist, keywords: `song music listen cassette ${al.title}`, icon: <Music size={16} />, run: () => player.playTrack(a, i) }),
      ),
    );
    out.push({ id: 'act:theme', group: 'Actions', label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', hint: 'Theme', keywords: 'theme dark light mode colours paper', icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />, run: toggleTheme });
    out.push({ id: 'act:email', group: 'Actions', label: 'Copy email address', hint: site.email, keywords: 'email mail contact copy', icon: <Copy size={16} />, run: () => { navigator.clipboard?.writeText(site.email).then(() => flash('Email copied'), () => flash(site.email)); } });
    for (const l of site.links as { label: string; href: string }[]) out.push({ id: `link:${l.label}`, group: 'Actions', label: `Open ${l.label}`, hint: 'External link', keywords: `link profile ${l.href}`, icon: <ExternalLink size={16} />, run: () => window.open(safeHref(l.href), '_blank', 'noopener,noreferrer') });
    return out;
  }, [navigate, theme, toggleTheme]);

  const results = useMemo(() => {
    const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return items.filter((i) => i.group !== 'Songs' || i.id.endsWith(':0')).slice(0, 40);
    return items
      .map((it, order) => {
        const label = it.label.toLowerCase();
        const hay = `${label} ${(it.hint ?? '').toLowerCase()} ${(it.keywords ?? '').toLowerCase()} ${it.group.toLowerCase()}`;
        if (!tokens.every((t) => hay.includes(t))) return null;
        const score = tokens.reduce((s, t) => s + (label.startsWith(t) ? 0 : label.includes(` ${t}`) ? 1 : label.includes(t) ? 2 : 4), 0);
        return { it, score, order };
      })
      .filter((x): x is { it: Item; score: number; order: number } => !!x)
      .sort((a, b) => a.score - b.score || a.order - b.order)
      .slice(0, 40)
      .map((x) => x.it);
  }, [items, q]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel, results]);

  const run = (it?: Item) => {
    if (!it) return;
    setOpen(false);
    it.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[sel]); }
  };

  return (
    <>
      {open && (
        <div className="pal-back" onMouseDown={() => setOpen(false)}>
          <div className="pal" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
            <label className="pal-in">
              <Search size={18} />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Go to a page, open a project, play a song..." aria-label="Search" aria-controls="pal-list" aria-activedescendant={results[sel] ? `pal-${results[sel].id}` : undefined} role="combobox" aria-expanded="true" autoComplete="off" spellCheck={false} />
              <kbd>Esc</kbd>
            </label>
            <ul id="pal-list" ref={list} role="listbox" className="pal-list">
              {results.length === 0 && <li className="pal-empty">Nothing matches. Try &ldquo;play friends&rdquo;, &ldquo;theme&rdquo;, &ldquo;projects&rdquo; or &ldquo;email&rdquo;.</li>}
              {results.map((it, i) => (
                <li key={it.id} id={`pal-${it.id}`} role="option" aria-selected={i === sel} className={i === sel ? 'on' : ''} onMouseMove={() => setSel(i)} onClick={() => run(it)}>
                  <span className="pal-ic">{it.icon}</span>
                  <span className="pal-lb">{it.label}</span>
                  {it.hint && <span className="pal-ht">{it.hint}</span>}
                  <span className="pal-gr">{it.group}</span>
                </li>
              ))}
            </ul>
            <div className="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> run</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> toggle</span></div>
          </div>
        </div>
      )}
      {toast && <div className="pal-toast" role="status">{toast}</div>}
    </>
  );
}
