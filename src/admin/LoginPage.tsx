import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';
import { LoginScreen } from './LoginScreen';
import '../styles/site.css';

type Status = { authed: boolean; local: boolean; configured: boolean; totp?: boolean; google?: string | null; github?: boolean; orcid?: boolean };

/** Dedicated sign-in page, reached by clicking the small "e" on the site. Returns you to where you came from once signed in. */
export default function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = (state as { from?: string } | null)?.from ?? '/';
  const [status, setStatus] = useState<Status | null>(null);

  const check = useCallback(
    () =>
      api<Status>('status')
        .then((raw) => setStatus(raw && typeof raw.authed === 'boolean' ? raw : { authed: false, local: false, configured: false }))
        .catch(() => setStatus({ authed: false, local: false, configured: false })),
    [],
  );
  useEffect(() => {
    document.title = 'Sign in';
    check();
  }, [check]);
  useEffect(() => {
    if (!status?.authed) return;
    try {
      if (!status.local) localStorage.setItem('cms', '1');
    } catch {
      /* storage unavailable */
    }
    navigate(from, { replace: true });
  }, [status, from, navigate]);

  if (!status || status.authed) return <div className="site lg" />;
  return <LoginScreen configured={status.configured} totp={status.totp} google={status.google} github={status.github} orcid={status.orcid} onDone={check} backTo={from} />;
}
