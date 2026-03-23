import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react';
import { apiFetch } from '@/services/api';

/* ── 타입 ── */
export interface Company {
  name: string;
  logoUrl: string;
  logoDarkUrl: string;
}

export interface Session {
  name: string;
  role: string;
  position: string | null;
  company: Company;
}

interface ApiMeResponse {
  success: boolean;
  data: { name: string; role: string; position: string | null; company: { name: string; logoUrl: string } };
}

interface ApiLoginData {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  username: string;
  email: string;
}

interface ApiChallengeData {
  challenge: string;
  session: string;
}

export type LoginResult =
  | { type: 'success' }
  | { type: 'challenge'; session: string; email: string };

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  challenge: (email: string, newPassword: string, session: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

/* ── Context ── */
export const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  login: async () => ({ type: 'success' }),
  challenge: async () => {},
  refreshSession: async () => {},
});

/* ── 헬퍼 ── */
const AUTH_KEYS = ['access_token', 'refresh_token', 'id_token', 'username', 'email'] as const;

function clearAuthStorage() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

function saveTokens(data: ApiLoginData) {
  localStorage.setItem('access_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);
  localStorage.setItem('id_token', data.idToken);
  localStorage.setItem('username', data.username);
  localStorage.setItem('email', data.email);
}

async function fetchMe(): Promise<Session> {
  const res = await apiFetch<ApiMeResponse>('/auth/me');
  const { name, role, position, company } = res.data;
  return {
    name,
    role,
    position: position ?? null,
    company: { name: company.name, logoUrl: company.logoUrl, logoDarkUrl: company.logoUrl },
  };
}

/* ── Provider ── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setIsLoading(false); return; }
    fetchMe()
      .then((sess) => {
        if (sess.role === 'hr') setSession(sess);
        else clearAuthStorage();
      })
      .catch(() => clearAuthStorage())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const res = await apiFetch<{ success: boolean; data: ApiLoginData | ApiChallengeData; error?: { message: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    if (!res.success) throw new Error(res.error?.message ?? '로그인 실패');
    const data = res.data;
    if ('challenge' in data) {
      return { type: 'challenge', session: data.session, email };
    }
    saveTokens(data as ApiLoginData);
    let sess: Session;
    try {
      sess = await fetchMe();
    } catch {
      clearAuthStorage();
      throw new Error('사용자 정보를 불러올 수 없습니다.');
    }
    if (sess.role !== 'hr') {
      clearAuthStorage();
      throw new Error('접근 권한이 없습니다.');
    }
    setSession(sess);
    return { type: 'success' };
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const sess = await fetchMe();
      setSession(sess);
    } catch { /* 무시 — 세션 갱신 실패해도 로그아웃하지 않음 */ }
  }, []);

  const challenge = useCallback(async (email: string, newPassword: string, challengeSession: string) => {
    const res = await apiFetch<{ success: boolean; data: ApiLoginData; error?: { message: string } }>(
      '/auth/challenge',
      { method: 'POST', body: JSON.stringify({ email, session: challengeSession, newPassword }) },
    );
    if (!res.success) throw new Error(res.error?.message ?? '비밀번호 변경 실패');
    saveTokens(res.data);
    let sess: Session;
    try {
      sess = await fetchMe();
    } catch {
      clearAuthStorage();
      throw new Error('사용자 정보를 불러올 수 없습니다.');
    }
    if (sess.role !== 'hr') {
      clearAuthStorage();
      throw new Error('접근 권한이 없습니다.');
    }
    setSession(sess);
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, login, challenge, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── 훅 ── */
export function useSession(): Session {
  const { session } = useContext(AuthContext);
  if (!session) throw new Error('useSession must be used inside a protected route');
  return session;
}

export function useAuth() {
  return useContext(AuthContext);
}
