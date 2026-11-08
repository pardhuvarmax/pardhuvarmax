import { useEffect, useMemo, useState } from 'react';
import { History as HistoryIcon, RotateCcw, X } from 'lucide-react';
import { api } from './api';

/* ---------- line diff (small, dependency-free) ---------- */
export type DiffLine = { t: ' ' | '+' | '-'; s: string };

export function lineDiff(before: string, after: string): DiffLine[] | null {
  const A = before.split('\n');
  const B = after.split('\n');
  let s = 0;
  while (s < A.length && s < B.length && A[s] === B[s]) s++;
  let ea = A.length;
  let eb = B.length;
  while (ea > s && eb > s && A[ea - 1] === B[eb - 1]) {
    ea--;
    eb--;
  }
  const a = A.slice(s, ea);
  const b = B.slice(s, eb);
  if (a.length * b.length > 4_000_000) return null; // too big to diff line by line
  const n = a.length;
  const m = b.length;
  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  const out: DiffLine[] = A.slice(0, s).map((x) => ({ t: ' ', s: x }));
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { out.push({ t: ' ', s: a[i] }); i++; j++; }
    else if (i < n && (j === m || dp[(i + 1) * w + j] >= dp[i * w + j + 1])) out.push({ t: '-', s: a[i++] }); // removed lines first
    else out.push({ t: '+', s: b[j++] });
  }
  for (const x of A.slice(ea)) out.push({ t: ' ', s: x });
  return out;
}

type Row = DiffLine | { t: 'gap'; n: number };
function compact(lines: DiffLine[], ctx = 2): Row[] {
  const keep = new Array(lines.length).fill(false);
  lines.forEach((l, i) => {
    if (l.t !== ' ') for (let k = Math.max(0, i - ctx); k <= Math.min(lines.length - 1, i + ctx); k++) keep[k] = true;
  });
  const rows: Row[] = [];
  let hidden = 0;
  lines.forEach((l, i) => {
    if (keep[i]) {
      if (hidden) rows.push({ t: 'gap', n: hidden });
      hidden = 0;
      rows.push(l);
    } else hidden++;
  });
  if (hidden) rows.push({ t: 'gap', n: hidden });
  return rows;
}

/* ---------- review before publishing ---------- */
export function ReviewDialog({ title, before, after, busy, onConfirm, onCancel, confirmLabel }: { title: string; before: string; after: string; busy: boolean; onConfirm: () => void; onCancel: () => void; confirmLabel: string }) {
  const diff = useMemo(() => lineDiff(before, after), [before, after]);
  const added = diff?.filter((l) => l.t === '+').length ?? 0;
  const removed = diff?.filter((l) => l.t === '-').length ?? 0;
  const rows = useMemo(() => (diff ? compact(diff) : []), [diff]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  return (
    <div className="rv-back" onClick={() => !busy && onCancel()}>
      <div className="rv" role="dialog" aria-modal="true" aria-label="Review changes" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <strong>Review changes</strong>
            <span>{title}</span>
          </div>
          <button className="ibtn" onClick={onCancel} disabled={busy} aria-label="Close"><X size={16} /></button>
        </header>
        <p className="rv-sum">
          {diff ? (
            <>
              <b className="d-add">+{added}</b> added · <b className="d-del">−{removed}</b> removed
            </>
          ) : (
            'A large change; too long to show line by line.'
          )}
        </p>
        <pre className="rv-diff" tabIndex={0}>
          {rows.map((r, i) =>
            r.t === 'gap' ? (
              <span key={i} className="d-gap">… {r.n} unchanged line{r.n === 1 ? '' : 's'} …{'\n'}</span>
            ) : (
              <span key={i} className={r.t === '+' ? 'd-add' : r.t === '-' ? 'd-del' : 'd-ctx'}>{r.t === ' ' ? '  ' : r.t + ' '}{r.s}{'\n'}</span>
            ),
          )}
        </pre>
        <footer>
          <button className="abtn" onClick={onCancel} disabled={busy}>Keep editing</button>
          <button className="abtn primary" onClick={onConfirm} disabled={busy}>{busy ? 'Saving…' : confirmLabel}</button>
        </footer>
      </div>
    </div>
  );
}

/* ---------- history and restore ---------- */
interface Revision { sha: string; date: string; author: string; message: string }

export function HistoryMenu({ path, onRestore, onError }: { path: string; onRestore: (content: string) => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Revision[] | null>(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!open) return;
    setList(null);
    api<{ revisions: Revision[] }>('history', { query: { path } })
      .then((r) => setList(r.revisions))
      .catch((e) => { onError(e.message); setOpen(false); });
  }, [open, path]);

  return (
    <div className="hist">
      <button className="abtn" onClick={() => setOpen((o) => !o)} aria-expanded={open}><HistoryIcon size={15} /> History</button>
      {open && (
        <div className="hist-pop" role="menu">
          <strong>Earlier versions</strong>
          <small>Restoring loads that version into the editor. You review it before it is saved.</small>
          {list === null ? (
            <p className="muted">Loading…</p>
          ) : list.length === 0 ? (
            <p className="muted">No earlier versions found.</p>
          ) : (
            <ul>
              {list.map((r, i) => (
                <li key={r.sha}>
                  <div>
                    <b>{r.message || '(no message)'}</b>
                    <span>{new Date(r.date).toLocaleString()} · {r.author}{i === 0 ? ' · current' : ''}</span>
                  </div>
                  {i > 0 && (
                    <button
                      className="abtn"
                      disabled={!!busy}
                      onClick={async () => {
                        setBusy(r.sha);
                        try {
                          const { content } = await api<{ content: string }>('revision', { query: { path, sha: r.sha } });
                          onRestore(content);
                          setOpen(false);
                        } catch (e) {
                          onError((e as Error).message);
                        } finally {
                          setBusy('');
                        }
                      }}
                    >
                      <RotateCcw size={14} /> {busy === r.sha ? '…' : 'Restore'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
