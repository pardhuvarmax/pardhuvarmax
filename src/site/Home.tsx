import { createPortal } from 'react-dom';
import { siArchlinux, siVoidlinux } from 'simple-icons';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, ArrowUpRight, FileText, Mail } from 'lucide-react';
import { experience, formatDate, honors, news, posts, projects, publications, safeHref, site, skills } from '../lib/content';
import { glow, Reveal, SectionHead } from './Reveal';
import { ProjectCard } from './ProjectsView';
import { PubCard } from './PublicationsView';
import { ResearchBoard } from './ResearchBoard';
import { allPubs } from '../lib/publications';
import { allProjects, homeProjects, repoOf, useGithubStats } from '../lib/projects';
import { SpiderSprite, type Frame } from './spiderman';

const ext = (href: string) => /^https?:/i.test(href);

/** Renders full-screen effects inside the .site root, fixed to the viewport (not clipped to the hero frame). */
function Overlay({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => setHost(document.querySelector('.site') ?? document.body), []);
  return host ? createPortal(children, host) : null;
}

/** Whole-page camera: viewfinder brackets + REC, focus box locks on, white flash across the site, then it disappears. */
function Camera() {
  return (
    <Overlay>
      <motion.div className="cam" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 1, 0] }} transition={{ duration: 1.7, times: [0, 0.07, 0.6, 0.85, 1] }}>
        <i className="cam-c tl" />
        <i className="cam-c tr" />
        <i className="cam-c bl" />
        <i className="cam-c br" />
        <motion.span className="cam-rec" animate={{ opacity: [1, 0.25, 1, 0.25, 1] }} transition={{ duration: 1.1, repeat: 1 }}>
          <b /> REC
        </motion.span>
        <motion.i
          className="cam-focus"
          initial={{ scale: 2.6, opacity: 0 }}
          animate={{ scale: [2.6, 1, 1, 0.9, 1], opacity: [0, 1, 1, 1, 1] }}
          transition={{ duration: 1, times: [0, 0.4, 0.6, 0.75, 1], delay: 0.1 }}
        />
        <motion.i className="cam-flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 0] }} transition={{ duration: 1.2, times: [0, 0.6, 0.66, 1], delay: 0.3 }} />
      </motion.div>
    </Overlay>
  );
}

/** 4 levels per channel + a 4x4 ordered dither = a 64-colour, 8-bit look. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function posterize(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 56;
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, Math.round((px[i + c] + t) / 85) * 85));
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** "Photographs" the site: redraws the top of the viewport (nav, headline, buttons, the current hero media) from the live layout
 *  onto a tiny canvas, then posterizes it. Not a real screenshot, but built from what is actually on screen. */
