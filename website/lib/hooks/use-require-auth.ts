'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../auth-context';
import { Permission } from '@/types';

/**
 * Hook to require authentication for a page
 * Redirects to login if not authenticated
 */
export function useRequireAuth(requiredPermissions?: Permission[]): {
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/admin/login?returnUrl=${returnUrl}`);
      return;
    }

    // Check permissions if required
    if (requiredPermissions && requiredPermissions.length > 0 && user) {
      const hasPermission = requiredPermissions.every((permission) =>
        user.permissions?.includes(permission)
      );

      if (!hasPermission) {
        router.push('/admin/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, user, requiredPermissions, router, pathname]);

  return { isLoading, isAuthenticated };
}

