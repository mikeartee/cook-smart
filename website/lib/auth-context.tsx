'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setAuthToken, removeAuthToken, getAuthToken } from './api-client';
import { AdminUser } from '@/types';
import { SESSION_TIMEOUT } from './constants';

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode}) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const router = useRouter();

  // Define logout function first so it can be used in useEffect hooks
  const logout = useCallback(() => {
    removeAuthToken();
    setUser(null);
    router.push('/admin/login');
  }, [router]);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          // Try to refresh token to verify it's still valid
          const refreshResponse = await authApi.refreshToken();
          const { token: newToken } = refreshResponse;
          if (newToken) {
            setAuthToken(newToken);
            // Set a mock user for now - replace with actual user data when API is ready
            setUser({
              id: '1',
              email: 'admin@cooksmartapp.com',
              name: 'Admin User',
              role: 'admin',
              permissions: [
                'user_management',
                'content_moderation',
                'recipe_management',
                'analytics_view',
                'system_settings',
                'admin_management',
                'notification_send',
                'financial_view',
                'support_manage',
              ],
              isActive: true,
              createdAt: new Date(),
              lastLoginAt: new Date(),
            });
          }
        } catch (error) {
          console.error('Failed to verify token:', error);
          removeAuthToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Auto-logout after 30 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    const checkInactivity = () => {
      const now = Date.now();
      if (now - lastActivity > SESSION_TIMEOUT) {
        logout();
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Check every minute

    // Track user activity
    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [user, lastActivity, logout]);

  // Refresh token every 25 minutes if user is active
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        const response = await authApi.refreshToken();
        const { token: newToken } = response;
        if (newToken) {
          setAuthToken(newToken);
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        logout();
      }
    };

    const interval = setInterval(refreshToken, 25 * 60 * 1000); // Refresh every 25 minutes

    return () => clearInterval(interval);
  }, [user, logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authApi.login(email, password);
        const { token, user: userData } = response;

        if (token) {
          setAuthToken(token);
        }
        if (userData) {
          setUser(userData as AdminUser);
        }
        setLastActivity(Date.now());

        router.push('/admin/dashboard');
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },
    [router]
  );

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.refreshToken();
      if (response.token) {
        setAuthToken(response.token);
      }
      // Mock user data - replace with actual API call when available
      setUser({
        id: '1',
        email: 'admin@cooksmartapp.com',
        name: 'Admin User',
        role: 'admin',
        permissions: [
          'user_management',
          'content_moderation',
          'recipe_management',
          'analytics_view',
          'system_settings',
          'admin_management',
          'notification_send',
          'financial_view',
          'support_manage',
        ],
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
