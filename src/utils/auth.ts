import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get the authentication token from storage
 */
export async function getAuthToken(): Promise<string> {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Check if an error is a session expiration error
 */
export function isSessionExpiredError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return (
    errorMessage.includes('Session expired') ||
    errorMessage.includes('Authorization required') ||
    errorMessage.includes('Please log in again') ||
    errorMessage.includes('Invalid token') ||
    errorMessage.includes('Token verification failed')
  );
}

/**
 * Check if a response status indicates session expiration
 */
export function isSessionExpiredStatus(status: number): boolean {
  return status === 401 || status === 403;
}
