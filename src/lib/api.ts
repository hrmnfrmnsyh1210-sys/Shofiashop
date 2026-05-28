import type { AuthResponse } from './types';

const API_BASE = '/api/v1';

const ACCESS_KEY = 'compos.accessToken';
const REFRESH_KEY = 'compos.refreshToken';
const USER_KEY = 'compos.user';
const TENANT_KEY = 'compos.tenant';

type TenantSnapshot = { id: string; name: string; slug: string } | null;

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse['user'];
    } catch {
      return null;
    }
  },
  getTenant: (): TenantSnapshot => {
    const raw = localStorage.getItem(TENANT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TenantSnapshot;
    } catch {
      return null;
    }
  },
  set: (data: AuthResponse) => {
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  },
  setUser: (user: AuthResponse['user']) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setTenant: (tenant: TenantSnapshot) => {
    if (tenant) localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
    else localStorage.removeItem(TENANT_KEY);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANT_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  skipAuth?: boolean;
};

let refreshInflight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInflight) return refreshInflight;
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;

  refreshInflight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        tokenStore.clear();
        return null;
      }
      const data = (await res.json()) as AuthResponse;
      tokenStore.set(data);
      return data.accessToken;
    } catch {
      tokenStore.clear();
      return null;
    } finally {
      refreshInflight = null;
    }
  })();
  return refreshInflight;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function doFetch<T>(path: string, options: RequestOptions, isRetry = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (!options.skipAuth) {
    const token = tokenStore.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 401 && !options.skipAuth && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return doFetch<T>(path, options, true);
    }
    tokenStore.clear();
    // Surface auth failure so AuthProvider can redirect.
    window.dispatchEvent(new CustomEvent('compos:unauthorized'));
    throw new ApiError(401, 'Sesi habis. Silakan login ulang.');
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const errObj = (payload as { error?: { message?: string; details?: unknown } } | undefined)?.error;
    throw new ApiError(res.status, errObj?.message ?? `Request failed (${res.status})`, errObj?.details);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...options, method: 'DELETE' }),
};
