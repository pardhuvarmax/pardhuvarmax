import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { site } from '../lib/content';
import BrokenPage from './BrokenPage';
import RunnerGame from './RunnerGame';
import { openPalette } from './CommandPalette';
import { useEffect } from 'react';

/** 404: the site falling apart. Spider-Man is running the bug game. */
export default function NotFound() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `404 | ${site.name}`;
  }, []);
  const shown = pathname.length > 38 ? pathname.slice(0, 37) + '…' : pathname;
  return (
    <BrokenPage
      code="404"
      title="Page not found"
      noindex
      line={<>GET <b>{shown}</b> → <b>404</b> · <span className="nfb-blink">route not found</span></>}
      copy="That page does not exist, or it moved, and the rest of the site came apart a little with it. Spider-Man is holding what is left together. Help him with the bugs."
      actions={
        <>
          <Link className="nfb-btn" to="/"><ArrowLeft size={16} /> Back home</Link>
          <button className="nfb-btn" onClick={openPalette}>Search the site <kbd>Ctrl</kbd>+<kbd>K</kbd></button>
        </>
      }
    >
      <RunnerGame mono />
    </BrokenPage>
  );
}
