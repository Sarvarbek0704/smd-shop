import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/store';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

export function GuestGuard() {
  const isAuth = useAppSelector(selectIsAuthenticated);

  if (isAuth) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}