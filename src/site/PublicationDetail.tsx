import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Copy, FileText, Share2 } from 'lucide-react';
import { formatDate, safeHref, site } from '../lib/content';
import { allPubs, bibKey, copyText, findPub, inText, relatedFor } from '../lib/publications';
import { CitePanel, Cover } from './PublicationsView';
import '../styles/pubs.css';

const STAGES = ['Draft', 'Preprint', 'Peer review', 'Published'];
const stageOf = (status: string) => (/preprint/i.test(status) ? 1 : /prep|draft/i.test(status) ? 0 : /review/i.test(status) ? 2 : /publish/i.test(status) ? 3 : 1);

/** The cover as an engraved foil plate: it tilts towards the cursor, the artwork turns to bevelled metal with a faint iridescence, and a glint slides across it. */
function Holo({ children, image }: { children: ReactNode; image?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = box.current;
    if (!el || reduce) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.classList.add('live');
    const set = (k: string, v: string) => el.style.setProperty(k, v);
    set('--mx', `${(x * 100).toFixed(1)}%`);
    set('--my', `${(y * 100).toFixed(1)}%`);
    set('--rx', `${((0.5 - y) * 20).toFixed(2)}deg`);
    set('--ry', `${((x - 0.5) * 24).toFixed(2)}deg`);
    set('--lx', `${((x - 0.5) * 3).toFixed(2)}px`);
    set('--ly', `${((y - 0.5) * 3).toFixed(2)}px`);
    set('--sx', `${((0.5 - x) * 26).toFixed(1)}px`);
    set('--sy', `${((y - 0.5) * 26 + 14).toFixed(1)}px`);
    set('--o', '1');
  };
  const leave = () => {
    const el = box.current;
    if (!el) return;
    el.classList.remove('live');
    for (const k of ['--rx', '--ry', '--o', '--lx', '--ly']) el.style.removeProperty(k);
    el.style.setProperty('--sx', '0px');
    el.style.setProperty('--sy', '14px');
  };
  return (
    <div className={`holo ${image ? 'has-img' : ''}`} style={image ? ({ '--cover': `url("${safeHref(image)}")` } as CSSProperties) : undefined} ref={box} onPointerMove={move} onPointerLeave={leave} onPointerCancel={leave}>
      <div className="holo-in">
        {children}
        <i className="holo-foil" aria-hidden="true" />
        <i className="holo-spark" aria-hidden="true" />
        <i className="holo-glare" aria-hidden="true" />
      </div>
    </div>
  );
}