function captureSite(cv: HTMLCanvasElement) {
  const W = 42;
  const H = 36;
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const root = document.querySelector('.site');
  if (!ctx || !root) return;
  const k = W / window.innerWidth;
  const pill = document.querySelector('.hero .pill');
  const y0 = pill ? Math.max(0, pill.getBoundingClientRect().top - 70) : 0; // frame the shot around the hero content
  const sel = (q: string) => Array.from(document.querySelectorAll(q));
  const rectOf = (el: Element) => el.getBoundingClientRect();
  const fill = (el: Element, color: string, alpha = 1, grow = 0) => {
    const r = rectOf(el);
    if (r.height <= 0 || (r.top - y0) * k > H || r.bottom - y0 < 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(r.left * k) - grow, Math.floor((r.top - y0) * k) - grow, Math.max(1, Math.ceil(r.width * k)) + grow * 2, Math.max(1, Math.ceil(r.height * k)) + grow * 2);
    ctx.globalAlpha = 1;
  };
  const bg = getComputedStyle(root).backgroundColor;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const text = getComputedStyle(root).color;
  for (const el of sel('.nav-links a')) fill(el, text, 0.5);
  for (const el of sel('.brand-mark')) fill(el, getComputedStyle(el).backgroundColor);
  for (const el of sel('.hero .pill')) fill(el, getComputedStyle(el).backgroundColor);
  for (const el of sel('.hero h1')) fill(el, text);
  for (const el of sel('.hero h1 em')) fill(el, getComputedStyle(el).color);
  for (const el of sel('.hero-lede')) fill(el, text, 0.6);
  for (const el of sel('.hero-aff')) fill(el, text, 0.3);
  for (const el of sel('.hero-cta .btn')) fill(el, getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)' ? text : getComputedStyle(el).backgroundColor, 0.85);
  for (const el of sel('.hero-links a')) fill(el, text, 0.45);
  for (const el of sel('.marquee')) fill(el, getComputedStyle(el).backgroundColor);
  // the media frame: accent shadow, then whatever is playing right now
  for (const ring of sel('.photo-ring')) {
    fill(ring, getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#1f4fb8', 1, 1);
    const media = ring.querySelector('video, img') as HTMLVideoElement | HTMLImageElement | null;
    const r = rectOf(ring);
    const sw = media instanceof HTMLVideoElement ? media.videoWidth : media?.naturalWidth || 0;
    const sh = media instanceof HTMLVideoElement ? media.videoHeight : media?.naturalHeight || 0;
    if (media && sw && sh) {
      const dw = Math.max(1, r.width * k);
      const dh = Math.max(1, r.height * k);
      const target = dw / dh;
      let cx = 0, cy = 0, cw = sw, ch = sh;
      if (sw / sh > target) { cw = sh * target; cx = (sw - cw) / 2; } else { ch = sw / target; cy = (sh - ch) / 2; }
      try { ctx.drawImage(media, cx, cy, cw, ch, Math.floor(r.left * k), Math.floor((r.top - y0) * k), Math.ceil(dw), Math.ceil(dh)); } catch { fill(ring, '#444'); }
    } else fill(ring, '#444');
  }
  posterize(ctx, W, H);
}

function ShotCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => ref.current && captureSite(ref.current), 900); // right as the flash fires
    return () => clearTimeout(t);
  }, []);
  return <canvas ref={ref} className="shot" width={42} height={36} />;
}

/** Instant photo that slides in at the corner of the screen after the shutter, showing the 8-bit "capture", then fades. */
function Polaroid() {
  return (
    <Overlay>
      <motion.div
        className="polaroid"
        aria-hidden="true"
        initial={{ y: 260, rotate: 0, opacity: 0 }}
        animate={{ y: [260, 260, 0, 0, 0], rotate: [0, 0, 6, 6, 6], opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 4.2, times: [0, 0.34, 0.46, 0.88, 1], ease: 'easeOut' }}
      >
        <ShotCanvas />
        <b className="cap">click!</b>
      </motion.div>
    </Overlay>
  );
}


