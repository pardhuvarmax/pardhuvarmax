// Admin API for the CMS and sign-in.
// IMPORTANT: this file must stay self-contained (only node: built-ins and fetch). Vercel compiles each file in api/ on its own,
// and an import from outside api/ is not bundled into the function ("Cannot find module ... admin-core.ts").
// The Vite dev server imports `handleAdmin` from here too (see vite.config.ts).
// Shared CMS backend. Used by the Vercel function (api/admin.ts) and by the Vite dev middleware.
// Storage: local filesystem in dev, GitHub Contents API in production.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface AdminRequest {
  method: string;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string | undefined>;
}
export interface AdminResult {
  status: number;
  json: unknown;
  headers?: Record<string, string | string[]>;
}
export interface AdminOptions {
  /** Dev server: write to local disk and skip login. */
  local?: boolean;
}

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL = 8 * 60 * 60; // seconds
const TEXT_EXTS = ['.md', '.json'];
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const ALLOWED = [
  { prefix: 'src/content/', exts: TEXT_EXTS },
  { prefix: 'public/uploads/', exts: IMAGE_EXTS },
];

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* ---------------- TOTP ---------------- */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function decodeBase32(input: string): Buffer | null {
  const s = input.trim().toUpperCase().replace(/\s+/g, '').replace(/=+$/g, '');
  if (!s) return null;
  let bits = 0;
  let cur = 0;
  const out: number[] = [];
  for (const ch of s) {
    const i = B32.indexOf(ch);
    if (i < 0) return null;
    cur = (cur << 5) | i;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((cur >> bits) & 0xff);
    }
  }
  return out.length ? Buffer.from(out) : null;
}
function totpAt(key: Buffer, step: number): string {
  const counter = Buffer.alloc(8);
  let c = step;
  for (let i = 7; i >= 0; i--) {
    counter[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const sig = crypto.createHmac('sha1', key).update(counter).digest();
  const o = sig[sig.length - 1] & 0x0f;
  const n = ((sig[o] & 0x7f) << 24) | (sig[o + 1] << 16) | (sig[o + 2] << 8) | sig[o + 3];
  return (n % 1_000_000).toString().padStart(6, '0');
}
function verifyTotp(code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const key = decodeBase32(process.env.TOTP_SECRET ?? '');
  if (!key) return false;
  const step = Math.floor(Date.now() / 1000 / 30);
  return [-1, 0, 1].some((d) => {
    const expected = Buffer.from(totpAt(key, step + d));
    return crypto.timingSafeEqual(expected, Buffer.from(code));
  });
}

/* ---------------- Google sign-in ---------------- */
/** Accounts allowed to sign in with Google (comma separated in ADMIN_EMAILS). */
function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS || 'pardhuvarma.cs@gmail.com').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}
/** Verifies a Google ID token (from Google Identity Services) with Google, and checks audience, issuer, expiry and the allow-list. */
async function verifyGoogle(credential: unknown): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new HttpError(500, 'Google sign-in is not configured.');
  if (typeof credential !== 'string' || credential.length < 20 || credential.length > 8192) throw new HttpError(400, 'Missing Google credential.');
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential));
  if (!r.ok) throw new HttpError(401, 'Google did not accept that sign-in.');
  const t = (await r.json()) as { aud?: string; iss?: string; email?: string; email_verified?: string | boolean; exp?: string | number };
  const issuerOk = t.iss === 'accounts.google.com' || t.iss === 'https://accounts.google.com';
  const email = String(t.email ?? '').toLowerCase();
  if (t.aud !== clientId || !issuerOk || String(t.email_verified) !== 'true' || Number(t.exp) * 1000 < Date.now() || !allowedEmails().includes(email)) {
    throw new HttpError(401, 'This Google account is not allowed to sign in.');
  }
  return email;
}

