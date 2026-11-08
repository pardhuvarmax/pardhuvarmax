import { useEffect, useRef } from 'react';
import { initDotGrid } from '../lib/dotgrid';
import { special } from '../lib/content';

const cfg = special as Record<string, unknown>;
const num = (v: unknown, def: number, min: number, max: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && v !== '' && v !== null && v !== undefined ? Math.min(max, Math.max(min, n)) : def;
};

export default function DotGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(
    () =>
      ref.current
        ? initDotGrid(ref.current, {
            colorVar: '--ink',
            accentVar: '--accent',
            baseAlpha: num(cfg.dotOpacity, 16, 2, 60) / 100,
            spacing: num(cfg.dotSpacing, 26, 12, 60),
            size: num(cfg.dotSize, 1.5, 0.5, 5),
            shape: cfg.dotShape === 'square' || cfg.dotShape === 'diamond' ? cfg.dotShape : 'circle',
            lens: cfg.cursorEnabled !== false,
            radius: num(cfg.cursorRadius, 190, 60, 400),
            lift: num(cfg.cursorDepth, 15, 0, 50),
            grow: num(cfg.cursorGrow, 2.6, 0, 8),
            glow: num(cfg.cursorGlow, 10, 0, 40) / 100,
          })
        : undefined,
    [],
  );
  return <canvas ref={ref} className="dotgrid" aria-hidden="true" />;
}
