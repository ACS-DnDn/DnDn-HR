import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedLogo } from '@/components/AnimatedLogo';

const NAV_TABS = [
  { label: '계정 관리', href: '/users' },
];

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useTheme();

  const username = localStorage.getItem('username') ?? '';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="topnav">
      <a className="nav-logo-link" href="/users" onClick={(e) => { e.preventDefault(); navigate('/users'); }}>
        <AnimatedLogo variant={isDark ? 'dark' : 'light'} className="nav-logo-obj" />
        <span className="nav-logo-hr">HR</span>
      </a>

      <nav className="nav-tabs">
        {NAV_TABS.map((tab) => (
          <a
            key={tab.href}
            className={`nav-tab${location.pathname === tab.href ? ' active' : ''}`}
            href={tab.href}
            onClick={(e) => { e.preventDefault(); navigate(tab.href); }}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      <div className="topnav-right">
        <span className="profile-name">{username}</span>
        <div className="divider-v" />
        <button className="sidebar-toggle" onClick={toggle} aria-label="테마 전환">
          <div className="toggle-track"><div className="toggle-thumb" /></div>
        </button>
        <div className="divider-v" />
        <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
      </div>
    </header>
  );
}
