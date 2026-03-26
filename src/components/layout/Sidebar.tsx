import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  hr: 'HR 관리자',
  leader: '부서장',
  member: '일반 사원',
};

const NAV_ITEMS: { section: string; items: NavItem[] }[] = [
  {
    section: '인사관리',
    items: [
      {
        label: '사원 목록',
        href: '/users',
        icon: <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 8h6M7 12h4"/></svg>,
      },
      {
        label: '사원 등록',
        href: '/users/register',
        icon: <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="7" r="3"/><path d="M2 17c0-3.3 3.1-6 7-6"/><path d="M15 11v6M12 14h6"/></svg>,
      },
      {
        label: '부서 관리',
        href: '/departments',
        icon: <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="8" y="2" width="4" height="3" rx="1"/><rect x="2" y="15" width="4" height="3" rx="1"/><rect x="14" y="15" width="4" height="3" rx="1"/><path d="M10 5v4M4 15v-2.5H16V15"/></svg>,
      },
    ],
  },
  {
    section: '설정',
    items: [
      {
        label: '회사 설정',
        href: '/settings',
        icon: <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 13a3 3 0 100-6 3 3 0 000 6z"/><path d="M16.5 10a6.5 6.5 0 01-.4 2.2l1.6 1.3-1.4 2.4-1.9-.6a6.5 6.5 0 01-1.9 1.1l-.5 2h-2.8l-.5-2a6.5 6.5 0 01-1.9-1.1l-1.9.6-1.4-2.4 1.6-1.3A6.5 6.5 0 013.5 10c0-.8.1-1.5.4-2.2L2.3 6.5l1.4-2.4 1.9.6A6.5 6.5 0 017.5 3.6l.5-2h2.8l.5 2c.7.3 1.3.6 1.9 1.1l1.9-.6 1.4 2.4-1.6 1.3c.3.7.4 1.4.4 2.2z"/></svg>,
      },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const session = useSession();
  const { logout } = useAuth();

  const logoSrc = isDark && session.company.logoDarkUrl
    ? session.company.logoDarkUrl
    : session.company.logoUrl;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((group, gi) => (
          <div key={gi}>
            <span className="nav-section-label" style={gi > 0 ? { marginTop: 8 } : undefined}>
              {group.section}
            </span>
            {group.items.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <a
                  key={item.href}
                  className={`nav-item${isActive ? ' active' : ''}`}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); navigate(item.href); }}
                >
                  {item.icon}
                  {item.label}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-logout" onClick={logout}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3" />
            <path d="M14 14l3-4-3-4" />
            <path d="M17 10H8" />
          </svg>
          로그아웃
        </button>
        <div className="nav-item" style={{ gap: 10, cursor: 'default', pointerEvents: 'none' }}>
          {logoSrc && <img className="sidebar-company-logo" src={logoSrc} alt="" />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{session.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{session.position ?? ROLE_LABELS[session.role] ?? session.role}</div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            style={{ pointerEvents: 'all', marginLeft: 'auto' }}
            aria-label="테마 전환"
          >
            <div className="toggle-track"><div className="toggle-thumb" /></div>
          </button>
        </div>
      </div>
    </aside>
  );
}
