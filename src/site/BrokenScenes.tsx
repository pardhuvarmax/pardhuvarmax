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
function Seq({ steps, ms }: { steps: [Frame, number][]; ms: number }) {
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
      {steps.map(([f], i) => (
        <div key={i} className="bs-fl" ref={(el) => { refs.current[i] = el; }} style={{ opacity: i === 0 ? 1 : 0 }}>
          <SpiderSprite frame={f} />
        </div>
      ))}
    </>
  );
}


/* ---------- 500: he pulls the plug out, the screen dies, he shrugs, then pushes it back in ---------- */
const SOCKET = ['WWWWWWWW', 'WKKWWKKW', 'WKKWWKKW', 'WKKWWKKW', 'WWWWWWWW'];
const PLUG = ['..GG..GG..', '..GG..GG..', 'GGGGGGGGGG', 'GGGGGGGGGG', 'GGGGGGGGGG', '..GGGGGG..', '...GGGG...'];
const CABLE_ON = 'M75 104 C 90 196, 270 196, 352 144';
const CABLE_OUT = 'M75 104 C 90 196, 226 196, 308 144';
const S500: [Frame, number][] = [['look-right', 0], ['reach', 0.14], ['brace', 0.27], ['shrug', 0.42], ['reach', 0.66], ['brace', 0.7], ['alert', 0.8]];
export function Scene500() {
  return (
    <div className="bs bs500" aria-hidden="true">
      <Bubble style={{ left: 130, top: 0 }}>Have you tried turning it off and on again?</Bubble>
      <div className="bs-mon"><div className="bs-mon-in"><span>500</span></div></div>
      <svg className="bs-cable" viewBox="0 0 440 210">
        <path fill="none" stroke="#f2f2f2" strokeWidth="5" strokeLinecap="round" d={CABLE_ON}>
          <animate attributeName="d" dur="8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.3;0.36;0.7;0.76;1" keySplines="0 0 1 1;0.1 0.9 0.2 1;0 0 1 1;0.5 0 0.3 1;0 0 1 1" values={`${CABLE_ON};${CABLE_ON};${CABLE_OUT};${CABLE_OUT};${CABLE_ON};${CABLE_ON}`} />
        </path>
      </svg>
      <PixelArt className="bs-socket" rows={SOCKET} palette={GREY} cell={5} />
      <i className="bs-spark a" /><i className="bs-spark b" /><i className="bs-spark c" />
      <i className="bs-spark d" /><i className="bs-spark e" /><i className="bs-spark f" />
      <div className="bs-pullers">
        <PixelArt className="bs-plug" rows={PLUG} palette={GREY} cell={4} />
        <div className="bs-sp"><Seq steps={S500} ms={8000} /></div>
      </div>
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

/* ---------- 401: disguised, scanning the crowd, pushing his glasses up ---------- */
const GLASSES = ['KKKKKKK', 'K..K..K', 'K..K..K', 'KKKKKKK'];
const MOUSTACHE = ['KKKKK', 'K...K'];
const S401: [Frame, number][] = [['hold-left', 0], ['hold', 0.2], ['hold-right', 0.4], ['hold', 0.7]];
export function Scene401() {
  return (
    <div className="bs bs401" aria-hidden="true">
      <div className="bs-sp bs-guard"><div className="bs-scan">
        <Seq steps={S401} ms={4400} />
        <PixelArt className="bs-over bs-glasses" style={{ left: 36, top: 20 }} rows={GLASSES} palette={GREY} cell={4} />
        <PixelArt className="bs-over" style={{ left: 40, top: 36 }} rows={MOUSTACHE} palette={GREY} cell={4} />
      </div></div>
      <div className="bs-board">
        <div className="bs-board-b">WHO ARE<br />UH??</div>
        <div className="bs-stick" />
      </div>
    </div>
  );
}

/* ---------- 429: treadmill. The speed is driven frame by frame so it eases down instead of jumping ---------- */
export function Scene429({ progress, done }: { progress: number; done: boolean }) {
  const belt = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const rest = useRef<HTMLDivElement>(null);
  const aim = useRef({ progress, done });
  aim.current = { progress, done };

  useEffect(() => {
    const show = (el: HTMLElement | null, on: boolean) => { if (el) el.style.opacity = on ? '1' : '0'; };
    if (reduced()) { show(a.current, false); show(rest.current, true); return; }
    let speed = 1, phase = 0, last = performance.now(), raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { progress: p, done: d } = aim.current;
      const target = d ? 0 : 1 - 0.82 * Math.pow(p, 1.4);
      speed += (target - speed) * Math.min(1, dt * 2.2);
      phase += dt * 7 * speed;
      const idle = speed < 0.07;
      const tired = !idle && speed < 0.3; // too slow to run: arms hang
      show(a.current, !idle && !tired && Math.floor(phase) % 2 === 0);
      show(b.current, !idle && !tired && Math.floor(phase) % 2 === 1);
      show(rest.current, idle || tired);
      if (belt.current) belt.current.style.backgroundPositionX = `${-phase * 14}px`;
      if (body.current) body.current.style.transform = `translateY(${Math.round(-Math.abs(Math.sin(phase * Math.PI)) * 3 * speed) }px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const wet = done ? 0 : 0.25 + progress * 0.75;
  return (
    <div className="bs bs429" aria-hidden="true">
      <Bubble style={{ left: 6, top: 2 }}>{done ? 'Okay. Go.' : 'Whoa. Breathe.'}</Bubble>
      <div className="bs-run">
        <div className="bs-sp" ref={body}>
          <div className="bs-fl" ref={a}><SpiderSprite frame="runA" /></div>
          <div className="bs-fl" ref={b} style={{ opacity: 0 }}><SpiderSprite frame="runB" /></div>
          <div className="bs-fl" ref={rest} style={{ opacity: 0 }}><SpiderSprite frame={done ? 'alert' : 'shrug'} /></div>
        </div>
        <i className="bs-sweat s1" style={{ '--w': wet } as CSSProperties} /><i className="bs-sweat s2" style={{ '--w': wet } as CSSProperties} /><i className="bs-sweat s3" style={{ '--w': wet } as CSSProperties} />
        <i className="bs-puff" style={{ '--w': done ? 0 : Math.max(0, progress - 0.3) } as CSSProperties} />
      </div>
      <div className="bs-belt" ref={belt} />
      <div className="bs-belt-legs" />
    </div>
  );
}

/* ---------- offline: a tin-can phone with a cut string ---------- */
const CAN = ['.WWWWWW.', 'WGGGGGGW', '.GGGGGG.', '.GGWGGG.', '.GGWGGG.', '.GGGGGG.', '.GGGGGG.', 'WGGGGGGW', '.WWWWWW.'];
const SHOUTS = ['HELLO??', 'ANYONE??', 'HELLOOO??'];
const STRING_A = 'M162 146 Q 280 196 398 152';
const STRING_B = 'M162 146 Q 280 188 398 152';
const SOFF: [Frame, number][] = [['look-right', 0], ['shout', 0.08], ['look-right', 0.5]];
export function SceneOffline({ online = false }: { online?: boolean }) {
  const [i, setI] = useState(0);
  return (
    <div className="bs bsoff" aria-hidden="true">
      <Bubble className={online ? 'say-once' : 'say'} style={{ left: 120, top: 8 }}>
        <span onAnimationIteration={online ? undefined : () => setI((v) => (v + 1) % SHOUTS.length)} className="bs-say">{online ? 'Loud and clear!' : SHOUTS[i]}</span>
      </Bubble>
      <svg className="bs-string" viewBox="0 0 440 210">
        {online ? (
          <>
            <path d={STRING_A} fill="none" stroke="#e8e8e8" strokeWidth="2">
              <animate attributeName="d" dur="0.5s" repeatCount="indefinite" values={`${STRING_A};${STRING_B};${STRING_A}`} />
            </path>
            <circle r="3.5" fill="#fff"><animateMotion dur="1.1s" repeatCount="indefinite" path={STRING_A} /></circle>
          </>
        ) : (
          <g className="bs-frayed" fill="none" stroke="#e8e8e8" strokeWidth="2">
            <path d="M162 146 Q 240 180 312 154" /><path d="M312 154 l9 -5 M312 154 l10 4 M312 154 l6 11" />
          </g>
        )}
      </svg>
      {!online && <><i className="bs-wave w1" /><i className="bs-wave w2" /><i className="bs-wave w3" /></>}
      <div className="bs-sp bs-talk">{online ? <div className="bs-fl" style={{ opacity: 1 }}><SpiderSprite frame="alert" /></div> : <Seq steps={SOFF} ms={3200} />}</div>
      <PixelArt className="bs-can bs-can-l" rows={CAN} palette={GREY} cell={4} style={{ left: 126, top: 128 }} />
      {online && <PixelArt className="bs-can bs-pop" rows={CAN} palette={GREY} cell={4} style={{ left: 398, top: 134 }} />}
    </div>
  );
}

/* ---------- 503: lunch break, one slice at a time ---------- */
const PIZ = [
  ['CCCCCCCCCC', 'CCCCCCCCCC', '.YYYYYYYY.', '.YPYYYYPY.', '..YYYYYY..', '..YYPYYY..', '...YYYY...', '...YYPY...', '....YY....', '.....Y....'],
  ['..CCCCCCCC', '..CCCCCCCC', '..YYYYYYY.', '..YYYYYPY.', '..YYYYYY..', '..YYPYYY..', '...YYYY...', '...YYPY...', '....YY....', '.....Y....'],
  ['CCCC......', 'CCCC......', '..........', '..........', '..........', '..........', '..........', '....YY....', '....YY....', '.....Y....'],
  ['..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........'],
];
const S503: [Frame, number][] = [['sit', 0], ['sit-left', 0.28], ['eat', 0.56], ['sit', 0.96]];
export function Scene503() {
  return (
    <div className="bs bs503" aria-hidden="true">
      <Bubble style={{ left: 6, top: 2 }}>Lunch break. Back soon.</Bubble>
      <div className="bs-beam" />
      <div className="bs-sp bs-sit"><div className="bs-chew"><Seq steps={S503} ms={3000} /></div></div>
      <div className="bs-pizza">
        <div className="bs-bite">
          {PIZ.map((rows, i) => (
            <div key={i} className="bs-fl on4" style={{ animationDuration: '12s', animationDelay: i ? `${-(12 - i * 3)}s` : '0s' }}><PixelArt rows={rows} palette={GREY} cell={3} /></div>
          ))}
        </div>
        <i className="bs-steam a" /><i className="bs-steam b" /><i className="bs-steam c" />
      </div>
      <svg className="bs-hang" viewBox="0 0 440 210"><g stroke="#e8e8e8" strokeWidth="2"><line x1="252" y1="160" x2="252" y2="178" /><line x1="322" y1="160" x2="322" y2="178" /></g></svg>
      <div className="bs-closed">BACK SOON</div>
    </div>
  );
}
