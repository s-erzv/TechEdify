import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function TestContext() {
  const { user, loading } = useAuth(); 

  if (loading) {
    return <div>Loading auth state in TestContext...</div>;
  }

  if (user) {
    return <div>TestContext: User is {user.email}!</div>;
  }

  return <div>TestContext: User is NOT logged in.</div>;
}