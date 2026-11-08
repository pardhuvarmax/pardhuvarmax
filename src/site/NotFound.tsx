import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { site } from '../lib/content';
import RunnerGame from './RunnerGame';
import { openPalette } from './CommandPalette';
import '../styles/notfound.css';

/** The 404 is the site falling apart: black and white, distorted, glitching. Spider-Man is the only thing still in colour. */
export default function NotFound() {
  const { pathname } = useLocation();
  const num = useRef<HTMLDivElement>(null);

  // stretch the 404 so it spans the whole screen, whatever its shape
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
    // the text changes size when the web font arrives; measure again then (a transform never triggers this observer)
    const ro = new ResizeObserver(fit);
    ro.observe(t);
    return () => {
      window.removeEventListener('resize', fit);
      document.fonts?.removeEventListener?.('loadingdone', fit);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    document.title = `404 | ${site.name}`;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    // the page covers the screen, so keep the hidden site chrome out of keyboard reach and stop the page behind from scrolling
    const chrome = document.querySelectorAll('header.nav, footer.footer');
    chrome.forEach((el) => el.setAttribute('inert', ''));
    document.documentElement.classList.add('nf-lock');
    return () => {
      meta.remove();
      chrome.forEach((el) => el.removeAttribute('inert'));
      document.documentElement.classList.remove('nf-lock');
    };
  }, []);

  const shown = pathname.length > 38 ? pathname.slice(0, 37) + '…' : pathname;

  // rendered on <body>, outside the site layout, so nothing in the layout can sit on top of it
  return createPortal(
    <main className="nfb" aria-labelledby="nfb-title">
      {/* the warp filter that bends the big number */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <filter id="nfb-warp" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.045" numOctaves="2" seed="7" result="n">
            <animate attributeName="baseFrequency" dur="7s" values="0.011 0.045;0.02 0.07;0.008 0.03;0.011 0.045" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="nfb-num" ref={num} aria-hidden="true">
        <div className="nfb-s" data-text="404"><span className="nfb-t">404</span></div>
      </div>
      <div className="nfb-noise" aria-hidden="true" />
      <div className="nfb-scan" aria-hidden="true" />

      <div className="nfb-in">
        <p className="nfb-line">GET <b>{shown}</b> → <b>404</b> · <span className="nfb-blink">route not found</span></p>
        <h1 id="nfb-title" className="nfb-h" data-text="Page not found">Page not found</h1>
        <p className="nfb-copy">That page does not exist, or it moved, and the rest of the site came apart a little with it. Spider-Man is holding what is left together. Help him with the bugs.</p>
        <RunnerGame mono />
        <div className="nfb-links">
          <Link className="nfb-btn" to="/"><ArrowLeft size={16} /> Back home</Link>
          <button className="nfb-btn" onClick={openPalette}>Search the site <kbd>Ctrl</kbd>+<kbd>K</kbd></button>
        </div>
      </div>
    </main>,
    document.body,
  );
}
