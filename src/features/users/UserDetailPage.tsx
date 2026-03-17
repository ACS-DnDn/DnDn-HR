import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/services/api';
import './UserDetailPage.css';

interface User {
  id: string;
  employeeNo: string | null;
  name: string;
  email: string;
  position: string | null;
  role: string;
  departmentId: string | null;
  departmentName: string | null;
}

interface Dept { id: string; name: string; parentId: string | null; }

const POSITIONS = ['사원', '대리', '과장', '차장', '부장', '이사'];
const ROLES = [
  { value: 'member', label: '일반 사원' },
  { value: 'leader', label: '부서장' },
  { value: 'hr',     label: 'HR 관리자' },
];

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<User>>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ success: boolean; data: User }>(`/hr/users/${id}`),
      apiFetch<{ success: boolean; data: Dept[] }>('/hr/departments'),
    ]).then(([userRes, deptsRes]) => {
      setUser(userRes.data);
      setForm(userRes.data);
      setDepts(deptsRes.data.filter((d) => d.parentId !== null));
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="detail-page"><p style={{ padding: '40px' }}>로딩 중...</p></div>;
  if (!user) return <div className="detail-page"><p className="detail-not-found">사원을 찾을 수 없습니다.</p></div>;

  const set = (field: keyof User, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const updated = await apiFetch<{ success: boolean; data: User }>(`/hr/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: form.name,
        employeeNo: form.employeeNo,
        position: form.position,
        departmentId: form.departmentId,
        role: form.role,
      }),
    });
    setUser(updated.data);
    setForm(updated.data);
    setEditing(false);
  };

  const handleCancel = () => { setForm(user); setEditing(false); };

  const handleDelete = async () => {
    await apiFetch(`/hr/users/${id}`, { method: 'DELETE' });
    navigate('/users');
  };

  const handleReset = async () => {
    await apiFetch(`/hr/users/${id}/reset-password`, { method: 'POST' });
    setResetConfirm(false);
  };

  return (
    <div className="detail-page">

      <button className="btn-back" onClick={() => navigate('/users')}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M8 2L3 6.5 8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        목록으로
      </button>

      <div className="detail-inner">

        <div className="detail-identity">
          <h1 className="detail-name">{user.name}</h1>
          <div className="detail-empno">{user.employeeNo ?? '-'}</div>
        </div>

        <div className="detail-divider" />

        {editing ? (
          <div className="detail-form">
            <div className="detail-field-row">
              <div className="detail-field">
                <label>이름</label>
                <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="detail-field">
                <label>사번</label>
                <input value={form.employeeNo ?? ''} onChange={(e) => set('employeeNo', e.target.value)} />
              </div>
            </div>
            <div className="detail-field-row">
              <div className="detail-field">
                <label>부서</label>
                <select value={form.departmentId ?? ''} onChange={(e) => set('departmentId', e.target.value)}>
                  <option value="">미지정</option>
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="detail-field">
                <label>직급</label>
                <select value={form.position ?? ''} onChange={(e) => set('position', e.target.value)}>
                  <option value="">선택</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="detail-field">
              <label>역할</label>
              <select value={form.role ?? 'member'} onChange={(e) => set('role', e.target.value)}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="detail-field">
              <label>이메일</label>
              <input value={user.email} disabled style={{ opacity: 0.5 }} />
            </div>
          </div>
        ) : (
          <dl className="detail-view">
            <div className="detail-view-row"><dt>부서</dt><dd>{user.departmentName ?? '-'}</dd></div>
            <div className="detail-view-row"><dt>직급</dt><dd>{user.position ?? '-'}</dd></div>
            <div className="detail-view-row"><dt>역할</dt><dd>{ROLES.find((r) => r.value === user.role)?.label ?? user.role}</dd></div>
            <div className="detail-view-row"><dt>이메일</dt><dd>{user.email}</dd></div>
          </dl>
        )}

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

        {/* 비밀번호 초기화 확인 */}
        {resetConfirm && (
          <div className="modal-backdrop" onClick={() => setResetConfirm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">비밀번호 초기화</h2>
                <button className="modal-close" onClick={() => setResetConfirm(false)}>✕</button>
              </div>
              <div className="modal-body">
                <p className="modal-desc">
                  <strong>{user.name}</strong> ({user.email}) 계정의 비밀번호를 초기화합니다.<br />
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

        {/* 계정 삭제 확인 */}
        {deleteConfirm && (
          <div className="modal-backdrop" onClick={() => setDeleteConfirm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title modal-title-danger">계정 삭제</h2>
                <button className="modal-close" onClick={() => setDeleteConfirm(false)}>✕</button>
              </div>
              <div className="modal-body">
                <p className="modal-desc">
                  <strong>{user.name}</strong> ({user.email}) 계정을 삭제합니다.<br />
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
