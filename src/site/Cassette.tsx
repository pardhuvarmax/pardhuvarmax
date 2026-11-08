import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Bluetooth, Pause, Play, SkipBack, SkipForward, Wifi } from 'lucide-react';
import { cassette, safeHref } from '../lib/content';
import { SectionHead } from './Reveal';
import { CoderSprite } from './spiderman';
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

  const [typing, setTyping] = useState<0 | 1>(0);
  const [leg, setLeg] = useState(0);
  const [gaze, setGaze] = useState(0);
  const [hit, setHit] = useState({ k: '', n: 0 }); // which control was just clicked, to replay its click animation
  const firstRun = useRef(true);

  const album = albums[a];
  const tracks = album?.tracks.filter((x) => x.src) ?? [];
  const track = tracks[t];
  const link: 'bluetooth' | 'wifi' = t % 2 === 0 ? 'bluetooth' : 'wifi'; // consecutive songs alternate connections

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

  // changing tape or song: he looks at us, blinks twice, then goes back to the laptop
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const steps: [number, number][] = [[1, 450], [2, 130], [1, 170], [2, 130], [1, 250], [0, 0]];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 0;
    for (const [g, hold] of steps) { timers.push(setTimeout(() => setGaze(g), at)); at += hold; }
    return () => { timers.forEach(clearTimeout); setGaze(0); };
  }, [a, t]);

  // his legs keep swinging
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setLeg((v) => (v + 1) % 4), 280);
    return () => clearInterval(id);
  }, []);

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

      <div className="cs-rig">
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
            <span className="cs-links" aria-hidden="true">
              {(['bluetooth', 'wifi'] as const).map((k) => (
                <span key={k} className={`cs-link ${k} ${i === a && link === k ? 'on' : ''} ${i === a && link === k && playing ? 'live' : ''}`}>
                  {k === 'wifi' ? <Wifi size={14} /> : <Bluetooth size={14} />}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="cs-stage">
      <div className={`cs-spidey ${playing ? 'on' : ''}`} aria-hidden="true">
        <CoderSprite leg={leg} typing={playing ? typing : 0} gaze={gaze} link={link} />
        {(gaze === 0 ? [[70, 28]] : [[48, 28], [88, 28]]).map(([x, y]) => (
          <i key={x} className={`cs-glow ${link} ${playing ? 'live' : ''}`} style={{ left: x, top: y }} />
        ))}
        {playing && <><i className="cs-note n1">♪</i><i className="cs-note n2">♫</i></>}
      </div>
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
          <button className="cs-btn" onClick={() => { setHit((h) => ({ k: 'prev', n: h.n + 1 })); step(-1); }} disabled={t === 0} aria-label="Previous track">
            <span className="cs-ico" key={hit.k === 'prev' ? hit.n : 0}><SkipBack size={18} /></span>
            {hit.k === 'prev' && <i className="cs-ripple" key={hit.n} />}
          </button>
          <button className="cs-btn big" onClick={() => { setHit((h) => ({ k: 'play', n: h.n + 1 })); toggle(); }} aria-label={playing ? 'Pause' : 'Play'}>
            <span className="cs-ico" key={`${playing}${hit.k === 'play' ? hit.n : 0}`} data-pop={hit.k === 'play' ? '1' : undefined}>{playing ? <Pause size={22} /> : <Play size={22} />}</span>
            {hit.k === 'play' && <i className="cs-ripple" key={hit.n} />}
          </button>
          <button className="cs-btn" onClick={() => { setHit((h) => ({ k: 'next', n: h.n + 1 })); step(1); }} disabled={t >= tracks.length - 1} aria-label="Next track">
            <span className="cs-ico" key={hit.k === 'next' ? hit.n : 0}><SkipForward size={18} /></span>
            {hit.k === 'next' && <i className="cs-ripple" key={hit.n} />}
          </button>
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
      </div>
    </section>
  );
}
