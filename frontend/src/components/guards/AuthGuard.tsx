import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/store';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

export function AuthGuard() {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}