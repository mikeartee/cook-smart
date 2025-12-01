'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import { Permission } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  redirectTo?: string;
}

/**
 * Protected route wrapper that requires authentication
 * Optionally checks for specific permissions
 */
export function ProtectedRoute({
  children,
  requiredPermissions = [],
  redirectTo = '/admin/login',
}: ProtectedRouteProps): React.ReactElement | null {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
      return;
    }

    // Check permissions if required
    if (requiredPermissions.length > 0 && user) {
      const hasPermission = requiredPermissions.every((permission) =>
        user.permissions?.includes(permission)
      );

      if (!hasPermission) {
        router.push('/admin/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, user, requiredPermissions, router, pathname, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render children until authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check permissions
  if (requiredPermissions.length > 0 && user) {
    const hasPermission = requiredPermissions.every((permission) =>
      user.permissions?.includes(permission)
    );

    if (!hasPermission) {
      return null;
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order component to protect a page
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: Permission[]
): React.ComponentType<P> {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredPermissions={requiredPermissions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

