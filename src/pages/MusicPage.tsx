// src/pages/MusicPage.tsx

import { useMusic } from "../context/MusicContext";

function fmt(s: number) {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function Bars({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16, width: 20 }}>
      {[0.5, 0.9, 0.6, 1.0, 0.7].map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: 1,
            background: color,
            height: active ? `${h * 100}%` : "25%",
            animation: active ? `bar${i} ${0.5 + i * 0.12}s ease-in-out infinite alternate` : "none",
            transition: "height 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}
export default function MusicPage() {
  const { tracks, currentIndex, isPlaying, progress, currentTime, duration, volume, currentTrack, toggle, next, prev, play, seek, setVolume } = useMusic();
  const accent = currentTrack?.color ?? "#e2e8f0";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary, #0a0a0a)", color: "var(--text-primary, #e2e8f0)", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", position: "relative" }}>

      {/* Subtle ambient glow */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "40vh", background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${accent}09 0%, transparent 100%)`, pointerEvents: "none", transition: "background 1.5s ease", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem 6rem" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4rem" }}>
          <a href="/" style={{ fontSize: "0.7rem", letterSpacing: "0.12em", color: "var(--text-muted, #4a5568)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = accent)}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted, #4a5568)")}>
            ← PARDHUVARMA.TECH
          </a>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--accent-color, #888)", opacity: 0.5 }}>
            AUDIO
          </div>
        </div>

        {/* Hero section */}
        <div style={{ marginBottom: "5rem" }}>
          <p style={{ margin: "0 0 1rem", fontSize: "0.7rem", letterSpacing: "0.2em", color: accent, opacity: 0.7 }}>
            ATMOSPHERIC RESEARCH SESSION
          </p>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: "var(--text-primary, #f0f0f0)", fontFamily: "var(--font-heading, sans-serif)" }}>
            Music
          </h1>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted, #4a5568)", letterSpacing: "0.04em" }}>
            {tracks.length} tracks · local files · continues while you navigate
          </p>
        </div>

        {/* Main layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr min(360px, 38%)", gap: "4rem", alignItems: "start" }}>

          {/* ── Playlist ── */}
          <div>
            {/* Thin divider + label */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "var(--text-muted, #4a5568)" }}>PLAYLIST</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color, rgba(255,255,255,0.06))" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {tracks.map((track, idx) => {
                const active = idx === currentIndex;
                const tc = track.color ?? "#e2e8f0";
                return (
                  <div
                    key={track.id}
                    onClick={() => play(idx)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "28px 8px 1fr auto",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1.1rem 0",
                      borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.05))",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                      opacity: active ? 1 : 0.5,
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.opacity = "0.85"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.opacity = "0.5"; }}
                  >
                    {/* Index / bars */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      {active
                        ? <Bars active={isPlaying} color={tc} />
                        : <span style={{ fontSize: "0.7rem", color: "var(--text-muted, #4a5568)", fontVariantNumeric: "tabular-nums" }}>{String(idx + 1).padStart(2, "0")}</span>
                      }
                    </div>

                    {/* Color stripe */}
                    <div style={{ width: 2, height: "100%", minHeight: 28, background: active ? tc : "transparent", borderRadius: 99, alignSelf: "stretch", transition: "background 0.3s" }} />

                    {/* Track info */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: active ? 600 : 400, color: active ? "var(--text-primary, #f0f0f0)" : "inherit", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted, #4a5568)", marginTop: "0.15rem", letterSpacing: "0.04em" }}>
                        {track.genre ?? track.artist}
                      </div>
                    </div>

                    {/* Duration */}
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted, #4a5568)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                      {track.duration ?? "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Now Playing ── */}
          <div style={{ position: "sticky", top: "2rem" }}>

            {/* Thin top border accent */}
            <div style={{ height: 1, background: `linear-gradient(90deg, ${accent}, transparent)`, marginBottom: "2rem" }} />

            <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "var(--text-muted, #4a5568)", marginBottom: "1.75rem" }}>
              NOW PLAYING
            </div>

            {/* Artwork — minimal geometric */}
            <div style={{ width: "100%", aspectRatio: "1", marginBottom: "2rem", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-surface, rgba(255,255,255,0.02))", border: "1px solid var(--border-color, rgba(255,255,255,0.06))", borderRadius: 4 }}>
              {/* Outer ring */}
              <div style={{ position: "absolute", inset: 16, borderRadius: "50%", border: `1px solid ${accent}25`, animation: isPlaying ? "rot 12s linear infinite" : "none" }} />
              {/* Inner dashed ring */}
              <div style={{ position: "absolute", inset: 36, borderRadius: "50%", border: `1px dashed ${accent}15`, animation: isPlaying ? "rot 20s linear infinite reverse" : "none" }} />
              {/* Center */}
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent, boxShadow: isPlaying ? `0 0 16px ${accent}80` : "none", transition: "box-shadow 0.6s ease" }} />
            </div>

            {/* Track name */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary, #f0f0f0)", marginBottom: "0.3rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentTrack?.title ?? "—"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #4a5568)", letterSpacing: "0.06em" }}>
                {currentTrack?.artist} · {currentTrack?.genre}
              </div>
            </div>

            {/* Progress */}
            <div
              role="slider" aria-label="Seek"
              onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * 100); }}
              style={{ height: 2, background: "var(--border-color, rgba(255,255,255,0.08))", borderRadius: 99, cursor: "pointer", marginBottom: "0.5rem", position: "relative" }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progress}%`, background: accent, borderRadius: 99, transition: "width 0.3s linear" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-muted, #4a5568)", marginBottom: "2rem", fontVariantNumeric: "tabular-nums" }}>
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
              <button onClick={prev} aria-label="Previous" style={ctrl()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
              </button>
              <button onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"} style={{ ...ctrl(), width: 48, height: 48, borderRadius: "50%", border: `1px solid ${accent}`, color: accent, boxShadow: isPlaying ? `0 0 20px ${accent}30` : "none", transition: "box-shadow 0.6s ease, color 0.3s" }}>
                {isPlaying
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
              </button>
              <button onClick={next} aria-label="Next" style={ctrl()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14 5.5 3.64L8 17.14V9.86zm7.5-3.86h2v12h-2z"/></svg>
              </button>
            </div>

            {/* Volume */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--text-muted, #4a5568)" style={{ flexShrink: 0 }}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <input type="range" min={0} max={1} step={0.01} value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: accent, cursor: "pointer", height: 2 }} />
              <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--text-muted, #4a5568)" style={{ flexShrink: 0 }}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rot { to { transform: rotate(360deg); } }
        @keyframes bar0 { to { height: 90%; } }
        @keyframes bar1 { to { height: 55%; } }
        @keyframes bar2 { to { height: 100%; } }
        @keyframes bar3 { to { height: 45%; } }
        @keyframes bar4 { to { height: 75%; } }
        @media (max-width: 680px) {
          div[style*="grid-template-columns: 1fr min"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function ctrl(): React.CSSProperties {
  return {
    background: "transparent",
    border: "none",
    color: "var(--text-muted, #4a5568)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: "50%",
    padding: 0,
    transition: "color 0.2s",
  };
}
