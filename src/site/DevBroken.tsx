import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CrashPage, ForbiddenPage, MaintenancePage, OfflinePage, SignedOutPage, SlowDownPage } from './BrokenPages';

function Boom(): never {
  throw new Error('Test crash from /__broken/crash');
}

/** Development only (/__broken/<kind>): preview every error page without having to cause the error. */
export default function DevBroken() {
  const { kind } = useParams();
  const [n, setN] = useState(0);
  switch (kind) {
    case '500': return <CrashPage error={new Error('Example error message')} />;
    case '500-stale': return <CrashPage error={new Error('Failed to fetch dynamically imported module: /assets/Admin-xyz.js')} />;
    case 'crash': return <Boom />;
    case '403': return <ForbiddenPage message="This Google account is not allowed to sign in." onClose={() => undefined} />;
    case '401': return <SignedOutPage onSignIn={() => undefined} />;
    case '429': return <SlowDownPage key={n} seconds={42} onRetry={() => setN((v) => v + 1)} />;
    case '429-done': return <SlowDownPage key={`d${n}`} seconds={1} onRetry={() => setN((v) => v + 1)} />;
    case 'offline': return <OfflinePage onDismiss={() => undefined} />;
    case 'online': return <OfflinePage online />;
    case '503': return <MaintenancePage />;
    default: return <p style={{ padding: 40 }}>Try /__broken/500, 500-stale, crash, 403, 401, 429, 429-done, offline, online, 503</p>;
  }
}
