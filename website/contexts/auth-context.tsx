'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { authApi } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Auto-logout after 30 minutes of inactivity
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const checkInactivity = (): void => {
      if (user && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, lastActivity]);

  // Track user activity
  useEffect(() => {
    const updateActivity = (): void => {
      setLastActivity(Date.now());
    };

    if (user) {
      window.addEventListener('mousemove', updateActivity);
      window.addEventListener('keypress', updateActivity);
      window.addEventListener('click', updateActivity);
      window.addEventListener('scroll', updateActivity);

      return () => {
        window.removeEventListener('mousemove', updateActivity);
        window.removeEventListener('keypress', updateActivity);
        window.removeEventListener('click', updateActivity);
        window.removeEventListener('scroll', updateActivity);
      };
    }
  }, [user]);

  // Load auth state on mount
  useEffect(() => {
    const loadAuth = async (): Promise<void> => {
      try {
        const token = apiClient.getAuthToken();
        console.log('[AUTH] Loading auth state, token exists:', !!token);

        if (token) {
          console.log('[AUTH] Token found, attempting to validate...');

          try {
            // Try to fetch current user info using the /me endpoint
            const response = await apiClient.get<{ user: any }>('/api/v1/auth/me');
            console.log('[AUTH] User info fetched:', response.user);

            const userData = {
              id: response.user.id,
              email: response.user.email,
              name:
                `${response.user.first_name || ''} ${response.user.last_name || ''}`.trim() ||
                'Admin User',
              role: 'admin',
            };
            console.log('[AUTH] Setting user state:', userData);
            setUser(userData);
          } catch (error) {
            console.error('[AUTH] Failed to validate token:', error);
            // Token is invalid, clear it
            apiClient.clearAuth();
          }
        } else {
          console.log('[AUTH] No token found, user not authenticated');
        }
      } catch (error) {
        console.error('[AUTH] Failed to load auth:', error);
        apiClient.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('[AUTH] Starting login process...');
      const response = await authApi.login(email, password);
      console.log('[AUTH] Login API response:', response);

      // Check if user has admin access
      const userData = response.user as any;
      console.log('[AUTH] User data:', userData);
      console.log('[AUTH] Admin check:', {
        is_admin: userData.is_admin,
        is_co_founder: userData.is_co_founder,
        is_creator: userData.is_creator,
        hasAccess: userData.is_admin || userData.is_co_founder || userData.is_creator,
      });

      if (!userData.is_admin && !userData.is_co_founder && !userData.is_creator) {
        console.error('[AUTH] User does not have admin access');
        throw new Error('You do not have admin access');
      }

      console.log('[AUTH] Setting auth token...');
      apiClient.setAuthToken(response.token);

      const newUser = {
        id: userData.id,
        email: userData.email,
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Admin User',
        role: 'admin',
      };
      console.log('[AUTH] Setting user state:', newUser);
      setUser(newUser);

      setLastActivity(Date.now());
      console.log('[AUTH] Login complete!');
    } catch (error) {
      console.error('[AUTH] Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      apiClient.clearAuth();
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      // TODO: Implement token refresh endpoint in backend
      console.log('[AUTH] Refresh auth called (not implemented yet)');
      setLastActivity(Date.now());
    } catch (error) {
      console.error('[AUTH] Token refresh failed:', error);
      await logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
