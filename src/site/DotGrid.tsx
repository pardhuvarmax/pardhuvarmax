import { useEffect, useRef } from 'react';
import { initDotGrid } from '../lib/dotgrid';

export default function DotGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => (ref.current ? initDotGrid(ref.current, { colorVar: '--ink', accentVar: '--accent', baseAlpha: 0.16 }) : undefined), []);
  return <canvas ref={ref} className="dotgrid" aria-hidden="true" />;
}
