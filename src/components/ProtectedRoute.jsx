import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { canAccessAdminPanel, hasAnyRole } from '../constants/permissions.js';

/**
 * Protects routes by authentication + optional role allow-list.
 * Backend remains authoritative; this is UX/safety only.
 */
export default function ProtectedRoute({ allowedRoles = null }) {
  const { isAuthenticated, loading, admin, logout } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = admin?.role;

  if (!canAccessAdminPanel(role)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasAnyRole(role, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
