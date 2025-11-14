import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RenewalNotification } from './RenewalNotification';
import { useRenewalNotifications } from '../hooks/useRenewalNotifications';

interface NotificationBannerProps {
  onNavigateToSubscriptions?: () => void;
  onNavigateToPricing?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onNavigateToSubscriptions,
  onNavigateToPricing
}) => {
  const { notifications, dismissNotification } = useRenewalNotifications();

  if (notifications.length === 0) {
    return null;
  }

  const handleNotificationAction = (notification: any) => {
    switch (notification.type) {
      case 'upcoming_renewal':
      case 'renewal_failed':
      case 'subscription_ending':
        onNavigateToSubscriptions?.();
        break;
      case 'trial_ending':
        onNavigateToPricing?.();
        break;
    }
  };

  return (
    <View style={styles.container}>
      {notifications.map(notification => (
        <RenewalNotification
          key={notification.id}
          type={notification.type}
          daysUntil={notification.daysUntil}
          planName={notification.planName}
          amount={notification.amount}
          onAction={() => handleNotificationAction(notification)}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No additional styling needed - notifications handle their own spacing
  },
});