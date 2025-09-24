export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export function getToken(): string | null {
  return localStorage.getItem("access_token");
}
export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}
export function clearToken() {
  localStorage.removeItem("access_token");
}

type Options = RequestInit & { json?: unknown };

async function doFetch<T>(path: string, opts: Options = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (opts.json !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
    credentials: "omit",
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.detail || data.message)) || res.statusText;
    throw new Error(String(msg));
  }
  return data as T;
}

export function apiFetch<T>(path: string, opts: Options = {}) {
  return doFetch<T>(path, opts);
}

export function authed<T>(path: string, opts: Options = {}) {
  const token = getToken();
  if (!token) throw new Error("NO_TOKEN");
  const headers = {
    ...(opts.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  };
  return doFetch<T>(path, { ...opts, headers });
}