/** Pixel web parachute: dome with ribs and rings, scalloped hem, cords converging on his raised hand (svg x=50 is the hand). */
function Canopy() {
  const arc = (r: number) => {
    const pts: string[] = [];
    for (let k = 0; k <= 6; k++) {
      const a = Math.PI + (k / 6) * Math.PI;
      pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(40 + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const hem: [number, number][] = [[4, 40], [27, 47], [50, 40], [73, 47], [96, 40]];
  const stroke = { stroke: '#f2f2ee', fill: 'none', strokeWidth: 3, shapeRendering: 'crispEdges' as const };
  return (
    <svg className="canopy" width="100" height="86" viewBox="0 0 100 86" aria-hidden="true">
      <polyline {...stroke} points={arc(46)} />
      <polyline {...stroke} points={arc(30)} />
      <polyline {...stroke} points={arc(15)} />
      {[1, 2, 3, 4, 5].map((k) => {
        const a = Math.PI + (k / 6) * Math.PI;
        return <line key={k} {...stroke} x1="50" y1="40" x2={50 + 46 * Math.cos(a)} y2={40 + 46 * Math.sin(a)} />;
      })}
      <polyline {...stroke} points={hem.map((p) => p.join(',')).join(' ')} />
      {hem.filter((_, i) => i !== 2).map((p, i) => (
        <line key={`c${i}`} {...stroke} strokeWidth={2} x1={p[0]} y1={p[1]} x2="50" y2="86" />
      ))}
    </svg>
  );
}

/** Whole-page web: a web shot streaks across the screen and spreads into a corner cobweb. Spider-Man floats down under a web
 *  parachute, halfway the parachute pops, he falls, bounces, glances both ways and runs off. Everything then fades. */
const WEB_DIRS: [number, number][] = [[-1, 0], [-0.92, 0.38], [-0.71, 0.71], [-0.38, 0.92], [0, 1]];
const BURST = Array.from({ length: 12 }, (_, k) => {
  const a = (k / 12) * Math.PI * 2;
  return { x: Math.cos(a) * (70 + (k % 3) * 25), y: Math.sin(a) * (70 + (k % 3) * 25) };
});

function Web() {
  const [d] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [frame, setFrame] = useState<Frame>('hang');
  const [popped, setPopped] = useState(false);
  useEffect(() => {
    // absolute ms from the start of the effect (his descent starts at 900ms)
    const timers: number[] = [];
    const T = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    let flail: number | undefined;
    let run: number | undefined;
    const alternate = (every: number) => {
      let on = false;
      return window.setInterval(() => setFrame((on = !on) ? 'runA' : 'runB'), every);
    };
    T(3400, () => { setPopped(true); flail = alternate(90); }); // parachute pops, he flails while falling
    T(4400, () => { if (flail) clearInterval(flail); setFrame('look-left'); });
    T(5200, () => setFrame('look-right'));
    T(6000, () => setFrame('alert'));
    T(6600, () => { run = alternate(120); });
    T(8900, () => { if (run) clearInterval(run); });
    return () => { timers.forEach(clearTimeout); if (flail) clearInterval(flail); if (run) clearInterval(run); };
  }, []);

  const R = Math.min(d.w, d.h) * 0.36;
  const pt = (r: number, v: [number, number]) => `${d.w + r * v[0]},${r * v[1]}`;
  const line = { stroke: '#fff', fill: 'none', vectorEffect: 'non-scaling-stroke' as const, shapeRendering: 'crispEdges' as const };
  // sprite bottom = y - 22 (dangler top -130 + 108px sprite), so these are chosen to put his feet where we want them
  const mid = d.h * 0.55 + 22; // parachute pops when his feet are ~55% down the screen
  const base = d.h + 18; // feet on the bottom edge of the view
  const burstX = d.w * 0.07 + 28;
  const burstY = mid - 150; // where the canopy was
  return (
    <Overlay>
      <motion.div className="web" aria-hidden="true" initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ duration: 9.8, times: [0, 0.92, 1] }}>
        <svg viewBox={`0 0 ${d.w} ${d.h}`}>
          <motion.line
            {...line}
            x1={0}
            y1={d.h}
            x2={d.w - 24}
            y2={24}
            strokeWidth={8}
            strokeDasharray="16 8"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 1, 0] }}
            transition={{ pathLength: { delay: 0.1, duration: 0.45, ease: 'easeIn' }, opacity: { delay: 0.1, duration: 1.2, times: [0, 0.65, 1] } }}
          />
          {WEB_DIRS.map((v, k) => (
            <motion.line
              {...line}
              key={`r${k}`}
              x1={d.w}
              y1={0}
              x2={d.w + R * v[0]}
              y2={R * v[1]}
              strokeWidth={4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.55 + k * 0.05, duration: 0.3 }}
            />
          ))}
          {[0.32, 0.64, 1].map((f, k) => (
            <motion.polyline
              {...line}
              key={`c${f}`}
              points={WEB_DIRS.map((v) => pt(R * f, v)).join(' ')}
              strokeWidth={4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.75 + k * 0.14, duration: 0.35 }}
            />
          ))}
        </svg>

        <motion.div
          className="dangler"
          initial={{ y: 0, x: 0 }}
          animate={{ y: [0, mid, mid, base, base - 30, base, base], x: [0, 0, d.w + 160] }}
          transition={{
            y: { duration: 8, delay: 0.9, times: [0, 0.3, 0.3125, 0.3875, 0.4125, 0.4375, 1], ease: ['linear', 'linear', 'easeIn', 'easeOut', 'easeIn', 'linear'] },
            x: { duration: 8, delay: 0.9, times: [0, 0.7125, 1], ease: 'easeIn' },
          }}
        >
          <motion.div
            className="swayer"
            animate={{ rotate: [-5, 5, -5, 5, 0, 0] }}
            transition={{ duration: 8, delay: 0.9, times: [0, 0.1, 0.2, 0.3, 0.3125, 1], ease: 'easeInOut' }}
          >
            {!popped && (
              <motion.div className="canopy-wrap" initial={{ scale: 1 }} animate={{ scale: [1, 1, 1.18] }} transition={{ duration: 2.5, delay: 0.9, times: [0, 0.94, 1] }}>
                <Canopy />
              </motion.div>
            )}
            <SpiderSprite frame={frame} />
          </motion.div>
        </motion.div>

        {popped && (
          <div className="burst" style={{ left: burstX, top: burstY }}>
            <motion.i className="burst-ring" initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} />
            {BURST.map((p, k) => (
              <motion.i
                key={k}
                className="burst-bit"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: p.y + 40, opacity: [1, 1, 0], scale: [1, 1, 0.4] }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </Overlay>
  );
}

/** 8px pixel bullet: starts small at the rifle, grows as it flies toward the viewer and exits the left of the screen. */
function Bullet() {
  const ref = useRef<HTMLDivElement>(null);
  const [to, setTo] = useState<{ x: number; y: number; deg: number } | null>(null);
  useEffect(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = -(r.left + 520);
    const y = Math.min(window.innerHeight - r.top, 520) * 0.55;
    setTo({ x, y, deg: (Math.atan2(y, x) * 180) / Math.PI });
  }, []);
  return (
    <motion.div
      ref={ref}
      className="bullet"
      aria-hidden="true"
      style={{ rotate: to ? to.deg : 180 }}
      initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
      animate={to ? { x: to.x, y: to.y, scale: 10 } : undefined}
      transition={{ duration: 1, ease: [0.55, 0.05, 0.95, 0.55], delay: 0.15 }}
    />
  );
}

