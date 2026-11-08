/** 8-bit Spider-Man on a grid of 4px cells. Poses: hanging from the web, standing (eyes can glance left/right), and two run frames.
 *  The black outline is computed around the body. */
const SM_W = 25;
const SM_H = 27;
const SM_CELL = 4;

type Pose = 'hang' | 'stand' | 'run' | 'sit';

function buildSpiderMan(pose: Pose, look = 0, sense = false): { x: number; y: number; c: string }[] {
  const cells = new Map<string, string>();
  const put = (x: number, y: number, c: string) => {
    if (x >= 0 && y >= 0 && x < SM_W && y < SM_H) cells.set(`${x},${y}`, c);
  };
  const line = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      put(x0, y0, c);
      put(x0 + 1, y0, c); // two cells thick
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c);
  };
  // legs
  if (pose === 'hang') {
    line(10, 19, 8, 22, 'B'); line(8, 22, 10, 25, 'B');
    line(14, 19, 16, 22, 'B'); line(16, 22, 14, 25, 'B');
  } else if (pose === 'sit') {
    line(10, 19, 8, 22, 'B'); line(8, 22, 10, 24, 'B');
    line(14, 19, 16, 22, 'B'); line(16, 22, 14, 24, 'B');
  } else if (pose === 'stand') {
    line(10, 19, 9, 25, 'B');
    line(14, 19, 15, 25, 'B');
  } else {
    line(10, 19, 7, 21, 'B'); line(7, 21, 9, 24, 'B'); // lifted knee
    line(14, 19, 16, 22, 'B'); line(16, 22, 18, 25, 'B'); // push-off leg
  }
  const bootRow = pose === 'sit' ? 23 : 24;
  for (const k of [...cells.keys()]) { const [x, y] = k.split(',').map(Number); if (y >= bootRow) put(x, y, 'R'); } // red boots
  // torso: blue sides, red chest, blue trunks
  rect(8, 11, 16, 12, 'R');
  rect(9, 13, 15, 18, 'R');
  for (let y = 13; y <= 18; y++) { put(9, y, 'B'); put(15, y, 'B'); }
  rect(9, 18, 15, 19, 'B');
  put(12, 13, 'K'); put(12, 14, 'K'); put(11, 15, 'K'); put(13, 15, 'K'); // web pattern
  // arms
  if (pose === 'hang') {
    line(8, 12, 6, 8, 'R'); line(6, 8, 6, 2, 'R'); // raised to the web
    line(16, 12, 19, 13, 'R'); line(19, 13, 19, 15, 'R');
  } else if (pose === 'stand' || pose === 'sit') {
    line(8, 12, 6, 16, 'R'); line(6, 16, 6, 19, 'R');
    line(16, 12, 18, 16, 'R'); line(18, 16, 18, 19, 'R');
  } else {
    line(8, 12, 5, 14, 'R'); line(5, 14, 5, 11, 'R'); // forward, bent
    line(16, 12, 19, 14, 'R'); line(19, 14, 20, 17, 'R'); // swung back
  }
  // head + eyes (eyes shift with `look`)
  for (let y = 0; y < SM_H; y++) for (let x = 0; x < SM_W; x++) if (((x - 12) / 3.4) ** 2 + ((y - 7) / 3.6) ** 2 <= 1.05) put(x, y, 'R');
  for (const [x, y] of [[10, 6], [10, 7], [11, 7], [14, 6], [14, 7], [13, 7]]) put(x + look, y, 'W');
  // outline around the body
  const body = [...cells.keys()].map((k) => k.split(',').map(Number) as [number, number]);
  for (const [x, y] of body) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has(`${x + dx},${y + dy}`)) put(x + dx, y + dy, 'K');
  }
  if (pose === 'hang') for (const [x, y] of [[19, 17], [20, 16], [20, 18], [18, 18], [19, 19], [17, 17]]) put(x, y, 'S'); // web splat
  if (sense || (pose === 'stand' && look === 0)) for (const [x, y] of [[9, 1], [12, 0], [15, 1], [17, 3], [8, 3]]) put(x, y, 'Y'); // spider-sense: alert!
  return [...cells.entries()].map(([k, c]) => {
    const [x, y] = k.split(',').map(Number);
    return { x, y, c };
  });
}