/** One paper on its own page: cover, where it stands, abstract, every way to cite it, and what belongs with it. */
export default function PublicationDetail() {
  const { slug } = useParams();
  const p = findPub(slug ?? '');
  const [done, setDone] = useState('');

  useEffect(() => {
    document.title = p ? `${p.title} | ${site.name}` : `Not found | ${site.name}`;
    if (location.hash === '#news') setTimeout(() => document.getElementById('news')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    else window.scrollTo(0, 0);
  }, [p]);

  if (!p) {
    return (
      <main className="wrap page">
        <h1>Paper not found</h1>
        <p className="muted">It may have been renamed or removed.</p>
        <Link className="link-arrow" to="/publications"><ArrowLeft size={15} /> All publications</Link>
      </main>
    );
  }

  const at = stageOf(p.status);
  const idx = allPubs.indexOf(p);
  const prev = allPubs[idx - 1];
  const next = allPubs[idx + 1];
  const rel = relatedFor(p);
  const here = () => `${location.origin}/publications/${p.slug}`;
  const copy = (k: string, text: string) => copyText(text).then((ok) => { if (ok) { setDone(k); setTimeout(() => setDone(''), 1500); } });
  const share = () => {
    if (navigator.share) navigator.share({ title: p.title, url: here() }).catch(() => undefined);
    else copy('share', here());
  };

  return (
    <main className="wrap page pubd">
      <Link className="link-arrow back" to="/publications"><ArrowLeft size={15} /> All publications</Link>

      <div className="pubd-grid">
        <aside className="pubd-side" aria-label="At a glance">
          <Holo image={p.cover}><Cover p={p} /></Holo>
          <dl>
            <div><dt>Status</dt><dd>{p.status}</dd></div>
            <div><dt>Year</dt><dd>{p.year}</dd></div>
            <div><dt>Where</dt><dd>{p.venue.replace(/,?\s*\d{4}\s*$/, '')}</dd></div>
            {p.doi && <div><dt>{p.doiLabel}</dt><dd><a href={safeHref(p.doiUrl!)} target="_blank" rel="noopener noreferrer">{p.doi}</a></dd></div>}
            {p.arxiv && <div><dt>arXiv</dt><dd>{p.arxiv}</dd></div>}
            <div><dt>Cite key</dt><dd className="mono">{bibKey(p)}</dd></div>
          </dl>
        </aside>

        <article className="pubd-main">
          <span className={`tag ${p.status === 'Preprint' ? 'tag-ok' : ''}`}>{p.status}</span>
          <h1>{p.title}</h1>
          <p className="pubd-authors">{p.authors}</p>

          <ol className="pubd-stages" aria-label={`Stage ${at + 1} of ${STAGES.length}: ${STAGES[at]}`}>
            {STAGES.map((n, k) => <li key={n} className={k < at ? 'done' : k === at ? 'now' : ''}><i />{n}</li>)}
          </ol>

          <div className="pub-actions">
            <a className="btn btn-primary" href={safeHref(p.url)} target="_blank" rel="noopener noreferrer">{p.linkLabel} <ArrowUpRight size={16} /></a>
            {p.pdfUrl && <a className="pub-pill" href={safeHref(p.pdfUrl)} target="_blank" rel="noopener noreferrer"><FileText size={14} /> PDF</a>}
            {p.doiUrl && <a className="pub-pill" href={safeHref(p.doiUrl)} target="_blank" rel="noopener noreferrer">{p.doiLabel}</a>}
            {p.codeUrl && <a className="pub-pill" href={safeHref(p.codeUrl)} target="_blank" rel="noopener noreferrer">Code</a>}
            <span className="pub-spacer" />
            <button className="pub-pill" onClick={share}>{done === 'share' ? <><Check size={14} /> Link copied</> : <><Share2 size={14} /> Share</>}</button>
          </div>

          {p.newsList.length > 0 && (
            <section className="pubd-sec" id="news">
              <h2>News</h2>
              <ol className="pubd-news">
                {p.newsList.map((n, i) => (
                  <li key={n.date + n.text} className={i === 0 ? 'latest' : ''}>
                    <time>{formatDate(n.date)}</time>
                    <p>{n.text}{n.link && <> <a href={safeHref(n.link)} target="_blank" rel="noopener noreferrer">{n.linkLabel || 'Link'} <ArrowUpRight size={13} /></a></>}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {p.abstract && (
            <section className="pubd-sec">
              <h2>Abstract</h2>
              <p className="pubd-abstract">{p.abstract}</p>
            </section>
          )}

          <section className="pubd-sec">
            <h2>Cite this</h2>
            <CitePanel p={p} />
            <div className="pubd-quick">
              <span>Quick copy</span>
              <button className="pub-pill" onClick={() => copy('in', inText(p))}>{done === 'in' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> {inText(p)}</>}</button>
              <button className="pub-pill" onClick={() => copy('key', `\\cite{${bibKey(p)}}`)}>{done === 'key' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> {`\\cite{${bibKey(p)}}`}</>}</button>
              <button className="pub-pill" onClick={() => copy('link', here())}>{done === 'link' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Link</>}</button>
            </div>
          </section>

          {(rel.projects.length > 0 || rel.posts.length > 0) && (
            <section className="pubd-sec">
              <h2>Goes with</h2>
              <ul className="pubd-rel">
                {rel.projects.map((x) => <li key={x.slug}><span>Project</span><Link to={`/projects/${x.slug}`}>{x.name}</Link></li>)}
                {rel.posts.map((x) => <li key={x.slug}><span>Writing</span><Link to={`/blog/${x.slug}`}>{x.title}</Link><em>{formatDate(x.date)}</em></li>)}
              </ul>
            </section>
          )}
        </article>
      </div>

      <nav className="post-nav" aria-label="More papers">
        {prev ? <Link to={`/publications/${prev.slug}`}><span>Previous</span>{prev.title}</Link> : <i />}
        {next ? <Link to={`/publications/${next.slug}`} className="r"><span>Next</span>{next.title}</Link> : <i />}
      </nav>
    </main>
  );
}