/* ---------------- GitHub / ORCID sign-in (OAuth authorization-code flow) ---------------- */
const OAUTH = {
  github: { authorize: 'https://github.com/login/oauth/authorize', idEnv: 'GITHUB_CLIENT_ID', secretEnv: 'GITHUB_CLIENT_SECRET' },
  orcid: { authorize: 'https://orcid.org/oauth/authorize', idEnv: 'ORCID_CLIENT_ID', secretEnv: 'ORCID_CLIENT_SECRET' },
} as const;
type Provider = keyof typeof OAUTH;
const providerOf = (p: unknown): Provider => {
  if (p === 'github' || p === 'orcid') return p;
  throw new HttpError(400, 'Unknown sign-in provider.');
};
const oauthConfigured = (p: Provider) => !!process.env[OAUTH[p].idEnv] && !!process.env[OAUTH[p].secretEnv];
const csvEnv = (name: string, fallback: string) => (process.env[name] || fallback).split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);

function siteOrigin(req: AdminRequest): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] ?? 'https').split(',')[0];
  return `${proto}://${host}`;
}
const callbackUrl = (req: AdminRequest, p: Provider) => `${siteOrigin(req)}/auth/${p}/callback`;
/** Where to send the person afterwards: only same-site paths. */
const safeFrom = (v: unknown): string => (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && v.length < 200 && !/[\r\n\\]/.test(v) ? v : '/');
const signState = (nonce: string) => crypto.createHmac('sha256', sessionSecret() + '|oauth').update(nonce).digest('hex');
// SameSite=Lax (not Strict): the provider sends the browser back to us from another site.
const stateCookie = (value: string, maxAge: number, secure: boolean) => `oauth_state=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;

/** Trades the one-time code for the person's identity. Returns the lowercase GitHub login / the ORCID iD. */
async function oauthIdentity(p: Provider, code: string, redirectUri: string): Promise<string> {
  const client_id = process.env[OAUTH[p].idEnv]!;
  const client_secret = process.env[OAUTH[p].secretEnv]!;
  if (p === 'github') {
    const t = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id, client_secret, code, redirect_uri: redirectUri }),
    });
    const token = ((await t.json()) as { access_token?: string }).access_token;
    if (!token) throw new HttpError(401, 'GitHub did not accept that sign-in.');
    const u = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-cms' } });
    return String(((await u.json()) as { login?: string }).login ?? '').toLowerCase();
  }
  const t = await fetch('https://orcid.org/oauth/token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id, client_secret, grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
  });
  const body = (await t.json()) as { orcid?: string };
  if (!body.orcid) throw new HttpError(401, 'ORCID did not accept that sign-in.');
  return body.orcid.toLowerCase();
}
const oauthAllowed = (p: Provider, who: string) => (p === 'github' ? csvEnv('ADMIN_GITHUB_USERS', 'pardhuvarmax') : csvEnv('ADMIN_ORCIDS', '0009-0005-3251-9944')).includes(who);

/* ---------------- Session ---------------- */
/** Key that signs the session cookie. Never derived from anything public (e.g. the Google client id). */
function sessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  return process.env.TOTP_SECRET ? crypto.createHash('sha256').update('admin:' + process.env.TOTP_SECRET).digest('hex') : '';
}
function signSession(exp: number): string {
  const secret = sessionSecret();
  if (!secret) throw new HttpError(500, 'Set ADMIN_SESSION_SECRET (or TOTP_SECRET) on the server to enable sign-in.');
  const sig = crypto.createHmac('sha256', secret).update(String(exp)).digest('hex');
  return `${exp}.${sig}`;
}
function readCookie(header: string | undefined, name: string): string {
  for (const part of (header ?? '').split(';')) {
    const [k, ...v] = part.split('=');
    if (k.trim() === name) return v.join('=').trim();
  }
  return '';
}
function isAuthed(req: AdminRequest): boolean {
  if (!sessionSecret()) return false;
  const [expStr, sig] = readCookie(req.headers.cookie, SESSION_COOKIE).split('.');
  const exp = Number(expStr);
  if (!exp || !sig || exp < Date.now() / 1000) return false;
  const expected = signSession(exp).split('.')[1];
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function cookieHeader(value: string, maxAge: number, secure: boolean): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

const attempts = new Map<string, { count: number; first: number }>();
function throttle(ip: string) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.first > 10 * 60_000) attempts.delete(ip);
  const cur = attempts.get(ip);
  if (cur && cur.count >= 5) throw new HttpError(429, 'Too many attempts. Try again in 10 minutes.');
}
function recordFailure(ip: string) {
  const rec = attempts.get(ip);
  if (rec) rec.count += 1;
  else attempts.set(ip, { count: 1, first: Date.now() });
}

/* ---------------- Paths ---------------- */
function safePath(p: unknown): string {
  if (typeof p !== 'string' || !p || p.includes('\0') || p.includes('\\')) throw new HttpError(400, 'Invalid path.');
  const n = path.posix.normalize(p);
  if (n.startsWith('/') || n.startsWith('..') || n !== p) throw new HttpError(400, 'Invalid path.');
  const rule = ALLOWED.find((r) => n.startsWith(r.prefix));
  if (!rule || !rule.exts.includes(path.posix.extname(n).toLowerCase())) throw new HttpError(403, 'Path not allowed.');
  return n;
}
function safeDir(p: unknown): string {
  if (typeof p !== 'string' || !p || p.includes('..') || p.includes('\\')) throw new HttpError(400, 'Invalid directory.');
  const n = p.replace(/\/+$/, '');
  if (!ALLOWED.some((r) => (n + '/').startsWith(r.prefix))) throw new HttpError(403, 'Directory not allowed.');
  return n;
}

/* ---------------- Storage ---------------- */
interface Storage {
  list(dir: string): Promise<string[]>;
  read(file: string): Promise<string | null>;
  write(file: string, data: Buffer, message: string): Promise<void>;
  remove(file: string, message: string): Promise<void>;
}

const localStorage: Storage = {
  async list(dir) {
    try {
      return (await fs.readdir(path.join(process.cwd(), dir))).filter((f) => !f.startsWith('.'));
    } catch {
      return [];
    }
  },
  async read(file) {
    try {
      return await fs.readFile(path.join(process.cwd(), file), 'utf8');
    } catch {
      return null;
    }
  },
  async write(file, data) {
    const full = path.join(process.cwd(), file);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  },
  async remove(file) {
    await fs.rm(path.join(process.cwd(), file), { force: true });
  },
};

function githubStorage(): Storage {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token || !repo) throw new HttpError(500, 'GITHUB_TOKEN and GITHUB_REPO are not configured.');
  const api = (p: string, init: RequestInit = {}, ref = false) =>
    fetch(`https://api.github.com/repos/${repo}/contents/${p.split('/').map(encodeURIComponent).join('/')}${ref ? `?ref=${branch}` : ''}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'portfolio-cms',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.headers ?? {}),
      },
    });
  const sha = async (file: string): Promise<string | undefined> => {
    const r = await api(file, {}, true);
    if (r.status === 404) return undefined;
    if (!r.ok) throw new HttpError(502, `GitHub error ${r.status}`);
    return ((await r.json()) as { sha: string }).sha;
  };
  return {
    async list(dir) {
      const r = await api(dir, {}, true);
      if (r.status === 404) return [];
      if (!r.ok) throw new HttpError(502, `GitHub error ${r.status}`);
      return ((await r.json()) as { name: string; type: string }[]).filter((f) => f.type === 'file').map((f) => f.name);
    },
    async read(file) {
      const r = await api(file, {}, true);
      if (r.status === 404) return null;
      if (!r.ok) throw new HttpError(502, `GitHub error ${r.status}`);
      const j = (await r.json()) as { content: string };
      return Buffer.from(j.content, 'base64').toString('utf8');
    },
    async write(file, data, message) {
      const r = await api(file, {
        method: 'PUT',
        body: JSON.stringify({ message, content: data.toString('base64'), branch, sha: await sha(file) }),
      });
      if (!r.ok) throw new HttpError(502, `GitHub write failed (${r.status})`);
    },
    async remove(file, message) {
      const s = await sha(file);
      if (!s) return;
      const r = await api(file, { method: 'DELETE', body: JSON.stringify({ message, branch, sha: s }) });
      if (!r.ok) throw new HttpError(502, `GitHub delete failed (${r.status})`);
    },
  };
}

