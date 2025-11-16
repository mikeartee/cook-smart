import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, getAuthHeader } from '../config/api';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_co_founder: boolean;
  is_special_user: boolean;
  has_lifetime_subscription: boolean;
  subscription_status: string;
  points: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  special_message?: string;
  lifetime_access?: boolean;
}

class AuthService {
  private token: string | null = null;

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(API_ENDPOINTS.auth.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    this.token = data.token;
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user));

    return data;
  }

  async register(userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    age_verified: boolean;
  }): Promise<AuthResponse> {
    const response = await fetch(API_ENDPOINTS.auth.register, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    this.token = data.token;
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user));

    return data;
  }

  async logout(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }

  async getStoredToken(): Promise<string | null> {
    if (this.token) return this.token;
    
    const storedToken = await AsyncStorage.getItem('auth_token');
    this.token = storedToken;
    return storedToken;
  }

  async getStoredUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  async getCurrentUser(): Promise<User> {
    const token = await this.getStoredToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(API_ENDPOINTS.auth.me, {
      headers: getAuthHeader(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user data');
    }

    return data.user;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }
}

export default new AuthService();