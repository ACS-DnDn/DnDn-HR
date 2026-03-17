import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { apiFetch } from '@/services/api';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const newPwRef = useRef<HTMLInputElement>(null);

  const [challengeMode, setChallengeMode] = useState(false);
  const [challengeSession, setChallengeSession] = useState('');
  const [challengeEmail, setChallengeEmail] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const email = emailRef.current?.value.trim() ?? '';
    const pw = pwRef.current?.value ?? '';
    if (!email) { setError('이메일을 입력해 주세요.'); emailRef.current?.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('올바른 이메일 형식을 입력해 주세요.'); emailRef.current?.focus(); return; }
    if (!pw) { setError('비밀번호를 입력해 주세요.'); pwRef.current?.focus(); return; }

    setError('');
    setIsLoading(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        data?: { challenge?: string; session?: string; accessToken?: string; idToken?: string; refreshToken?: string; username?: string; email?: string };
        error?: { message: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pw }),
      });

      if (!data.success) { setError(data.error?.message || '이메일 또는 비밀번호가 올바르지 않습니다.'); return; }

      if (data.data?.challenge === 'NEW_PASSWORD_REQUIRED') {
        setChallengeEmail(email);
        setChallengeSession(data.data.session ?? '');
        setChallengeMode(true);
        return;
      }

      if (data.data?.accessToken) {
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('id_token', data.data.idToken ?? '');
        localStorage.setItem('refresh_token', data.data.refreshToken ?? '');
        localStorage.setItem('username', data.data.username ?? '');
        localStorage.setItem('email', data.data.email ?? email);
        navigate('/users');
      }
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChallenge(e: React.FormEvent) {
    e.preventDefault();
    const newPw = newPwRef.current?.value ?? '';
    if (!newPw) { setError('새 비밀번호를 입력해 주세요.'); newPwRef.current?.focus(); return; }

    setError('');
    setIsLoading(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        data?: { accessToken?: string; idToken?: string; refreshToken?: string; username?: string; email?: string };
        error?: { message: string };
      }>('/auth/challenge', {
        method: 'POST',
        body: JSON.stringify({ email: challengeEmail, session: challengeSession, newPassword: newPw }),
      });

      if (!data.success) { setError(data.error?.message || '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.'); return; }

      if (data.data?.accessToken) {
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('id_token', data.data.idToken ?? '');
        localStorage.setItem('refresh_token', data.data.refreshToken ?? '');
        localStorage.setItem('username', data.data.username ?? '');
        localStorage.setItem('email', data.data.email ?? challengeEmail);
        navigate('/users');
      }
    } catch {
      setError('비밀번호 변경에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="mode-toggle" onClick={toggle} aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}>
        <div className="toggle-track"><div className="toggle-thumb" /></div>
      </button>

      <div className="glow" />

      <div className="login-container">
        <div className="logo-wrap">
          <AnimatedLogo variant={isDark ? 'dark' : 'light'} className="login-logo-obj" />
          <div className="logo-hr">HR</div>
        </div>

        {!challengeMode ? (
          <form className="form" onSubmit={handleLogin} noValidate>
            <div className="field">
              <input className="field-input" ref={emailRef} type="email" placeholder="이메일" autoComplete="email" />
            </div>
            <div className="field">
              <input className="field-input" ref={pwRef} type="password" placeholder="비밀번호" autoComplete="current-password" />
              <div className={`error-msg${error ? ' show' : ''}`}>{error}</div>
            </div>
            <button className="btn-login" type="submit" disabled={isLoading}>
              {isLoading ? '로그인 중...' : 'LOGIN'}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleChallenge} noValidate>
            <p style={{ fontSize: '0.85rem', marginBottom: '8px', opacity: 0.7 }}>
              첫 로그인입니다. 새 비밀번호를 설정해 주세요.
            </p>
            <div className="field">
              <input className="field-input" ref={newPwRef} type="password" placeholder="새 비밀번호" autoComplete="new-password" />
              <div className={`error-msg${error ? ' show' : ''}`}>{error}</div>
            </div>
            <button className="btn-login" type="submit" disabled={isLoading}>
              {isLoading ? '처리 중...' : '비밀번호 설정'}
            </button>
          </form>
        )}
      </div>

      <div className="version">DnDn HR v1.0</div>
    </>
  );
}
