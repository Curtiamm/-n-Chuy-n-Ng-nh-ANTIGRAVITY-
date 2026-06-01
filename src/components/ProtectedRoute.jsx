import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const ROLE_LEVELS = { user: 1, staff: 2, admin: 3 };

export default function ProtectedRoute({ children, requiredRole = 'user' }) {
  const { isAuthenticated, isLoadingAuth, role } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const userLevel = ROLE_LEVELS[role] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 1;

  if (userLevel < requiredLevel) {
    return <Navigate to="/" replace />;
  }

  return children;
}
