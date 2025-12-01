'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminSidebar } from '@/components/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 lg:ml-64">
            <div className="p-4 pt-16 lg:p-8 lg:pt-8">{children}</div>
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
