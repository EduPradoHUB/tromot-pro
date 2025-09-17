import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContextSimple';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  console.log('🛡️ ProtectedRoute - checking auth...');
  
  const { user, profile, loading } = useApp();
  
  console.log('🛡️ ProtectedRoute estado:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    loading, 
    requireAdmin,
    userRole: profile?.role 
  });

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

  return <>{children}</>;
};