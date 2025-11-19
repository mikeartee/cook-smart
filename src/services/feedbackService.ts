import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config/api';

export interface FeedbackSubmission {
  message: string;
  rating?: number;
  category?: string;
  screenshot?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedbackId: string;
}

class FeedbackService {
  private async getAuthToken(): Promise<string> {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }
    return token;
  }

  /**
   * Submit feedback (uses authenticated endpoint when logged in)
   */
  async submitFeedback(
    feedback: FeedbackSubmission,
  ): Promise<FeedbackResponse> {
    // Try to get token, but don't fail if not available
    let token: string | null = null;
    try {
      token = await this.getAuthToken();
    } catch (_error) {
      // No token available, will use public endpoint
    }

    // Use authenticated endpoint if token available, otherwise public
    const endpoint = token
      ? `${API_BASE_URL}/api/v1/feedback`
      : `${API_BASE_URL}/api/v1/feedback/public`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit feedback');
    }

    return data;
  }

  /**
   * Get user's feedback history
   */
  async getMyFeedback(): Promise<any[]> {
    const token = await this.getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/feedback/my-feedback`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch feedback');
    }

    return data.feedback || [];
  }
}

export default new FeedbackService();
