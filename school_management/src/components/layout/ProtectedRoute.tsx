import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from './DashboardLayout';
import { Spinner } from '../ui/Spinner';
import type { UserRole } from '../../types/index';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h2 className="text-2xl font-bold text-rose-500 mb-2">Access Denied (403)</h2>
          <p className="text-slate-400 text-sm max-w-md">
            You do not have permission to view this page. This section requires one of the following roles: {allowedRoles.join(', ')}.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};
