/**
 * Session storage utilities for managing authentication tokens
 * Uses both localStorage and sessionStorage for redundancy
 */

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

/**
 * Store authentication token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store token:', error);
  }
}

/**
 * Get authentication token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
}

/**
 * Store refresh token
 */
export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store refresh token:', error);
  }
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
}

/**
 * Remove refresh token
 */
export function removeRefreshToken(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove refresh token:', error);
  }
}

/**
 * Store user data
 */
export function setUserData(user: unknown): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user data:', error);
  }
}

/**
 * Get user data
 */
export function getUserData<T>(): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

/**
 * Remove user data
 */
export function removeUserData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to remove user data:', error);
  }
}

/**
 * Clear all session data
 */
export function clearSession(): void {
  removeToken();
  removeRefreshToken();
  removeUserData();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Get session expiry time (if stored)
 */
export function getSessionExpiry(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const expiry = localStorage.getItem('session_expiry');
    return expiry ? parseInt(expiry, 10) : null;
  } catch (error) {
    console.error('Failed to get session expiry:', error);
    return null;
  }
}

/**
 * Set session expiry time
 */
export function setSessionExpiry(expiryTime: number): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('session_expiry', expiryTime.toString());
  } catch (error) {
    console.error('Failed to set session expiry:', error);
  }
}

/**
 * Check if session has expired
 */
export function isSessionExpired(): boolean {
  const expiry = getSessionExpiry();
  if (!expiry) return false;

  return Date.now() > expiry;
}

