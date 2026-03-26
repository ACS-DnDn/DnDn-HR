import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/services/api';
import './AdminPages.css';

interface FormData {
  hrEmail: string;
  hrName: string;
}

const INITIAL: FormData = { hrEmail: '', hrName: '' };

export function CompanyRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.hrName.trim()) e.hrName = '이름을 입력하세요.';
    if (!form.hrEmail.trim()) {
      e.hrEmail = '이메일을 입력하세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.hrEmail)) {
      e.hrEmail = '올바른 이메일 형식이 아닙니다.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiFetch('/admin/companies', {
        method: 'POST',
        body: JSON.stringify({ hrEmail: form.hrEmail.trim(), hrName: form.hrName.trim() }),
      });
      navigate('/admin/companies');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '등록에 실패했습니다.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-inner">
        <h1 className="register-title">회사 등록</h1>

        <div className="register-divider" />

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>HR 관리자 이름 <span className="required">*</span></label>
            <input
              placeholder="홍길동"
              value={form.hrName}
              onChange={(e) => setForm({ ...form, hrName: e.target.value })}
              className={errors.hrName ? 'input-error' : ''}
            />
            {errors.hrName && <span className="field-error">{errors.hrName}</span>}
          </div>

          <div className="form-field">
            <label>HR 관리자 이메일 <span className="required">*</span></label>
            <input
              type="email"
              placeholder="hr@company.com"
              value={form.hrEmail}
              onChange={(e) => setForm({ ...form, hrEmail: e.target.value })}
              className={errors.hrEmail ? 'input-error' : ''}
            />
            {errors.hrEmail && <span className="field-error">{errors.hrEmail}</span>}
          </div>

          {apiError && <p className="field-error" style={{ textAlign: 'center' }}>{apiError}</p>}

          <div className="register-actions">
            <button type="submit" className="btn-primary-sm" disabled={submitting}>
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
