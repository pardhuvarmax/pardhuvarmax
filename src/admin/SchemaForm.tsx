import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Music, Plus, Trash2 } from 'lucide-react';
import type { Field } from './schemas';
import { uploadFile, uploadImage } from './api';

type Obj = Record<string, any>;

export function blankItem(fields: Field[]): Obj {
  const o: Obj = {};
  for (const f of fields) o[f.key] = f.type === 'list' || f.type === 'strings' ? [] : f.type === 'boolean' ? false : f.type === 'select' ? f.options?.[0] ?? '' : '';
  return o;
}

function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function ImageField({ value, onChange, onError }: { value: string; onChange: (v: string) => void; onError?: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="img-field">
      {value && <img src={value} alt="" />}
      <input className="inp" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/… or https://…" />
      <button type="button" className="abtn" disabled={busy} onClick={() => ref.current?.click()}>
        <ImagePlus size={15} /> {busy ? 'Uploading…' : 'Upload'}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setBusy(true);
          try {
            onChange(await uploadImage(f));
          } catch (err) {
            onError?.((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

const MAX_AUDIO = 3_200_000;

export function AudioField({ value, onChange, onError }: { value: string; onChange: (v: string) => void; onError?: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="img-field audio-field">
      {value && <audio controls preload="none" src={value} />}
      <input className="inp" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/… .mp3" />
      <button type="button" className="abtn" disabled={busy} onClick={() => ref.current?.click()}>
        <Music size={15} /> {busy ? 'Uploading…' : 'Upload audio'}
      </button>
      <input
        ref={ref}
        type="file"
        accept=".mp3,.m4a,.aac,.ogg,.wav,audio/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          if (f.size > MAX_AUDIO) return onError?.('That file is over 3.2 MB. Export it at a lower bitrate (128 kbps MP3 is about 1 MB per minute).');
          setBusy(true);
          try {
            onChange(await uploadFile(f));
          } catch (err) {
            onError?.((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function FieldInput({ f, value, onChange, onError, openLast }: { f: Field; value: any; onChange: (v: any) => void; onError?: (m: string) => void; openLast?: boolean }) {
  const [added, setAdded] = useState(-1); // index of an item just added with the + button, so it opens ready to fill in
  switch (f.type) {
    case 'textarea':
      return <textarea className="inp" rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return (
        <div className="num-field">
          <input type="range" min={f.min} max={f.max} step={f.step} value={Number(value ?? f.min ?? 0)} onChange={(e) => onChange(Number(e.target.value))} />
          <input className="inp" type="number" min={f.min} max={f.max} step={f.step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      );
    case 'select':
      return (
        <select className="inp" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {f.options?.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
    case 'boolean':
      return (
        <label className="switch">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{value ? 'Yes' : 'No'}</span>
        </label>
      );
    case 'date':
      return <input className="inp" type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'image':
      return <ImageField value={value ?? ''} onChange={onChange} onError={onError} />;
    case 'audio':
      return <AudioField value={value ?? ''} onChange={onChange} onError={onError} />;
    case 'strings': {
      const list: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="strings">
          {list.map((s, i) => (
            <div key={i} className="row">
              {f.multiline ? (
                <textarea className="inp" rows={3} value={s} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
              ) : (
                <input className="inp" value={s} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
              )}
              <div className="row-btns">
                <button type="button" className="ibtn" aria-label="Move up" onClick={() => onChange(move(list, i, -1))}><ArrowUp size={14} /></button>
                <button type="button" className="ibtn" aria-label="Move down" onClick={() => onChange(move(list, i, 1))}><ArrowDown size={14} /></button>
                <button type="button" className="ibtn danger" aria-label="Remove" onClick={() => onChange(list.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <button type="button" className="abtn" onClick={() => onChange([...list, ''])}><Plus size={14} /> Add</button>
        </div>
      );
    }
    case 'list': {
      const list: Obj[] = Array.isArray(value) ? value : [];
      const sub = f.fields ?? [];
      return (
        <div className="list">
          {list.map((item, i) => (
            <details key={i} className="item" open={list.length <= 2 || added === i || (!!openLast && i === list.length - 1)}>
              <summary>
                <span>{String(item[f.titleKey ?? sub[0]?.key] ?? '').slice(0, 70) || `Item ${i + 1}`}</span>
                <span className="row-btns" onClick={(e) => e.preventDefault()}>
                  <button type="button" className="ibtn" aria-label="Move up" onClick={() => onChange(move(list, i, -1))}><ArrowUp size={14} /></button>
                  <button type="button" className="ibtn" aria-label="Move down" onClick={() => onChange(move(list, i, 1))}><ArrowDown size={14} /></button>
                  <button type="button" className="ibtn danger" aria-label="Remove" onClick={() => onChange(list.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                </span>
              </summary>
              <SchemaForm fields={sub} value={item} onChange={(v) => onChange(list.map((x, j) => (j === i ? v : x)))} onError={onError} />
            </details>
          ))}
          <button type="button" className="abtn" onClick={() => { setAdded(list.length); onChange([...list, blankItem(sub)]); }}><Plus size={14} /> Add {f.label.toLowerCase().replace(/s$/, '')}</button>
        </div>
      );
    }
    default:
      return <input className="inp" type={f.type === 'url' ? 'text' : 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function SchemaForm({ fields, value, onChange, onError, openLast }: { fields: Field[]; value: Obj; onChange: (v: Obj) => void; onError?: (m: string) => void; openLast?: boolean }) {
  return (
    <div className="form">
      {fields.map((f) => (
        <div key={f.key} className="fld">
          <label>{f.label}</label>
          {f.help && <small>{f.help}</small>}
          <FieldInput f={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} onError={onError} openLast={openLast} />
        </div>
      ))}
    </div>
  );
}
