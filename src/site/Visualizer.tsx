import { useEffect, useRef } from 'react';
import { player, usePlayer } from '../lib/player';

/** 8-bit LED meter driven by the music. Also sets --energy (0..1, from the bass) on the nearest .cs-rig so the playing tape can glow. */
export default function Visualizer() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { playing } = usePlayer();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rig = canvas.closest<HTMLElement>('.cs-rig');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let colors = ['#3b8bff', '#7c4dff', '#c2185b'];

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const readColors = () => {
      const cs = getComputedStyle(canvas);
      colors = ['--accent', '--accent-2', '--accent-3'].map((v, i) => cs.getPropertyValue(v).trim() || colors[i]);
    };

    const draw = (levels: number[]) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const n = levels.length;
      const gap = 3;
      const bw = Math.max(4, Math.floor((w - gap * (n - 1)) / n));
      const block = 5;
      const rows = Math.floor(h / (block + 2));
      for (let i = 0; i < n; i++) {
        const lit = Math.max(1, Math.round(levels[i] * rows));
        for (let r = 0; r < lit; r++) {
          const t = r / rows;
          ctx.fillStyle = colors[t < 0.5 ? 0 : t < 0.8 ? 1 : 2];
          ctx.fillRect(i * (bw + gap), h - (r + 1) * (block + 2), bw, block);
        }
      }
    };

    const bars = () => Math.max(12, Math.min(48, Math.floor(canvas.clientWidth / 12)));
    const flat = () => draw(new Array(bars()).fill(0));

    size();
    readColors();
    const onResize = () => { size(); readColors(); if (!raf) flat(); };
    window.addEventListener('resize', onResize);

    const an = playing && !reduce ? player.getAnalyser() : null;
    if (an) {
      const data = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        raf = requestAnimationFrame(tick);
        an.getByteFrequencyData(data);
        const n = bars();
        const usable = Math.min(data.length, 48); // the top bins are mostly empty
        const levels: number[] = [];
        for (let i = 0; i < n; i++) {
          const a = Math.floor((i / n) * usable);
          const b = Math.max(a + 1, Math.floor(((i + 1) / n) * usable));
          let sum = 0;
          for (let k = a; k < b; k++) sum += data[k];
          levels.push(Math.min(1, sum / (b - a) / 255 * 1.25));
        }
        draw(levels);
        const bass = (data[1] + data[2] + data[3] + data[4]) / 4 / 255;
        rig?.style.setProperty('--energy', bass.toFixed(2));
      };
      tick();
    } else {
      flat();
      rig?.style.setProperty('--energy', '0');
    }
    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('resize', onResize);
      rig?.style.setProperty('--energy', '0');
    };
  }, [playing]);

  return <canvas ref={ref} className="cs-viz" aria-hidden="true" />;
}
