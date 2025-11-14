import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'week' | 'month' | 'year';
  features: string[];
}

interface Props {
  plan: PricingPlan;
  onSelect: (planId: string) => void;
  isSelected?: boolean;
  isBeta?: boolean;
  isPopular?: boolean;
}

export const PricingCard: React.FC<Props> = ({
  plan,
  onSelect,
  isSelected = false,
  isBeta = false,
  isPopular = false
}) => {
  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  const getIntervalText = (interval: string) => {
    switch (interval) {
      case 'week': return 'per week';
      case 'month': return 'per month';
      case 'year': return 'per year';
      default: return '';
    }
  };

  const getBadgeText = () => {
    if (isBeta) return 'BETA SPECIAL';
    if (isPopular) return 'MOST POPULAR';
    return null;
  };

  const getBadgeColor = () => {
    if (isBeta) return '#FF9800';
    if (isPopular) return '#4CAF50';
    return '#666';
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        isPopular && styles.popularCard
      ]}
      onPress={() => onSelect(plan.id)}
    >
      {getBadgeText() && (
        <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
          <Text style={styles.badgeText}>{getBadgeText()}</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.planName}>{plan.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.price}>{formatPrice(plan.price)}</Text>
          <Text style={styles.interval}>{getIntervalText(plan.interval)}</Text>
        </View>
      </View>
      
      <View style={styles.features}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          isSelected && styles.selectedButton,
          isBeta && styles.betaButton
        ]}
        onPress={() => onSelect(plan.id)}
      >
        <Text style={[
          styles.selectButtonText,
          isSelected && styles.selectedButtonText,
          isBeta && styles.betaButtonText
        ]}>
          {isSelected ? 'Selected' : isBeta ? 'Pre-Purchase' : 'Select Plan'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#4CAF50',
  },
  popularCard: {
    borderColor: '#4CAF50',
    transform: [{ scale: 1.05 }],
  },
  badge: {
    position: 'absolute',
    top: -8,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: getBadgeText ? 12 : 0,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 16,
    color: '#666',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  interval: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  features: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  betaButton: {
    backgroundColor: '#FF9800',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  selectedButtonText: {
    color: '#fff',
  },
  betaButtonText: {
    color: '#fff',
  },
});