import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './UserDetailPage.css';

interface User {
  id: string;
  employeeNumber: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
}

const DEPT_TREE = [
  { name: '기술본부', teams: ['플랫폼팀', '보안팀', '인프라팀', '개발팀'] },
  { name: '경영지원본부', teams: ['인사팀', '경영지원팀'] },
];
const DEPARTMENTS = DEPT_TREE.flatMap((d) => d.teams);
const POSITIONS   = ['사원', '대리', '과장', '차장', '부장', '이사'];

const MOCK_USERS: User[] = [
  { id: '1', employeeNumber: 'EMP-001', name: '김창하', department: '플랫폼팀',   position: '부장', email: 'changha@dndn.com',  phone: '010-1234-5678' },
  { id: '2', employeeNumber: 'EMP-002', name: '이준혁', department: '인사팀',     position: '대리', email: 'junhyuk@dndn.com',  phone: '010-2345-6789' },
  { id: '3', employeeNumber: 'EMP-003', name: '박지수', department: '보안팀',     position: '과장', email: 'jisoo@dndn.com',    phone: '010-3456-7890' },
  { id: '4', employeeNumber: 'EMP-004', name: '최민준', department: '개발팀',     position: '사원', email: 'minjun@dndn.com',   phone: '010-4567-8901' },
  { id: '5', employeeNumber: 'EMP-005', name: '정다은', department: '인프라팀',   position: '사원', email: 'daeun@dndn.com',    phone: '010-5678-9012' },
  { id: '6', employeeNumber: 'EMP-006', name: '한서연', department: '플랫폼팀',   position: '차장', email: 'seoyeon@dndn.com',  phone: '010-6789-0123' },
  { id: '7', employeeNumber: 'EMP-007', name: '오태양', department: '보안팀',     position: '대리', email: 'taeyang@dndn.com',  phone: '010-7890-1234' },
  { id: '8', employeeNumber: 'EMP-008', name: '윤하늘', department: '경영지원팀', position: '과장', email: 'haneul@dndn.com',   phone: '010-8901-2345' },
];

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const original = MOCK_USERS.find((u) => u.id === id);
  const [form, setForm] = useState<User | null>(original ?? null);
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  if (!form) {
    return <div className="detail-page"><p className="detail-not-found">사원을 찾을 수 없습니다.</p></div>;
  }

  const set = (field: keyof User, value: string) =>
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);

  const handleSave = () => {
    /* TODO: PATCH /hr/users/:id */
    setEditing(false);
  };

  const handleCancel = () => {
    setForm(original!);
    setEditing(false);
  };

  const handleDelete = () => {
    /* TODO: DELETE /hr/users/:id */
    navigate('/users');
  };

  const handleReset = () => {
    /* TODO: POST /hr/users/:id/reset-password
     * Cognito AdminResetUserPassword → 임시 비밀번호 이메일 자동 발송
     */
    setResetConfirm(false);
  };

  return (
    <div className="detail-page">

      {/* ── 뒤로가기 ── */}
      <button className="btn-back" onClick={() => navigate('/users')}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M8 2L3 6.5 8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        목록으로
      </button>

      <div className="detail-inner">

      {/* ── 이름 / 사번 (고정) ── */}
      <div className="detail-identity">
        <h1 className="detail-name">{form.name}</h1>
        <div className="detail-empno">{form.employeeNumber}</div>
      </div>

      <div className="detail-divider" />

      {/* ── 정보 ── */}
      {editing ? (
        <div className="detail-form">
          <div className="detail-field-row">
            <div className="detail-field">
              <label>부서</label>
              <select value={form.department} onChange={(e) => set('department', e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="detail-field">
              <label>직급</label>
              <select value={form.position} onChange={(e) => set('position', e.target.value)}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="detail-field">
            <label>이메일</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="detail-field">
            <label>전화번호</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>
      ) : (
        <dl className="detail-view">
          <div className="detail-view-row">
            <dt>부서</dt><dd>{form.department}</dd>
          </div>
          <div className="detail-view-row">
            <dt>직급</dt><dd>{form.position}</dd>
          </div>
          <div className="detail-view-row">
            <dt>이메일</dt><dd>{form.email}</dd>
          </div>
          <div className="detail-view-row">
            <dt>전화번호</dt><dd>{form.phone}</dd>
          </div>
        </dl>
      )}

      {/* ── 액션 ── */}
      <div className="detail-actions">
        {editing ? (
          <>
            <button className="btn-ghost-sm" onClick={handleCancel}>취소</button>
            <button className="btn-primary-sm" onClick={handleSave}>저장</button>
          </>
        ) : (
          <>
            <button className="btn-outline-sm" onClick={() => setResetConfirm(true)}>비밀번호 초기화</button>
            <button className="btn-danger-sm" onClick={() => setDeleteConfirm(true)}>계정 삭제</button>
            <button className="btn-primary-sm" onClick={() => setEditing(true)}>수정</button>
          </>
        )}
      </div>

      {/* ── 비밀번호 초기화 확인 ── */}
      {resetConfirm && (
        <div className="modal-backdrop" onClick={() => setResetConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">비밀번호 초기화</h2>
              <button className="modal-close" onClick={() => setResetConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                <strong>{form.name}</strong> ({form.email}) 계정의 비밀번호를 초기화합니다.<br />
                임시 비밀번호가 이메일로 자동 발송됩니다.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setResetConfirm(false)}>취소</button>
              <button className="btn-warning" onClick={handleReset}>초기화</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 계정 삭제 확인 ── */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title modal-title-danger">계정 삭제</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                <strong>{form.name}</strong> ({form.email}) 계정을 삭제합니다.<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setDeleteConfirm(false)}>취소</button>
              <button className="btn-danger" onClick={handleDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
