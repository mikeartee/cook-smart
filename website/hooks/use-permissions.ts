import { useAuth } from '@/lib/auth-context';
import { Permission } from '@/types';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some((permission) => user.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every((permission) => user.permissions.includes(permission));
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === 'super_admin';
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
  };
}
