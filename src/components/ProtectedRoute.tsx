import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRoles?: Array<'ADM' | 'Técnico Tromot' | 'Suporte Tromot' | 'Cliente'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireRoles
}) => {
  const { user, profile, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && profile.role !== 'ADM') {
    return <Navigate to="/" replace />;
  }

  if (requireRoles && !requireRoles.includes(profile.role as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
