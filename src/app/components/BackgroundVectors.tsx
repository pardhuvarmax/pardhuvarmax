import { useEffect, useRef } from 'react';

interface BackgroundVectorsProps {
  paused?: boolean;
}

export function BackgroundVectors({ paused = false }: BackgroundVectorsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);

  // Keep ref in sync without restarting the animation loop
  useEffect(() => {
    pausedRef.current = paused;
    // If unpausing, clear the canvas so it doesn't freeze on last frame
    if (!paused) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, c.width, c.height);
  }, [paused]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const N = 55;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * (window.innerWidth || 1200),
      y: Math.random() * (window.innerHeight || 800),
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));

    const fibers = Array.from({ length: 28 }, () => ({
      x: Math.random() * (window.innerWidth || 1200),
      y: Math.random() * (window.innerHeight || 800),
      vx: (Math.random() - 0.4) * 0.12,
      vy: Math.random() * 0.12 + 0.08,
      len: Math.random() * 5 + 4,
      angle: Math.random() * Math.PI * 2,
      av: (Math.random() - 0.5) * 0.005,
    }));

    let rafId: number;
    const step = () => {
      if (!c) return;

      if (pausedRef.current) {
        // Keep looping but don't draw — stays blank
        rafId = requestAnimationFrame(step);
        return;
      }

      ctx.clearRect(0, 0, c.width, c.height);

      ctx.strokeStyle = 'rgba(145,125,105,0.14)';
      ctx.lineWidth = 0.75;
      for (const f of fibers) {
        f.x += f.vx;
        f.y += f.vy;
        f.angle += f.av;

        if (f.y > c.height) { f.y = -10; f.x = Math.random() * c.width; }
        if (f.x < 0) f.x = c.width;
        if (f.x > c.width) f.x = 0;

        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x + Math.cos(f.angle) * f.len, f.y + Math.sin(f.angle) * f.len);
        ctx.stroke();
      }

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0) n.x = c.width;
        if (n.x > c.width) n.x = 0;
        if (n.y < 0) n.y = c.height;
        if (n.y > c.height) n.y = 0;
      }
      for (let a = 0; a < N; a++) {
        for (let b = a + 1; b < N; b++) {
          const dx = nodes[a].x - nodes[b].x;
          const dy = nodes[a].y - nodes[b].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.strokeStyle = 'rgba(96,146,255,' + ((1 - d / 130) * 0.12).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = 'rgba(96,146,255,0.45)';
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.4, 0, 6.284);
        ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    };
    step();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.55,
      }}
    />
  );
}
