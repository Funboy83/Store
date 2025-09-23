'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';

export function useAdmin() {
  const { isAdmin, userRole, user } = useAuth();

  return {
    isAdmin,
    userRole,
    canAccessAdminFeatures: isAdmin,
    canManageUsers: isAdmin,
    canViewReports: isAdmin,
    user,
  };
}

// Higher-order component to protect admin-only components
export function withAdminOnly<T extends object>(Component: React.ComponentType<T>) {
  return function AdminOnlyComponent(props: T) {
    const { isAdmin } = useAdmin();
    
    if (!isAdmin) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 text-sm">
            🔒 Admin access required to view this content
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}