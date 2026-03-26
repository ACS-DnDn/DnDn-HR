import { useNavigate } from 'react-router-dom';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';

const ROLE_LABELS: Record<string, string> = {
  hr: 'HR 관리자',
  leader: '부서장',
  member: '일반 사원',
  superadmin: '슈퍼어드민',
};

export function TopNav() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const session = useSession();

  const isSuperadmin = session.role === 'superadmin';
  const homePath = isSuperadmin ? '/admin/companies' : '/users';

  const logoSrc = isDark && session.company.logoDarkUrl
    ? session.company.logoDarkUrl
    : session.company.logoUrl;

  return (
    <header className="topnav">
      <a className="nav-logo-link" href={homePath} onClick={(e) => { e.preventDefault(); navigate(homePath); }}>
        <AnimatedLogo variant={isDark ? 'dark' : 'light'} className="nav-logo-obj" />
      </a>

      <div className="topnav-right">
        {isSuperadmin ? (
          <span className="company-name">DnDn Admin</span>
        ) : (
          <>
            <div className="profile-info">
              <span className="profile-name">{session.name}</span>
              <span className="profile-role">{session.position ?? ROLE_LABELS[session.role] ?? session.role}</span>
            </div>
            <div className="divider-v" />
            <span className="company-name">{session.company.name}</span>
            {logoSrc && <img className="company-logo" src={logoSrc} alt="" />}
          </>
        )}
      </div>
    </header>
  );
}
