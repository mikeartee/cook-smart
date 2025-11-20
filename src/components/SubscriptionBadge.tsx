import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  hasLifetimeSubscription?: boolean;
  subscriptionStatus?: string;
  isCoFounder?: boolean;
  isSpecialUser?: boolean;
  isCreator?: boolean;
}

export const SubscriptionBadge: React.FC<Props> = ({
  hasLifetimeSubscription,
  subscriptionStatus,
  isCoFounder,
  isSpecialUser,
  isCreator,
}) => {
  // Determine badge type
  if (hasLifetimeSubscription || subscriptionStatus === 'lifetime') {
    let title = 'Lifetime Access';
    let subtitle = 'Never expires';
    let icon = 'verified';
    let color = '#10B981';

    if (isCreator) {
      title = 'Developer • Lifetime Access';
      subtitle = 'Built Cook Smart';
      icon = 'code';
      color = '#8B5CF6';
    } else if (isCoFounder) {
      title = 'Creator • Lifetime Access';
      subtitle = 'Thank you for inspiring Cook Smart!';
      icon = 'star';
      color = '#F59E0B';
    } else if (isSpecialUser) {
      title = 'Special User • Lifetime Access';
      subtitle = 'Enjoy all features forever';
      icon = 'favorite';
      color = '#EC4899';
    }

    return (
      <View style={[styles.container, {backgroundColor: color}]}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Icon name="check-circle" size={20} color="#FFFFFF" />
      </View>
    );
  }

  // Active subscription
  if (subscriptionStatus === 'active') {
    return (
      <View style={[styles.container, {backgroundColor: '#3B82F6'}]}>
        <View style={styles.iconContainer}>
          <Icon name="verified" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Premium Active</Text>
          <Text style={styles.subtitle}>All features unlocked</Text>
        </View>
      </View>
    );
  }

  // Free tier
  return (
    <View style={[styles.container, {backgroundColor: '#6B7280'}]}>
      <View style={styles.iconContainer}>
        <Icon name="info" size={24} color="#FFFFFF" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Free Tier</Text>
        <Text style={styles.subtitle}>Upgrade for full access</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
