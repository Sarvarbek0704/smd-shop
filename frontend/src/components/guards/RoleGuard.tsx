import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/store';
import { selectCurrentUser, selectIsAuthenticated } from '@/store/slices/authSlice';

interface RoleGuardProps {
  roles: string[];
}

export function RoleGuard({ roles }: RoleGuardProps) {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  if (!isAuth) {
    return <Navigate to="/auth/login" replace />;
  }

  const hasRole = roles.some((role) => user?.roles?.includes(role));
  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}