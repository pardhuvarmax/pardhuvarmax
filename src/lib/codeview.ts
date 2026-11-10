// Code blocks: tokens that have a note get a kind (colour) and an explanation shown on hover.
// Works on the HTML marked already produced, so the text inside <code> is entity-escaped.

export type Notes = Record<string, string>;
export type Kind = 'function' | 'constant' | 'type' | 'keyword' | 'variable' | 'comment' | 'value' | 'string' | 'logic';

const KEYWORDS = new Set(['if', 'else', 'for', 'while', 'return', 'break', 'continue', 'const', 'void', 'static', 'new', 'true', 'false', 'NULL', 'nullptr', 'int', 'bool', 'auto', 'struct', 'class', 'sizeof', 'def', 'import', 'from', 'try', 'except', 'with', 'in', 'not', 'and', 'or', 'is', 'global', 'raise', 'elif', 'lambda', 'func', 'switch', 'case', 'go', 'defer', 'var', 'readonly', 'property', 'then', 'fi', 'do', 'done']);
const TYPES = new Set(['String', 'AsyncWebSocket', 'AsyncWebSocketClient', 'AwsEventType', 'AwsFrameInfo', 'StaticJsonDocument', 'DynamicJsonDocument', 'size_t']);

export function kindOf(id: string, next: string): Kind {
  if (KEYWORDS.has(id)) return 'keyword';
  if (/_t$/.test(id) || TYPES.has(id)) return 'type';
  if (/^[A-Z][A-Z0-9_]{2,}$/.test(id) || /^(ESP|WIFI|WS)_/.test(id)) return 'constant';
  if (next.startsWith('(')) return 'function';
  return 'variable';
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
// text nodes come out of DOMPurify with only & < > escaped, quotes stay literal
const escText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rx = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Notes whose key is not a plain identifier explain a literal piece of code: a comment, a number, a string, an expression.
export function noteKind(key: string, body: string): Kind {
  return IDENT.test(key) ? kindOf(key, body.includes(`${key}(`) ? '(' : '') : phraseKind(key);
}

function phraseKind(key: string): Kind {
  if (key.startsWith('//') || key.startsWith('#')) return 'comment';
  if (/^[0-9]/.test(key)) return 'value';
  if (/^["']/.test(key)) return 'string';
  return 'logic';
}

function annotate(code: string, notes: Notes): string {
  const phrases = Object.keys(notes).filter((k) => !IDENT.test(k)).sort((a, b) => b.length - a.length);
  const lit = phrases.map((k) => {
    const e = rx(escText(k));
    return (/^\w/.test(k) ? '(?<![\\w])' : '') + e + (/\w$/.test(k) ? '(?![\\w])' : '');
  });
  const re = new RegExp(`(${lit.length ? lit.join('|') : '(?!)'})|(&[a-z]+;)|((?:\\/\\/|#)[^\\n]*)|(\"[^\"\\n]*\"|'[^'\\n]*')|([A-Za-z_][A-Za-z0-9_]*)`, 'g');
  const byEsc = new Map(phrases.map((k) => [escText(k), k]));
  return code.replace(re, (m, lt: string | undefined, _ent, _cmt, _str, id: string | undefined, off: number) => {
    if (lt) {
      const key = byEsc.get(m);
      if (!key) return m;
      const kind = phraseKind(key);
      return `<span class="tk tk-alt tk-${kind}" data-id="${esc(key)}" data-kind="${kind}" data-note="${esc(notes[key])}" tabindex="0">${m}</span>`;
    }
    if (!id) return m;
    const note = notes[id];
    if (!note) return m;
    const kind = kindOf(id, code.slice(off + id.length));
    return `<span class="tk tk-${kind}" data-id="${esc(id)}" data-kind="${kind}" data-note="${esc(note)}" tabindex="0">${id}</span>`;
  });
}

/** Wrap noted identifiers inside every fenced code block. A no-op without notes. */
export function annotateCode(html: string, notes?: Notes): string {
  if (!notes || !Object.keys(notes).length) return html;
  return html.replace(/(<pre><code[^>]*>)([\s\S]*?)(<\/code><\/pre>)/g, (_m, open: string, body: string, close: string) => open + annotate(body, notes) + close);
}
