import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, RotateCcw } from 'lucide-react';

type Kind = 'cmd' | 'cmt' | 'out' | 'blank';
interface Seg { k: Kind; text: string }
interface Line { k: Kind; text: string }

/** `script` is either an authored demo ("$ command" lines are typed, other lines are output) or, with fromDemo=false, plain quick-start text
 *  (every non-comment line is a command). */
export function parseScript(script: string, fromDemo: boolean): Seg[] {
  return script.replace(/\r\n/g, '\n').split('\n').map((raw) => {
    const t = raw.replace(/\s+$/, '');
    if (!t.trim()) return { k: 'blank' as Kind, text: '' };
    if (t.trim().startsWith('#')) return { k: 'cmt' as Kind, text: t };
    if (fromDemo) return t.startsWith('$ ') ? { k: 'cmd' as Kind, text: t.slice(2) } : { k: 'out' as Kind, text: t };
    return { k: 'cmd' as Kind, text: t };
  });
}
export const commandsOf = (segs: Seg[]) => segs.filter((s) => s.k === 'cmd').map((s) => s.text).join('\n');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A terminal that types its script out the first time it scrolls into view, with Replay and Copy. */
export default function Terminal({ script, fromDemo, title = 'Quick start' }: { script: string; fromDemo: boolean; title?: string }) {
  const segs = useRef(parseScript(script, fromDemo));
  segs.current = parseScript(script, fromDemo);
  const [lines, setLines] = useState<Line[]>([]);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const token = useRef(0);
  const started = useRef(false);

  const play = useCallback(async () => {
    const my = ++token.current;
    const alive = () => token.current === my;
    const all = segs.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLines(all.map((s) => ({ ...s })));
      setPlaying(false);
      return;
    }
    setLines([]);
    setPlaying(true);
    for (const s of all) {
      if (!alive()) return;
      if (s.k === 'blank') { setLines((l) => [...l, { k: 'blank', text: '' }]); await sleep(110); continue; }
      if (s.k === 'out') { await sleep(80); if (!alive()) return; setLines((l) => [...l, { k: 'out', text: s.text }]); continue; }
      setLines((l) => [...l, { k: s.k, text: '' }]);
      const step = s.k === 'cmd' ? 24 : 7;
      for (let i = 1; i <= s.text.length; i++) {
        if (!alive()) return;
        setLines((l) => { const c = l.slice(); c[c.length - 1] = { k: s.k, text: s.text.slice(0, i) }; return c; });
        await sleep(step + (s.k === 'cmd' ? Math.random() * 22 : 0));
      }
      await sleep(s.k === 'cmd' ? 330 : 100);
    }
    if (alive()) setPlaying(false);
  }, []);

  // type it out the first time it is mostly on screen
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started.current) {
          started.current = true;
          void play();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => { io.disconnect(); token.current++; };
  }, [play]);

  const copy = async () => {
    const text = fromDemo ? commandsOf(segs.current) : script.trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard not available: the text is still selectable */
    }
  };

  return (
    <div className="pj-qs tm" ref={box}>
      <div className="pj-qs-bar">
        <span>{title}</span>
        <span className="tm-btns">
          <button onClick={() => void play()} aria-label="Replay"><RotateCcw size={13} /> Replay</button>
          <button onClick={copy} aria-label="Copy commands">{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>
        </span>
      </div>
      {/* the full text is always there for screen readers; the animated copy is visual only */}
      <pre className="sr-only">{script}</pre>
      <pre className="tm-screen" aria-hidden="true">
        {lines.map((l, i) => (
          <div key={i} className={`tm-${l.k}`}>
            {l.k === 'cmd' && <span className="tm-p">$ </span>}
            {l.text || ' '}
            {i === lines.length - 1 && <span className={`tm-cur ${playing ? 'on' : ''}`}>▍</span>}
          </div>
        ))}
        {lines.length === 0 && <div className="tm-cmd"><span className="tm-p">$ </span><span className="tm-cur on">▍</span></div>}
      </pre>
    </div>
  );
}