export type Frame = 'hang' | 'look-left' | 'look-right' | 'alert' | 'runA' | 'runB' | 'sit' | 'sit-left' | 'sit-right' | 'sit-sense';
const SM_FRAMES: Record<Frame, { x: number; y: number; c: string }[]> = (() => {
  const mirror = (cs: { x: number; y: number; c: string }[]) => cs.map((p) => ({ ...p, x: 24 - p.x }));
  const run = buildSpiderMan('run');
  return {
    hang: buildSpiderMan('hang'),
    'look-left': buildSpiderMan('stand', -1),
    'look-right': buildSpiderMan('stand', 1),
    alert: buildSpiderMan('stand', 0),
    runA: run,
    runB: mirror(run), // swapped legs and arms
    sit: buildSpiderMan('sit', 0),
    'sit-left': buildSpiderMan('sit', -1),
    'sit-right': buildSpiderMan('sit', 1),
    'sit-sense': buildSpiderMan('sit', 0, true), // spider-sense tingling
  };
})();
const SM_FILL: Record<string, string> = { R: '#c4161c', B: '#1d3fa0', K: '#08080a', W: '#ffffff', S: '#f2f2ee', Y: '#ffd23f' };

export function SpiderSprite({ frame }: { frame: Frame }) {
  return (
    <svg className="spider-sprite" width={SM_W * SM_CELL} height={SM_H * SM_CELL} viewBox={`0 0 ${SM_W * SM_CELL} ${SM_H * SM_CELL}`} shapeRendering="crispEdges" aria-hidden="true">
      {SM_FRAMES[frame].map((p) => (
        <rect key={`${p.x},${p.y}`} className={p.c === 'Y' ? 'sense' : undefined} x={p.x * SM_CELL} y={p.y * SM_CELL} width={SM_CELL} height={SM_CELL} fill={SM_FILL[p.c]} />
      ))}
    </svg>
  );
}

/** Spider-Man in profile (facing left), sitting on a ledge and coding on a laptop with a headset. `leg` (0-3) swings his legs, `typing` alternates the hand. */
const CP_W = 28;
const CP_H = 28;
const CODER_FILL: Record<string, string> = { ...SM_FILL, r: '#b4141a', L: '#8d939e', G: '#5f646d', H: '#2c2c36', C: '#5ad1ff', E: '#4aa3ff', D: '#142a70' };
const NEAR_FOOT = [12, 16, 20, 16];
const FAR_FOOT = [20, 16, 12, 16];

