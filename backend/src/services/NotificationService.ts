export interface UserNotification {
  id: string;
  userId: string;
  type: 'recipe_liked' | 'new_follower' | 'recipe_featured' | 'achievement' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export class NotificationService {
  private static notifications: Map<string, UserNotification[]> = new Map();

  static async createNotification(
    userId: string,
    type: UserNotification['type'],
    title: string,
    message: string,
    data?: any
  ): Promise<string> {
    const notification: UserNotification = {
      id: Date.now().toString(),
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date()
    };

    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.unshift(notification);
    
    // Keep only last 50 notifications per user
    if (userNotifications.length > 50) {
      userNotifications.splice(50);
    }
    
    this.notifications.set(userId, userNotifications);
    
    return notification.id;
  }

  static async getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<UserNotification[]> {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.slice(offset, offset + limit);
  }

  static async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.isRead = true;
      return true;
    }
    
    return false;
  }

  static async markAllAsRead(userId: string): Promise<number> {
    const userNotifications = this.notifications.get(userId) || [];
    let count = 0;
    
    userNotifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        count++;
      }
    });
    
    return count;
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => !n.isRead).length;
  }

  static async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const userNotifications = this.notifications.get(userId) || [];
    const index = userNotifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      userNotifications.splice(index, 1);
      return true;
    }
    
    return false;
  }

  // Helper methods for common notification types
  static async notifyRecipeLiked(userId: string, likerUsername: string, recipeTitle: string): Promise<void> {
    await this.createNotification(
      userId,
      'recipe_liked',
      'Recipe Liked!',
      `${likerUsername} liked your recipe "${recipeTitle}"`,
      { likerUsername, recipeTitle }
    );
  }

  static async notifyNewFollower(userId: string, followerUsername: string): Promise<void> {
    await this.createNotification(
      userId,
      'new_follower',
      'New Follower!',
      `${followerUsername} started following you`,
      { followerUsername }
    );
  }

  static async notifyRecipeFeatured(userId: string, recipeTitle: string): Promise<void> {
    await this.createNotification(
      userId,
      'recipe_featured',
      'Recipe Featured!',
      `Your recipe "${recipeTitle}" was featured in the community`,
      { recipeTitle }
    );
  }

  static async notifyAchievement(userId: string, achievementName: string, description: string): Promise<void> {
    await this.createNotification(
      userId,
      'achievement',
      'Achievement Unlocked!',
      `You earned: ${achievementName} - ${description}`,
      { achievementName, description }
    );
  }

  static async notifySystem(userId: string, title: string, message: string): Promise<void> {
    await this.createNotification(
      userId,
      'system',
      title,
      message
    );
  }
}