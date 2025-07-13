import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/Auth');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return <div className="text-center mt-20">Checking auth...</div>;
  }

  return user ? children : null;
}