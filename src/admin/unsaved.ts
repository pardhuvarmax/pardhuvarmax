import { useEffect } from 'react';

// Unsaved-changes guard shared by the admin page and the on-site edit drawer.
// - While an editor has unsaved changes the browser warns before the page is left, reloaded or closed
//   (that covers plain links such as "View site" and "Full admin").
// - confirmDiscard() is for in-page moves (closing the drawer, switching sections, signing out).
let dirtyCount = 0;

export function confirmDiscard(message = 'You have unsaved changes. Leave without saving?'): boolean {
  return dirtyCount === 0 || window.confirm(message);
}

export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    dirtyCount++;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // some browsers need this to show their prompt
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      dirtyCount--;
      window.removeEventListener('beforeunload', warn);
    };
  }, [dirty]);
}
