import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import type { User } from '../types/auth.types';

interface ProtectedRouteProps {
  allowedRoles?: User['role'][];
}

const ProtectedRoutes = ({ allowedRoles }: ProtectedRouteProps) => {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const loading         = useAppSelector((s) => s.auth.loading);
  const role            = useAppSelector((s) => s.auth.user?.role);
  const location        = useLocation();

  // FIX: Only show global spinner if we ARE loading AND NOT already authenticated.
  // This prevents background data fetches from booting the user out to a spinner.
  if (loading && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
      </div>
    );
  }

  // Check Authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check Authorization (RBAC)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;