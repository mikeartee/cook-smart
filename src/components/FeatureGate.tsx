import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';

interface FeatureGateProps {
  children: React.ReactNode;
  feature: string;
  onUpgrade?: () => void;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  children,
  feature,
  onUpgrade,
  fallback
}) => {
  const { subscriptionStatus } = useSubscriptionStatus();

  // During BETA, all users have premium access
  if (subscriptionStatus.isPremiumUser) {
    return <>{children}</>;
  }

  // Show fallback or upgrade prompt for non-premium users (post-BETA)
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={styles.gateContainer}>
      <View style={styles.lockIcon}>
        <Text style={styles.lockText}>🔒</Text>
      </View>
      <Text style={styles.featureName}>{feature}</Text>
      <Text style={styles.upgradeText}>Upgrade to unlock this feature</Text>
      {onUpgrade && (
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  gateContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  lockIcon: {
    marginBottom: 8,
  },
  lockText: {
    fontSize: 24,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  upgradeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});