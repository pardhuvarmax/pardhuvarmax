import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { cassette, safeHref } from '../lib/content';
import { SectionHead } from './Reveal';
import { CODER_SIZE, CoderSprite } from './spiderman';
import '../styles/cassette.css';

const TINTS = ['--accent', '--accent-2', '--accent-3', '--accent-4'];
const clock = (s: number) => (Number.isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

function Reels() {
  return (
    <span className="cs-window" aria-hidden="true">
      <span className="cs-reel" />
      <span className="cs-reel" />
    </span>
  );
}

export default function Cassette() {
  const disclaimer = cassette.disclaimer ? <aside className="cs-notice" role="note"><span className="cs-bang" aria-hidden="true">!</span><p>{cassette.disclaimer}</p></aside> : null;
  const albums = cassette.albums.filter((a) => a.tracks?.some((t) => t.src));
  const audio = useRef<HTMLAudioElement>(null);
  const wantPlay = useRef(false);
  const [a, setA] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);

  const rig = useRef<HTMLDivElement>(null);
  const spidey = useRef<HTMLDivElement>(null);
  const [typing, setTyping] = useState<0 | 1>(0);
  const [wire, setWire] = useState<{ d: string; x: number; y: number } | null>(null);

  const album = albums[a];
  const tracks = album?.tracks.filter((x) => x.src) ?? [];
  const track = tracks[t];

  useEffect(() => {
    const el = audio.current;
    if (!el || !track) return;
    el.load();
    setPos(0);
    setDur(0);
    if (wantPlay.current) el.play().catch(() => setPlaying(false));
  }, [a, t, track?.src]);

  useEffect(() => () => audio.current?.pause(), []);

  // Spider-Man types while the tape plays
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTyping((v) => (v ? 0 : 1)), 170);
    return () => clearInterval(id);
  }, [playing]);

  // headset wire: from the nearer ear cup to the plug on the selected tape
  const measure = useCallback(() => {
    const box = rig.current;
    const sp = spidey.current;
    const tape = box?.querySelectorAll<HTMLElement>('.cs-tape')[a];
    if (!box || !sp || !tape) return;
    const r = box.getBoundingClientRect();
    const s = sp.getBoundingClientRect();
    const tr = tape.getBoundingClientRect();
    const jx = tr.left - r.left + tr.width * 0.78;
    const jy = tr.top - r.top + 2;
    const right = jx > s.left - r.left + s.width / 2;
    const [ex, ey] = right ? CODER_SIZE.earR : CODER_SIZE.earL;
    const ax = s.left - r.left + ex;
    const ay = s.top - r.top + ey;
    const sag = Math.min(150, 46 + Math.abs(jx - ax) * 0.3);
    setWire({ d: `M ${ax} ${ay} C ${ax + (right ? 26 : -26)} ${ay + sag}, ${jx} ${Math.max(ay, jy) + sag * 0.8}, ${jx} ${jy}`, x: jx, y: jy });
  }, [a]);
  useLayoutEffect(() => {
    measure();
    const box = rig.current;
    if (!box) return;
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [measure, albums.length]);

  if (!albums.length) {
    return (
      <section className="wrap sec cs">
        <SectionHead kicker="Cassette" title={<>The tape is <em>blank</em></>}>{cassette.intro}</SectionHead>
        <div className="cs-empty">
          <span className="cs-tape" aria-hidden="true"><span className="cs-label"><b>Side A</b></span><Reels /></span>
          <p>Nothing on the shelf yet. New tapes soon.</p>
        </div>
        {disclaimer}
      </section>
    );
  }

  const play = (ai: number, ti: number) => {
    wantPlay.current = true;
    if (ai === a && ti === t) {
      audio.current?.play().catch(() => setPlaying(false));
    } else {
      setA(ai);
      setT(ti);
    }
  };
  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      wantPlay.current = true;
      el.play().catch(() => setPlaying(false));
    } else {
      wantPlay.current = false;
      el.pause();
    }
  };
  const step = (d: number) => {
    const n = t + d;
    if (n < 0 || n >= tracks.length) return;
    wantPlay.current = playing;
    setT(n);
  };

  return (
    <section className="wrap sec cs">
      <SectionHead kicker="Cassette" title={<>On <em>repeat</em></>}>{cassette.intro}</SectionHead>

      <div className="cs-rig" ref={rig}>
      <div className="cs-shelf" role="list">
        {albums.map((al, i) => (
          <button
            key={al.title + i}
            role="listitem"
            className={`cs-tape ${i === a ? 'on' : ''} ${i === a && playing ? 'spin' : ''}`}
            style={{ '--tc': `var(${TINTS[i % TINTS.length]})` } as CSSProperties}
            onClick={() => {
              if (i === a) return;
              wantPlay.current = false;
              audio.current?.pause();
              setA(i);
              setT(0);
            }}
            aria-pressed={i === a}
          >
            <span className="cs-label">
              {(al.cover || al.tracks[0]?.cover) && <img src={safeHref(al.cover || al.tracks[0].cover!)} alt="" />}
              <span>
                <b>{al.title}</b>
                <i>{al.artist}{al.year ? ` · ${al.year}` : ''}</i>
              </span>
            </span>
            <Reels />
          </button>
        ))}
      </div>
      <div className={`cs-spidey ${playing ? 'on' : ''}`} ref={spidey} aria-hidden="true">
        <CoderSprite typing={playing ? typing : 0} />
        {playing && <><i className="cs-note n1">♪</i><i className="cs-note n2">♫</i></>}
      </div>
      {wire && (
        <svg className={`cs-wire ${playing ? 'on' : ''}`} aria-hidden="true">
          <path className="w-base" d={wire.d} />
          <path className="w-flow" d={wire.d} />
          <rect className="w-plug" x={wire.x - 6} y={wire.y - 3} width="12" height="8" />
          <circle className="w-led" cx={wire.x} cy={wire.y + 1} r="2" />
        </svg>
      )}
      </div>

      <div className="cs-stage">
      <div className="cs-deck">
        <audio
          ref={audio}
          preload="metadata"
          src={track ? safeHref(track.src) : undefined}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          onEnded={() => {
            if (t + 1 < tracks.length) {
              wantPlay.current = true;
              setT(t + 1);
            } else {
              wantPlay.current = false;
              setPlaying(false);
              setT(0);
            }
          }}
        />
        <div className="cs-head">
          {(track?.cover || album.cover) && <img className="cs-cover" src={safeHref((track?.cover || album.cover)!)} alt={`${track?.title ?? album.title} cover`} />}
          <div className="cs-now">
            <span className="cs-kick">{playing ? 'Now playing' : 'Loaded'}</span>
            <h3>{track?.title}</h3>
            <p>{track?.artist || album.artist}</p>
          </div>
        </div>
        <div className="cs-ctrl">
          <button className="cs-btn" onClick={() => step(-1)} disabled={t === 0} aria-label="Previous track"><SkipBack size={18} /></button>
          <button className="cs-btn big" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={22} /> : <Play size={22} />}</button>
          <button className="cs-btn" onClick={() => step(1)} disabled={t >= tracks.length - 1} aria-label="Next track"><SkipForward size={18} /></button>
        </div>
        <div className="cs-seek">
          <span>{clock(pos)}</span>
          <input
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={Math.min(pos, dur || 0)}
            onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); }}
            aria-label="Seek"
          />
          <span>{clock(dur)}</span>
        </div>
        {album.note && <p className="cs-note">{album.note}</p>}
        <ol className="cs-tracks">
          {tracks.map((x, i) => (
            <li key={x.src + i}>
              <button className={i === t ? 'on' : ''} onClick={() => play(a, i)}>
                <span className="cs-n">{i === t && playing ? '▶' : String(i + 1).padStart(2, '0')}</span>
                <span className="cs-t">{x.title}</span>
                {x.artist && <span className="cs-a">{x.artist}</span>}
              </button>
            </li>
          ))}
        </ol>
      </div>
      {disclaimer}
      </div>
    </section>
  );
}
