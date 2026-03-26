import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/services/api';
import './AdminPages.css';

interface Company {
  id: number;
  name: string;
  logoUrl: string | null;
  hrEmail: string | null;
  createdAt: string | null;
}

export function CompanyManagementPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function load() {
    try {
      const res = await apiFetch<{ success: boolean; data: Company[] }>('/admin/companies');
      setCompanies(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = companies.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.hrEmail?.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/admin/companies/${deleteTarget.id}`, { method: 'DELETE' });
      setCompanies((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  return (
    <div className="admin-page">
      <div className="toolbar">
        <div className="search-wrap">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="8.5" cy="8.5" r="5.5" /><path d="M13 13l4 4" />
          </svg>
          <input
            className="search-input"
            placeholder="회사명 또는 HR 이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>&#x2715;</button>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn-primary" onClick={() => navigate('/admin/register')}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4v12M4 10h12" />
          </svg>
          회사 등록
        </button>
      </div>

      <div className="table-wrap">
        <table className="companies-table">
          <colgroup>
            <col className="col-id" />
            <col className="col-logo" />
            <col className="col-name" />
            <col className="col-hr" />
            <col className="col-date" />
            <col className="col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>로고</th>
              <th>회사명</th>
              <th>HR 이메일</th>
              <th>가입일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="empty-row">불러오는 중...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="empty-row">등록된 회사가 없습니다.</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="tr-expandable" onClick={() => setExpandedId((prev) => prev === c.id ? null : c.id)}>
                <td className="td-id">{c.id}</td>
                <td>
                  {c.logoUrl
                    ? <img className="company-logo-cell" src={c.logoUrl} alt="" />
                    : <span className="logo-placeholder">-</span>
                  }
                </td>
                <td className="td-name">{c.name}</td>
                <td className="td-email">{c.hrEmail ?? '-'}</td>
                <td className="td-meta">{formatDate(c.createdAt)}</td>
                <td>
                  <button className="btn-danger-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}>삭제</button>
                </td>
              </tr>
              {expandedId === c.id && (
                <tr key={`${c.id}-detail`} className="tr-expand-detail">
                  <td colSpan={6}>
                    <div className="expand-detail-content">
                      <div className="expand-detail-row">
                        <span className="expand-detail-label">HR 이메일</span>
                        <span className="expand-detail-value">{c.hrEmail ?? '-'}</span>
                      </div>
                      <div className="expand-detail-row">
                        <span className="expand-detail-label">가입일</span>
                        <span className="expand-detail-value">{formatDate(c.createdAt)}</span>
                      </div>
                      <div className="expand-detail-row">
                        <button className="btn-danger-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}>삭제</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            ))}
          </tbody>
        </table>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title modal-title-danger">회사 삭제</span>
              <button className="modal-close" onClick={() => setDeleteTarget(null)} disabled={deleting}>&#x2715;</button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                <strong>{deleteTarget.name}</strong> (ID: {deleteTarget.id}) 을 삭제하시겠습니까?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>취소</button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
