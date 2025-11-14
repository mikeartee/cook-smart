import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BetaPricingCardProps {
  planId: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  isPopular?: boolean;
  onSelect: (planId: string) => void;
}

export const BetaPricingCard: React.FC<BetaPricingCardProps> = ({
  planId,
  name,
  price,
  interval,
  features,
  isPopular = false,
  onSelect
}) => {
  const isBetaPresale = planId === 'beta-presale';
  
  return (
    <View style={[styles.card, isPopular && styles.popularCard]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}
      
      {isBetaPresale && (
        <View style={styles.betaBadge}>
          <Text style={styles.betaText}>30% OFF</Text>
        </View>
      )}
      
      <Text style={styles.planName}>{name}</Text>
      
      <View style={styles.priceContainer}>
        <Text style={styles.currentPrice}>FREE</Text>
        <Text style={styles.betaLabel}>During BETA</Text>
      </View>
      
      <View style={styles.futurePrice}>
        <Text style={styles.futureLabel}>After BETA:</Text>
        <Text style={styles.futureAmount}>${(price / 100).toFixed(2)}/{interval}</Text>
      </View>
      
      <View style={styles.features}>
        {features.map((feature, index) => (
          <Text key={index} style={styles.feature}>✓ {feature}</Text>
        ))}
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isBetaPresale && styles.presaleButton]}
        onPress={() => onSelect(planId)}
      >
        <Text style={[styles.buttonText, isBetaPresale && styles.presaleButtonText]}>
          {isBetaPresale ? 'Pre-Purchase Now' : 'Start Free BETA'}
        </Text>
      </TouchableOpacity>
      
      {isBetaPresale && (
        <Text style={styles.presaleNote}>
          Secure your discount for when BETA ends
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  popularCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  betaBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  betaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  betaLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  futurePrice: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  futureLabel: {
    fontSize: 12,
    color: '#666',
  },
  futureAmount: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  features: {
    marginBottom: 20,
  },
  feature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  presaleButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  presaleButtonText: {
    color: '#fff',
  },
  presaleNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});