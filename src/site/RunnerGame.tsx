import { useEffect, useRef, useState } from 'react';
import { SPIDER_GRID, spiderCells, spiderFill } from './spiderman';

// A tiny endless runner: jump the bugs. Space, Up arrow or a tap to jump.
const W = 640;
const H = 220;
const GROUND = 180;
const SCALE = 2; // sprite cell size in px
const SPR_W = SPIDER_GRID.w * SCALE;
const SPR_H = SPIDER_GRID.h * SCALE;
const FOOT = 25 * SCALE; // where his feet end inside the sprite
const BUG = ['..X..X..', '.XXXXXX.', 'XXOXXOXX', '.XXXXXX.', 'X.XXXX.X', '..X..X..']; // 8 wide, 6 tall (X body, O eye)
const BUG_PX = 3;

interface Obstacle { x: number; w: number; h: number; wide: boolean }
type Mode = 'idle' | 'run' | 'over';

const readBest = () => {
  try { return Number(localStorage.getItem('rungame:best')) || 0; } catch { return 0; }
};

export default function RunnerGame({ mono = false }: { mono?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [best, setBest] = useState(readBest);
  const [mode, setMode] = useState<Mode>('idle');
  const modeRef = useRef<Mode>('idle');
  const bestRef = useRef(best);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const cs = getComputedStyle(canvas);
    const col = (v: string, d: string) => cs.getPropertyValue(v).trim() || d;
    let ink = mono ? '#f2f2f2' : col('--text', '#eee');
    let accent = mono ? '#ffffff' : col('--accent', '#3b8bff');
    let muted = mono ? '#8a8a8a' : col('--muted', '#999');

    let y = 0; // height above the ground
    let vy = 0;
    let obstacles: Obstacle[] = [];
    let speed = 260;
    let score = 0;
    let spawn = 1.2;
    let last = performance.now();
    let frameT = 0;
    let raf = 0;
    const stars = Array.from({ length: 22 }, () => ({ x: Math.random() * W, y: 18 + Math.random() * 110, s: Math.random() < 0.3 ? 2 : 1 }));

    const set = (m: Mode) => { modeRef.current = m; setMode(m); };
    const reset = () => { y = 0; vy = 0; obstacles = []; speed = 260; score = 0; spawn = 1.0; };
    const jump = () => {
      if (modeRef.current === 'idle' || modeRef.current === 'over') {
        if (modeRef.current === 'over' && performance.now() - overAt < 350) return; // do not skip the game-over screen by accident
        reset();
        set('run');
      }
      if (y === 0) vy = 640;
    };
    let overAt = 0;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        const el = e.target as HTMLElement | null;
        if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
        e.preventDefault();
        jump();
      }
    };
    const onPointer = (e: PointerEvent) => { e.preventDefault(); jump(); };
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', onPointer);

    const drawSprite = (frame: 'runA' | 'runB', px: number, py: number) => {
      for (const c of spiderCells(frame)) {
        ctx.fillStyle = spiderFill(c.c);
        ctx.fillRect(px + c.x * SCALE, py + c.y * SCALE, SCALE, SCALE);
      }
    };
    const drawBug = (x: number, baseY: number, big: boolean) => {
      const s = big ? BUG_PX + 1 : BUG_PX;
      ctx.fillStyle = accent;
      BUG.forEach((row, r) =>
        [...row].forEach((ch, c) => {
          if (ch === '.') return;
          ctx.fillStyle = ch === 'O' ? '#fff' : accent;
          ctx.fillRect(x + c * s, baseY - (BUG.length - r) * s, s, s);
        }),
      );
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (document.hidden) return;
      frameT += dt;

      if (modeRef.current === 'run') {
        vy -= 1900 * dt;
        y = Math.max(0, y + vy * dt);
        if (y === 0 && vy < 0) vy = 0;
        speed = Math.min(640, speed + 9 * dt);
        score += dt * 10 * (speed / 260);
        spawn -= dt;
        if (spawn <= 0) {
          const wide = Math.random() < 0.3;
          const s = wide ? BUG_PX + 1 : BUG_PX;
          obstacles.push({ x: W + 20, w: 8 * s, h: BUG.length * s, wide });
          spawn = (0.85 + Math.random() * 0.9) * (300 / speed) + 0.25;
        }
        for (const o of obstacles) o.x -= speed * dt;
        obstacles = obstacles.filter((o) => o.x + o.w > -10);
        // hit test with a forgiving box around his body
        const px = 70 + 14;
        const pw = SPR_W - 30;
        const top = GROUND - y - FOOT + 12;
        const bottom = GROUND - y - 4;
        for (const o of obstacles) {
          if (px < o.x + o.w - 3 && px + pw > o.x + 3 && bottom > GROUND - o.h + 3 && top < GROUND) {
            overAt = performance.now();
            const final = Math.floor(score);
            if (final > bestRef.current) {
              bestRef.current = final;
              setBest(final);
              try { localStorage.setItem('rungame:best', String(final)); } catch { /* ignore */ }
            }
            set('over');
          }
        }
      }

      // draw
      if (!mono) { ink = col('--text', ink); accent = col('--accent', accent); muted = col('--muted', muted); }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = muted;
      for (const s of stars) {
        if (modeRef.current === 'run') { s.x -= speed * 0.08 * dt; if (s.x < 0) s.x = W; }
        ctx.globalAlpha = 0.45;
        ctx.fillRect(s.x, s.y, s.s, s.s);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = ink;
      ctx.fillRect(0, GROUND, W, 3);
      for (let i = 0; i < 24; i++) ctx.fillRect(((i * 53 - (modeRef.current === 'run' ? (frameT * speed) % 53 : 0)) + W) % W, GROUND + 10 + (i % 3) * 8, 14, 2);
      for (const o of obstacles) drawBug(o.x, GROUND, o.wide);
      const runFrame = modeRef.current === 'run' && y === 0 ? (Math.floor(frameT * 9) % 2 ? 'runB' : 'runA') : 'runA';
      drawSprite(runFrame, 70, GROUND - y - FOOT);
      ctx.fillStyle = ink;
      ctx.font = '700 14px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${String(Math.floor(score)).padStart(5, '0')}   best ${String(bestRef.current).padStart(5, '0')}`, W - 14, 24);
      ctx.textAlign = 'center';
      if (modeRef.current === 'idle') { ctx.font = '700 15px ui-monospace, monospace'; ctx.fillText('Press SPACE or tap to run', W / 2, 90); }
      if (modeRef.current === 'over') {
        ctx.font = '900 22px ui-monospace, monospace';
        ctx.fillText('GAME OVER', W / 2, 82);
        ctx.font = '700 13px ui-monospace, monospace';
        ctx.fillText('SPACE or tap to try again', W / 2, 106);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointer);
    };
  }, [mono]);

  return (
    <div className="rg">
      <canvas ref={ref} className="rg-canvas" role="img" aria-label={`Endless runner game. ${mode === 'run' ? 'Running.' : 'Press space or tap to start.'} Best score ${best}.`} tabIndex={0} />
      <p className="rg-help">Jump the bugs: Space, Up arrow, or tap.</p>
    </div>
  );
}
