import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:3000/api/v1';

export interface FeedbackData {
  rating: number;
  category: 'bug' | 'feature' | 'ui' | 'performance' | 'general';
  message: string;
  email?: string;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  rating: number;
  category: string;
  message: string;
  email?: string;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
  userInfo?: {
    name: string;
    email: string;
  };
}

class FeedbackService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async submitFeedback(feedback: FeedbackData): Promise<void> {
    const response = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(feedback)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to submit feedback');
    }
  }

  async getUserFeedback(): Promise<FeedbackItem[]> {
    const response = await fetch(`${API_BASE}/feedback/user`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get user feedback');
    }

    return data.feedback;
  }

  async getAllFeedback(page: number = 1, limit: number = 50): Promise<FeedbackItem[]> {
    const response = await fetch(`${API_BASE}/admin/feedback?page=${page}&limit=${limit}`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get all feedback');
    }

    return data.feedback;
  }

  async updateFeedbackStatus(feedbackId: string, status: 'new' | 'reviewed' | 'resolved'): Promise<void> {
    const response = await fetch(`${API_BASE}/admin/feedback/${feedbackId}/status`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update feedback status');
    }
  }

  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    averageRating: number;
    categoryBreakdown: Record<string, number>;
    statusBreakdown: Record<string, number>;
  }> {
    const response = await fetch(`${API_BASE}/admin/feedback/stats`, {
      headers: await this.getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get feedback stats');
    }

    return data.stats;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'bug': '🐛 Bug Report',
      'feature': '💡 Feature Request',
      'ui': '🎨 UI/UX Feedback',
      'performance': '⚡ Performance',
      'general': '💬 General Feedback'
    };
    return labels[category] || category;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'new': return '#FF9800';
      case 'reviewed': return '#2196F3';
      case 'resolved': return '#4CAF50';
      default: return '#666';
    }
  }

  getRatingStars(rating: number): string {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}

export const feedbackService = new FeedbackService();
