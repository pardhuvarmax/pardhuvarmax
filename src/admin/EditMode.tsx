import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ExternalLink, FilePlus2, FolderPlus, LogOut, Pencil, User, X } from 'lucide-react';
import { api } from './api';
import { COLLECTIONS, type FileCollection } from './schemas';
import { FileEditor, PostEditor, type Toast } from './Admin';
import { confirmDiscard } from './unsaved';
import { SignedOutPage } from '../site/BrokenPages';
import '../styles/admin.css';
import '../styles/editmode.css';

type Status = { authed: boolean; local: boolean; configured: boolean };
type Action = { id: string; label: string; startNew?: boolean; addItem?: boolean; slug?: string };

const POSTS_DIR = 'src/content/posts';

/** Which editor "Edit this page" should open for the page you are on. */
function contextAction(path: string): Action {
  if (path.startsWith('/blog/')) return { id: 'posts', label: 'Edit this post', slug: path.split('/')[2] };
  if (path === '/blog') return { id: 'posts', label: 'Edit posts' };
  if (path === '/projects') return { id: 'projects', label: 'Edit projects' };
  if (path === '/publications') return { id: 'publications', label: 'Edit publications' };
  return { id: 'site', label: 'Edit this page' };
}

const QUICK: (Action & { icon: typeof Pencil })[] = [
  { id: 'posts', label: 'Write a blog post', startNew: true, icon: FilePlus2 },
  { id: 'projects', label: 'Add a project', addItem: true, icon: FolderPlus },
  { id: 'publications', label: 'Add a publication', addItem: true, icon: BookOpen },
  { id: 'site', label: 'Edit bio & profile', icon: User },
];
const MORE = ['posts', 'projects', 'publications', 'experience', 'honors', 'skills', 'news'];

/**
 * On-site editing. Loaded only for the owner (a saved hint, or the dev server) or when "Admin" in the footer is clicked.
 * Signed out: shows the TOTP sign-in dialog. Signed in: a floating Edit button, a menu, and a slide-in editor panel.
 */
export default function EditMode({ request }: { request: number }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status | null>(null);
  const [menu, setMenu] = useState(false);
  const [action, setAction] = useState<(Action & { n: number }) | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [expired, setExpired] = useState<{ status: number; message: string; action: string } | null>(null); // the session ended while editing
  useEffect(() => {
    const on = (e: Event) => setExpired((e as CustomEvent).detail ?? { status: 401, message: 'Unauthorized', action: 'unknown' });
    window.addEventListener('admin:expired', on);
    return () => window.removeEventListener('admin:expired', on);
  }, []);

  const refresh = useCallback(
    () =>
      api<Status>('status')
        .then((raw) => {
          // an unexpected reply (no API, bad deploy) counts as signed out, so the sign-in dialog still works
          const s: Status = raw && typeof raw.authed === 'boolean' ? raw : { authed: false, local: false, configured: false };
          setStatus(s);
          try {
            if (s.authed && !s.local) localStorage.setItem('cms', '1');
            if (!s.authed) localStorage.removeItem('cms');
          } catch {
            /* storage unavailable */
          }
        })
        .catch(() => setStatus({ authed: false, local: false, configured: false })),
    [],
  );
  useEffect(() => { refresh(); }, [refresh]);

  // footer "Admin" link: sign in, or open the menu when already signed in
  // each click on the small "e": toggle the menu when signed in, otherwise go to the sign-in page (e.g. the session expired)
  const handled = useRef(0);
  useEffect(() => {
    if (!status || request <= handled.current) return;
    handled.current = request;
    if (status.authed) setMenu((m) => !m);
    else navigate('/login', { state: { from: pathname } });
  }, [request, status]);

  // lets the "e" button look "on" while signed in
  useEffect(() => {
    document.documentElement.dataset.cms = status?.authed ? 'on' : '';
    return () => { document.documentElement.dataset.cms = ''; };
  }, [status?.authed]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (action) { if (confirmDiscard()) setAction(null); }
      else setMenu(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [action]);

  if (!status) return null;
  const saveNote = status.local ? 'Saved to disk. The site updates instantly in dev.' : 'Committed to GitHub. The live site updates in about a minute.';
  const open = (a: Action) => { if (!confirmDiscard()) return; setAction({ ...a, n: Date.now() }); setMenu(false); };
  const ctx = contextAction(pathname);
  const col = action && action.id !== 'posts' ? (COLLECTIONS.find((c) => c.id === action.id) as FileCollection | undefined) : undefined;
  const title = action ? (action.startNew || action.addItem ? action.label : COLLECTIONS.find((c) => c.id === action.id)?.label) : '';

  return (
    <div className="em">
      {/* floating edit button + menu */}
      {status.authed && menu && <div className="em-catch" onClick={() => setMenu(false)} />}
      {status.authed && (
        <div className="em-bar">
          {menu && (
            <div className="em-menu" role="menu">
              <button role="menuitem" className="em-primary" onClick={() => open(ctx)}><Pencil size={15} /> {ctx.label}</button>
              <hr />
              {QUICK.map((q) => (
                <button key={q.label} role="menuitem" onClick={() => open(q)}><q.icon size={15} /> {q.label}</button>
              ))}
              <hr />
              {MORE.map((id) => (
                <button key={id} role="menuitem" className="em-sub" onClick={() => open({ id, label: id })}>{COLLECTIONS.find((c) => c.id === id)?.label}</button>
              ))}
              <hr />
              <a role="menuitem" href="/admin"><ExternalLink size={15} /> Full admin</a>
              {!status.local && (
                <button
                  role="menuitem"
                  onClick={async () => {
                    if (!confirmDiscard()) return;
                    await api('logout', { body: {} });
                    setMenu(false);
                    refresh();
                  }}
                >
                  <LogOut size={15} /> Sign out
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* editor panel */}
      {status.authed && action && (
        <>
          <div className="em-backdrop" onClick={() => { if (confirmDiscard()) setAction(null); }} />
          <aside className="em-drawer" role="dialog" aria-modal="true" aria-label={title}>
            <header>
              <strong>{title}</strong>
              <button className="em-x" aria-label="Close editor" onClick={() => { if (confirmDiscard()) setAction(null); }}><X size={18} /></button>
            </header>
            <div className="adm em-adm">
              {action.id === 'posts' ? (
                <PostEditor key={action.n} dir={POSTS_DIR} notify={setToast} saveNote={saveNote} startNew={action.startNew} openSlug={action.slug} />
              ) : col ? (
                <FileEditor key={action.n} col={col} notify={setToast} saveNote={saveNote} addItem={action.addItem} />
              ) : null}
            </div>
          </aside>
        </>
      )}
      {toast && <div className={`em-toast ${toast.kind}`} role="status">{toast.text}</div>}
      {expired && <SignedOutPage detail={expired} onSignIn={() => window.location.assign('/login')} />}
    </div>
  );
}
