# Admin Dashboard - Complete Build Guide

## Overview

**Time Required:** 8-12 hours  
**Complexity:** Medium  
**Tech Stack:** React + TypeScript + Material-UI

---

## Phase 1: Project Setup (30 minutes)

### Step 1: Create React Project
```bash
# Create new React app with TypeScript
npx create-react-app admin-dashboard --template typescript

# Navigate to project
cd admin-dashboard

# Install dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install react-router-dom
npm install axios
npm install recharts
npm install @types/react-router-dom
```

### Step 2: Project Structure
```
admin-dashboard/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorMessage.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AdminsPage.tsx
│   │   └── ActivityLogPage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── authService.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── tsconfig.json
```

### Step 3: Environment Configuration
```typescript
// src/config.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

export const config = {
  apiUrl: API_BASE_URL,
  tokenKey: 'admin_token',
};
```

---

## Phase 2: Authentication (2 hours)

### Files to Create:

**1. src/types/index.ts**
```typescript
export interface Admin {
  id: number;
  email: string;
  username: string;
  name?: string;
  is_super_admin: boolean;
  last_login?: string;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export interface ApprovedEmail {
  id: number;
  email: string;
  is_super_admin: boolean;
  approved_by?: string;
  notes?: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  admin_id?: number;
  admin_email?: string;
  username?: string;
  action_type: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  created_at: string;
}
```

**2. src/services/api.ts**
```typescript
import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**3. src/contexts/AuthContext.tsx**
```typescript
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { Admin, LoginResponse } from '../types';

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
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const response = await api.get<{ admin: Admin }>('/admin/auth/me');
        setAdmin(response.data.admin);
      } catch (error) {
        localStorage.removeItem('admin_token');
      }
    }
    setLoading(false);
  };

  const login = async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/admin/auth/login', {
      username,
      password,
    });
    localStorage.setItem('admin_token', response.data.token);
    setAdmin(response.data.admin);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
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
```

**4. src/pages/LoginPage.tsx**
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Cook Smart Admin
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to access the admin dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};
```

---

## Phase 3: Layout Components (2 hours)

### Files to Create:

**1. src/components/layout/DashboardLayout.tsx**
**2. src/components/layout/Sidebar.tsx**
**3. src/components/layout/TopBar.tsx**

(Full code provided in separate files)

---

## Phase 4: Dashboard Pages (4-6 hours)

### Pages to Build:

1. **DashboardPage** - Overview with stats
2. **AdminsPage** - List and manage admins
3. **ApprovedEmailsPage** - Manage email whitelist
4. **ActivityLogPage** - View admin activity

---

## Phase 5: Deployment (1 hour)

### Build and Deploy to S3:

```bash
# Build for production
npm run build

# Upload to S3
aws s3 sync build/ s3://your-admin-dashboard-bucket/

# Configure CloudFront
# (See AWS deployment guide)
```

---

## Quick Start Commands

```bash
# Create project
npx create-react-app admin-dashboard --template typescript
cd admin-dashboard

# Install dependencies
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-router-dom axios recharts

# Start development
npm start

# Build for production
npm run build
```

---

## Next Steps

This is an 8-12 hour project. I recommend:

1. **Today:** Set up the project and authentication (2-3 hours)
2. **Tomorrow:** Build layout and dashboard pages (4-6 hours)
3. **Day 3:** Polish, test, and deploy (2-3 hours)

**OR**

Deploy your mobile app first, then build the dashboard when you have dedicated time.

The backend APIs are ready and waiting for you!
