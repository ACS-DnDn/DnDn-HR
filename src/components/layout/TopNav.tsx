import { useNavigate } from 'react-router-dom';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';

interface TopNavProps {
  breadcrumb?: React.ReactNode;
}

export function TopNav({ breadcrumb }: TopNavProps) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const session = useSession();

  const logoSrc = isDark && session.company.logoDarkUrl
    ? session.company.logoDarkUrl
    : session.company.logoUrl;

  return (
    <header className="topnav">
      <a className="nav-logo-link" href="/users" onClick={(e) => { e.preventDefault(); navigate('/users'); }}>
        <AnimatedLogo variant={isDark ? 'dark' : 'light'} className="nav-logo-obj" />
      </a>

      {breadcrumb && (
        <div className="nav-title">{breadcrumb}</div>
      )}

      <div className="topnav-right">
        <div className="profile-info">
          <span className="profile-name">{session.name}</span>
          <span className="profile-role">{session.role}</span>
        </div>
        <div className="divider-v" />
        <span className="company-name">{session.company.name}</span>
        {logoSrc && <img className="company-logo" src={logoSrc} alt="" />}
      </div>
    </header>
  );
}
