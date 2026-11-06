import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role))
    return (
      <div className="container py-5 text-center">
        <h2>Admins only</h2>
        <p className="text-muted">Your account does not have access to this page.</p>
      </div>
    );
  return children;
}
