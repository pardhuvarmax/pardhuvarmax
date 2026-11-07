// Interactive dot grid: dots near the cursor lift, grow, brighten and push outward (a soft lens),
// then ease back. Shared by the portfolio (React) and the minimal ZenRage page (plain HTML).

export interface DotGridOptions {
  /** CSS custom property holding the dot colour, e.g. "--ink". */
  colorVar: string;
  /** CSS custom property holding the highlight colour near the cursor, e.g. "--accent". */
  accentVar: string;
  spacing?: number; // px between dots
  radius?: number; // px of influence around the cursor
  baseAlpha?: number; // resting dot opacity
  lift?: number; // px a dot is pushed outward at the cursor
  grow?: number; // extra dot radius at the cursor
}

type RGB = [number, number, number];

function readColor(ctx: CanvasRenderingContext2D, cssVar: string, fallback: RGB): RGB {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  if (!raw) return fallback;
  ctx.fillStyle = '#000';
  ctx.fillStyle = raw; // the browser normalises any valid CSS colour
  const v = String(ctx.fillStyle);
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = v.match(/[\d.]+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : fallback;
}

export function initDotGrid(canvas: HTMLCanvasElement, opts: DotGridOptions): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const spacing = opts.spacing ?? 26;
  const R = opts.radius ?? 190;
  const baseAlpha = opts.baseAlpha ?? 0.14;
  const lift = opts.lift ?? 15;
  const grow = opts.grow ?? 2.6;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let ink: RGB = [236, 236, 242];
  let accent: RGB = [200, 24, 61];
  // target = real pointer, pos = eased pointer, presence = 0..1 fade in/out
  const target = { x: -9999, y: -9999, on: false };
  const pos = { x: -9999, y: -9999 };
  let presence = 0;
  let raf = 0;

  const colors = () => {
    ink = readColor(ctx, opts.colorVar, ink);
    accent = readColor(ctx, opts.accentVar, accent);
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    draw();
  };

  function draw() {
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, w, h);
    const cols = Math.ceil(w / spacing) + 1;
    const rows = Math.ceil(h / spacing) + 1;
    const [ir, ig, ib] = ink;
    const active = presence > 0.01;

    // soft pit under the cursor sells the depth
    if (active) {
      const g = ctx!.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, R * 1.15);
      g.addColorStop(0, `rgba(${accent[0]},${accent[1]},${accent[2]},${0.1 * presence})`);
      g.addColorStop(1, `rgba(${accent[0]},${accent[1]},${accent[2]},0)`);
      ctx!.fillStyle = g;
      ctx!.fillRect(pos.x - R * 1.2, pos.y - R * 1.2, R * 2.4, R * 2.4);
    }

    // resting dots in one batch
    ctx!.fillStyle = `rgba(${ir},${ig},${ib},${baseAlpha})`;
    const near: [number, number, number][] = [];
    for (let j = 0; j < rows; j++) {
      const y = j * spacing + spacing / 2;
      for (let i = 0; i < cols; i++) {
        const x = i * spacing + spacing / 2;
        if (active) {
          const dx = x - pos.x;
          const dy = y - pos.y;
          if (dx * dx + dy * dy < R * R) {
            near.push([x, y, 0]);
            continue;
          }
        }
        ctx!.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }

    // dots in the lens, individually styled
    for (const [x, y] of near) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const t = Math.max(0, 1 - d / R);
      const e = t * t * (3 - 2 * t) * presence; // smoothstep falloff
      const push = e * lift;
      const px = x + (dx / d) * push;
      const py = y + (dy / d) * push;
      const r = 0.75 + e * grow;
      const mix = Math.min(1, e * e * 1.6);
      const cr = Math.round(ir + (accent[0] - ir) * mix);
      const cg = Math.round(ig + (accent[1] - ig) * mix);
      const cb = Math.round(ib + (accent[2] - ib) * mix);
      const a = baseAlpha + e * (0.95 - baseAlpha);
      ctx!.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
      ctx!.beginPath();
      ctx!.arc(px, py, r, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  const tick = () => {
    raf = 0;
    colors();
    pos.x += (target.x - pos.x) * 0.2;
    pos.y += (target.y - pos.y) * 0.2;
    presence += ((target.on ? 1 : 0) - presence) * 0.12;
    draw();
    const settled = !target.on && presence < 0.01;
    const moving = Math.abs(target.x - pos.x) > 0.3 || Math.abs(target.y - pos.y) > 0.3;
    if (!settled && (target.on || presence >= 0.01 || moving)) raf = requestAnimationFrame(tick);
    else {
      presence = 0;
      draw();
    }
  };
  const kick = () => {
    if (!raf && !reduce) raf = requestAnimationFrame(tick);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (!target.on) {
      pos.x = e.clientX;
      pos.y = e.clientY;
    }
    target.x = e.clientX;
    target.y = e.clientY;
    target.on = true;
    kick();
  };
  const onLeave = () => {
    target.on = false;
    kick();
  };

  colors();
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  window.addEventListener('blur', onLeave);
  const mo = new MutationObserver(() => {
    colors();
    draw();
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-mode'] });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('mouseleave', onLeave);
    window.removeEventListener('blur', onLeave);
    mo.disconnect();
  };
}
