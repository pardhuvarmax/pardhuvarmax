import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Bluetooth, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, Wifi } from 'lucide-react';
import { cassette, safeHref } from '../lib/content';
import { albums, player, usePlayer } from '../lib/player';
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
  const favLabel = cassette.favLabel ?? 'Peak favourite';
  const disclaimer = cassette.disclaimer ? <aside className="cs-notice" role="note"><span className="cs-bang" aria-hidden="true">!</span><p>{cassette.disclaimer}</p></aside> : null;
  const { a, t, playing, pos, dur, loop, shuffle, volume, muted } = usePlayer();

  const [typing, setTyping] = useState<0 | 1>(0);
  const [leg, setLeg] = useState(0);
  const [gaze, setGaze] = useState(0);
  const [hit, setHit] = useState({ k: '', n: 0 }); // which control was just clicked, to replay its click animation
  const firstRun = useRef(true);

  const album = albums[a];
  const tracks = album?.tracks ?? [];
  const track = tracks[t];
  const link: 'bluetooth' | 'wifi' = (a + t) % 2 === 0 ? 'bluetooth' : 'wifi'; // consecutive songs alternate connections; each tape starts on the opposite one

  useEffect(() => { player.warm(); }, []);

  // keyboard: space play/pause, arrows seek, shift+arrows change song, M mute (ignored while typing or on a focused control)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName))) return;
      if (e.code === 'Space') { e.preventDefault(); player.toggle(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); e.shiftKey ? player.next() : player.seekBy(5); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.shiftKey ? player.prev() : player.seekBy(-5); }
      else if (e.key === 'm' || e.key === 'M') player.toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
            onClick={() => player.selectTape(i)}
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
        {playing && <><i className="cs-tune n1">♪</i><i className="cs-tune n2">♫</i></>}
      </div>
      <div className="cs-deck">
        <div className="cs-head">
          {(track?.cover || album.cover) && <img className="cs-cover" src={safeHref((track?.cover || album.cover)!)} alt={`${track?.title ?? album.title} cover`} />}
          <div className="cs-now">
            <span className="cs-kick">{playing ? 'Now playing' : 'Loaded'}</span>
            {track?.fav && favLabel && <span className="cs-fav">★ {favLabel}</span>}
            <h3>{track?.title}</h3>
            <p>{track?.artist || album.artist}{track?.year ? ` · ${track.year}` : ''}</p>
          </div>
        </div>
        <div className="cs-ctrl">
          <button className="cs-btn" onClick={() => { setHit((h) => ({ k: 'prev', n: h.n + 1 })); player.prev(); }} aria-label="Previous track (restarts the song after 3 seconds)">
            <span className="cs-ico" key={hit.k === 'prev' ? hit.n : 0}><SkipBack size={18} /></span>
            {hit.k === 'prev' && <i className="cs-ripple" key={hit.n} />}
          </button>
          <button className="cs-btn big" onClick={() => { setHit((h) => ({ k: 'play', n: h.n + 1 })); player.toggle(); }} aria-label={playing ? 'Pause' : 'Play'}>
            <span className="cs-ico" key={`${playing}${hit.k === 'play' ? hit.n : 0}`} data-pop={hit.k === 'play' ? '1' : undefined}>{playing ? <Pause size={22} /> : <Play size={22} />}</span>
            {hit.k === 'play' && <i className="cs-ripple" key={hit.n} />}
          </button>
          <button className="cs-btn" onClick={() => { setHit((h) => ({ k: 'next', n: h.n + 1 })); player.next(); }} disabled={!shuffle && t >= tracks.length - 1} aria-label="Next track">
            <span className="cs-ico" key={hit.k === 'next' ? hit.n : 0}><SkipForward size={18} /></span>
            {hit.k === 'next' && <i className="cs-ripple" key={hit.n} />}
          </button>
          <div className="cs-opts">
            <button className={`cs-btn sm ${shuffle ? 'on' : ''}`} onClick={() => player.setShuffle(!shuffle)} aria-pressed={shuffle} aria-label="Shuffle" title="Shuffle"><Shuffle size={16} /></button>
            <button className={`cs-btn sm ${loop ? 'on' : ''}`} onClick={() => player.setLoop(!loop)} aria-pressed={loop} aria-label="Loop this song" title="Loop this song"><Repeat size={16} /></button>
            <button className="cs-btn sm" onClick={() => player.toggleMute()} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'}>{muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
            <input className="cs-vol" type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={(e) => player.setVolume(Number(e.target.value))} aria-label="Volume" />
          </div>
        </div>
        <div className="cs-seek">
          <span>{clock(pos)}</span>
          <input
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={Math.min(pos, dur || 0)}
            onChange={(e) => player.seek(Number(e.target.value))}
            aria-label="Seek"
          />
          <span>{clock(dur)}</span>
        </div>
        <p className="cs-keys" aria-hidden="true">Space play · ← → seek · Shift + ← → song · M mute</p>
        {(track?.note || album.note) && <p className="cs-note">{track?.note || album.note}</p>}
        <ol className="cs-tracks">
          {tracks.map((x, i) => (
            <li key={x.src + i}>
              <button className={i === t ? 'on' : ''} onClick={() => player.playTrack(a, i)}>
                <span className="cs-n">{i === t && playing ? '▶' : String(i + 1).padStart(2, '0')}</span>
                <span className="cs-t">{x.title}{x.fav && <span className="cs-star" aria-label={favLabel || 'Favourite'}> ★</span>}</span>
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
