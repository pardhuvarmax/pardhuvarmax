import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../styles/notfound.css';

/** The shared "broken site" screen: black and white, a huge warped code stretched across the page, glitching text, and a scene
 *  with Spider-Man (the only colour). Rendered on <body> so nothing in the layout can sit on top of it. */

const GLITCH = ['#e0242c', '#2f5bff', '#ffd23f', '#22d3ee', '#ff3fa4'];
/** Faint coloured streaks that flicker and jump sideways, like a signal coming back. Deterministic per page so it does not reshuffle on re-render. */
function GlitchLines({ seed }: { seed: number }) {
  let r = seed * 9301 + 49297;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const lines = Array.from({ length: 26 }, (_, i) => {
    const thick = rnd() < 0.22;
    return {
      top: rnd() * 100, left: rnd() * 70, width: 14 + rnd() * 48, height: thick ? 6 + rnd() * 10 : 1 + Math.floor(rnd() * 3),
      color: GLITCH[i % GLITCH.length], dx: (rnd() < 0.5 ? -1 : 1) * (14 + rnd() * 60), dur: 2.2 + rnd() * 3.6, delay: rnd() * 4, peak: thick ? 0.12 : 0.34,
    };
  });
  return (
    <div className="nfb-glow" aria-hidden="true">
      {lines.map((l, i) => (
        <i key={i} style={{ top: `${l.top}%`, left: `${l.left}%`, width: `${l.width}%`, height: l.height, background: l.color, '--dx': `${l.dx}px`, '--pk': l.peak, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` } as React.CSSProperties} />
      ))}
    </div>
  );
}

export default function BrokenPage({
  code,
  title,
  line,
  copy,
  scene,
  children,
  actions,
  seed = 7,
  noindex = false,
  tint = false,
}: {
  code: string;
  title: string;
  line?: ReactNode;
  copy?: ReactNode;
  scene?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  seed?: number;
  noindex?: boolean;
  /** Good news (back online, new version, timer finished): a faint wash of colour fades in behind the black and white. */
  tint?: boolean;
}) {
  const num = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let meta: HTMLMetaElement | null = null;
    if (noindex) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex';
      document.head.appendChild(meta);
    }
    // the page covers the screen, so keep the hidden site chrome out of keyboard reach and stop the page behind from scrolling
    const chrome = document.querySelectorAll('header.nav, footer.footer');
    chrome.forEach((el) => el.setAttribute('inert', ''));
    document.documentElement.classList.add('nf-lock');
    return () => {
      meta?.remove();
      chrome.forEach((el) => el.removeAttribute('inert'));
      document.documentElement.classList.remove('nf-lock');
    };
  }, [noindex]);

  // stretch the code so it spans the whole screen, whatever its shape
  useEffect(() => {
    const box = num.current;
    const t = box?.querySelector<HTMLElement>('.nfb-t');
    if (!box || !t) return;
    const fit = () => {
      box.style.setProperty('--sx', '1');
      box.style.setProperty('--sy', '1');
      const w = t.offsetWidth || 1;
      const h = t.offsetHeight || 1;
      const sx = (window.innerWidth * 1.04) / w;
      const sy = Math.min((window.innerHeight * 0.96) / h, sx * 1.8); // on tall, narrow screens do not stretch it into unreadable strips
      box.style.setProperty('--sx', String(sx));
      box.style.setProperty('--sy', String(sy));
    };
    fit();
    document.fonts?.ready.then(fit);
    document.fonts?.addEventListener?.('loadingdone', fit);
    window.addEventListener('resize', fit);
    const ro = new ResizeObserver(fit); // the text changes size when the web font arrives; a transform never triggers this
    ro.observe(t);
    return () => {
      window.removeEventListener('resize', fit);
      document.fonts?.removeEventListener?.('loadingdone', fit);
      ro.disconnect();
    };
  }, [code]);

  const filter = `nfb-warp-${seed}`;
  return createPortal(
    <main className="nfb" aria-labelledby="nfb-title">
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <filter id={filter} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.045" numOctaves="2" seed={seed} result="n">
            <animate attributeName="baseFrequency" dur="7s" values="0.011 0.045;0.02 0.07;0.008 0.03;0.011 0.045" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="nfb-num" ref={num} aria-hidden="true" style={{ filter: `url(#${filter})` }}>
        <div className="nfb-s" data-text={code}><span className="nfb-t">{code}</span></div>
      </div>
      {tint && <GlitchLines seed={seed} />}
      <div className="nfb-noise" aria-hidden="true" />
      <div className="nfb-scan" aria-hidden="true" />

      <div className="nfb-in">
        {line && <p className="nfb-line">{line}</p>}
        <h1 id="nfb-title" className="nfb-h" data-text={title}>{title}</h1>
        {copy && <p className="nfb-copy">{copy}</p>}
        {scene}
        {children}
        {actions && <div className="nfb-links">{actions}</div>}
      </div>
    </main>,
    document.body,
  );
}
