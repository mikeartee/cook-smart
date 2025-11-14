import { useState, useEffect } from 'react';
import { useSubscriptionStatus } from './useSubscriptionStatus';
import { paymentService } from '../services/paymentService';

export interface RenewalNotification {
  id: string;
  type: 'upcoming_renewal' | 'renewal_failed' | 'subscription_ending' | 'trial_ending';
  daysUntil: number;
  planName: string;
  amount?: number;
  dismissed: boolean;
}

export const useRenewalNotifications = () => {
  const { subscriptionStatus } = useSubscriptionStatus();
  const [notifications, setNotifications] = useState<RenewalNotification[]>([]);

  const checkForNotifications = async () => {
    const newNotifications: RenewalNotification[] = [];

    try {
      const subscriptions = await paymentService.getUserSubscriptions();
      
      subscriptions.forEach(subscription => {
        const endDate = new Date(subscription.currentPeriodEnd);
        const now = new Date();
        const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Upcoming renewal (7 days before)
        if (subscription.status === 'active' && !subscription.cancelAtPeriodEnd && daysUntil <= 7 && daysUntil > 0) {
          newNotifications.push({
            id: `renewal_${subscription.id}`,
            type: 'upcoming_renewal',
            daysUntil,
            planName: paymentService.getPlanDisplayName(subscription.planId),
            dismissed: false
          });
        }
        
        // Subscription ending (canceled but still active)
        if (subscription.status === 'active' && subscription.cancelAtPeriodEnd && daysUntil <= 7 && daysUntil > 0) {
          newNotifications.push({
            id: `ending_${subscription.id}`,
            type: 'subscription_ending',
            daysUntil,
            planName: paymentService.getPlanDisplayName(subscription.planId),
            dismissed: false
          });
        }
        
        // Payment failed
        if (subscription.status === 'past_due') {
          newNotifications.push({
            id: `failed_${subscription.id}`,
            type: 'renewal_failed',
            daysUntil: 0,
            planName: paymentService.getPlanDisplayName(subscription.planId),
            dismissed: false
          });
        }
      });
      
      // BETA ending notification (mock - would be based on actual BETA end date)
      if (subscriptionStatus.status === 'free_beta') {
        const betaEndDate = new Date('2024-12-31'); // Mock BETA end date
        const daysUntilBetaEnd = Math.ceil((betaEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilBetaEnd <= 30 && daysUntilBetaEnd > 0) {
          newNotifications.push({
            id: 'beta_ending',
            type: 'trial_ending',
            daysUntil: daysUntilBetaEnd,
            planName: 'BETA Access',
            dismissed: false
          });
        }
      }
      
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Failed to check renewal notifications:', error);
    }
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, dismissed: true }
          : notification
      )
    );
  };

  const getActiveNotifications = () => {
    return notifications.filter(notification => !notification.dismissed);
  };

  const hasUrgentNotifications = () => {
    return notifications.some(notification => 
      !notification.dismissed && 
      (notification.type === 'renewal_failed' || 
       (notification.type === 'subscription_ending' && notification.daysUntil <= 3) ||
       (notification.type === 'trial_ending' && notification.daysUntil <= 7))
    );
  };

  useEffect(() => {
    checkForNotifications();
    
    // Check for notifications every hour
    const interval = setInterval(checkForNotifications, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [subscriptionStatus]);

  return {
    notifications: getActiveNotifications(),
    hasUrgentNotifications: hasUrgentNotifications(),
    dismissNotification,
    refreshNotifications: checkForNotifications
  };
};