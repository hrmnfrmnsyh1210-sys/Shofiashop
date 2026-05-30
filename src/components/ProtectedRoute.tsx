import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import type { UserRole } from '../lib/types';
import { Loading } from './Spinner';

interface Props {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loading label="Memuat sesi..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses ditolak</h2>
        <p className="text-sm text-slate-600 max-w-md">
          Halaman ini hanya tersedia untuk: {roles.join(', ')}. Akun Anda berperan{' '}
          <strong>{user.role}</strong>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
