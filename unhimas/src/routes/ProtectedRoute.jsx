import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protect a route. Optionally restrict to specific roles.
 * roles: e.g. ['admin', 'frontdesk']
 */
export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading, profileError } = useAuth();

  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profileError || !profile || !profile.is_active) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
