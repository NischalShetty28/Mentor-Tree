import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // If not authenticated, redirect to portal selector
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to user's assigned dashboard
    if (user.role === 'MENTEE') return <Navigate to="/mentee/dashboard" replace />;
    if (user.role === 'MENTOR') return <Navigate to="/mentor/dashboard" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};
