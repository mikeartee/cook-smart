import { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';

export interface UserSubscriptionStatus {
  status: 'free_beta' | 'active' | 'canceled' | 'past_due' | 'pre_purchased';
  planName?: string;
  expiryDate?: string;
  hasActiveSubscription: boolean;
  isPremiumUser: boolean;
}

export const useSubscriptionStatus = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<UserSubscriptionStatus>({
    status: 'free_beta',
    hasActiveSubscription: false,
    isPremiumUser: true // Everyone is premium during BETA
  });
  const [loading, setLoading] = useState(true);

  const checkSubscriptionStatus = async () => {
    try {
      const subscriptions = await paymentService.getUserSubscriptions();
      
      if (subscriptions.length === 0) {
        // No subscriptions - free BETA user
        setSubscriptionStatus({
          status: 'free_beta',
          hasActiveSubscription: false,
          isPremiumUser: true // BETA users get premium features
        });
        return;
      }

      // Find the most relevant subscription
      const activeSubscription = subscriptions.find(sub => sub.status === 'active');
      const prePurchased = subscriptions.find(sub => sub.planId === 'beta-presale');
      
      if (prePurchased) {
        setSubscriptionStatus({
          status: 'pre_purchased',
          planName: paymentService.getPlanDisplayName(prePurchased.planId),
          hasActiveSubscription: true,
          isPremiumUser: true
        });
      } else if (activeSubscription) {
        setSubscriptionStatus({
          status: activeSubscription.cancelAtPeriodEnd ? 'canceled' : 'active',
          planName: paymentService.getPlanDisplayName(activeSubscription.planId),
          expiryDate: new Date(activeSubscription.currentPeriodEnd).toLocaleDateString(),
          hasActiveSubscription: true,
          isPremiumUser: true
        });
      } else {
        // Has subscriptions but none active
        const latestSub = subscriptions[0];
        setSubscriptionStatus({
          status: latestSub.status as any,
          planName: paymentService.getPlanDisplayName(latestSub.planId),
          expiryDate: new Date(latestSub.currentPeriodEnd).toLocaleDateString(),
          hasActiveSubscription: false,
          isPremiumUser: false
        });
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      // Default to free BETA on error
      setSubscriptionStatus({
        status: 'free_beta',
        hasActiveSubscription: false,
        isPremiumUser: true
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = () => {
    setLoading(true);
    checkSubscriptionStatus();
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  return {
    subscriptionStatus,
    loading,
    refreshStatus
  };
};