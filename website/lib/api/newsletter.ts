import { newsletterApi, handleApiError } from '../api-client';

export interface NewsletterSubscription {
  email: string;
  preferences?: {
    recipes?: boolean;
    tips?: boolean;
    updates?: boolean;
  };
}

/**
 * Subscribe to newsletter
 */
export async function subscribeToNewsletter(
  data: NewsletterSubscription
): Promise<{ success: boolean; message: string }> {
  try {
    await newsletterApi.subscribe(data.email, data.preferences);
    return { success: true, message: 'Successfully subscribed!' };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return { success: false, message: errorMessage };
  }
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(
  email: string,
  _token?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await newsletterApi.unsubscribe(email);
    return { success: true, message: 'Successfully unsubscribed' };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return { success: false, message: errorMessage };
  }
}

/**
 * Update newsletter preferences
 */
export async function updateNewsletterPreferences(
  _email: string,
  _preferences: NewsletterSubscription['preferences'],
  _token?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Mock implementation - replace with actual API call when available
    return { success: true, message: 'Preferences updated' };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return { success: false, message: errorMessage };
  }
}

