import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
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
function useCycle<T>(items: T[], ms: number): T {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const id = setInterval(() => setI((v) => (v + 1) % items.length), ms);
    return () => clearInterval(id);
  }, [items.length, ms]);
  return items[i];
}

const GREY = { W: '#f2f2f2', G: '#9a9a9a', D: '#3a3a3a', K: '#000000', Y: '#ffffff', C: '#cfcfcf', P: '#7a7a7a' };

/* ---------- 500: he pulls the plug out and puts it back ---------- */
const SOCKET = ['WWWWWWWW', 'WKKWWKKW', 'WKKWWKKW', 'WKKWWKKW', 'WWWWWWWW'];
const PLUG = ['..GG..GG..', '..GG..GG..', 'GGGGGGGGGG', 'GGGGGGGGGG', 'GGGGGGGGGG', '..GGGGGG..', '...GGGG...'];
export function Scene500() {
  return (
    <div className="bs bs500" aria-hidden="true">
      <Bubble style={{ left: 130, top: 0 }}>Have you tried turning it off and on again?</Bubble>
      <div className="bs-mon"><span>500</span></div>
      <svg className="bs-cable" viewBox="0 0 440 210">
        <path fill="none" stroke="#f2f2f2" strokeWidth="5" strokeLinecap="round" d="M75 104 C 90 196, 270 196, 352 144">
          <animate attributeName="d" dur="6s" repeatCount="indefinite" calcMode="linear" keyTimes="0;0.3;0.38;0.62;0.7;1" values="M75 104 C 90 196, 270 196, 352 144;M75 104 C 90 196, 270 196, 352 144;M75 104 C 90 196, 226 196, 308 144;M75 104 C 90 196, 226 196, 308 144;M75 104 C 90 196, 270 196, 352 144;M75 104 C 90 196, 270 196, 352 144" />
        </path>
      </svg>
      <PixelArt className="bs-socket" rows={SOCKET} palette={GREY} cell={5} />
      <div className="bs-pullers">
        <PixelArt className="bs-plug" rows={PLUG} palette={GREY} cell={4} />
        <div className="bs-sp"><SpiderSprite frame="look-right" /></div>
      </div>
    </div>
  );
}

/* ---------- 403: he webs a NO ENTRY sign to the page and taps it to test it ---------- */
const NOPES = ['Nope. Taped off.', 'Still no.', 'Read the sign.', 'Tap tap. Solid.'];
const F403: Frame[] = ['look-right', 'alert', 'look-right', 'look-left'];
export function Scene403() {
  const [n, setN] = useState(0);
  const frame = useCycle(F403, 1400);
  return (
    <div className="bs bs403" onClick={() => setN((v) => v + 1)} role="presentation">
      <Bubble style={{ left: 6, top: 2 }}>{NOPES[n % NOPES.length]}</Bubble>
      <svg className="bs-web" viewBox="0 0 440 210" aria-hidden="true">
        {[[250, 52, 200, 0], [392, 52, 440, 0], [250, 132, 214, 190], [392, 132, 440, 176]].map(([x1, y1, x2, y2], i) => (
          <g key={i} stroke="#e8e8e8" strokeWidth="2" fill="none"><line x1={x1} y1={y1} x2={x2} y2={y2} /><circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="2.5" fill="#e8e8e8" /></g>
        ))}
      </svg>
      <div className="bs-sign" key={n}>NO<br />ENTRY</div>
      <div className="bs-sp bs-tap"><SpiderSprite frame={frame} /></div>
    </div>
  );
}

/* ---------- 401: disguised, and asking who you are ---------- */
const GLASSES = ['KKKKKKK', 'K..K..K', 'K..K..K', 'KKKKKKK'];
const MOUSTACHE = ['KKKKK', 'K...K'];
const F401: Frame[] = ['look-left', 'look-right', 'look-left', 'alert'];
export function Scene401() {
  const frame = useCycle(F401, 1300);
  return (
    <div className="bs bs401" aria-hidden="true">
      <div className="bs-sp bs-guard">
        <SpiderSprite frame={frame} />
        <PixelArt className="bs-over" style={{ left: 36, top: 20 }} rows={GLASSES} palette={GREY} cell={4} />
        <PixelArt className="bs-over" style={{ left: 40, top: 36 }} rows={MOUSTACHE} palette={GREY} cell={4} />
      </div>
      <div className="bs-board">
        <div className="bs-board-b">WHO ARE<br />UH??</div>
        <div className="bs-stick" />
      </div>
    </div>
  );
}

