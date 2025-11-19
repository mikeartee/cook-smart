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
