import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  {
    section: '인사 관리',
    items: [
      {
        label: '계정 관리',
        href: '/users',
        icon: <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="7" r="3"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>,
      },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggle } = useTheme();

  const username = localStorage.getItem('username') ?? '';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <div className={`overlay${open ? ' visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar${open ? ' open' : ''}`}>
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
                    onClick={(e) => { e.preventDefault(); onClose(); navigate(item.href); }}
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
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{username}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>HR 관리자</div>
            </div>
            <button
              className="sidebar-toggle"
              onClick={(e) => { e.stopPropagation(); toggle(); }}
              style={{ pointerEvents: 'all' }}
              aria-label="테마 전환"
            >
              <div className="toggle-track"><div className="toggle-thumb" /></div>
            </button>
          </div>
          <button
            onClick={handleLogout}
            style={{ pointerEvents: 'all', width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left' }}
          >
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
