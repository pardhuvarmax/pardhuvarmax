import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, FilePlus2, ImagePlus, LogOut, Save, Trash2 } from 'lucide-react';
import { api, ApiError, uploadImage } from './api';
import { COLLECTIONS, type FileCollection } from './schemas';
import { blankItem, ImageField, SchemaForm } from './SchemaForm';
import { EMPTY_META, parsePost, slugify, stringifyPost, type PostMeta } from '../lib/frontmatter';
import { renderMarkdown } from '../lib/markdown';
import '../styles/site.css';
import '../styles/admin.css';

export type Toast = { kind: 'ok' | 'err'; text: string } | null;
type Status = { authed: boolean; local: boolean; configured: boolean };

/* ---------- Login ---------- */
export function Login({ configured, onDone }: { configured: boolean; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="login"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr('');
        try {
          await api('login', { body: { code } });
          onDone();
        } catch (ex) {
          setErr((ex as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1>Content admin</h1>
      <p className="muted">Enter the 6-digit code from your authenticator app.</p>
      {!configured && <p className="err">TOTP_SECRET is not configured on the server.</p>}
      <input className="inp code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" autoFocus />
      {err && <p className="err">{err}</p>}
      <button className="abtn primary" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Sign in'}</button>
    </form>
  );
}

/* ---------- File (JSON) editor ---------- */
export function FileEditor({ col, notify, saveNote, addItem }: { col: FileCollection; notify: (t: Toast) => void; saveNote: string; addItem?: boolean }) {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setData(null);
    setDirty(false);
    api<{ content: string }>('read', { query: { path: col.path } })
      .then((r) => {
        const parsed = JSON.parse(r.content);
        // "Add a ..." shortcuts: append a blank entry to the first list so the form opens ready to fill in
        const list = col.fields.find((f) => f.type === 'list');
        if (addItem && list) {
          parsed[list.key] = [...(parsed[list.key] ?? []), blankItem(list.fields ?? [])];
          setDirty(true);
        }
        setData(parsed);
      })
      .catch((e) => notify({ kind: 'err', text: e.message }));
  }, [col.path]);

  if (!data) return <p className="muted">Loading…</p>;
  return (
    <>
      <div className="bar">
        <h2>{col.label}</h2>
        <button
          className="abtn primary"
          disabled={!dirty || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api('write', { body: { path: col.path, content: JSON.stringify(data, null, 2) + '\n', message: `cms: update ${col.label}` } });
              setDirty(false);
              notify({ kind: 'ok', text: saveNote });
            } catch (e) {
              notify({ kind: 'err', text: (e as Error).message });
            } finally {
              setBusy(false);
            }
          }}
        >
          <Save size={15} /> {busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </div>
      <SchemaForm openLast={addItem} fields={col.fields} value={data} onChange={(v) => { setData(v); setDirty(true); }} onError={(m) => notify({ kind: 'err', text: m })} />
    </>
  );
}

/* ---------- Posts ---------- */
interface PostRow { file: string; slug: string; meta: PostMeta }

