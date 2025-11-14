import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  onSetDefault,
  onDelete
}) => {
  const getBrandIcon = (brand: string) => {
    switch (brand) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  const getBrandName = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <View style={[styles.card, paymentMethod.isDefault && styles.defaultCard]}>
      <View style={styles.cardInfo}>
        <Text style={styles.icon}>{getBrandIcon(paymentMethod.brand)}</Text>
        <View style={styles.details}>
          <Text style={styles.brand}>{getBrandName(paymentMethod.brand)}</Text>
          <Text style={styles.number}>•••• {paymentMethod.last4}</Text>
          <Text style={styles.expiry}>
            {paymentMethod.expiryMonth.toString().padStart(2, '0')}/{paymentMethod.expiryYear.toString().slice(-2)}
          </Text>
        </View>
        {paymentMethod.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>DEFAULT</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actions}>
        {!paymentMethod.isDefault && (
          <TouchableOpacity 
            style={styles.defaultButton}
            onPress={() => onSetDefault(paymentMethod.id)}
          >
            <Text style={styles.defaultButtonText}>Set Default</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDelete(paymentMethod.id)}
        >
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: '#eee',
  },
  defaultCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  brand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  number: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  expiry: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  defaultButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  defaultButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F44336',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },
});