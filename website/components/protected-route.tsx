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
    console.log('[PROTECTED] Route check:', {
      isLoading,
      isAuthenticated,
      user: !!user,
      userRole: user?.role,
    });

    // Only redirect if we're definitely not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log('[PROTECTED] Not authenticated, redirecting to login');
      // Use a small delay to prevent race conditions
      setTimeout(() => {
        router.push('/admin/login');
      }, 100);
    }

    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      console.log('[PROTECTED] Wrong role, redirecting to unauthorized');
      router.push('/admin/unauthorized');
    }
  }, [isAuthenticated, isLoading, requiredRole, user, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if wrong role (redirect will happen)
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
