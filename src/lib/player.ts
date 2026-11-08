// Shared Cassette player: one <audio> for the whole site, so music keeps playing while you browse.
// The Cassette page and the little now-playing pill both read this store.
import { useSyncExternalStore } from 'react';
import { cassette, safeHref, type CassetteAlbum, type CassetteTrack } from './content';

export const albums: CassetteAlbum[] = cassette.albums
  .map((al) => ({ ...al, tracks: (al.tracks ?? []).filter((t) => t.src) }))
  .filter((al) => al.tracks.length > 0);

export interface PlayerState {
  a: number; // tape
  t: number; // song on that tape
  playing: boolean;
  started: boolean; // has played this session (shows the mini player)
  pos: number;
  dur: number;
  loop: boolean;
  shuffle: boolean;
  volume: number; // 0..1
  muted: boolean;
}

const KEY = 'cassette:v1';
type Saved = Partial<Pick<PlayerState, 'a' | 't' | 'loop' | 'shuffle' | 'volume' | 'muted'>> & { pos?: number };

function readSaved(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Saved;
  } catch {
    return {};
  }
}
function writeSaved() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ a: state.a, t: state.t, pos: Math.floor(state.pos), loop: state.loop, shuffle: state.shuffle, volume: state.volume, muted: state.muted }));
  } catch {
    /* storage unavailable: nothing to remember */
  }
}

const clamp = (n: unknown, lo: number, hi: number, def: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def);

let state: PlayerState = { a: 0, t: 0, playing: false, started: false, pos: 0, dur: 0, loop: false, shuffle: false, volume: 0.9, muted: false };
const listeners = new Set<() => void>();
let audio: HTMLAudioElement | null = null;
let pendingSeek: number | null = null;
let lastSave = 0;
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;

