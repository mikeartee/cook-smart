import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { Admin, LoginResponse } from '../types';
import { config } from '../config';

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem(config.tokenKey);
    if (token) {
      try {
        const response = await api.get<{ admin: Admin }>('/admin/auth/me');
        setAdmin(response.data.admin);
      } catch (error) {
        localStorage.removeItem(config.tokenKey);
      }
    }
    setLoading(false);
  };

  const login = async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/admin/auth/login', {
      username,
      password,
    });
    localStorage.setItem(config.tokenKey, response.data.token);
    setAdmin(response.data.admin);
  };

  const logout = () => {
    localStorage.removeItem(config.tokenKey);
    setAdmin(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        isAuthenticated: !!admin,
        isSuperAdmin: admin?.is_super_admin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