/* ---------- 429: he runs on a treadmill and runs out of breath ---------- */
export function Scene429({ progress, done }: { progress: number; done: boolean }) {
  const [f, setF] = useState<Frame>('runA');
  const step = Math.round(progress * 10);
  useEffect(() => {
    if (done) { setF('alert'); return; }
    if (reduced()) return;
    const id = setInterval(() => setF((v) => (v === 'runA' ? 'runB' : 'runA')), 80 + progress * 340);
    return () => clearInterval(id);
  }, [done, step]);
  const wet = done ? 0 : 0.35 + progress * 0.65;
  return (
    <div className="bs bs429" aria-hidden="true">
      <Bubble style={{ left: 6, top: 2 }}>{done ? 'Okay. Go.' : 'Whoa. Breathe.'}</Bubble>
      <div className="bs-run">
        <div className="bs-sp"><SpiderSprite frame={f} /></div>
        <i className="bs-sweat s1" style={{ opacity: wet }} /><i className="bs-sweat s2" style={{ opacity: wet }} /><i className="bs-sweat s3" style={{ opacity: wet }} />
      </div>
      <div className={`bs-belt ${done ? 'stop' : ''}`} style={{ animationDuration: `${0.3 + progress * 2.4}s` }} />
      <div className="bs-belt-legs" />
    </div>
  );
}

/* ---------- offline: a tin-can phone with a cut string ---------- */
const CAN = ['.WWWWWW.', 'WGGGGGGW', '.GGGGGG.', '.GGWGGG.', '.GGWGGG.', '.GGGGGG.', '.GGGGGG.', 'WGGGGGGW', '.WWWWWW.'];
const SHOUTS = ['HELLO??', 'ANYONE??', 'HELLOOO??'];
export function SceneOffline({ online = false }: { online?: boolean }) {
  const shout = useCycle(SHOUTS, 1600);
  return (
    <div className="bs bsoff" aria-hidden="true">
      <Bubble className={online ? '' : 'shout'} style={{ left: 120, top: 8 }}>{online ? 'Loud and clear!' : shout}</Bubble>
      <svg className="bs-string" viewBox="0 0 440 210">
        {online ? (
          <path d="M162 146 Q 280 196 398 152" fill="none" stroke="#e8e8e8" strokeWidth="2" />
        ) : (
          <g fill="none" stroke="#e8e8e8" strokeWidth="2"><path d="M162 146 Q 240 180 312 154" /><path d="M312 154 l9 -5 M312 154 l10 4 M312 154 l6 11" /></g>
        )}
      </svg>
      <div className="bs-sp bs-talk"><SpiderSprite frame="look-right" /></div>
      <PixelArt className="bs-can" rows={CAN} palette={GREY} cell={4} style={{ left: 126, top: 128 }} />
      {online && <PixelArt className="bs-can" rows={CAN} palette={GREY} cell={4} style={{ left: 398, top: 134 }} />}
    </div>
  );
}

/* ---------- 503: a pizza break on a beam ---------- */
const PIZ = [
  ['CCCCCCCCCC', 'CCCCCCCCCC', '.YYYYYYYY.', '.YPYYYYPY.', '..YYYYYY..', '..YYPYYY..', '...YYYY...', '...YYPY...', '....YY....', '.....Y....'],
  ['..CCCCCCCC', '..CCCCCCCC', '..YYYYYYY.', '..YYYYYPY.', '..YYYYYY..', '..YYPYYY..', '...YYYY...', '...YYPY...', '....YY....', '.....Y....'],
  ['..........', '..........', '..........', '..........', '..........', '..........', '..........', '....YY....', '....YY....', '.....Y....'].map((r, i) => (i === 0 ? 'CCCC......' : i === 1 ? 'CCCC......' : r)),
  ['..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........'],
];
const F503: Frame[] = ['sit', 'sit-left', 'sit', 'sit-right'];
const STAGES = [0, 0, 1, 1, 2, 3];
export function Scene503() {
  const frame = useCycle(F503, 2400);
  const stage = useCycle(STAGES, 1100);
  return (
    <div className="bs bs503" aria-hidden="true">
      <Bubble style={{ left: 6, top: 2 }}>Lunch break. Back soon.</Bubble>
      <div className="bs-beam" />
      <div className="bs-sp bs-sit"><SpiderSprite frame={frame} /></div>
      <div className="bs-pizza">
        {stage < 3 && <PixelArt rows={PIZ[stage]} palette={GREY} cell={3} />}
        {stage < 3 && <><i className="bs-steam a" /><i className="bs-steam b" /><i className="bs-steam c" /></>}
      </div>
      <svg className="bs-hang" viewBox="0 0 440 210"><g stroke="#e8e8e8" strokeWidth="2"><line x1="252" y1="160" x2="252" y2="178" /><line x1="322" y1="160" x2="322" y2="178" /></g></svg>
      <div className="bs-closed">BACK SOON</div>
    </div>
  );
}
