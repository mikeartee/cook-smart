import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SubscriptionStatusProps {
  status: 'free_beta' | 'active' | 'canceled' | 'past_due' | 'pre_purchased';
  planName?: string;
  expiryDate?: string;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  status,
  planName,
  expiryDate
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'free_beta':
        return {
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          text: '🚧 FREE BETA ACCESS',
          subtext: 'All features unlocked during testing'
        };
      case 'active':
        return {
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          text: '✅ ACTIVE SUBSCRIPTION',
          subtext: `${planName} • Expires ${expiryDate}`
        };
      case 'canceled':
        return {
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          text: '⚠️ SUBSCRIPTION ENDING',
          subtext: `Access until ${expiryDate}`
        };
      case 'past_due':
        return {
          color: '#F44336',
          backgroundColor: '#FFEBEE',
          text: '❌ PAYMENT OVERDUE',
          subtext: 'Update payment method to continue'
        };
      case 'pre_purchased':
        return {
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          text: '🎯 PRE-PURCHASED',
          subtext: 'Free BETA + locked-in pricing for launch'
        };
      default:
        return {
          color: '#666',
          backgroundColor: '#f5f5f5',
          text: 'UNKNOWN STATUS',
          subtext: ''
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.text}
      </Text>
      {config.subtext && (
        <Text style={[styles.subtextText, { color: config.color }]}>
          {config.subtext}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtextText: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
});