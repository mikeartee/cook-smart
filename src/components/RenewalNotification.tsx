import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface RenewalNotificationProps {
  type: 'upcoming_renewal' | 'renewal_failed' | 'subscription_ending' | 'trial_ending';
  daysUntil: number;
  planName: string;
  amount?: number;
  onAction: () => void;
  onDismiss: () => void;
}

export const RenewalNotification: React.FC<RenewalNotificationProps> = ({
  type,
  daysUntil,
  planName,
  amount,
  onAction,
  onDismiss
}) => {
  const getNotificationConfig = () => {
    switch (type) {
      case 'upcoming_renewal':
        return {
          icon: '🔄',
          color: '#2196F3',
          backgroundColor: '#E3F2FD',
          title: 'Renewal Reminder',
          message: `Your ${planName} renews in ${daysUntil} days`,
          actionText: 'View Details',
          urgent: false
        };
      case 'renewal_failed':
        return {
          icon: '⚠️',
          color: '#F44336',
          backgroundColor: '#FFEBEE',
          title: 'Payment Failed',
          message: `Unable to renew your ${planName}. Update payment method.`,
          actionText: 'Fix Payment',
          urgent: true
        };
      case 'subscription_ending':
        return {
          icon: '⏰',
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          title: 'Subscription Ending',
          message: `Your ${planName} ends in ${daysUntil} days`,
          actionText: 'Reactivate',
          urgent: daysUntil <= 3
        };
      case 'trial_ending':
        return {
          icon: '🎯',
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          title: 'BETA Ending Soon',
          message: `BETA access ends in ${daysUntil} days. Subscribe to continue.`,
          actionText: 'Subscribe Now',
          urgent: daysUntil <= 7
        };
      default:
        return {
          icon: '📢',
          color: '#666',
          backgroundColor: '#f5f5f5',
          title: 'Notification',
          message: '',
          actionText: 'OK',
          urgent: false
        };
    }
  };

  const config = getNotificationConfig();

  return (
    <View style={[
      styles.container,
      { backgroundColor: config.backgroundColor },
      config.urgent && styles.urgentBorder
    ]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{config.icon}</Text>
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: config.color }]}>
            {config.title}
          </Text>
          <Text style={styles.message}>{config.message}</Text>
          {amount && (
            <Text style={styles.amount}>
              ${(amount / 100).toFixed(2)}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={onDismiss}
        >
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: config.color }]}
          onPress={onAction}
        >
          <Text style={styles.actionText}>{config.actionText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgentBorder: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dismissButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 18,
    color: '#999',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});