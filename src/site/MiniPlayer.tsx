import { Link } from 'react-router-dom';
import { Pause, Play, X } from 'lucide-react';
import { albums, currentTrack, player, usePlayer } from '../lib/player';
import '../styles/mini.css';

/** Little now-playing pill: shows on every page except /cassette once a song has been played. */
export default function MiniPlayer() {
  const s = usePlayer();
  const track = currentTrack(s);
  const album = albums[s.a];
  if (!s.started || !track || !album) return null;
  return (
    <div className={`mini ${s.playing ? 'on' : ''}`} role="region" aria-label="Now playing">
      <span className="mini-eq" aria-hidden="true"><i /><i /><i /><i /></span>
      <Link to="/cassette" className="mini-info" title="Open Cassette">
        <b>{track.title}</b>
        <span>{track.artist || album.artist}</span>
      </Link>
      <button className="mini-btn" onClick={() => player.toggle()} aria-label={s.playing ? 'Pause' : 'Play'}>{s.playing ? <Pause size={15} /> : <Play size={15} />}</button>
      <button className="mini-btn" onClick={() => player.stop()} aria-label="Close player"><X size={15} /></button>
    </div>
  );
}
