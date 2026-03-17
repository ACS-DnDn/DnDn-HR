import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './UsersPage.css';

/* ─────────────────── 타입 ─────────────────── */
interface User {
  id: string;
  employeeNumber: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
}

/* ─────────────────── 상수 ─────────────────── */
const DEPT_TREE = [
  { name: '기술본부', teams: ['플랫폼팀', '보안팀', '인프라팀', '개발팀'] },
  { name: '경영지원본부', teams: ['인사팀', '경영지원팀'] },
];

const DEPARTMENTS = DEPT_TREE.flatMap((d) => d.teams);
const POSITIONS   = ['사원', '대리', '과장', '차장', '부장', '이사'];

/* ─────────────────── 목업 ─────────────────── */
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

/* ─────────────────── 모달 타입 ─────────────────── */
type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; user: User }
  | { type: 'delete'; user: User }
  | { type: 'reset'; user: User };

/* 필터: '' = 전체, 'dept:기술본부' = 본부, '플랫폼팀' = 팀 */
const PAGE_SIZE = 20;

/* ─────────────────── 메인 ─────────────────── */
export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(DEPT_TREE.map((d) => d.name))
  );
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  /* 인원수: 본부/팀 각각 */
  const counts = useMemo(() => {
    const map: Record<string, number> = { '': users.length };
    for (const u of users) {
      map[u.department] = (map[u.department] ?? 0) + 1;
    }
    for (const d of DEPT_TREE) {
      map[`dept:${d.name}`] = d.teams.reduce((s, t) => s + (map[t] ?? 0), 0);
    }
    return map;
  }, [users]);

  /* 필터링 */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const deptNode = filter.startsWith('dept:') ? filter.slice(5) : null;
    const teams = deptNode
      ? DEPT_TREE.find((d) => d.name === deptNode)?.teams ?? []
      : null;

    return users.filter((u) => {
      const matchName = !q || u.name.includes(q);
      const matchDept = !filter
        ? true
        : teams
          ? teams.includes(u.department)
          : u.department === filter;
      return matchName && matchDept;
    });
  }, [users, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectFilter = (val: string) => {
    setFilter(val);
    setPage(1);
  };

  const toggleExpand = (deptName: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(deptName) ? next.delete(deptName) : next.add(deptName);
      return next;
    });
  };

  /* 액션 핸들러 */
  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setUsers((prev) => [
      {
        id: String(Date.now()),
        employeeNumber: fd.get('employeeNumber') as string,
        name: fd.get('name') as string,
        department: fd.get('department') as string,
        position: fd.get('position') as string,
        email: fd.get('email') as string,
        phone: fd.get('phone') as string,
      },
      ...prev,
    ]);
    setModal({ type: 'none' });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>, user: User) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setUsers((prev) => prev.map((u) =>
      u.id === user.id ? {
        ...u,
        employeeNumber: fd.get('employeeNumber') as string,
        name: fd.get('name') as string,
        department: fd.get('department') as string,
        position: fd.get('position') as string,
        email: fd.get('email') as string,
        phone: fd.get('phone') as string,
      } : u,
    ));
    setModal({ type: 'none' });
  };

  const handleDelete = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setModal({ type: 'none' });
  };

  const handleReset = (userId: string) => {
    setModal({ type: 'none' });
    console.log('reset', userId);
  };

  return (
    <div className="users-page">
      <div className="users-layout">

        {/* ── 부서 트리 ── */}
        <aside className="dept-tree">
          <div className="tree-label">조직</div>

          {/* 전체 */}
          <button
            className={`tree-item${!filter ? ' tree-item--active' : ''}`}
            onClick={() => selectFilter('')}
          >
            <span className="tree-item-name">전체</span>
            <span className="tree-item-count">{counts['']}</span>
          </button>

          {/* 본부 → 팀 */}
          {DEPT_TREE.map((dept) => {
            const isOpen = expanded.has(dept.name);
            const deptKey = `dept:${dept.name}`;
            return (
              <div key={dept.name} className="tree-group">
                <button
                  className={`tree-dept${filter === deptKey ? ' tree-item--active' : ''}`}
                  onClick={() => { toggleExpand(dept.name); selectFilter(deptKey); }}
                >
                  <span className="tree-chevron">{isOpen ? '▾' : '▸'}</span>
                  <span className="tree-item-name">{dept.name}</span>
                  <span className="tree-item-count">{counts[deptKey] ?? 0}</span>
                </button>
                {isOpen && dept.teams.map((team) => (
                  <button
                    key={team}
                    className={`tree-team${filter === team ? ' tree-item--active' : ''}`}
                    onClick={() => selectFilter(team)}
                  >
                    <span className="tree-item-name">{team}</span>
                    <span className="tree-item-count">{counts[team] ?? 0}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </aside>

        {/* ── 오른쪽 영역 ── */}
        <div className="users-main">
          {/* 툴바 */}
          <div className="toolbar">
            <button className="btn-primary" onClick={() => setModal({ type: 'add' })}>
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

          {/* 테이블 */}
          <div className="table-wrap">
            <table className="users-table">
              <colgroup>
                <col className="col-empno" />
                <col className="col-name" />
                <col className="col-dept" />
                <col className="col-pos" />
                <col className="col-email" />
                <col className="col-phone" />
              </colgroup>
              <thead>
                <tr>
                  <th>사번</th>
                  <th>이름</th>
                  <th>부서</th>
                  <th>직급</th>
                  <th>이메일</th>
                  <th>전화번호</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">검색 결과가 없습니다.</td>
                  </tr>
                ) : (
                  list.map((user) => (
                    <tr key={user.id} className="tr-link" onClick={() => navigate(`/users/${user.id}`)}>
                      <td className="td-empno">{user.employeeNumber}</td>
                      <td className="td-name">{user.name}</td>
                      <td className="td-meta">{user.department}</td>
                      <td className="td-meta">{user.position}</td>
                      <td className="td-email">{user.email}</td>
                      <td className="td-phone">{user.phone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="pagination">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >‹</button>
            <span className="page-info">{page} / {totalPages}</span>
            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >›</button>
          </div>
        </div>
      </div>

      {/* ── 모달 ── */}
      {modal.type !== 'none' && (
        <div className="modal-backdrop" onClick={() => setModal({ type: 'none' })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            {modal.type === 'add' && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">사용자 추가</h2>
                  <button className="modal-close" onClick={() => setModal({ type: 'none' })}>✕</button>
                </div>
                <form onSubmit={handleAddSubmit}>
                  <div className="modal-body">
                    <div className="form-row">
                      <div className="form-group">
                        <label>사번</label>
                        <input name="employeeNumber" required placeholder="EMP-009" />
                      </div>
                      <div className="form-group">
                        <label>이름</label>
                        <input name="name" required placeholder="홍길동" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>이메일</label>
                        <input name="email" type="email" required placeholder="user@dndn.com" />
                      </div>
                      <div className="form-group">
                        <label>전화번호</label>
                        <input name="phone" required placeholder="010-0000-0000" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>임시 비밀번호</label>
                      <input name="password" type="password" required placeholder="8자 이상, 대소문자·숫자·특수문자" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>부서</label>
                        <select name="department" required>
                          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>직급</label>
                        <select name="position" required>
                          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-ghost" onClick={() => setModal({ type: 'none' })}>취소</button>
                    <button type="submit" className="btn-primary">추가</button>
                  </div>
                </form>
              </>
            )}

            {modal.type === 'edit' && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">계정 수정</h2>
                  <button className="modal-close" onClick={() => setModal({ type: 'none' })}>✕</button>
                </div>
                <form onSubmit={(e) => handleEditSubmit(e, modal.user)}>
                  <div className="modal-body">
                    <div className="form-row">
                      <div className="form-group">
                        <label>사번</label>
                        <input name="employeeNumber" required defaultValue={modal.user.employeeNumber} />
                      </div>
                      <div className="form-group">
                        <label>이름</label>
                        <input name="name" required defaultValue={modal.user.name} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>이메일</label>
                        <input name="email" type="email" required defaultValue={modal.user.email} />
                      </div>
                      <div className="form-group">
                        <label>전화번호</label>
                        <input name="phone" required defaultValue={modal.user.phone} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>부서</label>
                        <select name="department" defaultValue={modal.user.department}>
                          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>직급</label>
                        <select name="position" defaultValue={modal.user.position}>
                          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-ghost" onClick={() => setModal({ type: 'none' })}>취소</button>
                    <button type="submit" className="btn-primary">저장</button>
                  </div>
                </form>
              </>
            )}

            {modal.type === 'reset' && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">비밀번호 초기화</h2>
                  <button className="modal-close" onClick={() => setModal({ type: 'none' })}>✕</button>
                </div>
                <div className="modal-body">
                  <p className="modal-desc">
                    <strong>{modal.user.name}</strong>의 비밀번호를 초기화합니다.<br />
                    사용자는 다음 로그인 시 비밀번호를 변경해야 합니다.
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn-ghost" onClick={() => setModal({ type: 'none' })}>취소</button>
                  <button className="btn-warning" onClick={() => handleReset(modal.user.id)}>초기화</button>
                </div>
              </>
            )}

            {modal.type === 'delete' && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title modal-title-danger">계정 삭제</h2>
                  <button className="modal-close" onClick={() => setModal({ type: 'none' })}>✕</button>
                </div>
                <div className="modal-body">
                  <p className="modal-desc">
                    <strong>{modal.user.name}</strong> ({modal.user.email}) 계정을 삭제합니다.<br />
                    이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn-ghost" onClick={() => setModal({ type: 'none' })}>취소</button>
                  <button className="btn-danger" onClick={() => handleDelete(modal.user.id)}>삭제</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
