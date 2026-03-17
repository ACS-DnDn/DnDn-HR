import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import './Layout.css';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      <TopNav onMenuClick={toggleSidebar} />
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <main className="main">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </>
  );
}
