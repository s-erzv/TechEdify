import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/auth" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;

  return children;
}
