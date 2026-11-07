import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { allTags, formatDate, posts, site } from '../lib/content';
import { glow, Reveal } from './Reveal';

export default function Blog() {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Writing | ${site.name}`;
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter(
      (p) => (!tag || p.tags.includes(tag)) && (!needle || `${p.title} ${p.summary} ${p.tags.join(' ')}`.toLowerCase().includes(needle)),
    );
  }, [q, tag]);

  return (
    <main className="wrap page">
      <Reveal className="page-head">
        <span className="kicker">Writing</span>
        <h1>Notes &amp; <em>essays</em></h1>
        <p className="sec-lede">Working notes on systems security, high-performance computing and the reliability of learned systems.</p>
      </Reveal>

      <div className="filters">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts" aria-label="Search posts" />
        </label>
        <div className="chips" role="group" aria-label="Filter by tag">
          <button className={`chip chip-btn ${tag === null ? 'on' : ''}`} onClick={() => setTag(null)}>All</button>
          {allTags.map((t) => (
            <button key={t} className={`chip chip-btn ${tag === t ? 'on' : ''}`} onClick={() => setTag(tag === t ? null : t)}>{t}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="muted empty">No posts match.</p>
      ) : (
        <div className="posts posts-list">
          {shown.map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i, 4) * 0.05}>
              <Link to={`/blog/${p.slug}`} className="post-card glow" onPointerMove={glow}>
                {p.cover && <img className="post-cover" src={p.cover} alt="" loading="lazy" />}
                <div className="post-meta">{formatDate(p.date)} · {p.minutes} min read</div>
                <h3>{p.title}</h3>
                <p>{p.summary}</p>
                <div className="chips">{p.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </main>
  );
}
