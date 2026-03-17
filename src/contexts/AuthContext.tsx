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
  company: Company;
}

interface ApiMeResponse {
  success: boolean;
  data: { name: string; role: string; company: { name: string; logoUrl: string } };
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
}

/* ── Context ── */
export const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  login: async () => ({ type: 'success' }),
  challenge: async () => {},
});

/* ── 헬퍼 ── */
function saveTokens(data: ApiLoginData) {
  localStorage.setItem('access_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);
  localStorage.setItem('id_token', data.idToken);
  localStorage.setItem('username', data.username);
  localStorage.setItem('email', data.email);
}

async function fetchMe(): Promise<Session> {
  const res = await apiFetch<ApiMeResponse>('/auth/me');
  const { name, role, company } = res.data;
  return {
    name,
    role,
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
      .then(setSession)
      .catch(() => {
        // 백엔드 미연동 시 localStorage 값으로 임시 세션 구성
        const username = localStorage.getItem('username');
        if (username) {
          setSession({
            name: username,
            role: 'HR 관리자',
            company: { name: 'DnDn', logoUrl: '', logoDarkUrl: '' },
          });
        }
      })
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
    const sess = await fetchMe();
    if (sess.role !== 'hr') {
      localStorage.clear();
      throw new Error('접근 권한이 없습니다.');
    }
    setSession(sess);
    return { type: 'success' };
  }, []);

  const challenge = useCallback(async (email: string, newPassword: string, sess: string) => {
    const res = await apiFetch<{ success: boolean; data: ApiLoginData; error?: { message: string } }>(
      '/auth/challenge',
      { method: 'POST', body: JSON.stringify({ email, session: sess, newPassword }) },
    );
    if (!res.success) throw new Error(res.error?.message ?? '비밀번호 변경 실패');
    saveTokens(res.data);
    const sess = await fetchMe();
    if (sess.role !== 'hr') {
      localStorage.clear();
      throw new Error('접근 권한이 없습니다.');
    }
    setSession(sess);
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, login, challenge }}>
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