function MediaFrame() {
  const [i, setI] = useState(0);
  const items = site.media;
  const m = items[i];
  const next = () => setI((n) => (n + 1) % items.length);
  const reduce = useReducedMotion();
  const bullet = m.effect === 'bullet' && !reduce;
  const camera = m.effect === 'camera' && !reduce;
  const web = m.effect === 'web' && !reduce;
  return (
    <figure className="media">
      <div className="media-stage">
      <button className="photo-ring" onClick={next} aria-label={`Show next media, ${i + 1} of ${items.length}`}>
        <AnimatePresence mode="wait">
          {m.type === 'video' ? (
            <motion.video
              key={i}
              src={safeHref(m.src)}
              autoPlay
              loop
              muted
              playsInline
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            />
          ) : (
            <motion.img
              key={i}
              src={safeHref(m.src)}
              alt={site.name}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
        {camera && <Camera key={`cam-${i}`} />}
        {web && <Web key={`web-${i}`} />}
        <span className="media-count">{m.type === 'video' ? 'VIDEO' : 'PHOTO'} {i + 1}/{items.length} · CLICK</span>
      </button>
      {bullet && <Bullet key={`bullet-${i}`} />}
      {camera && <Polaroid key={`pol-${i}`} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          className="pop"
          role="status"
          initial={reduce ? false : { scale: 0, rotate: -16, opacity: 0 }}
          animate={{ scale: 1, rotate: -4, opacity: 1 }}
          exit={reduce ? undefined : { scale: 0, rotate: 10, opacity: 0, transition: { duration: 0.12 } }}
          transition={{ type: 'spring', stiffness: 520, damping: 13, delay: reduce ? 0 : bullet ? 1.2 : camera ? 1.05 : web ? 1.3 : 0.14 }}
        >
          <motion.span
            className="pop-in"
            animate={reduce ? undefined : { y: [0, -5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {m.pop}
          </motion.span>
        </motion.div>
      </AnimatePresence>
      </div>
    </figure>
  );
}

/** A link that, when it has `pop` text, shows an 8-bit comic bubble on click instead of navigating (e.g. a link to this very site). */
function PopLink({ link, children, external = true }: { link: { label: string; href: string; pop?: string }; children: React.ReactNode; external?: boolean }) {
  const msgs = (link.pop ?? '').split('|').map((m) => m.trim()).filter(Boolean);
  const [tick, setTick] = useState(0);
  const [show, setShow] = useState(false);
  const timer = useRef<number>();
  const reduce = useReducedMotion();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (!msgs.length) {
    return <a href={safeHref(link.href)} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
  }
  return (
    <span className="pop-anchor">
      <a
        href={safeHref(link.href)}
        onClick={(e) => {
          e.preventDefault();
          setTick((t) => t + 1);
          setShow(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setShow(false), 2800);
        }}
      >
        {children}
      </a>
      <AnimatePresence>
        {show && (
          <motion.span
            key={tick}
            className="link-pop"
            role="status"
            initial={reduce ? false : { scale: 0, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: -3, opacity: 1 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 13 }}
          >
            <span className="pop-in">{msgs[(tick - 1) % msgs.length]}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const words = site.name.split(' ');
  const first = words.slice(0, -2).join(' ');
  const last = words.slice(-2).join(' ');
  const item = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section id="about" className="hero wrap">
      <div className="hero-copy">
        <motion.span className="pill" {...item(0)}>
          <i className="dot" /> {site.role} &middot; {site.location}
        </motion.span>
        <motion.h1 {...item(1)}>
          {first}
          <br />
          <em>{last}</em>
        </motion.h1>
        <motion.p className="hero-lede" {...item(2)}>{site.headline}</motion.p>
        <motion.p className="hero-aff" {...item(3)}>{site.affiliation}</motion.p>
        <motion.div className="hero-cta" {...item(4)}>
          <a className="btn btn-primary" href={`mailto:${site.email}`}><Mail size={16} /> Get in touch</a>
          <a className="btn" href={site.cvUrl} target="_blank" rel="noopener noreferrer"><FileText size={16} /> Curriculum vitae</a>
          <Link className="btn btn-ghost" to="/blog">Read the blog <ArrowRight size={16} /></Link>
        </motion.div>
      </div>

      <motion.div
        className="hero-visual"
        initial={reduce ? false : { opacity: 0, scale: 0.92, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <MediaFrame />
        <ul className="hero-links" aria-label="Profiles">
          {site.links.map((l) => (
            <li key={l.label}>
              <PopLink link={l}>{l.label}<ArrowUpRight size={14} /></PopLink>
            </li>
          ))}
        </ul>
      </motion.div>
      <button
        className={`scroll-cue ${scrolled ? 'is-hidden' : ''}`}
        aria-label="Scroll down"
        tabIndex={scrolled ? -1 : 0}
        onClick={() => document.querySelector('.marquee')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      >
        <span>scroll</span>
        <i><ArrowDown size={20} strokeWidth={3} /></i>
      </button>
    </section>
  );
}

function Marquee() {
  const row = [...site.keywords, ...site.keywords];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row.map((k, i) => (
          <span key={i}>{k}<i /></span>
        ))}
      </div>
    </div>
  );
}

export function About() {
  return (
    <section className="wrap sec">
      <div className="about-grid">
        <Reveal className="about-text">
          {site.bio.map((p, i) => <p key={i}>{p}</p>)}
        </Reveal>
        <div className="stats">
          {site.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.07} className="stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The real Arch Linux and Void Linux marks, from the simple-icons package. */
function ArchLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill={`#${siArchlinux.hex}`} d={siArchlinux.path} />
    </svg>
  );
}
function VoidLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill={`#${siVoidlinux.hex}`} d={siVoidlinux.path} />
    </svg>
  );
}

export function Research() {
  return (
    <section id="research" className="wrap sec">
      <SectionHead kicker="01 · Research" title={<>What I <em>study</em></>}>
        {site.researchStatement[0]}
      </SectionHead>
      <ResearchBoard
        extra={(t) =>
          /arch/i.test(t) && /void/i.test(t) ? (
            <span className="distro-logos" aria-hidden="true">
              <i className="distro arch"><ArchLogo /></i>
              <i className="distro void"><VoidLogo /></i>
            </span>
          ) : null
        }
      />
      {site.researchStatement.slice(1).map((p, i) => (
        <Reveal key={i}><p className="prose-p">{p}</p></Reveal>
      ))}
    </section>
  );
}

export function Publications() {
  return (
    <section id="publications" className="wrap sec">
      <SectionHead kicker="02 · Publications" title={<>Papers &amp; <em>preprints</em></>} />
      <ol className="pubs">
        {allPubs.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.06}>
            <PubCard p={p} />
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

export function Experience() {
  const rows = [
    ...experience.experience.map((e) => ({ k: e.role, sub: e.org, dates: e.dates, points: e.points })),
    ...experience.education.map((e) => ({ k: e.degree, sub: `${e.school} · ${e.note}`, dates: e.dates, points: [] as string[] })),
  ];
  return (
    <section id="experience" className="wrap sec">
      <SectionHead kicker="03 · Experience" title={<>Education &amp; <em>experience</em></>} />
      <div className="timeline">
        {rows.map((r, i) => (
          <Reveal key={r.k} delay={i * 0.05} className="tl-item">
            <span className="tl-dot" aria-hidden="true" />
            <div className="tl-dates">{r.dates}</div>
            <h3>{r.k}</h3>
            <div className="tl-sub">{r.sub}</div>
            {r.points.length > 0 && <ul>{r.points.map((p) => <li key={p}>{p}</li>)}</ul>}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Projects() {
  const stats = useGithubStats();
  return (
    <section id="projects" className="wrap sec">
      <SectionHead kicker="04 · Projects" title={<>Open-source <em>systems</em></>}>
        Research code and systems software, built in the open.
      </SectionHead>
      <div className="cards">
        {homeProjects().map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 0.06}>
            <ProjectCard p={p} stats={stats[repoOf(p.url) ?? '']} />
          </Reveal>
        ))}
      </div>
      <Reveal>
        <div className="more-links">
          <Link className="link-arrow more" to="/projects">All {allProjects.length} projects <ArrowRight size={15} /></Link>
          <a className="link-arrow more" href={site.links[0].href} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={15} /></a>
        </div>
      </Reveal>
    </section>
  );
}

function Writing() {
  const latest = posts.slice(0, 3);
  return (
    <section id="writing" className="wrap sec">
      <SectionHead kicker="05 · Writing" title={<>From the <em>blog</em></>}>
        Working notes on systems, security and learned systems.
      </SectionHead>
      {latest.length === 0 ? (
        <p className="muted">No posts yet.</p>
      ) : (
        <div className="posts">
          {latest.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <Link to={`/blog/${p.slug}`} className="post-card glow" onPointerMove={glow}>
                <div className="post-meta">{formatDate(p.date)} · {p.minutes} min read</div>
                <h3>{p.title}</h3>
                <p>{p.summary}</p>
                <span className="link-arrow">Read <ArrowRight size={15} /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
      <Reveal><Link className="link-arrow more" to="/blog">All posts <ArrowRight size={15} /></Link></Reveal>
    </section>
  );
}

function Recognition() {
  return (
    <section id="honors" className="wrap sec">
      <SectionHead kicker="06 · Recognition" title={<>Honors, certifications &amp; <em>skills</em></>} />
      <div className="two-col">
        <Reveal>
          <h3 className="col-h">Honors</h3>
          <ul className="rows">
            {honors.honors.map((h) => (
              <li key={h.title}>
                <div><strong>{h.title}</strong>{h.detail && <span className="muted"> — {h.detail}</span>}</div>
                <span className="muted nowrap">{h.date}</span>
              </li>
            ))}
          </ul>
          <h3 className="col-h">Latest</h3>
          <ul className="rows">
            {news.items.map((n) => (
              <li key={n.text}><div>{n.text}</div><span className="muted nowrap">{formatDate(n.date)}</span></li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.08}>
          <h3 className="col-h">Certifications</h3>
          <ul className="rows">
            {honors.certs.map((c) => (
              <li key={c.name}><div>{c.name}</div><span className="muted nowrap">{c.issuer}</span></li>
            ))}
          </ul>
        </Reveal>
      </div>
      <Reveal>
        <h3 className="col-h">Technical skills</h3>
        <dl className="skills">
          {skills.groups.map((g) => (
            <div key={g.label}>
              <dt>{g.label}</dt>
              <dd>{g.items.split(',').map((s) => <span key={s} className="chip">{s.trim()}</span>)}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="wrap sec">
      <Reveal className="cta">
        <span className="kicker">07 · Contact</span>
        <h2>Let&rsquo;s <em>talk</em>.</h2>
        <p>{site.contactText}</p>
        <a className="btn btn-primary btn-lg" href={`mailto:${site.email}`}><Mail size={18} /> {site.email}</a>
        <ul className="cta-links">
          {site.links.map((l) => (
            <li key={l.label}><PopLink link={l} external={ext(l.href)}>{l.label}</PopLink></li>
          ))}
          <li><a href="https://zenrage.pardhuvarma.tech">ZenRage</a></li>
        </ul>
      </Reveal>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    document.title = `${site.name} | Researcher`;
  }, []);
  return (
    <main>
      <Hero />
      <Marquee />
      <About />
      <Research />
      <Publications />
      <Experience />
      <Projects />
      <Writing />
      <Recognition />
      <Contact />
    </main>
  );
}
