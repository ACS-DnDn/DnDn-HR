import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LoginPage } from '@/features/login/LoginPage';
import { UsersPage } from '@/features/users/UsersPage';
import { UsersRegisterPage } from '@/features/users/UsersRegisterPage';
import { UserDetailPage } from '@/features/users/UserDetailPage';
import { DepartmentsPage } from '@/features/departments/DepartmentsPage';
import { Layout } from '@/components/layout/Layout';
import '@/styles/global.css';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  if (isLoading) return null;
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
