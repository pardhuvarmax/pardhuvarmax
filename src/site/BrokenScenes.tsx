import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { SpiderSprite, type Frame } from './spiderman';

/* Little pixel-art scenes for the error pages. Everything is black and white; Spider-Man is the only colour. */

export function PixelArt({ rows, palette, cell = 4, className, style }: { rows: string[]; palette: Record<string, string>; cell?: number; className?: string; style?: CSSProperties }) {
  const w = Math.max(...rows.map((r) => r.length));
  return (
    <svg className={className} style={style} width={w * cell} height={rows.length * cell} viewBox={`0 0 ${w * cell} ${rows.length * cell}`} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) => [...row].map((ch, x) => (ch === '.' ? null : <rect key={`${x},${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={palette[ch]} />)))}
    </svg>
  );
}

export function Bubble({ children, style, className = '' }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return <div className={`bs-bubble ${className}`} style={style}>{children}</div>;
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GREY = { W: '#f2f2f2', G: '#9a9a9a', D: '#3a3a3a', K: '#000000', Y: '#ffffff', C: '#cfcfcf', P: '#7a7a7a' };

/** Plays a sequence of Spider-Man poses on a loop: [pose, start] pairs, `start` being a fraction of `ms`. Each pose is held until the next starts,
 *  so his arms and legs actually move (no rotating pixel art). Runs on the Web Animations API, so it stays in step with the CSS timelines. */
function Seq({ steps, ms }: { steps: [Frame, number, string?, ReactNode?][]; ms: number }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (reduced()) return;
    const eps = 0.0004;
    const anims = steps.map(([, start], i) => {
      const end = i + 1 < steps.length ? steps[i + 1][1] : 1;
      const kf: Keyframe[] = [{ offset: 0, opacity: start <= 0 ? 1 : 0 }];
      if (start > 0) kf.push({ offset: Math.max(0, start - eps), opacity: 0 }, { offset: start, opacity: 1 });
      if (end < 1) kf.push({ offset: end - eps, opacity: 1 }, { offset: end, opacity: 0 });
      kf.push({ offset: 1, opacity: end >= 1 ? 1 : 0 });
      return refs.current[i]?.animate(kf, { duration: ms, iterations: Infinity });
    });
    return () => anims.forEach((a) => a?.cancel());
  }, [ms]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {steps.map(([f, , cls, extra], i) => (
        <div key={i} className={`bs-fl ${cls ?? ''}`} ref={(el) => { refs.current[i] = el; }} style={{ opacity: i === 0 ? 1 : 0 }}>
          <SpiderSprite frame={f} />
          {extra}
        </div>
      ))}
    </>
  );
}


/* ---------- 500: percussive maintenance. He hits the monitor with a wrench until it behaves ---------- */
const S500: [Frame, number][] = [['look-right', 0], ['throwA', 0.08], ['throwB', 0.17], ['look-right', 0.23], ['throwA', 0.33], ['throwB', 0.42], ['look-right', 0.48], ['throwA', 0.58], ['throwB', 0.67], ['shrug', 0.74], ['alert', 0.88]];
export function Scene500({ stale = false }: { stale?: boolean }) {
  return (
    <div className="bs bs500" aria-hidden="true">
      <Bubble style={{ left: 6, top: 2 }}>{stale ? 'New build landed. Let me poke it.' : 'Hold on. I know a trick.'}</Bubble>
      <div className="bs-mon">
        <div className="bs-mon-in">
          <span>500</span>
          {stale && (
            <div className="bs-site">
              <b /><u /><u /><u /><s /><s /><s />
            </div>
          )}
        </div>
      </div>
      <div className="bs-mon-neck" /><div className="bs-mon-foot" />
      <i className="bs-smoke a" /><i className="bs-smoke b" /><i className="bs-smoke c" />
      <div className="bs-sp"><Seq steps={S500} ms={8000} /></div>
      <div className="bs-wrench"><i /></div>
    </div>
  );
}

/* ---------- 403: he webs a NO ENTRY sign up, runs over, taps it twice, runs back ---------- */
const NOPES = ['Nope. Taped off.', 'Still no.', 'Read the sign.', 'Tap tap. Solid.'];
const STRANDS = [[250, 52, 200, 0], [392, 52, 440, 0], [250, 132, 214, 190], [392, 132, 440, 176]];
const S403: [Frame, number][] = [['point', 0], ['look-right', 0.1], ['runA', 0.33], ['runB', 0.365], ['runA', 0.4], ['reach', 0.44], ['point', 0.47], ['alert', 0.5], ['point', 0.52], ['alert', 0.55], ['runB', 0.57], ['runA', 0.61], ['runB', 0.65], ['look-right', 0.68]];
const S403_MAD: [Frame, number][] = [['brace', 0], ['throwA', 0.6]];
const CRACKS = ['M50 50 L38 30 L40 12 L30 0', 'M50 50 L66 34 L62 14 L74 0', 'M50 50 L28 56 L12 50 L0 58', 'M50 50 L72 62 L88 56 L100 64', 'M50 50 L44 74 L48 90 L40 100', 'M50 50 L58 72 L70 84 L66 100'];
export function Scene403() {
  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'mad' | 'throw' | 'hit'>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Four taps in a row is too many: he gets angry, then throws the sign at whoever is looking
  const tap = () => {
    if (phase !== 'idle') return;
    const t = taps + 1;
    setTaps(t);
    if (t <= 3) return;
    setPhase('mad');
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    at(1100, () => setPhase('throw'));
    at(1950, () => setPhase('hit'));
    at(3600, () => { setPhase('idle'); setTaps(0); });
  };
  const line = phase === 'mad' ? 'I SAID NO!!' : phase === 'throw' ? 'CATCH!' : phase === 'hit' ? 'Ahem. Sorry.' : NOPES[taps % NOPES.length];
  return (
    <div className={`bs bs403 ${phase !== 'idle' ? phase : ''} ${phase === 'mad' || phase === 'throw' ? 'angry' : ''}`} onClick={tap} role="presentation">
      <Bubble style={{ left: 6, top: 2 }}>{line}</Bubble>
      <svg className="bs-web" viewBox="0 0 440 210" aria-hidden="true">
        {STRANDS.map(([x1, y1, x2, y2], i) => (
          <line key={i} className="bs-strand" pathLength={1} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e8e8e8" strokeWidth="2" />
        ))}
      </svg>
      <div className="bs-sign">NO<br />ENTRY</div>
      <div className="bs-sp bs-walk"><div className="bs-hop"><div className="bs-fl-wrap">
        {phase === 'idle' || phase === 'hit' ? <Seq key={phase} steps={S403} ms={7000} />
          : phase === 'mad' ? <Seq steps={S403_MAD} ms={1100} />
          : <div className="bs-fl" style={{ opacity: 1 }}><SpiderSprite frame="throwB" /></div>}
        <div className="bs-rage"><i /><i /><i /></div>
      </div></div></div>
      {phase === 'hit' && (
        <div className="bs-hit" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="none" stroke="#fff">{CRACKS.map((d) => <path key={d} d={d} vectorEffect="non-scaling-stroke" strokeWidth="3" />)}</g></svg>
        </div>
      )}
    </div>
  );
}

/* ---------- 401: disguised, inspecting you with a magnifying glass ---------- */
const GLASSES = ['KKKKKKK', 'K..K..K', 'K..K..K', 'KKKKKKK'];
const MOUSTACHE = ['KKKKK', 'K...K'];
const S401: [Frame, number][] = [['reach', 0], ['alert', 0.52], ['reach', 0.64]];
export function Scene401() {
  return (
    <div className="bs bs401" aria-hidden="true">
      <div className="bs-sp bs-guard">
        <Seq steps={S401} ms={4400} />
        <PixelArt className="bs-over" style={{ left: 40, top: 20 }} rows={GLASSES} palette={GREY} cell={4} />
        <PixelArt className="bs-over" style={{ left: 44, top: 36 }} rows={MOUSTACHE} palette={GREY} cell={4} />
      </div>
      <div className="bs-mag"><b /><i /></div>
      <div className="bs-board">
        <div className="bs-board-b">WHO ARE<br />UH??</div>
        <div className="bs-stick" />
        <span className="bs-qm q1">?</span><span className="bs-qm q2">?</span><span className="bs-qm q3">?</span>
      </div>
    </div>
  );
}

/* ---------- 429: hamster wheel. The speed is driven frame by frame so it eases down instead of jumping ---------- */
const RUNGS = Array.from({ length: 24 }, (_, k) => (k * Math.PI * 2) / 24);
export function Scene429({ progress, done }: { progress: number; done: boolean }) {
  const wheel = useRef<SVGGElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const rest = useRef<HTMLDivElement>(null);
  const aim = useRef({ progress, done });
  aim.current = { progress, done };

  useEffect(() => {
    const show = (el: HTMLElement | null, on: boolean) => { if (el) el.style.opacity = on ? '1' : '0'; };
    if (reduced()) { show(a.current, false); show(rest.current, true); return; }
    let speed = 1, phase = 0, angle = 0, last = performance.now(), raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { progress: p, done: d } = aim.current;
      const target = d ? 0 : 1 - 0.85 * Math.pow(p, 1.3);
      speed += (target - speed) * Math.min(1, dt * 1.6);
      phase += dt * 7 * speed;
      angle += dt * 150 * speed;
      const idle = speed < 0.06;
      const tired = !idle && speed < 0.3; // too slow to run: he just hangs there
      show(a.current, !idle && !tired && Math.floor(phase) % 2 === 0);
      show(b.current, !idle && !tired && Math.floor(phase) % 2 === 1);
      show(rest.current, idle || tired);
      wheel.current?.setAttribute('transform', `rotate(${angle.toFixed(1)} 110 110)`);
      if (body.current) body.current.style.transform = `translateY(${Math.round(-Math.abs(Math.sin(phase * Math.PI)) * 3 * speed)}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const wet = done ? 0 : 0.25 + progress * 0.75;
  return (
    <div className="bs bs429" aria-hidden="true">
      <Bubble style={{ left: 6, top: 2 }}>{done ? 'Okay. Go.' : 'Whoa. Breathe.'}</Bubble>
      <svg className="bs-wheel" viewBox="0 0 220 220">
        <g ref={wheel}>
          <circle cx="110" cy="110" r="100" fill="none" stroke="#f2f2f2" strokeWidth="5" />
          <circle cx="110" cy="110" r="88" fill="none" stroke="#777" strokeWidth="2" />
          {RUNGS.map((t, k) => <line key={k} x1={110 + Math.cos(t) * 88} y1={110 + Math.sin(t) * 88} x2={110 + Math.cos(t) * 100} y2={110 + Math.sin(t) * 100} stroke="#f2f2f2" strokeWidth="3" />)}
          {[0, 1, 2, 3].map((k) => <line key={k} x1="110" y1="110" x2={110 + Math.cos((k * Math.PI) / 2) * 88} y2={110 + Math.sin((k * Math.PI) / 2) * 88} stroke="#555" strokeWidth="2" />)}
          <circle cx="110" cy="110" r="6" fill="#f2f2f2" />
        </g>
      </svg>
      <div className="bs-run">
        <div className="bs-sp" ref={body}>
          <div className="bs-fl" ref={a}><SpiderSprite frame="runA" /></div>
          <div className="bs-fl" ref={b} style={{ opacity: 0 }}><SpiderSprite frame="runB" /></div>
          <div className="bs-fl" ref={rest} style={{ opacity: 0 }}><SpiderSprite frame={done ? 'alert' : 'shrug'} /></div>
        </div>
        <i className="bs-sweat s1" style={{ '--w': wet } as CSSProperties} /><i className="bs-sweat s2" style={{ '--w': wet } as CSSProperties} /><i className="bs-sweat s3" style={{ '--w': wet } as CSSProperties} />
        <i className="bs-puff" style={{ '--w': done ? 0 : Math.max(0, progress - 0.3) } as CSSProperties} />
      </div>
    </div>
  );
}

/* ---------- offline: the tower looks dead. He tries for a bar (three times), loses it, hurls the phone at you, then panics ---------- */
const TOWER = ['....WW....', '....WW....', '...W..W...', '...WWWW...', '...W..W...', '..W.WW.W..', '..WWWWWW..', '..W.WW.W..', '.W..WW..W.', '.WWWWWWWW.', '.W..WW..W.', 'WWWWWWWWWW'];
const TRY_LINES = ['One bar. Please.', 'Come on...', 'JUST ONE BAR!!'];
const PhoneIn = ({ side }: { side: 'r' | 'l' }) => <div className={`bs-phone-in ${side}`}><div className="bs-bars"><i /><i /><i /><i /></div></div>;
/** One try for signal: he walks one way holding the phone up, stops to check the bars, then walks back. `first` is the way he sets off. */
const tryWalk = (first: 'r' | 'l'): [Frame, number, string?, ReactNode?][] => {
  const out = first === 'r' ? 'wr' : 'wl';
  const back = first === 'r' ? 'wl' : 'wr';
  const phone = (side: 'r' | 'l') => <PhoneIn side={side} />;
  const steps: [Frame, number, string?, ReactNode?][] = [];
  [0, 0.06, 0.12, 0.18, 0.24].forEach((t, i) => steps.push([`${out}${i % 2 ? 'B' : 'A'}` as Frame, t, undefined, phone(first)]));
  steps.push([(first === 'r' ? 'hold-right' : 'hold-left') as Frame, 0.3, undefined, phone(first)]);
  [0.55, 0.61, 0.67, 0.73, 0.79].forEach((t, i) => steps.push([`${back}${i % 2 ? 'B' : 'A'}` as Frame, t, undefined, phone(first === 'r' ? 'l' : 'r')]));
  steps.push([(first === 'r' ? 'hold-left' : 'hold-right') as Frame, 0.85, undefined, phone(first === 'r' ? 'l' : 'r')]);
  return steps;
};
const S_TRY_R = tryWalk('r');
const S_TRY_L = tryWalk('l');
const S_MAD: [Frame, number][] = [['brace', 0], ['throwA', 0.6]];
export function SceneOffline({ online = false }: { online?: boolean }) {
  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'try' | 'mad' | 'throw' | 'hit' | 'panic'>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const state = useRef({ taps, phase });
  state.current = { taps, phase };
  const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Same rhythm as the 403: three tries for signal, and the fourth is one too many
  const tap = () => {
    if (online || state.current.phase !== 'idle') return;
    const t = state.current.taps + 1;
    setTaps(t);
    if (t <= 3) {
      setPhase('try');
      at(2600, () => setPhase('idle'));
      return;
    }
    setPhase('mad');
    at(1200, () => setPhase('throw'));
    at(2050, () => setPhase('hit'));
    at(3700, () => setPhase('panic'));
    at(6300, () => { setPhase('idle'); setTaps(0); });
  };
  const tapRef = useRef(tap);
  tapRef.current = tap;
  // nobody tapping: he keeps trying by himself
  useEffect(() => {
    if (online || reduced()) return;
    const id = setInterval(() => tapRef.current(), 5200);
    return () => clearInterval(id);
  }, [online]);

  const line = online ? 'Got signal!' : phase === 'mad' ? 'NO SIGNAL?? AGAIN??' : phase === 'throw' ? 'TAKE IT!' : phase === 'hit' ? '...' : phase === 'panic' ? 'I BROKE IT!!' : phase === 'try' ? TRY_LINES[Math.min(taps, 3) - 1] : taps === 0 ? 'Tap to help him find signal.' : 'Hmm.';
  return (
    <div className={`bs bsoff ${online ? 'on' : `ph-${phase}`}`} onClick={tap} role="presentation">
      <Bubble className={online ? 'say-once' : ''} style={{ left: 6, top: 2 }}>{line}</Bubble>
      {online ? (
        <>
          <PixelArt className="bs-tower" rows={TOWER} palette={GREY} cell={4} />
          <i className="bs-sig s1" /><i className="bs-sig s2" /><i className="bs-sig s3" />
        </>
      ) : (
        <>
          <PixelArt className="bs-tower dead" rows={TOWER} palette={GREY} cell={4} />
          <span className="bs-x" />
        </>
      )}
      <div className={`bs-sp ${phase === 'try' ? (taps % 2 ? 'walk-r' : 'walk-l') : ''}`}>
        {online ? <div className="bs-fl" style={{ opacity: 1 }}><SpiderSprite frame="hold" /></div>
          : phase === 'try' ? <Seq key={taps} steps={taps % 2 ? S_TRY_R : S_TRY_L} ms={2600} />
          : phase === 'mad' ? <Seq steps={S_MAD} ms={1200} />
          : phase === 'throw' ? <div className="bs-fl" style={{ opacity: 1 }}><SpiderSprite frame="throwB" /></div>
          : phase === 'panic' ? <div className="bs-fl bs-jit" style={{ opacity: 1 }}><SpiderSprite frame="clutch" /></div>
          : <div className="bs-fl" style={{ opacity: 1 }}><SpiderSprite frame="look-right" /></div>}
        <div className="bs-rage"><i /><i /><i /></div>
      </div>
      <div className={`bs-phone ${online ? 'lit' : ''}`}>
        <div className={`bs-bars ${online ? 'lit' : ''}`}><i /><i /><i /><i /></div>
      </div>
      {phase === 'hit' && (
        <div className="bs-hit" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="none" stroke="#fff">{CRACKS.map((d) => <path key={d} d={d} vectorEffect="non-scaling-stroke" strokeWidth="3" />)}</g></svg>
        </div>
      )}
    </div>
  );
}

/* ---------- 503: asleep in a web hammock, until a fly goes past ---------- */
const S503: [Frame, number][] = [['sit', 0], ['sit-sense', 0.52], ['sit-right', 0.66], ['sit', 0.8]];
export function Scene503() {
  return (
    <div className="bs bs503" aria-hidden="true">
      <Bubble style={{ left: 6, top: 2 }}>Shh. Nap time. Back soon.</Bubble>
      <i className="bs-post l" /><i className="bs-post r" />
      <div className="bs-sway">
        <svg className="bs-hammock" viewBox="0 0 440 210"><path d="M44 50 Q 220 230 396 50" fill="none" stroke="#e8e8e8" strokeWidth="3" strokeDasharray="6 3" /><path d="M44 54 Q 220 236 396 54" fill="none" stroke="#777" strokeWidth="2" /></svg>
        <div className="bs-sp bs-sleeper"><Seq steps={S503} ms={8000} /></div>
        <span className="bs-z z1">z</span><span className="bs-z z2">z</span><span className="bs-z z3">Z</span>
      </div>
      <i className="bs-fly" />
      <div className="bs-closed">BACK SOON</div>
    </div>
  );
}
