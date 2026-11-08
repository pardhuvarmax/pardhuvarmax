import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Copy, GitFork, Star } from 'lucide-react';
import { formatDate, safeHref, site } from '../lib/content';
import { renderMarkdown } from '../lib/markdown';
import { ago, allProjects, findProject, relatedFor, repoOf, useGithubStats } from '../lib/projects';
import { LangBar, Sparkline } from './ProjectsView';
import '../styles/projects.css';

function QuickStart({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="pj-qs">
      <div className="pj-qs-bar">
        <span>Quick start</span>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setDone(true);
              setTimeout(() => setDone(false), 1600);
            } catch {
              /* clipboard not available: the text is still selectable */
            }
          }}
          aria-label="Copy commands"
        >
          {done ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>
      </div>
      <pre><code>{text}</code></pre>
    </div>
  );
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const p = findProject(slug);
  const stats = useGithubStats();
  const rendered = useMemo(() => (p?.body?.trim() ? renderMarkdown(p.body) : null), [p]);

  useEffect(() => {
    document.title = p ? `${p.name} | ${site.name}` : `Not found | ${site.name}`;
    window.scrollTo(0, 0);
  }, [p]);

  if (!p) {
    return (
      <main className="wrap page">
        <h1>Project not found</h1>
        <p className="muted">It may have been renamed or removed.</p>
        <Link className="link-arrow" to="/projects"><ArrowLeft size={15} /> All projects</Link>
      </main>
    );
  }

  const st = stats[repoOf(p.url) ?? ''];
  const rel = relatedFor(p);
  const idx = allProjects.indexOf(p);
  const prev = allProjects[idx - 1];
  const next = allProjects[idx + 1];
  const hasRelated = rel.posts.length + rel.pubs.length + rel.projects.length > 0;

  return (
    <main className="wrap page post pj-page">
      <Link className="link-arrow back" to="/projects"><ArrowLeft size={15} /> All projects</Link>

      <header className="post-head">
        <div className="chips">
          {p.status && <span className={`pj-status s-${p.status.toLowerCase()}`}>{p.status}</span>}
          {p.featured && <span className="pj-star">Featured</span>}
          {p.langs.map((l) => <span key={l} className="chip">{l}</span>)}
        </div>
        <h1>{p.name}</h1>
        <p className="sec-lede">{p.description}</p>
        <div className="pj-actions">
          <a className="btn btn-primary" href={safeHref(p.url)} target="_blank" rel="noopener noreferrer">Repository <ArrowUpRight size={16} /></a>
          {(p.links ?? []).filter((l) => l.href).map((l) => (
            <a key={l.href} className="btn" href={safeHref(l.href)} target={/^https?:/i.test(l.href) ? '_blank' : undefined} rel="noopener noreferrer">{l.label} <ArrowUpRight size={16} /></a>
          ))}
        </div>
      </header>

      {p.cover && <img className="post-hero" src={safeHref(p.cover)} alt="" />}

      <div className="pj-body">
        <div className="pj-main">
          {p.install?.trim() && <QuickStart text={p.install.trim()} />}
          {rendered ? (
            <article className="prose" dangerouslySetInnerHTML={{ __html: rendered.html }} />
          ) : (
            <p className="muted">A full write-up is on the way. The repository has the details in the meantime.</p>
          )}
        </div>

        <aside className="pj-side" aria-label="Project facts">
          {st ? (
            <>
              <h2>On GitHub</h2>
              <div className="pj-nums">
                <span><Star size={15} /> <b>{st.stars}</b> stars</span>
                <span><GitFork size={15} /> <b>{st.forks}</b> forks</span>
                <span><b>{st.issues}</b> open issues</span>
              </div>
              <LangBar langs={st.languages} legend />
              {st.weeks.some(Boolean) && (
                <div className="pj-pulse">
                  <h3>Commits, last 52 weeks</h3>
                  <Sparkline weeks={st.weeks} height={44} />
                  <small>{st.weeks.reduce((a, b) => a + b, 0)} commits · last push {ago(st.pushed)}</small>
                </div>
              )}
            </>
          ) : (
            <>
              <h2>Details</h2>
              <p className="muted">Live repository numbers appear here once the site has been built with GitHub access.</p>
            </>
          )}
          {p.date && <p className="pj-date">Dated {formatDate(p.date)}</p>}
        </aside>
      </div>

      {hasRelated && (
        <section className="pj-related">
          <h2>Related</h2>
          <div className="pj-rel-grid">
            {rel.posts.length > 0 && (
              <div>
                <h3>Writing</h3>
                <ul>{rel.posts.map((x) => <li key={x.slug}><Link to={`/blog/${x.slug}`}>{x.title}</Link><span>{formatDate(x.date)}</span></li>)}</ul>
              </div>
            )}
            {rel.pubs.length > 0 && (
              <div>
                <h3>Publications</h3>
                <ul>{rel.pubs.map((x) => <li key={x.url}><a href={safeHref(x.url)} target="_blank" rel="noopener noreferrer">{x.title}</a><span>{x.venue}</span></li>)}</ul>
              </div>
            )}
            {rel.projects.length > 0 && (
              <div>
                <h3>Similar projects</h3>
                <ul>{rel.projects.map((x) => <li key={x.slug}><Link to={`/projects/${x.slug}`}>{x.name}</Link><span>{x.langs.slice(0, 3).join(' · ')}</span></li>)}</ul>
              </div>
            )}
          </div>
        </section>
      )}

      <nav className="post-nav" aria-label="More projects">
        {prev ? <Link to={`/projects/${prev.slug}`}><span>Previous</span>{prev.name}</Link> : <i />}
        {next ? <Link to={`/projects/${next.slug}`} className="r"><span>Next</span>{next.name}</Link> : <i />}
      </nav>
    </main>
  );
}
