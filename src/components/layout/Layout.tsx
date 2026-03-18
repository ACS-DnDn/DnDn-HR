import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import './Layout.css';

export function Layout() {
  return (
    <>
      <TopNav />
      <Sidebar />
      <main className="main">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </>
  );
}
