import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import './Layout.css';

const BREADCRUMB: Record<string, React.ReactNode> = {
  '/users':          <span className="crumb-cur">사원 목록</span>,
  '/users/register': <><span className="crumb-link-static">인사관리</span><span className="sep">›</span><span className="crumb-cur">사원 등록</span></>,
  '/departments':    <><span className="crumb-link-static">인사관리</span><span className="sep">›</span><span className="crumb-cur">부서 관리</span></>,
};

export function Layout() {
  const location = useLocation();
  const breadcrumb = BREADCRUMB[location.pathname] ?? null;

  return (
    <>
      <TopNav breadcrumb={breadcrumb} />
      <Sidebar />
      <main className="main">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </>
  );
}
