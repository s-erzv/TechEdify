import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export const AdminGuard = ({ children }) => {
  const { user, loading, isReady } = useAuth();

  useEffect(() => {
    console.log('AdminGuard: user state:', user);
    console.log('AdminGuard: loading state:', loading);
    console.log('AdminGuard: user role:', user?.role);
    console.log('AdminGuard: isReady:', isReady);
  }, [user, loading, isReady]);

  // Wait for auth to be ready
  if (loading || !isReady) {
    return (
      <div className="h-screen w-full flex justify-center items-center text-gray-700 text-xl">
        Checking admin access...
      </div>
    );
  }

  // Check if user exists and has admin role
  if (!user || user.role !== 'admin') {
    return (
      <div className="h-screen w-full flex justify-center items-center text-gray-700 text-xl">
        Access denied. Admin privileges required.
      </div>
    );
  }

  return children;
};