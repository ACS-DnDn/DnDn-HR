import { useState, useMemo } from 'react';
import { useSession } from '@/hooks/useSession';
import './DepartmentsPage.css';

/* ─────────────────── 타입 ─────────────────── */
interface DeptNode {
  id: string;
  name: string;
  parentId: string | null;
  leaderId: string | null;
}

interface Member {
  id: string;
  employeeNo: string;
  name: string;
  position: string;
  department: string;
}

interface LayoutNode extends DeptNode {
  children: LayoutNode[];
  x: number;
  y: number;
}

/* ─────────────────── 레이아웃 상수 ─────────────────── */
const NW  = 130;
const NH  = 44;
const GX  = 60;
const GY  = 14;
const PAD = 32;

/* ─────────────────── 목업 ─────────────────── */
// TODO: GET /hr/departments → DeptNode[]
const MOCK_NODES: DeptNode[] = [
  { id: 'root', name: '__company__',  parentId: null,   leaderId: null },
  { id: 'd1',   name: '기술본부',     parentId: 'root', leaderId: null },
  { id: 'd2',   name: '경영지원본부', parentId: 'root', leaderId: null },
  { id: 't1',   name: '플랫폼팀',    parentId: 'd1',   leaderId: '1'  },
  { id: 't2',   name: '보안팀',      parentId: 'd1',   leaderId: '3'  },
  { id: 't3',   name: '인프라팀',    parentId: 'd1',   leaderId: '5'  },
  { id: 't4',   name: '개발팀',      parentId: 'd1',   leaderId: '4'  },
  { id: 't5',   name: '인사팀',      parentId: 'd2',   leaderId: '2'  },
  { id: 't6',   name: '경영지원팀',  parentId: 'd2',   leaderId: '8'  },
];

// TODO: GET /hr/users → Member[]
const MOCK_MEMBERS: Member[] = [
  { id: '1', employeeNo: '20210001', name: '김창하', position: '부장', department: '플랫폼팀' },
  { id: '2', employeeNo: '20220003', name: '이준혁', position: '대리', department: '인사팀' },
  { id: '3', employeeNo: '20190007', name: '박지수', position: '과장', department: '보안팀' },
  { id: '4', employeeNo: '20230012', name: '최민준', position: '사원', department: '개발팀' },
  { id: '5', employeeNo: '20230015', name: '정다은', position: '사원', department: '인프라팀' },
  { id: '6', employeeNo: '20180002', name: '한서연', position: '차장', department: '플랫폼팀' },
  { id: '7', employeeNo: '20220008', name: '오태양', position: '대리', department: '보안팀' },
  { id: '8', employeeNo: '20200005', name: '윤하늘', position: '과장', department: '경영지원팀' },
];

/* ─────────────────── 레이아웃 알고리즘 (left-to-right) ─────────────────── */
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

  const totalH = subtreeH(root);
  assign(root, 0, PAD);

  function maxDepth(n: LayoutNode): number {
    return n.children.length ? 1 + Math.max(...n.children.map(maxDepth)) : 0;
  }

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

/* ─────────────────── 컴포넌트 ─────────────────── */
export function DepartmentsPage() {
  const session = useSession();
  const [deptNodes, setDeptNodes]         = useState<DeptNode[]>(MOCK_NODES);
  const [selected, setSelected]           = useState<string | null>(null);
  const [isAdding, setIsAdding]           = useState(false);
  const [addingName, setAddingName]       = useState('');
  const [isEditingLeader, setIsEditingLeader] = useState(false);
  const [pendingLeader, setPendingLeader] = useState('');

  const nodes = useMemo(
    () => deptNodes.map((n) => n.id === 'root' ? { ...n, name: session.company.name } : n),
    [deptNodes, session.company.name],
  );

  const layout   = useMemo(() => buildLayout(nodes), [nodes]);
  const edges    = useMemo(() => layout ? getEdges(layout.root) : [], [layout]);
  const allNodes = useMemo(() => layout ? getNodes(layout.root) : [], [layout]);

  const selectedNode = allNodes.find((n) => n.id === selected) ?? null;
  const members = useMemo(
    () => selectedNode ? MOCK_MEMBERS.filter((m) => m.department === selectedNode.name) : [],
    [selectedNode],
  );

  const totalCount  = MOCK_MEMBERS.length;
  const leafCount   = allNodes.filter((n) => !n.children.length).length;
  const hasChildren = (id: string) => deptNodes.some((n) => n.parentId === id);

  const leaderName = selectedNode?.leaderId
    ? MOCK_MEMBERS.find((m) => m.id === selectedNode.leaderId)?.name ?? null
    : null;

  function resetEditState() {
    setIsAdding(false);
    setAddingName('');
    setIsEditingLeader(false);
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

  function handleAddDept() {
    const name = addingName.trim();
    if (!name || !selected) return;
    setDeptNodes((prev) => [
      ...prev,
      { id: `d_${Date.now()}`, name, parentId: selected, leaderId: null },
    ]);
    setAddingName('');
    setIsAdding(false);
  }

  function handleDeleteDept(id: string) {
    setDeptNodes((prev) => prev.filter((n) => n.id !== id));
    setSelected(null);
  }

  function handleSaveLeader() {
    if (!selected) return;
    setDeptNodes((prev) =>
      prev.map((n) => n.id === selected ? { ...n, leaderId: pendingLeader || null } : n),
    );
    setIsEditingLeader(false);
  }

  if (!layout) return null;

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
        <button className="detail-add-confirm" onClick={handleAddDept}>추가</button>
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
        {/* ── 조직도 ── */}
        <div className="org-wrap">
          <div className="org-canvas" style={{ width: layout.svgW, height: layout.svgH }}>
            <svg className="org-svg" width={layout.svgW} height={layout.svgH}>
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

        {/* ── 상세 패널 ── */}
        <div className={`dept-detail${selectedNode ? ' dept-detail--open' : ''}`}>
          {selectedNode && (
            <>
              {/* 헤더 */}
              <div className="dept-detail-header">
                <div className="dept-detail-name">{selectedNode.name}</div>
                {selectedNode.parentId !== null && !hasChildren(selectedNode.id) && (
                  <button
                    className="dept-action-delete"
                    onClick={() => handleDeleteDept(selectedNode.id)}
                  >
                    삭제
                  </button>
                )}
              </div>

              {selectedNode.parentId === null ? (
                /* 루트 노드 */
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
                /* 일반 노드 */
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
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} · {m.position}</option>
                          ))}
                        </select>
                        <div className="detail-add-btns">
                          <button className="detail-add-confirm" onClick={handleSaveLeader}>저장</button>
                          <button className="detail-add-cancel" onClick={() => setIsEditingLeader(false)}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className="detail-leader-row">
                        <span className={leaderName ? 'detail-leader' : 'detail-value-muted'}>
                          {leaderName ?? '미지정'}
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
                      {members.length > 0 && (
                        <span className="detail-badge">{members.length}</span>
                      )}
                    </div>
                    {members.length === 0 ? (
                      <div className="detail-value-muted">없음</div>
                    ) : (
                      <div className="detail-member-list">
                        {members.map((m) => (
                          <div key={m.id} className="detail-member-row">
                            <span className="detail-member-name">
                              {m.name}
                              <span className="detail-member-empno">({m.employeeNo})</span>
                            </span>
                            <span className="detail-member-pos">{m.position}</span>
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
