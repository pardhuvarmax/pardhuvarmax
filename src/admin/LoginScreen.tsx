import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { siGithub, siOrcid } from 'simple-icons';
import { api } from './api';
import DotGrid from '../site/DotGrid';
import { useDynamicColors } from '../site/useDynamicColors';
import { SpiderSprite, type Frame } from '../site/spiderman';
import { site } from '../lib/content';
import '../styles/site.css';
import '../styles/login.css';

const LEN = 6;

/** Loads Google Identity Services once. */
let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { gsiPromise = null; reject(new Error('Could not load Google sign-in.')); };
      document.head.appendChild(s);
    });
  }
  return gsiPromise;
}
// Spider-Man sits on the card and glances around: centre, left, centre, right
const LOOK: Frame[] = ['sit', 'sit-left', 'sit', 'sit-right'];
const LOOK_MS = [1500, 1100, 800, 1100];

/** Full-page sign-in: six digit boxes (type, paste or autofill; submits itself on the last digit). */
export function LoginScreen({ configured, totp = true, google = null, github = false, orcid = false, onDone, backTo = '/', returnTo }: { configured: boolean; totp?: boolean; google?: string | null; github?: boolean; orcid?: boolean; onDone: () => void; backTo?: string; returnTo?: string }) {
  useDynamicColors();
  const alt = !!google || github || orcid; // other ways in besides the authenticator code
  const ret = returnTo ?? backTo; // where GitHub / ORCID send you after signing in
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get('error'); // sent back by a failed GitHub / ORCID sign-in
    if (e) setErr(e);
  }, []);
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(''));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0); // bumps after a wrong code so the boxes shake again
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [lookIdx, setLookIdx] = useState(0);
  const [sense, setSense] = useState(false);
  const senseTimer = useRef<number>();
  const prevFilled = useRef(0);
  const filled = digits.filter(Boolean).length;
  const googleBtn = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setLookIdx((i) => (i + 1) % LOOK.length), LOOK_MS[lookIdx]);
    return () => window.clearTimeout(t);
  }, [lookIdx]);
  const flash = useCallback((ms: number) => {
    setSense(true);
    window.clearTimeout(senseTimer.current);
    senseTimer.current = window.setTimeout(() => setSense(false), ms);
  }, []);
  useEffect(() => {
    if (filled > prevFilled.current) flash(650); // spider-sense on every digit entered
    prevFilled.current = filled;
  }, [filled, flash]);
  useEffect(() => { if (round) flash(1400); }, [round, flash]); // longer when the code was wrong
  useEffect(() => () => window.clearTimeout(senseTimer.current), []);

  // "Sign in with Google": Google returns a signed ID token, the server verifies it and checks the allowed account
  useEffect(() => {
    if (!google) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        const gid = (window as any).google?.accounts?.id;
        if (cancelled || !gid || !googleBtn.current) return;
        gid.initialize({
          client_id: google,
          callback: async ({ credential }: { credential: string }) => {
            try {
              await api('google', { body: { credential } });
              onDone();
            } catch (e) {
              setErr((e as Error).message);
              setRound((r) => r + 1);
            }
          },
        });
        gid.renderButton(googleBtn.current, { theme: 'filled_black', size: 'large', shape: 'rectangular', text: 'signin_with', logo_alignment: 'left', width: 320 });
      })
      .catch((e) => setErr((e as Error).message));
    return () => { cancelled = true; };
  }, [google, onDone]);

  const submit = useCallback(
    async (code: string) => {
      if (!configured || busy) return;
      setBusy(true);
      setErr('');
      try {
        await api('login', { body: { code } });
        onDone();
      } catch (e) {
        setErr((e as Error).message);
        setRound((r) => r + 1);
        setDigits(Array(LEN).fill(''));
        setTimeout(() => refs.current[0]?.focus(), 0);
      } finally {
        setBusy(false);
      }
    },
    [configured, busy, onDone],
  );

  useEffect(() => {
    if (configured) refs.current[0]?.focus();
  }, [configured]);

  const fill = (start: number, text: string) => {
    const chars = text.replace(/\D/g, '').slice(0, LEN - start).split('');
    if (!chars.length) return;
    const next = digits.slice();
    chars.forEach((c, k) => (next[start + k] = c));
    setDigits(next);
    setErr('');
    const nextIndex = Math.min(start + chars.length, LEN - 1);
    refs.current[nextIndex]?.focus();
    if (next.every(Boolean)) submit(next.join(''));
  };
  const onChange = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '');
    if (!v) {
      const next = digits.slice();
      next[i] = '';
      setDigits(next);
    } else if (v.length > 1) fill(0, v); // a whole code arrived at once (autofill / paste)
    else fill(i, v);
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = digits.slice();
      next[i - 1] = '';
      setDigits(next);
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < LEN - 1) refs.current[i + 1]?.focus();
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fill(0, e.clipboardData.getData('text'));
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length === LEN) submit(code);
  };

  return (
    <div className="site lg">
      <DotGrid />
      <main className="lg-card">
        <div className="lg-spidey" aria-hidden="true"><SpiderSprite frame={sense ? 'sit-sense' : LOOK[lookIdx]} /></div>
        <div className="lg-brand"><span>K</span>{site.shortName}</div>
        <p className="lg-kicker" data-text="Content admin">Content admin</p>
        <h1>Sign in</h1>
        <p className="lg-lede">{alt ? (totp ? "Use your authenticator code, or choose another way to sign in." : "Choose how you want to sign in.") : "Enter the 6-digit code from your authenticator app."}</p>

        {totp && (
        <form onSubmit={onSubmit}>
          <div key={round} className={`lg-otp ${err ? 'bad' : ''}`} role="group" aria-label="6-digit code">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                value={d}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={i === 0 ? LEN : 1}
                aria-label={`Digit ${i + 1}`}
                disabled={!configured || busy}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                onPaste={onPaste}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>
          {err && <p className="lg-err" role="alert">{err}</p>}
          {!configured && (
            <p className="lg-note">
              Sign-in isn&rsquo;t set up on this server yet.
              <span>Add <code>TOTP_SECRET</code> to the environment and redeploy.</span>
            </p>
          )}
          <button className="lg-btn" disabled={!configured || busy || digits.some((d) => !d)}>{busy ? 'Checking…' : 'Sign in'}</button>
        </form>
        )}

        {alt && (
          <>
            {totp && <p className="lg-or"><span>or</span></p>}
            {google && <div className="lg-google" ref={googleBtn} />}
            {(github || orcid) && (
              <div className="lg-oauth">
                {github && (
                  <a className="lg-provider" href={`/api/admin?action=oauth-start&provider=github&from=${encodeURIComponent(ret)}`}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d={siGithub.path} /></svg> Continue with GitHub
                  </a>
                )}
                {orcid && (
                  <a className="lg-provider" href={`/api/admin?action=oauth-start&provider=orcid&from=${encodeURIComponent(ret)}`}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d={siOrcid.path} /></svg> Continue with ORCID
                  </a>
                )}
              </div>
            )}
            {!totp && err && <p className="lg-err" role="alert">{err}</p>}
          </>
        )}

        <Link className="lg-back" to={backTo}><ArrowLeft size={14} /> Back to site</Link>
      </main>
    </div>
  );
}
