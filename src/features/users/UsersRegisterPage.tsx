import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordRules, validatePassword } from '@/components/PasswordRules';
import './UsersRegisterPage.css';

const DEPT_TREE = [
  { name: '기술본부', teams: ['플랫폼팀', '보안팀', '인프라팀', '개발팀'] },
  { name: '경영지원본부', teams: ['인사팀', '경영지원팀'] },
];
const DEPARTMENTS = DEPT_TREE.flatMap((d) => d.teams);
const POSITIONS = ['사원', '대리', '과장', '차장', '부장', '이사'];

interface RegisterForm {
  employeeNumber: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  initPassword: string;
}

const EMPTY: RegisterForm = {
  employeeNumber: '',
  name: '',
  department: '',
  position: '',
  email: '',
  phone: '',
  initPassword: '',
};

export function UsersRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const set = (field: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const e: Partial<RegisterForm> = {};
    if (!form.employeeNumber.trim()) e.employeeNumber = '사번을 입력하세요.';
    if (!form.name.trim()) e.name = '이름을 입력하세요.';
    if (!form.department) e.department = '부서를 선택하세요.';
    if (!form.position) e.position = '직급을 선택하세요.';
    if (!form.email.trim()) e.email = '이메일을 입력하세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.';
    if (!form.phone.trim()) e.phone = '전화번호를 입력하세요.';
    if (!form.initPassword.trim()) e.initPassword = '초기 비밀번호를 입력하세요.';
    else if (!validatePassword(form.initPassword)) e.initPassword = '비밀번호 규칙을 확인하세요.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      /* TODO: POST /hr/users
       * body: { employeeNumber, name, department, position, email, phone, initPassword }
       * 1. Cognito AdminCreateUser(TemporaryPassword=initPassword, MessageAction="SUPPRESS")
       * 2. DB users 테이블 insert
       */
      await new Promise((r) => setTimeout(r, 600)); // mock delay
      navigate('/users');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">

      {/* ── 뒤로가기 ── */}
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

        {/* ── 폼 ── */}
        <div className="register-form">

          {/* 사번 / 이름 */}
          <div className="form-row">
            <div className="form-field">
              <label>사번 <span className="required">*</span></label>
              <input
                value={form.employeeNumber}
                onChange={(e) => set('employeeNumber', e.target.value)}
                className={errors.employeeNumber ? 'input-error' : ''}
              />
              {errors.employeeNumber && <span className="field-error">{errors.employeeNumber}</span>}
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
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
                className={errors.department ? 'input-error' : ''}
              >
                <option value="">선택</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <span className="field-error">{errors.department}</span>}
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

          {/* 전화번호 */}
          <div className="form-field">
            <label>전화번호 <span className="required">*</span></label>
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={errors.phone ? 'input-error' : ''}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          {/* 초기 비밀번호 */}
          <div className="form-field">
            <label>초기 비밀번호 <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                value={form.initPassword}
                onChange={(e) => set('initPassword', e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                className={errors.initPassword ? 'input-error' : ''}
              />
              <PasswordRules password={form.initPassword} show={pwFocused} />
            </div>
            {errors.initPassword && <span className="field-error">{errors.initPassword}</span>}
          </div>
        </div>

        {/* ── 액션 ── */}
        <div className="register-actions">
          <button className="btn-ghost-sm" onClick={() => navigate('/users')} disabled={submitting}>
            취소
          </button>
          <button className="btn-primary-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '등록 중...' : '사원 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
