import { useEffect, useRef, useState } from 'react';
import { special } from '../lib/content';
import { MaintenancePage, OfflinePage } from './BrokenPages';

/** Shows the "No signal" page when the connection drops, and closes it with a short "back online" when it returns. */
export function OfflineGate() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  const [dismissed, setDismissed] = useState(false);
  const [back, setBack] = useState(false);
  const was = useRef(offline);
  const [since, setSince] = useState(() => new Date().toTimeString().slice(0, 8)); // when the browser said the connection was lost
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const off = () => { was.current = true; setSince(new Date().toTimeString().slice(0, 8)); setOffline(true); setDismissed(false); setBack(false); };
    const on = () => {
      if (!was.current) return;
      was.current = false;
      setBack(true);
      timer = setTimeout(() => { setOffline(false); setBack(false); }, 1700);
    };
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on); clearTimeout(timer); };
  }, []);
  if (!offline || (dismissed && !back)) return null;
  return <OfflinePage online={back} since={since} onDismiss={() => setDismissed(true)} />;
}

/** Maintenance mode (Special > Maintenance mode): visitors see the 503 page. The owner, signed in or running locally, sees the
 *  site as normal with a thin banner, so they can still check their work. */
export function MaintenanceGate() {
  const cfg = special as Record<string, unknown>;
  if (cfg.maintenance !== true) return null;
  let owner = import.meta.env.DEV;
  try { owner = owner || localStorage.getItem('cms') === '1'; } catch { /* storage unavailable */ }
  if (!owner) return <MaintenancePage text={typeof cfg.maintenanceText === 'string' ? cfg.maintenanceText : undefined} />;
  return (
    <div className="maint-banner" role="status">
      Maintenance mode is on: visitors see the 503 page. Turn it off under Special in the admin.
    </div>
  );
}
