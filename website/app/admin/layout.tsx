'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/auth-context';
import { RefreshProvider } from '@/contexts/admin-refresh-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminGlobalRefreshButton } from '@/components/admin-refresh-button';
import { Toaster } from '@/components/ui/toaster';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const isDebugPage = pathname === '/admin/debug-login';

  if (isLoginPage || isDebugPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <RefreshProvider>
        <ProtectedRoute>
          <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 lg:ml-64">
              <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="flex h-14 items-center justify-end px-4 lg:px-8">
                  <AdminGlobalRefreshButton />
                </div>
              </div>
              <div className="p-4 lg:p-8">{children}</div>
            </main>
          </div>
          <Toaster />
        </ProtectedRoute>
      </RefreshProvider>
    </AuthProvider>
  );
}