function emit(patch: Partial<PlayerState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const tracksOf = (a: number): CassetteTrack[] => albums[a]?.tracks ?? [];
export const currentTrack = (s: PlayerState = state): CassetteTrack | undefined => tracksOf(s.a)[s.t];

function setSrc(a: number, t: number, startAt = 0) {
  if (!audio) return;
  const track = tracksOf(a)[t];
  if (!track) return;
  pendingSeek = startAt > 0 ? startAt : null;
  audio.src = safeHref(track.src);
  audio.load();
  emit({ a, t, pos: startAt, dur: 0 });
  updateMediaSession();
}

/** Hook the audio into an analyser for the visualiser. Only when every song is on this site: routing a cross-origin file
 *  through Web Audio would silence it, so in that case the visualiser just stays flat. Needs a user gesture, so it runs on play. */
function ensureAnalyser() {
  if (analyser || !audio) return;
  if (!albums.every((al) => al.tracks.every((t) => t.src.startsWith('/')))) return;
  try {
    const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AC();
    const source = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  } catch {
    analyser = null;
  }
}

function play() {
  ensureAnalyser();
  void audioCtx?.resume();
  audio?.play().catch(() => emit({ playing: false }));
}

function init() {
  if (audio || typeof window === 'undefined' || !albums.length) return;
  audio = new Audio();
  audio.preload = 'none'; // nothing downloads until the Cassette page asks (warm) or you press play

  const saved = readSaved();
  const a = Math.min(albums.length - 1, Math.max(0, Math.floor(clamp(saved.a, 0, 99, 0))));
  const t = Math.min(tracksOf(a).length - 1, Math.max(0, Math.floor(clamp(saved.t, 0, 999, 0))));
  state = { ...state, loop: !!saved.loop, shuffle: !!saved.shuffle, volume: clamp(saved.volume, 0, 1, 0.9), muted: !!saved.muted };
  audio.volume = state.volume;
  audio.muted = state.muted;
  audio.loop = state.loop;
  setSrc(a, t, clamp(saved.pos, 0, 36000, 0));

  audio.addEventListener('play', () => emit({ playing: true, started: true }));
  audio.addEventListener('pause', () => {
    emit({ playing: false });
    writeSaved();
  });
  audio.addEventListener('loadedmetadata', () => {
    const d = audio!.duration;
    if (pendingSeek !== null && Number.isFinite(d) && pendingSeek < d - 1) audio!.currentTime = pendingSeek;
    pendingSeek = null;
    emit({ dur: Number.isFinite(d) ? d : 0 });
  });
  audio.addEventListener('timeupdate', () => {
    emit({ pos: audio!.currentTime });
    const now = Date.now();
    if (now - lastSave > 4000) {
      lastSave = now;
      writeSaved();
    }
  });
  audio.addEventListener('ended', () => {
    const n = tracksOf(state.a).length;
    if (state.shuffle && n > 1) {
      setSrc(state.a, randomOther(state.t, n));
      play();
    } else if (state.t + 1 < n) {
      setSrc(state.a, state.t + 1);
      play();
    } else {
      setSrc(state.a, 0); // end of the tape: rewind and stop
      emit({ playing: false });
    }
  });
  window.addEventListener('pagehide', writeSaved);
  initMediaSession();
}

const randomOther = (cur: number, n: number) => {
  let r = cur;
  while (r === cur) r = Math.floor(Math.random() * n);
  return r;
};

/* ---------------- actions ---------------- */
export const player = {
  /** The analyser node once playback has started, or null. */
  getAnalyser: (): AnalyserNode | null => analyser,
  /** Called by the Cassette page: fetch the song's length (not the whole file) so the seek bar is ready. */
  warm() {
    init();
    if (!audio || audio.preload === 'metadata' || state.playing) return;
    audio.preload = 'metadata';
    pendingSeek = state.pos > 0 ? state.pos : null;
    audio.load();
  },
  /** Put a different tape in the deck (paused, first song). */
  selectTape(i: number) {
    init();
    if (!audio || i === state.a || !albums[i]) return;
    audio.pause();
    setSrc(i, 0);
    writeSaved();
  },
  /** Play a specific song (same tape or another). */
  playTrack(a: number, t: number) {
    init();
    if (!audio) return;
    if (a === state.a && t === state.t) {
      play();
    } else {
      setSrc(a, t);
      play();
    }
    writeSaved();
  },
  toggle() {
    init();
    if (!audio) return;
    if (audio.paused) play();
    else audio.pause();
  },
  next() {
    init();
    const n = tracksOf(state.a).length;
    if (state.shuffle && n > 1) {
      setSrc(state.a, randomOther(state.t, n));
      if (state.playing) play();
    } else if (state.t + 1 < n) {
      setSrc(state.a, state.t + 1);
      if (state.playing) play();
    }
  },
  /** Restart the song if it is past 3 s, otherwise go back one. */
  prev() {
    init();
    if (!audio) return;
    if (audio.currentTime > 3 || state.t === 0) {
      audio.currentTime = 0;
    } else {
      setSrc(state.a, state.t - 1);
      if (state.playing) play();
    }
  },
  seek(sec: number) {
    init();
    if (!audio || !Number.isFinite(sec)) return;
    audio.currentTime = Math.max(0, Math.min(sec, state.dur || sec));
    emit({ pos: audio.currentTime });
  },
  seekBy(delta: number) {
    init();
    if (audio) player.seek(audio.currentTime + delta);
  },
  setLoop(on: boolean) {
    init();
    if (audio) audio.loop = on;
    emit({ loop: on });
    writeSaved();
  },
  setShuffle(on: boolean) {
    emit({ shuffle: on });
    writeSaved();
  },
  setVolume(v: number) {
    init();
    const volume = clamp(v, 0, 1, state.volume);
    if (audio) {
      audio.volume = volume;
      audio.muted = false;
    }
    emit({ volume, muted: false });
    writeSaved();
  },
  toggleMute() {
    init();
    if (audio) audio.muted = !state.muted;
    emit({ muted: !state.muted });
    writeSaved();
  },
  stop() {
    audio?.pause();
    emit({ started: false });
  },
};

/* ---------------- lock-screen / headphone controls ---------------- */
function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const track = currentTrack();
  const al = albums[state.a];
  if (!track || !al) return;
  const art = track.cover || al.cover;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist || al.artist,
    album: al.title,
    artwork: art ? [{ src: safeHref(art), sizes: '480x480', type: 'image/jpeg' }] : [],
  });
}
function initMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const set = (action: MediaSessionAction, fn: MediaSessionActionHandler) => {
    try {
      navigator.mediaSession.setActionHandler(action, fn);
    } catch {
      /* action not supported by this browser */
    }
  };
  set('play', () => player.toggle());
  set('pause', () => player.toggle());
  set('previoustrack', () => player.prev());
  set('nexttrack', () => player.next());
  set('seekto', (d) => d.seekTime !== undefined && player.seek(d.seekTime));
}

/* ---------------- React ---------------- */
function subscribe(l: () => void) {
  init();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function usePlayer(): PlayerState {
  init(); // idempotent; done before the first read so the saved tape shows without a flash
  return useSyncExternalStore(subscribe, () => state, () => state);
}
