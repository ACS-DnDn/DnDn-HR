import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/services/api';
import './UsersPage.css';

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

interface Dept {
  id: string;
  name: string;
  parentId: string | null;
}

const PAGE_SIZE = 20;

function getDescendantIds(id: string, depts: Dept[]): string[] {
  const children = depts.filter((d) => d.parentId === id);
  return [id, ...children.flatMap((c) => getDescendantIds(c.id, depts))];
}

export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDeptId, setFilterDeptId] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ success: boolean; data: User[] }>('/hr/users'),
      apiFetch<{ success: boolean; data: Dept[] }>('/hr/departments'),
    ]).then(([usersRes, deptsRes]) => {
      setUsers(usersRes.data);
      const all = deptsRes.data;
      const rootId = all.find((d) => d.parentId === null)?.id;
      const nonRoot = all.filter((d) => d.parentId !== null);
      setDepts(nonRoot);
      setExpanded(new Set(nonRoot.filter((d) => d.parentId === rootId).map((d) => d.id)));
    }).catch((err) => {
      console.error('Failed to load users/departments:', err);
      setLoadError('데이터를 불러올 수 없습니다.');
    }).finally(() => setLoading(false));
  }, []);

  const deptIdSet = useMemo(() => new Set(depts.map((d) => d.id)), [depts]);
  const topDepts = useMemo(
    () => depts.filter((d) => !deptIdSet.has(d.parentId ?? '')),
    [depts, deptIdSet],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || u.name.toLowerCase().includes(q);
      const matchDept =
        !filterDeptId ||
        getDescendantIds(filterDeptId, depts).includes(u.departmentId ?? '');
      return matchSearch && matchDept;
    });
  }, [users, search, filterDeptId, depts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectFilter = (val: string) => { setFilterDeptId(val); setPage(1); };
  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  function renderTree(parentId: string | null, depth: number): React.ReactNode {
    const children = (parentId === null ? topDepts : depts.filter((d) => d.parentId === parentId))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return children.map((dept) => {
      const hasKids = depts.some((d) => d.parentId === dept.id);
      const isOpen = expanded.has(dept.id);
      const count = getDescendantIds(dept.id, depts).filter((id) =>
        users.some((u) => u.departmentId === id),
      ).length;
      return (
        <div key={dept.id} className="tree-group">
          <button
            className={`${depth === 0 ? 'tree-dept' : 'tree-team'}${filterDeptId === dept.id ? ' tree-item--active' : ''}`}
            onClick={() => { if (hasKids) toggleExpand(dept.id); selectFilter(dept.id); }}
          >
            {hasKids && <span className="tree-chevron">{isOpen ? '▾' : '▸'}</span>}
            <span className="tree-item-name">{dept.name}</span>
            <span className="tree-item-count">{count}</span>
          </button>
          {hasKids && isOpen && renderTree(dept.id, depth + 1)}
        </div>
      );
    });
  }

  if (loading) return <div className="users-page"><p style={{ padding: '40px' }}>로딩 중...</p></div>;
  if (loadError) return <div className="users-page"><p style={{ padding: '40px', color: 'var(--color-danger, #e53e3e)' }}>{loadError}</p></div>;

  return (
    <div className="users-page">
      <div className="users-layout">

        {/* ── 부서 트리 ── */}
        <aside className="dept-tree">
          <div className="tree-label">조직</div>
          <button
            className={`tree-item${!filterDeptId ? ' tree-item--active' : ''}`}
            onClick={() => selectFilter('')}
          >
            <span className="tree-item-name">전체</span>
            <span className="tree-item-count">{users.length}</span>
          </button>
          {renderTree(null, 0)}
        </aside>

        {/* ── 오른쪽 영역 ── */}
        <div className="users-main">
          <div className="toolbar">
            <button className="btn-primary" onClick={() => navigate('/users/register')}>
              + 사원 추가
            </button>
            <div className="search-wrap">
              <svg className="search-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8.5 8.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                className="search-input"
                placeholder="이름 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
          </div>

          <div className="table-wrap">
            <table className="users-table">
              <colgroup>
                <col className="col-empno" />
                <col className="col-name" />
                <col className="col-dept" />
                <col className="col-pos" />
                <col className="col-email" />
              </colgroup>
              <thead>
                <tr>
                  <th>사번</th>
                  <th>이름</th>
                  <th>부서</th>
                  <th>직급</th>
                  <th>이메일</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-row">검색 결과가 없습니다.</td>
                  </tr>
                ) : (
                  list.map((user) => (
                    <tr key={user.id} className="tr-link" onClick={() => navigate(`/users/${user.id}`)}>
                      <td className="td-empno">{user.employeeNo ?? '-'}</td>
                      <td className="td-name">{user.name}</td>
                      <td className="td-meta">{user.departmentName ?? '-'}</td>
                      <td className="td-meta">{user.position ?? '-'}</td>
                      <td className="td-email">{user.email}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            <span className="page-info">{page} / {totalPages}</span>
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
