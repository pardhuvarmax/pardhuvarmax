import { useEffect, type RefObject } from 'react';

const LABEL: Record<string, string> = { function: 'function', constant: 'constant', type: 'type', keyword: 'keyword', variable: 'variable', comment: 'comment', value: 'value', string: 'string', logic: 'logic' };

/** Hover (or focus / tap) a noted token in a code block: tint it by kind, light up its other uses, show the note. */
export function useCodeTips(root: RefObject<HTMLElement>, dep: unknown) {
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const tip = document.createElement('div');
    tip.className = 'tk-tip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    let cur: HTMLElement | null = null;

    const clear = () => {
      host.querySelectorAll('.tk-on').forEach((n) => n.classList.remove('tk-on'));
      tip.classList.remove('show');
      cur = null;
    };
    const show = (el: HTMLElement) => {
      if (el === cur) return;
      clear();
      cur = el;
      const id = el.dataset.id ?? '';
      const kind = el.dataset.kind ?? 'variable';
      const pre = el.closest('pre');
      pre?.querySelectorAll<HTMLElement>('.tk').forEach((n) => { if (n.dataset.id === id) n.classList.add('tk-on'); });
      const uses = pre ? [...pre.querySelectorAll<HTMLElement>('.tk')].filter((n) => n.dataset.id === id).length : 1;
      tip.className = `tk-tip tk-${kind}${el.classList.contains('tk-alt') ? ' tk-alt' : ''}`;
      tip.replaceChildren();
      const head = document.createElement('div');
      head.className = 'tk-head';
      const badge = document.createElement('span');
      badge.className = 'tk-badge';
      badge.textContent = LABEL[kind] ?? kind;
      const name = document.createElement('code');
      name.textContent = id;
      head.append(badge, name);
      const body = document.createElement('p');
      body.textContent = el.dataset.note ?? '';
      tip.append(head, body);
      if (uses > 1) {
        const foot = document.createElement('div');
        foot.className = 'tk-foot';
        foot.textContent = `used ${uses}× in this block`;
        tip.append(foot);
      }
      const r = el.getBoundingClientRect();
      void tip.offsetWidth; // restart the pop-in animation
      tip.classList.add('show');
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let x = Math.min(Math.max(12, r.left), window.innerWidth - w - 12);
      let y = r.top - h - 10;
      if (y < 72) y = r.bottom + 10; // not under the nav: flip below
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    };

    const over = (e: Event) => {
      if (document.documentElement.dataset.codenotes === 'off') return;
      const el = (e.target as HTMLElement).closest?.('.tk') as HTMLElement | null;
      if (el && host.contains(el)) show(el);
    };
    const out = (e: Event) => {
      const el = (e.target as HTMLElement).closest?.('.tk');
      if (el) clear();
    };
    host.addEventListener('mouseover', over);
    host.addEventListener('mouseout', out);
    host.addEventListener('focusin', over);
    host.addEventListener('focusout', out);
    host.addEventListener('click', over); // tap on touch screens
    const away = () => clear();
    window.addEventListener('scroll', away, { passive: true });
    return () => {
      host.removeEventListener('mouseover', over);
      host.removeEventListener('mouseout', out);
      host.removeEventListener('focusin', over);
      host.removeEventListener('focusout', out);
      host.removeEventListener('click', over);
      window.removeEventListener('scroll', away);
      tip.remove();
    };
  }, [root, dep]);
}
