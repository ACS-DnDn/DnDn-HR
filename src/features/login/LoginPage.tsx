import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/services/api';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [session, setSession] = useState('');
  const [challenge, setChallenge] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        data?: { challenge?: string; session?: string; accessToken?: string; idToken?: string; refreshToken?: string; username?: string; email?: string };
        error?: { message: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!data.success) { setError(data.error?.message || '로그인 실패'); return; }

      if (data.data?.challenge === 'NEW_PASSWORD_REQUIRED') {
        setSession(data.data.session ?? '');
        setChallenge(true);
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
      setError('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        data?: { accessToken?: string; idToken?: string; refreshToken?: string; username?: string; email?: string };
        error?: { message: string };
      }>('/auth/challenge', {
        method: 'POST',
        body: JSON.stringify({ email, session, newPassword }),
      });

      if (!data.success) { setError(data.error?.message || '비밀번호 변경 실패'); return; }

      if (data.data?.accessToken) {
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('id_token', data.data.idToken ?? '');
        localStorage.setItem('refresh_token', data.data.refreshToken ?? '');
        localStorage.setItem('username', data.data.username ?? '');
        localStorage.setItem('email', data.data.email ?? email);
        navigate('/users');
      }
    } catch {
      setError('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">DnDn HR</div>
        <div className="login-subtitle">인사 관리 포털</div>

        {!challenge ? (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="field-group">
              <label className="field-label">이메일</label>
              <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="field-group">
              <label className="field-label">비밀번호</label>
              <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="btn-login" type="submit" disabled={loading}>{loading ? '로그인 중…' : '로그인'}</button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleChallenge}>
            <div className="login-notice">초기 비밀번호를 변경해야 합니다.</div>
            <div className="field-group">
              <label className="field-label">새 비밀번호</label>
              <input className="field-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoFocus />
            </div>
            <div className="field-group">
              <label className="field-label">비밀번호 확인</label>
              <input className="field-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="btn-login" type="submit" disabled={loading}>{loading ? '변경 중…' : '비밀번호 변경'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
