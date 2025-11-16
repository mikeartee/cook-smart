import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {subscriptionService} from '../services/subscriptionService';

interface Subscription {
  id: string;
  userId: number;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trial';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  promotionalPriceUsed: boolean;
  initialPrice: number;
  renewalPrice: number;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isPremium: boolean;
  refreshSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export function SubscriptionProvider({children}: {children: ReactNode}) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const sub = await subscriptionService.getUserSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) {
      throw new Error('No active subscription');
    }

    try {
      await subscriptionService.cancelSubscription(subscription.id);
      await loadSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  };

  const isPremium =
    subscription?.status === 'active' || subscription?.status === 'trial';

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        isPremium,
        refreshSubscription: loadSubscription,
        cancelSubscription,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider',
    );
  }
  return context;
}
