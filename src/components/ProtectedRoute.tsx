import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

export const ProtectedRoute = ({ children, requiredRole }: { children: ReactNode; requiredRole?: 'admin' | 'member' }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole === 'admin' && role !== 'admin') return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
