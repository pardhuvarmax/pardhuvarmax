import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../styles/notfound.css';

/** The shared "broken site" screen: black and white, a huge warped code stretched across the page, glitching text, and a scene
 *  with Spider-Man (the only colour). Rendered on <body> so nothing in the layout can sit on top of it. */
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
