import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/services/api';
import './UsersRegisterPage.css';

interface Dept { id: string; name: string; parentId: string | null; }

const POSITIONS = ['사원', '대리', '과장', '차장', '부장', '이사'];
const ROLES = [
  { value: 'member', label: '일반 사원' },
  { value: 'leader', label: '부서장' },
  { value: 'hr',     label: 'HR 관리자' },
];

interface RegisterForm {
  employeeNo: string;
  name: string;
  departmentId: string;
  position: string;
  email: string;
  role: string;
}

const EMPTY: RegisterForm = {
  employeeNo: '', name: '', departmentId: '', position: '', email: '', role: 'member',
};

export function UsersRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [depts, setDepts] = useState<Dept[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<{ success: boolean; data: Dept[] }>('/hr/departments').then((res) => {
      setDepts(res.data.filter((d) => d.parentId !== null));
    }).catch((err) => {
      console.error('Failed to load departments:', err);
      setErrors({ departmentId: '부서 목록을 불러올 수 없습니다.' });
    });
  }, []);

  const set = (field: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof RegisterForm, string>> = {};
    if (!form.employeeNo.trim()) e.employeeNo = '사번을 입력하세요.';
    if (!form.name.trim()) e.name = '이름을 입력하세요.';
    if (!form.departmentId) e.departmentId = '부서를 선택하세요.';
    if (!form.position) e.position = '직급을 선택하세요.';
    if (!form.email.trim()) e.email = '이메일을 입력하세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiFetch('/hr/users', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          employeeNo: form.employeeNo,
          position: form.position,
          departmentId: form.departmentId,
          role: form.role,
        }),
      });
      navigate('/users');
    } catch {
      setErrors({ email: '등록에 실패했습니다. 다시 시도해 주세요.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">

      <button className="btn-back" onClick={() => navigate('/users')}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M8 2L3 6.5 8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        목록으로
      </button>

      <div className="register-inner">
        <div className="register-header">
          <h1 className="register-title">사원 등록</h1>
        </div>

        <div className="register-divider" />

        <div className="register-form">

          {/* 사번 / 이름 */}
          <div className="form-row">
            <div className="form-field">
              <label>사번 <span className="required">*</span></label>
              <input
                value={form.employeeNo}
                onChange={(e) => set('employeeNo', e.target.value)}
                className={errors.employeeNo ? 'input-error' : ''}
              />
              {errors.employeeNo && <span className="field-error">{errors.employeeNo}</span>}
            </div>
            <div className="form-field">
              <label>이름 <span className="required">*</span></label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
          </div>

          {/* 부서 / 직급 */}
          <div className="form-row">
            <div className="form-field">
              <label>부서 <span className="required">*</span></label>
              <select
                value={form.departmentId}
                onChange={(e) => set('departmentId', e.target.value)}
                className={errors.departmentId ? 'input-error' : ''}
              >
                <option value="">선택</option>
                {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.departmentId && <span className="field-error">{errors.departmentId}</span>}
            </div>
            <div className="form-field">
              <label>직급 <span className="required">*</span></label>
              <select
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
                className={errors.position ? 'input-error' : ''}
              >
                <option value="">선택</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.position && <span className="field-error">{errors.position}</span>}
            </div>
          </div>

          {/* 이메일 */}
          <div className="form-field">
            <label>이메일 <span className="required">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {/* 역할 */}
          <div className="form-field">
            <label>역할</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <p className="register-note">등록 후 Cognito에서 임시 비밀번호가 이메일로 자동 발송됩니다.</p>
        </div>

        <div className="register-actions">
          <button className="btn-ghost-sm" onClick={() => navigate('/users')} disabled={submitting}>취소</button>
          <button className="btn-primary-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '등록 중...' : '사원 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
