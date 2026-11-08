import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CrashPage, ForbiddenPage, MaintenancePage, OfflinePage, SignedOutPage, SlowDownPage } from './BrokenPages';
import NotFound from './NotFound';
import { SpiderSprite } from './spiderman';

function Boom(): never {
  throw new Error('Test crash from /__broken/crash');
}

const PAGES: { kind: string; code: string; label: string }[] = [
  { kind: '404', code: '404', label: 'Page not found' },
  { kind: '500', code: '500', label: 'Something broke' },
  { kind: '500-stale', code: '500', label: 'New version out' },
  { kind: 'crash', code: '500', label: 'Real crash (error boundary)' },
  { kind: '403', code: '403', label: 'Not allowed' },
  { kind: '401', code: '401', label: 'Signed out' },
  { kind: '429', code: '429', label: 'Slow down (42 s countdown)' },
  { kind: '429-done', code: '429', label: 'Slow down (timer finished)' },
  { kind: 'offline', code: 'OFF', label: 'No signal' },
  { kind: 'online', code: 'OFF', label: 'Back online' },
  { kind: '503', code: '503', label: 'Back soon (maintenance)' },
];

/** /__broken lists every error page; /__broken/<kind> shows one on its own so it can be checked without causing the error. */
export default function DevBroken() {
  const { kind } = useParams();
  const [n, setN] = useState(0);

  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex';
    document.head.appendChild(m);
    document.title = kind ? `Error page ${kind}` : 'Error pages';
    return () => m.remove();
  }, [kind]);

  if (!kind) {
    return (
      <main className="bi">
        <div className="bi-head">
          <div className="bi-who" aria-hidden="true">
            <span className="bi-q">?</span>
            <SpiderSprite frame="alert" />
          </div>
          <h1>Looking for error codes?</h1>
        </div>
        <ul>
          {PAGES.map((p) => (
            <li key={p.kind}><Link to={`/__broken/${p.kind}`}><b>{p.code}</b> {p.label}</Link></li>
          ))}
        </ul>
        <p><Link to="/">Back to the site</Link></p>
      </main>
    );
  }

  const page = (() => {
    switch (kind) {
      case '404': return <NotFound />;
      case '500': return <CrashPage error={new Error('Example error message')} />;
      case '500-stale': return <CrashPage error={new Error('Failed to fetch dynamically imported module: /assets/Admin-xyz.js')} />;
      case 'crash': return <Boom />;
      case '403': return <ForbiddenPage message="This Google account is not allowed to sign in." onClose={() => undefined} />;
      case '401': return <SignedOutPage onSignIn={() => undefined} />;
      case '429': return <SlowDownPage key={n} seconds={42} onRetry={() => setN((v) => v + 1)} />;
      case '429-done': return <SlowDownPage key={`d${n}`} seconds={1} onRetry={() => setN((v) => v + 1)} />;
      case 'offline': return <OfflinePage onDismiss={() => undefined} />;
      case 'online': return <OfflinePage online />;
      case '503': return <MaintenancePage />;
      default: return null;
    }
  })();
  if (!page) {
    return <main className="bi"><h1>No such error page</h1><p><Link to="/__broken">See the list</Link></p></main>;
  }

  return (
    <>
      {page}
      <ErrorMenu kind={kind} />
    </>
  );
}

/** A faint (h) in the corner. It opens a plain white list of every error page, with a black and white Spider-Man pointing at it. */
function ErrorMenu({ kind }: { kind: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) setOpen((v) => !v);
      else if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <>
      <button className="bi-h" onClick={() => setOpen(true)} aria-label="List of error pages">(h)</button>
      {open && (
        <div className="bi-menu" role="dialog" aria-label="Error pages">
          <button className="bi-x" onClick={() => setOpen(false)} aria-label="Close">close (esc)</button>
          <div className="bi-menu-in">
            <ul>
              {PAGES.map((p) => (
                <li key={p.kind}><Link to={`/__broken/${p.kind}`} onClick={() => setOpen(false)} className={p.kind === kind ? 'on' : ''}><b>{p.code}</b> {p.label}</Link></li>
              ))}
            </ul>
            <div className="bi-point" aria-hidden="true"><SpiderSprite frame="point-left" /></div>
          </div>
        </div>
      )}
    </>
  );
}
