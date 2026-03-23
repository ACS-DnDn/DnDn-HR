import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LoginPage } from '@/features/login/LoginPage';
import { UsersPage } from '@/features/users/UsersPage';
import { UsersRegisterPage } from '@/features/users/UsersRegisterPage';
import { UserDetailPage } from '@/features/users/UserDetailPage';
import { DepartmentsPage } from '@/features/departments/DepartmentsPage';
import { CompanySettingsPage } from '@/features/settings/CompanySettingsPage';
import { Layout } from '@/components/layout/Layout';
import '@/styles/global.css';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // 토큰은 있는데 세션이 5초 이상 안 잡히면 토큰 정리 후 로그인으로
  useEffect(() => {
    if (!isLoading && !session && localStorage.getItem('access_token')) {
      const id = setTimeout(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('id_token');
        setTimedOut(true);
      }, 5000);
      return () => clearTimeout(id);
    }
  }, [isLoading, session]);

  if (isLoading) return null;
  if (timedOut) return <Navigate to="/login" replace />;
  // 토큰은 있는데 session 상태가 아직 반영 안 된 경우 (challenge 직후 race condition)
  if (!session && localStorage.getItem('access_token')) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/register" element={<UsersRegisterPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/settings" element={<CompanySettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/users" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
