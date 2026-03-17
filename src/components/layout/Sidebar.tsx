import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

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
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggle } = useTheme();
  const session = useSession();

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
        <div className="nav-item" style={{ gap: 10, cursor: 'default', pointerEvents: 'none' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{session.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{session.role}</div>
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