export function PostEditor({ notify, saveNote, dir, startNew, openSlug }: { notify: (t: Toast) => void; saveNote: string; dir: string; startNew?: boolean; openSlug?: string }) {
  const [rows, setRows] = useState<PostRow[] | null>(null);
  const [current, setCurrent] = useState<{ slug: string | null; meta: PostMeta; body: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      const { files } = await api<{ files: string[] }>('list', { query: { dir } });
      const md = files.filter((f) => f.endsWith('.md'));
      const loaded = await Promise.all(
        md.map(async (f) => {
          const { content } = await api<{ content: string }>('read', { query: { path: `${dir}/${f}` } });
          return { file: f, slug: f.replace(/\.md$/, ''), meta: parsePost(content).meta };
        }),
      );
      setRows(loaded.sort((a, b) => b.meta.date.localeCompare(a.meta.date)));
    } catch (e) {
      notify({ kind: 'err', text: (e as Error).message });
      setRows([]);
    }
  }, [dir]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (startNew) setCurrent({ slug: null, meta: { ...EMPTY_META, date: new Date().toISOString().slice(0, 10) }, body: '' });
    else if (openSlug) open(openSlug);
  }, []);

  const open = async (slug: string) => {
    try {
      const { content } = await api<{ content: string }>('read', { query: { path: `${dir}/${slug}.md` } });
      const { meta, body } = parsePost(content);
      setCurrent({ slug, meta, body });
      setDirty(false);
      setPreview(false);
    } catch (e) {
      notify({ kind: 'err', text: (e as Error).message });
    }
  };

  const html = useMemo(() => (current && preview ? renderMarkdown(current.body).html : ''), [current, preview]);

  const patch = (p: Partial<PostMeta>) => { setCurrent((c) => c && { ...c, meta: { ...c.meta, ...p } }); setDirty(true); };

  if (!current) {
    return (
      <>
        <div className="bar">
          <h2>Blog posts</h2>
          <button className="abtn primary" onClick={() => { setCurrent({ slug: null, meta: { ...EMPTY_META, date: new Date().toISOString().slice(0, 10) }, body: '' }); setDirty(false); }}>
            <FilePlus2 size={15} /> New post
          </button>
        </div>
        {rows === null ? <p className="muted">Loading…</p> : rows.length === 0 ? <p className="muted">No posts yet.</p> : (
          <ul className="plist">
            {rows.map((r) => (
              <li key={r.slug}>
                <button onClick={() => open(r.slug)}>
                  <strong>{r.meta.title || r.slug}</strong>
                  <span>{r.meta.date} · {r.meta.draft ? 'Draft' : 'Published'} · /blog/{r.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  const isNew = current.slug === null;
  const slug = current.slug ?? slugify(current.meta.title);

  const save = async () => {
    if (!current.meta.title.trim()) return notify({ kind: 'err', text: 'Title is required.' });
    if (!slug) return notify({ kind: 'err', text: 'Title must contain letters or numbers.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(current.meta.date)) return notify({ kind: 'err', text: 'Pick a valid date.' });
    if (isNew && rows?.some((r) => r.slug === slug)) return notify({ kind: 'err', text: 'A post with this title already exists.' });
    setBusy(true);
    try {
      await api('write', { body: { path: `${dir}/${slug}.md`, content: stringifyPost(current.meta, current.body), message: `cms: ${isNew ? 'add' : 'update'} post ${slug}` } });
      setCurrent({ ...current, slug });
      setDirty(false);
      notify({ kind: 'ok', text: saveNote });
      load();
    } catch (e) {
      notify({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const insertImage = async (file: File) => {
    try {
      const url = await uploadImage(file);
      const md = `\n![${file.name.replace(/\.[^.]+$/, '')}](${url})\n`;
      const el = ta.current;
      const pos = el ? el.selectionStart : current.body.length;
      setCurrent({ ...current, body: current.body.slice(0, pos) + md + current.body.slice(pos) });
      setDirty(true);
    } catch (e) {
      notify({ kind: 'err', text: (e as Error).message });
    }
  };

  return (
    <>
      <div className="bar">
        <button className="abtn" onClick={() => { if (!dirty || confirm('Discard unsaved changes?')) setCurrent(null); }}>← All posts</button>
        <div className="bar-r">
          {!isNew && (
            <button
              className="abtn danger"
              onClick={async () => {
                if (!confirm(`Delete “${current.meta.title}”? This cannot be undone from here.`)) return;
                try {
                  await api('delete', { body: { path: `${dir}/${slug}.md` } });
                  notify({ kind: 'ok', text: 'Post deleted.' });
                  setCurrent(null);
                  load();
                } catch (e) {
                  notify({ kind: 'err', text: (e as Error).message });
                }
              }}
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
          <button className="abtn primary" disabled={!dirty || busy} onClick={save}><Save size={15} /> {busy ? 'Saving…' : dirty ? 'Save post' : 'Saved'}</button>
        </div>
      </div>

      <div className="form">
        <div className="fld"><label>Title</label><input className="inp big" value={current.meta.title} onChange={(e) => patch({ title: e.target.value })} /></div>
        <div className="grid2">
          <div className="fld"><label>Date</label><input className="inp" type="date" value={current.meta.date} onChange={(e) => patch({ date: e.target.value })} /></div>
          <div className="fld">
            <label>Status</label>
            <label className="switch"><input type="checkbox" checked={!current.meta.draft} onChange={(e) => patch({ draft: !e.target.checked })} /><span>{current.meta.draft ? 'Draft (hidden)' : 'Published'}</span></label>
          </div>
        </div>
        <div className="fld"><label>Summary</label><textarea className="inp" rows={2} value={current.meta.summary} onChange={(e) => patch({ summary: e.target.value })} /></div>
        <div className="fld"><label>Tags</label><input className="inp" value={current.meta.tags.join(', ')} onChange={(e) => patch({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} placeholder="comma, separated" /></div>
        <div className="fld"><label>Cover image (optional)</label><ImageField value={current.meta.cover} onChange={(v) => patch({ cover: v })} onError={(m) => notify({ kind: 'err', text: m })} /></div>
        <div className="fld">
          <div className="bar tight">
            <label>Body (Markdown)</label>
            <div className="bar-r">
              <label className="abtn"><ImagePlus size={15} /> Insert image<input type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) insertImage(f); }} /></label>
              <button className={`abtn ${preview ? 'on' : ''}`} onClick={() => setPreview((p) => !p)}>{preview ? 'Edit' : 'Preview'}</button>
            </div>
          </div>
          {preview ? (
            <article className="prose preview" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <textarea ref={ta} className="inp md" rows={22} spellCheck value={current.body} onChange={(e) => { setCurrent({ ...current, body: e.target.value }); setDirty(true); }} placeholder="## Heading\n\nWrite in Markdown…" />
          )}
        </div>
        {!isNew && !current.meta.draft && <a className="abtn" href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> View live</a>}
      </div>
    </>
  );
}

/* ---------- Shell ---------- */
export default function Admin() {
  const [status, setStatus] = useState<Status | null>(null);
  const [active, setActive] = useState(COLLECTIONS[0].id);
  const [toast, setToast] = useState<Toast>(null);

  const refresh = useCallback(() => api<Status>('status').then(setStatus).catch(() => setStatus({ authed: false, local: false, configured: false })), []);
  useEffect(() => { refresh(); document.title = 'Admin'; }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!status) return <div className="site adm"><p className="muted pad">Loading…</p></div>;
  if (!status.authed) return <div className="site adm"><Login configured={status.configured} onDone={refresh} /></div>;

  const col = COLLECTIONS.find((c) => c.id === active)!;
  const saveNote = status.local ? 'Saved to disk. The site updates instantly in dev.' : 'Committed to GitHub. The site redeploys in about a minute.';

  return (
    <div className="site adm">
      <aside className="side">
       <div className="side-inner">
        <strong className="logo">Content admin</strong>
        {status.local && <span className="tag">Local mode</span>}
        <nav>
          {COLLECTIONS.map((c) => (
            <button key={c.id} className={c.id === active ? 'on' : ''} onClick={() => setActive(c.id)}>{c.label}</button>
          ))}
        </nav>
        <div className="side-foot">
          <a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> View site</a>
          {!status.local && (
            <button onClick={async () => { await api('logout', { body: {} }); refresh(); }}><LogOut size={14} /> Sign out</button>
          )}
        </div>
       </div>
      </aside>
      <section className="main">
        {col.kind === 'posts' ? (
          <PostEditor key={col.id} dir={col.dir} notify={setToast} saveNote={saveNote} />
        ) : (
          <FileEditor key={col.id} col={col} notify={setToast} saveNote={saveNote} />
        )}
      </section>
      {toast && <div className={`toast ${toast.kind}`} role="status">{toast.text}</div>}
    </div>
  );
}

export { ApiError };
