import { useState, useMemo, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { apiFetch } from '@/services/api';
import './DepartmentsPage.css';

interface DeptNode {
  id: string;
  name: string;
  parentId: string | null;
  leaderId: string | null;
  leaderName: string | null;
}

interface Member {
  id: string;
  employeeNo: string | null;
  name: string;
  position: string | null;
  departmentId: string | null;
}

interface LayoutNode extends DeptNode {
  children: LayoutNode[];
  x: number;
  y: number;
}

const NW  = 130;
const NH  = 44;
const GX  = 60;
const GY  = 14;
const PAD = 32;

function buildLayout(nodes: DeptNode[]): { root: LayoutNode; svgW: number; svgH: number } | null {
  const rootData = nodes.find((n) => n.parentId === null);
  if (!rootData) return null;

  function build(n: DeptNode): LayoutNode {
    return { ...n, children: nodes.filter((c) => c.parentId === n.id).map(build), x: 0, y: 0 };
  }
  const root = build(rootData);

  function subtreeH(n: LayoutNode): number {
    if (!n.children.length) return NH;
    return Math.max(NH, n.children.reduce((s, c, i) => s + subtreeH(c) + (i > 0 ? GY : 0), 0));
  }

  function assign(n: LayoutNode, depth: number, top: number) {
    n.x = PAD + depth * (NW + GX);
    n.y = top + (subtreeH(n) - NH) / 2;
    let cur = top;
    for (const c of n.children) {
      assign(c, depth + 1, cur);
      cur += subtreeH(c) + GY;
    }
  }

  assign(root, 0, PAD);

  function maxDepth(n: LayoutNode): number {
    return n.children.length ? 1 + Math.max(...n.children.map(maxDepth)) : 0;
  }

  const totalH = subtreeH(root);
  const d = maxDepth(root);
  return { root, svgW: PAD + d * (NW + GX) + NW + PAD, svgH: totalH + PAD * 2 };
}

function getEdges(n: LayoutNode): { id: string; path: string }[] {
  return n.children.flatMap((c) => {
    const px = n.x + NW, py = n.y + NH / 2, cx = c.x, cy = c.y + NH / 2, mx = (px + cx) / 2;
    return [
      { id: `${n.id}→${c.id}`, path: `M${px},${py} L${mx},${py} L${mx},${cy} L${cx},${cy}` },
      ...getEdges(c),
    ];
  });
}

function getNodes(n: LayoutNode): LayoutNode[] {
  return [n, ...n.children.flatMap(getNodes)];
}

export function DepartmentsPage() {
  const session = useSession();
  const [deptNodes, setDeptNodes] = useState<DeptNode[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addingName, setAddingName] = useState('');
  const [isEditingLeader, setIsEditingLeader] = useState(false);
  const [pendingLeader, setPendingLeader] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ success: boolean; data: DeptNode[] }>('/hr/departments'),
      apiFetch<{ success: boolean; data: Member[] }>('/hr/users'),
    ]).then(([deptsRes, usersRes]) => {
      setDeptNodes(deptsRes.data);
      setMembers(usersRes.data);
    }).catch((err) => console.error('Failed to load departments/users:', err))
      .finally(() => setLoading(false));
  }, []);

  const VIRTUAL_ROOT_ID = '__root__';

  const nodes = useMemo(() => {
    const hasRoot = deptNodes.some((n) => n.parentId === null);
    let rootRenamed = false;
    const mapped = deptNodes.map((n) => {
      if (n.parentId === null && !rootRenamed) {
        rootRenamed = true;
        return { ...n, name: session.company.name };
      }
      return n;
    });
    if (!hasRoot) {
      mapped.unshift({
        id: VIRTUAL_ROOT_ID,
        name: session.company.name,
        parentId: null,
        leaderId: null,
        leaderName: null,
      });
    }
    return mapped;
  }, [deptNodes, session.company.name]);

  const layout   = useMemo(() => buildLayout(nodes), [nodes]);
  const edges    = useMemo(() => layout ? getEdges(layout.root) : [], [layout]);
  const allNodes = useMemo(() => layout ? getNodes(layout.root) : [], [layout]);

  const selectedNode = allNodes.find((n) => n.id === selected) ?? null;

  const deptMembers = useMemo(
    () => selectedNode ? members.filter((m) => m.departmentId === selectedNode.id) : [],
    [selectedNode, members],
  );

  const totalCount = members.length;
  const leafCount  = allNodes.filter((n) => !n.children.length).length;
  const hasChildren = (id: string) => deptNodes.some((n) => n.parentId === id);

  function resetEditState() {
    setIsAdding(false);
    setAddingName('');
    setIsEditingLeader(false);
    setActionError(null);
  }

  function selectNode(id: string) {
    resetEditState();
    setSelected((prev) => prev === id ? null : id);
  }

  function handleMainClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.org-node') && !target.closest('.dept-detail')) {
      resetEditState();
      setSelected(null);
    }
  }

  async function handleAddDept() {
    const name = addingName.trim();
    if (!name || !selected || saving) return;
    setSaving(true);
    try {
      const parentId = selected === VIRTUAL_ROOT_ID ? null : selected;
      const res = await apiFetch<{ success: boolean; data: DeptNode }>('/hr/departments', {
        method: 'POST',
        body: JSON.stringify({ name, parentId }),
      });
      setDeptNodes((prev) => [...prev, res.data]);
      setAddingName('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add department:', err);
      setActionError('부서 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDept(id: string) {
    if (saving) return;
    setSaving(true);
    try {
      await apiFetch(`/hr/departments/${id}`, { method: 'DELETE' });
      setDeptNodes((prev) => prev.filter((n) => n.id !== id));
      setSelected(null);
    } catch (err) {
      console.error('Failed to delete department:', err);
      setActionError('부서 삭제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLeader() {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await apiFetch<{ success: boolean; data: DeptNode }>(
        `/hr/departments/${selected}/leader`,
        { method: 'PATCH', body: JSON.stringify({ leaderId: pendingLeader || null }) },
      );
      setDeptNodes((prev) => prev.map((n) => n.id === selected ? res.data : n));
      setIsEditingLeader(false);
    } catch (err) {
      console.error('Failed to set leader:', err);
      setActionError('부서장 지정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="dept-page"><p style={{ padding: '40px' }}>로딩 중...</p></div>;

  const addForm = isAdding ? (
    <div className="detail-add-form">
      <input
        className="detail-add-input"
        value={addingName}
        onChange={(e) => setAddingName(e.target.value)}
        placeholder="부서명"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAddDept();
          if (e.key === 'Escape') { setIsAdding(false); setAddingName(''); }
        }}
        autoFocus
      />
      <div className="detail-add-btns">
        <button className="detail-add-confirm" onClick={handleAddDept} disabled={saving}>추가</button>
        <button className="detail-add-cancel" onClick={() => { setIsAdding(false); setAddingName(''); }}>취소</button>
      </div>
    </div>
  ) : (
    <button className="detail-add-btn" onClick={() => setIsAdding(true)}>＋ 하위 부서 추가</button>
  );

  return (
    <div className="dept-page">
      <div className="dept-header">
        <h1 className="dept-title">부서 관리</h1>
      </div>

      <div className="dept-main" onClick={handleMainClick}>
        {/* 조직도 */}
        <div className="org-wrap">
          <div className="org-canvas" style={{ width: layout?.svgW ?? 0, height: layout?.svgH ?? 0 }}>
            <svg className="org-svg" width={layout?.svgW ?? 0} height={layout?.svgH ?? 0}>
              {edges.map(({ id, path }) => (
                <path key={id} d={path} className="org-edge" />
              ))}
            </svg>
            {allNodes.map((node) => (
              <button
                key={node.id}
                className={[
                  'org-node',
                  node.parentId === null ? 'org-node--root' : '',
                  node.id === selected   ? 'org-node--active' : '',
                ].filter(Boolean).join(' ')}
                style={{ left: node.x, top: node.y, width: NW, height: NH }}
                onClick={() => selectNode(node.id)}
              >
                {node.name}
              </button>
            ))}
          </div>
        </div>

        {/* 상세 패널 */}
        <div className={`dept-detail${selectedNode ? ' dept-detail--open' : ''}`}>
          {actionError && <p className="dept-action-error">{actionError}</p>}
          {selectedNode && (
            <>
              <div className="dept-detail-header">
                <div className="dept-detail-name">{selectedNode.name}</div>
                {selectedNode.parentId !== null && !hasChildren(selectedNode.id) && (
                  <button
                    className="dept-action-delete"
                    onClick={() => handleDeleteDept(selectedNode.id)}
                    disabled={saving}
                  >
                    삭제
                  </button>
                )}
              </div>

              {selectedNode.parentId === null ? (
                <>
                  <div className="detail-stat-row">
                    <div className="detail-stat">
                      <span className="detail-stat-value">{totalCount}</span>
                      <span className="detail-stat-label">전체 인원</span>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-stat-value">{leafCount}</span>
                      <span className="detail-stat-label">팀 수</span>
                    </div>
                  </div>
                  <div className="detail-add-section">{addForm}</div>
                </>
              ) : (
                <>
                  <div className="detail-section">
                    <div className="detail-section-label">부서장</div>
                    {isEditingLeader ? (
                      <div className="detail-leader-edit">
                        <select
                          className="detail-leader-select"
                          value={pendingLeader}
                          onChange={(e) => setPendingLeader(e.target.value)}
                        >
                          <option value="">미지정</option>
                          {deptMembers.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} · {m.position ?? '-'}</option>
                          ))}
                        </select>
                        <div className="detail-add-btns">
                          <button className="detail-add-confirm" onClick={handleSaveLeader} disabled={saving}>저장</button>
                          <button className="detail-add-cancel" onClick={() => setIsEditingLeader(false)}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className="detail-leader-row">
                        <span className={selectedNode.leaderName ? 'detail-leader' : 'detail-value-muted'}>
                          {selectedNode.leaderName ?? '미지정'}
                        </span>
                        <button
                          className="detail-edit-btn"
                          onClick={() => {
                            setPendingLeader(selectedNode.leaderId ?? '');
                            setIsEditingLeader(true);
                          }}
                        >
                          편집
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <div className="detail-section-label">
                      소속 인원
                      {deptMembers.length > 0 && (
                        <span className="detail-badge">{deptMembers.length}</span>
                      )}
                    </div>
                    {deptMembers.length === 0 ? (
                      <div className="detail-value-muted">없음</div>
                    ) : (
                      <div className="detail-member-list">
                        {deptMembers.map((m) => (
                          <div key={m.id} className="detail-member-row">
                            <span className="detail-member-name">
                              {m.name}
                              <span className="detail-member-empno">({m.employeeNo ?? '-'})</span>
                            </span>
                            <span className="detail-member-pos">{m.position ?? '-'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="detail-add-section">{addForm}</div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