/* ---------------- Handler ---------------- */
export async function handleAdmin(req: AdminRequest, opts: AdminOptions = {}): Promise<AdminResult> {
  const noStore = { 'Cache-Control': 'no-store' };
  const ok = (json: unknown, headers: Record<string, string | string[]> = {}): AdminResult => ({ status: 200, json, headers: { ...noStore, ...headers } });
  try {
    const action = req.query.action ?? '';
    const local = !!opts.local;
    const secure = !local;
    const ip = (req.headers['x-forwarded-for'] ?? 'local').split(',')[0].trim();

    if (action === 'status') {
      const totp = !!process.env.TOTP_SECRET;
      const google = process.env.GOOGLE_CLIENT_ID || null; // a client id is public by design
      return ok({ authed: local || isAuthed(req), local, configured: local || totp || !!google || oauthConfigured('github') || oauthConfigured('orcid'), totp: local || totp, google, github: oauthConfigured('github'), orcid: oauthConfigured('orcid') });
    }

    if (req.method !== 'POST' && ['login', 'google', 'logout', 'write', 'delete', 'upload'].includes(action)) {
      throw new HttpError(405, 'Method Not Allowed');
    }

    if (action === 'login') {
      if (local) return ok({ authed: true, local });
      if (!process.env.TOTP_SECRET) throw new HttpError(500, 'Authenticator sign-in is not configured.');
      throttle(ip);
      const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
      if (!verifyTotp(code)) {
        recordFailure(ip);
        throw new HttpError(401, 'Invalid code.');
      }
      attempts.delete(ip);
      return ok({ authed: true }, { 'Set-Cookie': cookieHeader(signSession(Math.floor(Date.now() / 1000) + SESSION_TTL), SESSION_TTL, secure) });
    }
    if (action === 'google') {
      if (local) return ok({ authed: true, local });
      throttle(ip);
      try {
        await verifyGoogle(req.body?.credential);
      } catch (e) {
        if (e instanceof HttpError && e.status === 401) recordFailure(ip);
        throw e;
      }
      attempts.delete(ip);
      return ok({ authed: true }, { 'Set-Cookie': cookieHeader(signSession(Math.floor(Date.now() / 1000) + SESSION_TTL), SESSION_TTL, secure) });
    }
    if (action === 'oauth-start') {
      const p = providerOf(req.query.provider);
      const from = safeFrom(req.query.from);
      if (local) return { status: 302, json: {}, headers: { Location: from, 'Cache-Control': 'no-store' } };
      if (!oauthConfigured(p)) throw new HttpError(500, `${p} sign-in is not configured.`);
      if (!sessionSecret()) throw new HttpError(500, 'Set ADMIN_SESSION_SECRET (or TOTP_SECRET) on the server to enable sign-in.');
      const nonce = crypto.randomBytes(16).toString('hex');
      const url = new URL(OAUTH[p].authorize);
      url.searchParams.set('client_id', process.env[OAUTH[p].idEnv]!);
      url.searchParams.set('redirect_uri', callbackUrl(req, p));
      url.searchParams.set('state', `${nonce}.${Buffer.from(from).toString('base64url')}`);
      if (p === 'github') {
        url.searchParams.set('scope', 'read:user');
        url.searchParams.set('allow_signup', 'false');
      } else {
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', '/authenticate');
      }
      return { status: 302, json: {}, headers: { Location: url.toString(), 'Set-Cookie': stateCookie(`${nonce}.${signState(nonce)}`, 600, secure), 'Cache-Control': 'no-store' } };
    }
    if (action === 'oauth-callback') {
      const p = providerOf(req.query.provider);
      const back = (location: string, cookies: string[]): AdminResult => ({ status: 302, json: {}, headers: { Location: location, 'Set-Cookie': cookies, 'Cache-Control': 'no-store' } });
      const fail = (message: string) => back('/login?error=' + encodeURIComponent(message), [stateCookie('', 0, secure)]);
      try {
        if (!oauthConfigured(p) || !sessionSecret()) throw new HttpError(500, 'Sign-in is not configured.');
        throttle(ip);
        if (req.query.error) return fail('Sign-in was cancelled.');
        const [nonce, fromB64] = String(req.query.state ?? '').split('.');
        const [cookieNonce, cookieSig] = readCookie(req.headers.cookie, 'oauth_state').split('.');
        const sigOk = !!nonce && nonce === cookieNonce && !!cookieSig && cookieSig.length === signState(nonce).length && crypto.timingSafeEqual(Buffer.from(cookieSig), Buffer.from(signState(nonce)));
        if (!sigOk) {
          recordFailure(ip);
          throw new HttpError(401, 'The sign-in session expired. Please try again.');
        }
        const code = String(req.query.code ?? '');
        if (!code || code.length > 512) throw new HttpError(400, 'Missing sign-in code.');
        const who = await oauthIdentity(p, code, callbackUrl(req, p));
        if (!who || !oauthAllowed(p, who)) {
          recordFailure(ip);
          throw new HttpError(401, 'This account is not allowed to sign in.');
        }
        attempts.delete(ip);
        const from = safeFrom(fromB64 ? Buffer.from(fromB64, 'base64url').toString() : '/');
        return back(from, [stateCookie('', 0, secure), cookieHeader(signSession(Math.floor(Date.now() / 1000) + SESSION_TTL), SESSION_TTL, secure)]);
      } catch (e) {
        return fail(e instanceof HttpError ? e.message : 'Sign-in failed.');
      }
    }
    if (action === 'logout') return ok({ authed: false }, { 'Set-Cookie': cookieHeader('', 0, secure) });

    // Everything below needs a session; state-changing calls also need the CSRF header.
    if (!local && !isAuthed(req)) throw new HttpError(401, 'Not signed in.');
    if (req.method === 'POST' && req.headers['x-admin-request'] !== '1') throw new HttpError(403, 'Missing request header.');

    const store = local ? localStorage : githubStorage();

    if (action === 'list') return ok({ files: await store.list(safeDir(req.query.dir)) });

    if (action === 'read') {
      const content = await store.read(safePath(req.query.path));
      if (content === null) throw new HttpError(404, 'Not found.');
      return ok({ content });
    }

    if (action === 'write') {
      const file = safePath(req.body?.path);
      if (typeof req.body?.content !== 'string') throw new HttpError(400, 'content must be a string.');
      if (file.endsWith('.json')) {
        try {
          JSON.parse(req.body.content);
        } catch {
          throw new HttpError(400, 'Invalid JSON.');
        }
      }
      await store.write(file, Buffer.from(req.body.content, 'utf8'), String(req.body?.message || `cms: update ${file}`).slice(0, 200));
      return ok({ saved: file });
    }

    if (action === 'delete') {
      const file = safePath(req.body?.path);
      await store.remove(file, `cms: delete ${file}`);
      return ok({ deleted: file });
    }

    if (action === 'upload') {
      const name = String(req.body?.name ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
      const file = safePath(`public/uploads/${Date.now()}-${name}`);
      const data = Buffer.from(String(req.body?.data ?? ''), 'base64');
      if (!data.length || data.length > 3_500_000) throw new HttpError(400, 'Image missing or larger than 3.5 MB.');
      await store.write(file, data, `cms: upload ${file}`);
      return ok({ url: '/' + file.replace(/^public\//, '') });
    }

    throw new HttpError(404, 'Unknown action.');
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, json: { error: e.message }, headers: { 'Cache-Control': 'no-store' } };
    return { status: 500, json: { error: 'Server error.' }, headers: { 'Cache-Control': 'no-store' } };
  }
}

/* ---------------- Vercel entry point ---------------- */

interface VercelReq {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}
interface VercelRes {
  setHeader: (name: string, value: string | string[]) => void;
  status: (code: number) => { json: (payload: unknown) => void };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function handler(req: VercelReq, res: VercelRes) {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.query)) query[k] = first(v) ?? '';
  const headers: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(req.headers)) headers[k.toLowerCase()] = first(v);

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }
  }

  const result = await handleAdmin({ method: req.method ?? 'GET', query, body, headers });
  for (const [k, v] of Object.entries(result.headers ?? {})) res.setHeader(k, v);
  return res.status(result.status).json(result.json);
}
