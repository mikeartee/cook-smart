import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:3000/api/v1';

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  betaUsers: number;
  totalRevenue: number;
  newUsersToday: number;
  failedPayments: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  lastLogin: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  services: {
    database: 'online' | 'offline' | 'slow';
    api: 'online' | 'offline' | 'slow';
    payments: 'online' | 'offline' | 'slow';
    storage: 'online' | 'offline' | 'slow';
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    activeUsers: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  alerts: {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
  }[];
}

class AdminService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async adminLogin(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Admin login failed');
    }

    // Store admin token
    await AsyncStorage.setItem('adminToken', data.token);

    return { token: data.token, user: data.user };
  }

  async getDashboardStats(): Promise<AdminStats> {
    const response = await fetch(`${API_BASE}/admin/stats`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get dashboard stats');
    }

    return data.stats;
  }

  async getAllUsers(page: number = 1, limit: number = 50): Promise<any[]> {
    const response = await fetch(`${API_BASE}/admin/users?page=${page}&limit=${limit}`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get users');
    }

    return data.users;
  }

  async getSubscriptionAnalytics(): Promise<any> {
    const response = await fetch(`${API_BASE}/admin/analytics/subscriptions`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get subscription analytics');
    }

    return data.analytics;
  }

  async getFailedPayments(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/admin/payments/failed`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get failed payments');
    }

    return data.failedPayments;
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<void> {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update user status');
    }
  }

  async getBetaMetrics(): Promise<any> {
    const response = await fetch(`${API_BASE}/admin/beta/metrics`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get BETA metrics');
    }

    return data.metrics;
  }

  async isAdminAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('adminToken');
    return !!token;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await fetch(`${API_BASE}/admin/system/health`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get system health');
    }

    return data.health;
  }

  async getSystemLogs(level: 'error' | 'warning' | 'info' = 'error', limit: number = 100): Promise<any[]> {
    const response = await fetch(`${API_BASE}/admin/system/logs?level=${level}&limit=${limit}`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get system logs');
    }

    return data.logs;
  }

  async restartService(serviceName: string): Promise<void> {
    const response = await fetch(`${API_BASE}/admin/system/restart/${serviceName}`, {
      method: 'POST',
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to restart service');
    }
  }

  async createAlert(type: 'error' | 'warning' | 'info', message: string): Promise<void> {
    const response = await fetch(`${API_BASE}/admin/system/alerts`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ type, message })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create alert');
    }
  }

  async adminLogout(): Promise<void> {
    await AsyncStorage.removeItem('adminToken');
  }
}

export const adminService = new AdminService();
