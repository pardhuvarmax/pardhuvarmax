import { handleAdmin } from '../server/admin-core.ts';

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
