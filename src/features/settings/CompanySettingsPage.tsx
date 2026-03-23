import { useState, useEffect, useRef } from 'react';
import { apiFetch, BASE_URL } from '@/services/api';
import './CompanySettingsPage.css';

interface CompanyData {
  id: number;
  name: string;
  logoUrl: string | null;
}

export function CompanySettingsPage() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 회사명 편집
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  // 로고 업로드
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (messageTimer.current) clearTimeout(messageTimer.current); };
  }, []);

  useEffect(() => {
    apiFetch<{ success: boolean; data: CompanyData }>('/hr/company')
      .then((res) => {
        setCompany(res.data);
        setNameValue(res.data.name);
      })
      .catch(() => setMessage({ type: 'error', text: '회사 정보를 불러올 수 없습니다.' }))
      .finally(() => setLoading(false));
  }, []);

  function showMessage(type: 'success' | 'error', text: string) {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage({ type, text });
    messageTimer.current = setTimeout(() => setMessage(null), 3000);
  }

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || !company || saving) return;
    if (trimmed === company.name) { setEditingName(false); return; }

    setSaving(true);
    try {
      const res = await apiFetch<{ success: boolean; data: CompanyData }>('/hr/company', {
        method: 'PATCH',
        body: JSON.stringify({ name: trimmed }),
      });
      setCompany(res.data);
      setNameValue(res.data.name);
      setEditingName(false);
      showMessage('success', '회사명이 변경되었습니다.');
    } catch {
      showMessage('error', '회사명 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !company || saving) return;

    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      showMessage('error', 'PNG, JPG, SVG, WebP 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', '파일 크기는 2MB 이하여야 합니다.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE_URL}/hr/company/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('upload failed');
      const json = await res.json();
      setCompany(json.data);
      showMessage('success', '로고가 업로드되었습니다.');
    } catch {
      showMessage('error', '로고 업로드에 실패했습니다.');
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (loading) return <div className="settings-page"><p style={{ padding: 40 }}>로딩 중...</p></div>;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">회사 설정</h1>
      </div>

      {message && (
        <div className={`settings-toast settings-toast--${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-card">
        {/* 로고 */}
        <div className="settings-logo-section">
          <div
            className="settings-logo-box"
            onClick={() => fileRef.current?.click()}
            title="클릭하여 로고 변경"
          >
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="회사 로고" className="settings-logo-img" />
            ) : (
              <div className="settings-logo-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
            <div className="settings-logo-overlay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            style={{ display: 'none' }}
            onChange={handleLogoUpload}
          />
          <span className="settings-logo-hint">PNG, JPG, SVG, WebP (2MB 이하)</span>
        </div>

        {/* 회사명 */}
        <div className="settings-field">
          <label className="settings-label">회사명</label>
          {editingName ? (
            <div className="settings-name-edit">
              <input
                ref={nameRef}
                className="settings-name-input"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') { setEditingName(false); setNameValue(company?.name ?? ''); }
                }}
                autoFocus
              />
              <button className="settings-btn settings-btn--save" onClick={handleSaveName} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
              <button className="settings-btn settings-btn--cancel" onClick={() => { setEditingName(false); setNameValue(company?.name ?? ''); }}>
                취소
              </button>
            </div>
          ) : (
            <div className="settings-name-display">
              <span className="settings-name-value">{company?.name ?? '-'}</span>
              <button className="settings-btn settings-btn--edit" onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 0); }}>
                편집
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
