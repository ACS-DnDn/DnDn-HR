export const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

// ── 토큰 자동 갱신 ──────────────────────────────────────
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const newToken = json.data?.accessToken;
    if (newToken) {
      localStorage.setItem('access_token', newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

/** 동시 다발 401 시 refresh 요청을 1회로 통합 */
function refreshOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// ── 공통 fetch 헬퍼 ─────────────────────────────────────
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const makeHeaders = (t: string | null) => ({
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...options.headers,
  });

  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: makeHeaders(token),
  });

  // 401 → refresh 후 재시도
  if (res.status === 401) {
    const newToken = await refreshOnce();
    if (newToken) {
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: makeHeaders(newToken),
      });
    } else {
      // refresh 실패 → 자동 로그아웃
      ['access_token', 'refresh_token', 'id_token', 'username', 'email'].forEach(
        (k) => localStorage.removeItem(k),
      );
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('SESSION_EXPIRED');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}
