import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedLogo } from '@/components/AnimatedLogo';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const username = localStorage.getItem('username') ?? '';
  const email = localStorage.getItem('email') ?? '';

  return (
    <header className="topnav">
      <button className="menu-btn" onClick={onMenuClick} aria-label="메뉴">
        <svg width="20" height="16" viewBox="0 0 16 13" fill="none">
          <rect x="0" y="0" width="16" height="3" rx="1" fill="currentColor" />
          <rect x="0" y="5" width="16" height="3" rx="1" fill="currentColor" />
          <rect x="0" y="10" width="16" height="3" rx="1" fill="currentColor" />
        </svg>
      </button>

      <a className="nav-logo-link" href="/users" onClick={(e) => { e.preventDefault(); navigate('/users'); }}>
        <AnimatedLogo variant={isDark ? 'dark' : 'light'} className="nav-logo-obj" />
        <span className="nav-logo-hr">HR</span>
      </a>

      <div className="topnav-right">
        <div className="divider-v" />
        <div className="profile-info">
          <span className="profile-name">{username}</span>
          <span className="profile-role">{email}</span>
        </div>
      </div>
    </header>
  );
}
