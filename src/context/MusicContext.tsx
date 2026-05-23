// src/context/MusicContext.tsx
// Drop-in global music state that persists across all pages.
// Wrap your <App /> with <MusicProvider> in main.tsx.

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;         // path to file in /public/music/
  genre?: string;
  duration?: string;   // display string e.g. "3:42"
  color?: string;      // accent color for the track card
}

interface MusicContextValue {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  progress: number;      // 0–100
  currentTime: number;
  duration: number;
  play: (index?: number) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  currentTrack: Track | null;
}

const MusicContext = createContext<MusicContextValue | null>(null);

// ── Default playlist ────────────────────────────────────────────────────────
// Add your actual mp3 files under public/music/ and update this list.
const DEFAULT_TRACKS: Track[] = [
  {
    id: "t1",
    title: "Friends",
    artist: "Chase Atlantic",
    src: "/music/friends-chasholic.mp3",
    genre: "Synth R&B",
    color: "#a855f7",
  },
  {
    id: "t2",
    title: "The Hills",
    artist: "The Weeknd",
    src: "/music/thehillsbyweeknd.mp3",
    genre: "Dark R&B",
    color: "#f59e0b",
  },
  {
    id: "t3",
    title: "Do I Wanna Know?",
    artist: "Arctic Monkeys",
    src: "/music/doiwannaknow-arcaticmonkeys.mp3",
    genre: "Indie Rock",
    color: "#e63946",
  },
];

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Create the audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.6;
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!audio.duration) return;
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setCurrentIndex((i) => (i + 1) % DEFAULT_TRACKS.length);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, []);

  // Update src when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = DEFAULT_TRACKS[currentIndex];
    audio.src = track.src;
    audio.load();
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback((index?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (index !== undefined && index !== currentIndex) {
      setCurrentIndex(index);
      // src change effect will call play
      setIsPlaying(true);
      return;
    }
    audio.play().catch(() => {});
    setIsPlaying(true);
  }, [currentIndex]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % DEFAULT_TRACKS.length);
    setIsPlaying(true);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((i) =>
      i === 0 ? DEFAULT_TRACKS.length - 1 : i - 1
    );
    setIsPlaying(true);
  }, []);

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = (pct / 100) * audio.duration;
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (audioRef.current) audioRef.current.volume = clamped;
    setVolumeState(clamped);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        tracks: DEFAULT_TRACKS,
        currentIndex,
        isPlaying,
        volume,
        progress,
        currentTime,
        duration,
        play,
        pause,
        toggle,
        next,
        prev,
        seek,
        setVolume,
        currentTrack: DEFAULT_TRACKS[currentIndex] ?? null,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside <MusicProvider>");
  return ctx;
}