function buildCoder(leg: number, typing: number, gaze: number): { x: number; y: number; c: string }[] {
  const cells = new Map<string, string>();
  const put = (x: number, y: number, c: string) => { if (x >= 0 && y >= 0 && x < CP_W && y < CP_H) cells.set(`${x},${y}`, c); };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c); };
  const line = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      put(x0, y0, c); put(x0 + 1, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  const boots = (c: string, from: number) => { for (const [k, v] of [...cells]) { const [x, y] = k.split(',').map(Number); if (y >= from && v === c) put(x, y, 'R'); } };
  // legs hang over the ledge and swing: far leg (darker) behind, near leg in front
  line(14, 20, FAR_FOOT[leg], 26, 'D'); boots('D', 24);
  line(16, 20, NEAR_FOOT[leg], 26, 'B'); boots('B', 24);
  rect(8, 19, 17, 20, 'B'); // thighs
  // torso, side on
  rect(8, 11, 13, 17, 'R'); rect(8, 18, 13, 20, 'B');
  // head facing the laptop (right) with its eye
  for (let y = 0; y < CP_H; y++) for (let x = 0; x < CP_W; x++) if (((x - 11) / 3.4) ** 2 + ((y - 6) / 3.6) ** 2 <= 1.05) put(x, y, 'R');
  if (gaze === 0) for (const [x, y] of [[13, 5], [14, 5], [14, 6]]) put(x, y, 'W'); // eye on the laptop
  else if (gaze === 1) for (const [x, y] of [[8, 5], [8, 6], [9, 6], [12, 5], [12, 6], [11, 6]]) put(x, y, 'W'); // both eyes on the viewer
  else for (const [x, y] of [[8, 6], [9, 6], [11, 6], [12, 6]]) put(x, y, 'K'); // blink
  // arm reaching the keys
  line(11, 12, 12, 15, 'R'); line(12, 15, 18, typing ? 15 : 16, 'R');
  // laptop on his knees, screen towards him
  rect(15, 17, 22, 18, 'G'); rect(21, 8, 22, 16, 'L'); rect(20, 9, 20, 15, 'C'); put(23, 12, 'Y');
  // headset: band over the head, ear cup(s), mic boom
  if (gaze === 0) {
    rect(9, 2, 13, 2, 'H'); put(8, 3, 'H'); put(8, 4, 'H'); put(14, 3, 'H'); put(14, 4, 'H'); put(8, 5, 'H'); put(8, 6, 'H');
    rect(9, 5, 11, 8, 'H'); put(10, 6, 'E'); put(10, 7, 'E');
    put(12, 9, 'H'); put(13, 10, 'H'); put(14, 10, 'C');
  } else {
    // head turned to face us: a cup on each side
    rect(8, 2, 14, 2, 'H'); put(7, 3, 'H'); put(7, 4, 'H'); put(15, 3, 'H'); put(15, 4, 'H');
    rect(6, 5, 7, 8, 'H'); rect(15, 5, 16, 8, 'H'); put(6, 6, 'E'); put(6, 7, 'E'); put(16, 6, 'E'); put(16, 7, 'E');
    put(8, 9, 'H'); put(9, 10, 'H'); put(10, 10, 'C');
  }
  // faint web grid on the red suit (a slightly darker red every 4th row and column)
  for (const [k, v] of [...cells]) { const [x, y] = k.split(',').map(Number); if (v === 'R' && (x % 4 === 0 || y % 4 === 0)) cells.set(k, 'r'); }
  for (const k of [...cells.keys()]) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has(`${x + dx},${y + dy}`)) put(x + dx, y + dy, 'K');
  }
  return [...cells.entries()].map(([k, c]) => { const [x, y] = k.split(',').map(Number); return { x: CP_W - 1 - x, y, c }; }); // mirrored: he faces left
}
const coderCache = new Map<string, { x: number; y: number; c: string }[]>();
const coderFrame = (leg: number, typing: number, gaze: number) => {
  const key = `${leg}${typing}${gaze}`;
  if (!coderCache.has(key)) coderCache.set(key, buildCoder(leg, typing, gaze));
  return coderCache.get(key)!;
};


/** gaze: 0 = on the laptop, 1 = looking at the viewer, 2 = blinking at the viewer. */
export function CoderSprite({ leg, typing, gaze = 0, link = 'bluetooth' }: { leg: number; typing: number; gaze?: number; link?: 'bluetooth' | 'wifi' }) {
  const earLight = link === 'wifi' ? '#1f9d57' : '#3b8bff'; // the headset's connected light
  return (
    <svg className="spider-sprite" width={CP_W * SM_CELL} height={CP_H * SM_CELL} viewBox={`0 0 ${CP_W * SM_CELL} ${CP_H * SM_CELL}`} shapeRendering="crispEdges" aria-hidden="true">
      {coderFrame(leg % 4, typing ? 1 : 0, gaze).map((p) => (
        <rect key={`${p.x},${p.y}`} x={p.x * SM_CELL} y={p.y * SM_CELL} width={SM_CELL} height={SM_CELL} fill={p.c === 'E' ? earLight : CODER_FILL[p.c]} />
      ))}
    </svg>
  );
}
