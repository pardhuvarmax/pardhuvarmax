import { useEffect } from 'react';

// Slowly drifting accent palette. Hues sweep blue -> violet -> magenta -> crimson -> burnt orange
// (210deg..380deg, so never green or yellow). Lightness stays low so every colour is deep.
const FROM = 210;
const SPAN = 170;
const PERIOD = 300; // seconds for one full sweep there and back
const SLOTS = [
  { name: '--accent', phase: 0, s: 74, l: 40 },
  { name: '--accent-2', phase: 0.17, s: 72, l: 44 },
  { name: '--accent-3', phase: 0.34, s: 70, l: 36 },
  { name: '--accent-4', phase: 0.51, s: 76, l: 32 },
];

export function useDynamicColors() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();

    const paint = () => {
      const t = reduce ? 0 : (performance.now() - start) / 1000;
      const light = root.dataset.theme === 'light';
      for (const sl of SLOTS) {
        const k = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / PERIOD + sl.phase));
        const h = (FROM + SPAN * k) % 360;
        root.style.setProperty(sl.name, `hsl(${h.toFixed(1)} ${sl.s}% ${sl.l}%)`);
        if (sl.name === '--accent') {
          // accent used as text: lighter on the dark theme, deeper on the paper theme
          root.style.setProperty('--accent-text', `hsl(${h.toFixed(1)} 78% ${light ? 34 : 64}%)`);
          root.style.setProperty('--accent-soft', `hsl(${h.toFixed(1)} 74% 40% / 0.16)`);
        }
      }
    };

    paint();
    if (reduce) return;
    const id = window.setInterval(paint, 120);
    return () => {
      window.clearInterval(id);
      for (const n of ['--accent', '--accent-2', '--accent-3', '--accent-4', '--accent-text', '--accent-soft']) root.style.removeProperty(n);
    };
  }, []);
}
