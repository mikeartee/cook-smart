'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps): React.ReactElement | null {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[PROTECTED] Route check:', { isLoading, isAuthenticated, user: !!user });

    if (!isLoading && !isAuthenticated) {
      console.log('[PROTECTED] Not authenticated, redirecting to login');
      router.push('/admin/login');
    }

    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      console.log('[PROTECTED] Wrong role, redirecting to unauthorized');
      router.push('/admin/unauthorized');
    }
  }, [isAuthenticated, isLoading, requiredRole, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
