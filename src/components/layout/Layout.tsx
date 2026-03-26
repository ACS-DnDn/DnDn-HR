import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import './Layout.css';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // 페이지 이동 시 사이드바 닫기
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <TopNav onMenuClick={() => setSidebarOpen((v) => !v)} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
      <Sidebar open={sidebarOpen} onNavigate={closeSidebar} />
      <main className="main">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </>
  );
}
