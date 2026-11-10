// The hover explanations on code blocks can be switched off. The choice is remembered in this browser.
const KEY = 'codenotes';
const EVT = 'codenotes:change';

export function codeNotesOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setCodeNotes(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage blocked: still apply for this visit */ }
  apply(on);
  window.dispatchEvent(new Event(EVT));
}

export function apply(on = codeNotesOn()) {
  document.documentElement.dataset.codenotes = on ? 'on' : 'off';
}

export function onCodeNotesChange(fn: () => void) {
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
