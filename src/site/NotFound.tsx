import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { site } from '../lib/content';
import RunnerGame from './RunnerGame';
import { openPalette } from './CommandPalette';
import '../styles/notfound.css';

export default function NotFound() {
  useEffect(() => {
    document.title = `Not found | ${site.name}`;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return (
    <main className="wrap page nf">
      <span className="kicker">404</span>
      <h1>Lost in the <em>web</em></h1>
      <p className="sec-lede">That page does not exist, or it moved. While you are here, Spider-Man could use some help with the bugs.</p>
      <RunnerGame />
      <div className="nf-links">
        <Link className="btn btn-primary" to="/"><ArrowLeft size={16} /> Back home</Link>
        <button className="btn" onClick={openPalette}>Search the site <kbd>Ctrl</kbd>+<kbd>K</kbd></button>
      </div>
    </main>
  );
}
