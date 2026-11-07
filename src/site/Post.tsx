import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDate, posts, site } from '../lib/content';
import { renderMarkdown } from '../lib/markdown';

export default function Post() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);
  const rendered = useMemo(() => (post ? renderMarkdown(post.body) : null), [post]);

  useEffect(() => {
    document.title = post ? `${post.title} | ${site.name}` : `Not found | ${site.name}`;
  }, [post]);

  if (!post || !rendered) {
    return (
      <main className="wrap page">
        <h1>Post not found</h1>
        <p className="muted">It may have been moved or unpublished.</p>
        <Link className="link-arrow" to="/blog"><ArrowLeft size={15} /> Back to writing</Link>
      </main>
    );
  }

  const idx = posts.indexOf(post);
  const next = posts[idx + 1];
  const prev = posts[idx - 1];

  return (
    <main className="wrap page post">
      <Link className="link-arrow back" to="/blog"><ArrowLeft size={15} /> All posts</Link>
      <header className="post-head">
        <div className="chips">{post.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        <h1>{post.title}</h1>
        <p className="sec-lede">{post.summary}</p>
        <div className="post-meta">{site.shortName} · {formatDate(post.date)} · {post.minutes} min read</div>
      </header>
      {post.cover && <img className="post-hero" src={post.cover} alt="" />}

      <div className="post-layout">
        <article className="prose" dangerouslySetInnerHTML={{ __html: rendered.html }} />
        {rendered.toc.length > 1 && (
          <aside className="toc" aria-label="On this page">
            <strong>On this page</strong>
            <ul>
              {rendered.toc.map((t) => (
                <li key={t.id} className={t.level === 3 ? 'sub' : ''}>
                  <a href={`#${t.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' }); }}>{t.text}</a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <nav className="post-nav" aria-label="More posts">
        {prev ? <Link to={`/blog/${prev.slug}`}><span>Newer</span>{prev.title}</Link> : <i />}
        {next ? <Link to={`/blog/${next.slug}`} className="r"><span>Older</span>{next.title}</Link> : <i />}
      </nav>
    </main>
  );
}
