export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = any>(action: string, opts: { query?: Record<string, string>; body?: unknown } = {}): Promise<T> {
  const qs = new URLSearchParams({ action, ...(opts.query ?? {}) });
  const post = opts.body !== undefined || ['login', 'logout'].includes(action);
  const res = await fetch(`/api/admin?${qs}`, {
    method: post ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: post ? { 'Content-Type': 'application/json', 'X-Admin-Request': '1' } : undefined,
    body: post ? JSON.stringify(opts.body ?? {}) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  if (data === null) throw new ApiError(res.status, 'The admin service did not answer. Check that the API is deployed.');
  return data as T;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new Error('Could not read file.'));
    r.readAsDataURL(file);
  });
}

export async function uploadFile(file: File): Promise<string> {
  const { url } = await api<{ url: string }>('upload', { body: { name: file.name, data: await fileToBase64(file) } });
  return url;
}

export const uploadImage = uploadFile;
