import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import './Layout.css';

export function Layout() {
  return (
    <>
      <TopNav />
      <main className="main">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </>
  );
}
