import { useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import BrokenPage from './BrokenPage';
import { Scene401, Scene403, Scene429, Scene500, Scene503, SceneOffline } from './BrokenScenes';

const home = <a className="nfb-btn" href="/"><ArrowLeft size={16} /> Back home</a>;

export const isChunkError = (e?: Error | null) => !!e && /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk|Failed to fetch dynamically/i.test(`${e.name} ${e.message}`);

/** 500: a page crashed while drawing. Replaces what used to be a blank white screen. */
const stamp = () => new Date().toTimeString().slice(0, 8);
const useStamp = () => useState(stamp)[0]; // fixed at first render so the log does not tick
const clean = (l: string) => l.trim().replace(/https?:\/\/[^/\s)]+/g, '').replace(/\?[^\s):]*/g, '').slice(0, 96);
/** What the console would print for a crash: the error, then the first few stack frames. */
const crashLog = (e: Error | null | undefined, t: string): string[] => {
  const frames = (e?.stack ?? '').split('\n').filter((l) => /\bat\s|@/.test(l)).slice(0, 4).map(clean);
  return [`[${t}] ERROR ${clean(`${e?.name ?? 'Error'}: ${e?.message ?? 'unknown'}`)}`, ...frames, `[${t}] render aborted, page unmounted`];
};

export function CrashPage({ error }: { error?: Error | null }) {
  const stale = isChunkError(error);
  const t = useStamp();
  return (
    <BrokenPage
      code="500"
      seed={3}
      tint={stale}
      log={stale ? undefined : crashLog(error, t)}
      title={stale ? 'New version out' : 'Something broke'}
      line={<>ERROR <b>500</b> · <span className="nfb-blink">{stale ? 'page files changed' : 'the page crashed'}</span></>}
      copy={stale ? 'The site was updated while this tab was open, so some of its files are gone. Reload to get the new version.' : 'Something went wrong while drawing this page. It is not you, and Spider-Man is on it. Reloading usually helps.'}
      scene={<Scene500 stale={stale} />}
      actions={
        <>
          <button className="nfb-btn nfb-primary" onClick={() => window.location.reload()}><RotateCcw size={16} /> Reload</button>
          <a className="nfb-btn" href="/">Back home</a>
        </>
      }
    >
      {error && !stale && <p className="nfb-err">{String(error.message).slice(0, 160)}</p>}
    </BrokenPage>
  );
}

/** 403: signed in, or tried to, but not allowed. */
export function ForbiddenPage({ message, onClose, closeLabel = 'Try another way' }: { message?: string; onClose?: () => void; closeLabel?: string }) {
  const t = useStamp();
  return (
    <BrokenPage
      code="403"
      seed={5}
      log={message ? [`[${t}] ERROR 403 ${clean(message)}`] : undefined}
      title="Not allowed"
      line={<>ERROR <b>403</b> · <span className="nfb-blink">access denied</span></>}
      copy={message || 'This account is not on the list, so Spider-Man is not letting it through.'}
      scene={<Scene403 />}
      actions={
        <>
          {onClose && <button className="nfb-btn nfb-primary" onClick={onClose}>{closeLabel}</button>}
          {home}
        </>
      }
    />
  );
}

/** 401: the session ended, or you are not signed in. */
/** `detail` is what the server actually said: the status, its message and which request it was. */
export function SignedOutPage({ onSignIn, detail }: { onSignIn: () => void; detail?: { status: number; message: string; action: string } }) {
  const t = useStamp();
  return (
    <BrokenPage
      code="401"
      seed={11}
      log={detail ? [`[${t}] ERROR ${detail.status} ${clean(detail.message)}`, `request: ${clean(detail.action)}`] : undefined}
      title="Signed out"
      line={<>ERROR <b>401</b> · <span className="nfb-blink">session ended</span></>}
      copy="Your session ended, or you were never signed in. Spider-Man needs to see some ID before you carry on."
      scene={<Scene401 />}
      actions={
        <>
          <button className="nfb-btn nfb-primary" onClick={onSignIn}>Sign in</button>
          {home}
        </>
      }
    />
  );
}

/** 429: too many sign-in attempts, with a live countdown. */
/** `detail` is the server's own message; `exact` says the seconds came from its Retry-After rather than a guess. */
export function SlowDownPage({ seconds, onRetry, detail, exact = false }: { seconds: number; onRetry: () => void; detail?: string; exact?: boolean }) {
  const t = useStamp();
  const total = Math.max(1, Math.round(seconds));
  const [left, setLeft] = useState(total);
  useEffect(() => {
    const id = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <BrokenPage
      code="429"
      seed={13}
      tint={left === 0}
      log={left === 0 || !detail ? undefined : [`[${t}] ERROR 429 ${clean(detail)}`, ...(exact ? [`retry-after: ${left}s`] : [])]}
      title="Slow down"
      line={<>ERROR <b>429</b> · try again in <b>{mm}:{ss}</b></>}
      copy="Too many sign-in attempts. Spider-Man is out of breath. Wait for the timer to run out, then try again."
      scene={<Scene429 progress={1 - left / total} done={left === 0} />}
      actions={
        <>
          <button className="nfb-btn nfb-primary" onClick={onRetry} disabled={left > 0}>{left > 0 ? `Wait ${mm}:${ss}` : 'Try again'}</button>
          {home}
        </>
      }
    />
  );
}

/** Offline: the connection dropped. */
/** `since` is when the browser reported the connection lost. */
export function OfflinePage({ online = false, onDismiss, since }: { online?: boolean; onDismiss?: () => void; since?: string }) {
  const t = useStamp();
  return (
    <BrokenPage
      code="OFF"
      seed={17}
      tint={online}
      log={online ? undefined : [`[${since ?? t}] ERROR connection lost`, 'navigator.onLine = false']}
      title={online ? 'Back online' : 'No signal'}
      line={online ? <>CONNECTION <b>restored</b></> : <>NETWORK <b>unreachable</b> · <span className="nfb-blink">waiting for signal</span></>}
      copy={online ? 'Got it. Carry on.' : 'Your connection dropped. What is already on this page still works, but anything new has to wait. Spider-Man is shouting down the line.'}
      scene={<SceneOffline online={online} />}
      actions={
        !online && (
          <>
            {onDismiss && <button className="nfb-btn nfb-primary" onClick={onDismiss}>Keep reading</button>}
            <button className="nfb-btn" onClick={() => window.location.reload()}><RotateCcw size={16} /> Try again</button>
          </>
        )
      }
    />
  );
}

/** 503: maintenance mode, switched on under Special in the admin. */
export function MaintenancePage({ text }: { text?: string }) {
  const t = useStamp();
  return (
    <BrokenPage
      code="503"
      seed={19}
      log={[`[${t}] ERROR 503 maintenance mode is on`, 'special.maintenance = true', ...(text ? [`note: ${clean(text)}`] : [])]}
      title="Back soon"
      line={<>ERROR <b>503</b> · <span className="nfb-blink">down for maintenance</span></>}
      copy={text || 'The site is getting a little maintenance. Spider-Man is taking a short nap meanwhile, and both will be back soon.'}
      scene={<Scene503 />}
      actions={<button className="nfb-btn nfb-primary" onClick={() => window.location.reload()}><RotateCcw size={16} /> Check again</button>}
    />
  );
}
