import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { safeHref } from '../lib/content';
import '../styles/pubs.css';

/** The cover as an engraved steel plate: it tilts towards the cursor and the artwork is cut into brushed metal with hard, sharp edges that follow the light. */
export function Holo({ children, image }: { children: ReactNode; image?: string }) {
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
    // the light sits at the cursor: edges facing it catch a hard highlight, the opposite edges fall into a hard shadow (never less than a pixel)
    const edge = (v: number) => `${(Math.sign(v || 1) * (1 + Math.abs(v) * 2.4)).toFixed(2)}px`;
    set('--lx', edge(x - 0.5));
    set('--ly', edge(y - 0.5));
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
