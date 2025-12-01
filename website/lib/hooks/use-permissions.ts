'use client';

import { useAuth } from '../auth-context';
import type { Permission } from '@/types';

/**
 * Hook to check if user has specific permissions
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission | string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission as Permission);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: (Permission | string)[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissions.every((permission) => user.permissions.includes(permission as Permission));
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: (Permission | string)[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissions.some((permission) => user.permissions.includes(permission as Permission));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  /**
   * Check if user is an admin
   */
  const isAdmin = (): boolean => {
    return hasRole('admin') || hasRole('super_admin');
  };

  /**
   * Check if user is a moderator
   */
  const isModerator = (): boolean => {
    return hasRole('moderator') || isAdmin();
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    isAdmin,
    isModerator,
    permissions: user?.permissions || [],
    role: user?.role || null,
  };
}

/**
 * Common permission constants
 */
export const PERMISSIONS = {
  USER_MANAGEMENT: 'user_management',
  CONTENT_MODERATION: 'content_moderation',
  RECIPE_MANAGEMENT: 'recipe_management',
  ANALYTICS_VIEW: 'analytics_view',
  SYSTEM_SETTINGS: 'system_settings',
  ADMIN_MANAGEMENT: 'admin_management',
  NOTIFICATION_SEND: 'notification_send',
  FINANCIAL_VIEW: 'financial_view',
  SUPPORT_MANAGE: 'support_manage',
} as const;

