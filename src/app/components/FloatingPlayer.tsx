// src/components/FloatingPlayer.tsx

import { useState } from "react";
import { useMusic } from "../../context/MusicContext";

function fmt(s: number) {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export default function FloatingPlayer() {
  const { currentTrack, isPlaying, progress, currentTime, duration, volume, toggle, next, prev, seek, setVolume } = useMusic();
  const [expanded, setExpanded] = useState(false);

  if (!currentTrack) return null;

  const accent = currentTrack.color ?? "#e2e8f0";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        width: expanded ? 300 : 240,
        background: "rgba(8, 8, 10, 0.94)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderTop: `1px solid ${accent}35`,
        borderRadius: 8,
        padding: "0.9rem 1rem",
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        color: "var(--text-primary, #e2e8f0)",
        userSelect: "none",
        transition: "width 0.3s ease, box-shadow 0.6s ease",
        boxShadow: isPlaying
          ? `0 0 0 1px ${accent}10, 0 8px 40px rgba(0,0,0,0.7), 0 0 60px ${accent}08`
          : "0 8px 40px rgba(0,0,0,0.6)",
      }}
    >
      {/* Top row: status + track name + expand toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.65rem" }}>
        {/* Live dot */}
        <div style={{
          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
          background: isPlaying ? accent : "rgba(255,255,255,0.15)",
          boxShadow: isPlaying ? `0 0 8px ${accent}` : "none",
          transition: "background 0.3s, box-shadow 0.3s",
        }} />

        {/* Track title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em", color: "rgba(255,255,255,0.9)" }}>
            {currentTrack.title}
          </div>
        </div>

        {/* Expand / link */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(x => !x)}
            aria-label="Expand player"
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", padding: 0, display: "flex", fontSize: 10, lineHeight: 1, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
          >
            {expanded ? "▴" : "▾"}
          </button>
          <a
            href="/music"
            style={{ fontSize: "0.58rem", letterSpacing: "0.08em", color: accent, opacity: 0.6, textDecoration: "none", transition: "opacity 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
          >
            ↗
          </a>
        </div>
      </div>

      {/* Progress bar — always visible */}
      <div
        onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * 100); }}
        style={{ height: 1.5, background: "rgba(255,255,255,0.08)", borderRadius: 99, cursor: "pointer", marginBottom: "0.65rem", position: "relative" }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progress}%`, background: accent, borderRadius: 99, transition: "width 0.3s linear" }} />
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button onClick={prev} aria-label="Previous" style={mini()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pause" : "Play"}
          style={{ ...mini(), width: 30, height: 30, borderRadius: "50%", border: `1px solid ${accent}60`, color: accent, transition: "box-shadow 0.3s, color 0.2s", boxShadow: isPlaying ? `0 0 12px ${accent}40` : "none" }}
        >
          {isPlaying
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
        </button>
        <button onClick={next} aria-label="Next" style={mini()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14 5.5 3.64L8 17.14V9.86zm7.5-3.86h2v12h-2z"/></svg>
        </button>

        {/* Time */}
        <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", fontVariantNumeric: "tabular-nums", marginLeft: "auto" }}>
          {fmt(currentTime)} / {fmt(duration)}
        </span>
      </div>

      {/* Expanded: genre + volume */}
      {expanded && (
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", marginBottom: "0.6rem" }}>
            {currentTrack.genre?.toUpperCase() ?? currentTrack.artist?.toUpperCase()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }}>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: accent, cursor: "pointer" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function mini(): React.CSSProperties {
  return {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.35)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    borderRadius: "50%",
    padding: 0,
    transition: "color 0.2s",
    flexShrink: 0,
  };
}
