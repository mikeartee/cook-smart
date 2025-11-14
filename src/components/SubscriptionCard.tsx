import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  onCancel: (subscriptionId: string) => void;
  onReactivate?: (subscriptionId: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onCancel,
  onReactivate
}) => {
  const getPlanName = (planId: string) => {
    const plans: Record<string, string> = {
      'weekly': 'Weekly Plan',
      'monthly': 'Monthly Plan', 
      'yearly': 'Yearly Plan',
      'beta-presale': 'BETA Pre-Purchase'
    };
    return plans[planId] || planId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'canceled': return '#FF9800';
      case 'past_due': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.planName}>{getPlanName(subscription.planId)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
          <Text style={styles.statusText}>{subscription.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.endDate}>
        Ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
      </Text>
      
      {subscription.cancelAtPeriodEnd && (
        <Text style={styles.cancelNote}>Will cancel at period end</Text>
      )}
      
      <View style={styles.actions}>
        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={() => onCancel(subscription.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        
        {subscription.cancelAtPeriodEnd && onReactivate && (
          <TouchableOpacity 
            style={[styles.button, styles.reactivateButton]}
            onPress={() => onReactivate(subscription.id)}
          >
            <Text style={styles.reactivateButtonText}>Reactivate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  endDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cancelNote: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
    textAlign: 'center',
    fontWeight: '600',
  },
  reactivateButton: {
    backgroundColor: '#4CAF50',
  },
  reactivateButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});