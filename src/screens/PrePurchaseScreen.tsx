import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { PaymentForm } from '../components/PaymentForm';
import { PaymentErrorModal, PaymentError } from '../components/PaymentErrorModal';
import { paymentService, PaymentData } from '../services/paymentService';

export const PrePurchaseScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);

  const betaPlan = {
    id: 'beta-presale',
    name: 'BETA Pre-Purchase',
    price: 2499,
    originalPrice: 3499,
    savings: 1000,
    features: [
      'All yearly features when we launch',
      '30% discount (save $10.00)',
      'Lifetime BETA access',
      'Early feature access',
      'Priority support',
      'Exclusive pre-launch updates'
    ]
  };

  const handleContinueToPayment = () => {
    setStep('payment');
  };

  const handlePayment = async (paymentData: PaymentData) => {
    setLoading(true);
    try {
      await paymentService.createSubscription(betaPlan.id, paymentData);
      
      Alert.alert(
        'Pre-Purchase Successful! 🎉',
        'Thank you for supporting Cook Smart! You\'ll have full access when we launch, plus all BETA features remain free until then.',
        [{ text: 'Continue', onPress: () => {/* Navigate back */} }]
      );
      // Payment successful
    } catch (error) {
      setPaymentError(error as PaymentError);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    setPaymentError(null);
    // Retry logic can be added here
  };

  const handleCloseError = () => {
    setPaymentError(null);
  };

  if (step === 'payment') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('info')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Complete Pre-Purchase</Text>
        </View>
        
        <PaymentForm
          planId={betaPlan.id}
          planName={betaPlan.name}
          price={betaPlan.price}
          onSubmit={handlePayment}
          loading={loading}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Pre-Purchase Cook Smart</Text>
        <Text style={styles.subtitle}>Lock in your 30% discount now!</Text>
      </View>

      <View style={styles.dealCard}>
        <View style={styles.dealHeader}>
          <Text style={styles.dealTitle}>Limited Time Offer</Text>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>SAVE ${(betaPlan.savings / 100).toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.priceComparison}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Regular Price:</Text>
            <Text style={styles.originalPrice}>${(betaPlan.originalPrice / 100).toFixed(2)}/year</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Pre-Purchase Price:</Text>
            <Text style={styles.discountPrice}>${(betaPlan.price / 100).toFixed(2)}/year</Text>
          </View>
        </View>
      </View>

      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>What You Get:</Text>
        {betaPlan.features.map((feature, index) => (
          <Text key={index} style={styles.benefit}>✓ {feature}</Text>
        ))}
      </View>

      <View style={styles.guaranteeCard}>
        <Text style={styles.guaranteeTitle}>🛡️ Our Promise</Text>
        <Text style={styles.guaranteeText}>
          • Continue using all BETA features for FREE until launch{'\n'}
          • Full refund if you're not satisfied{'\n'}
          • Price locked in - no surprises{'\n'}
          • Early access to new features
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.purchaseButton}
        onPress={handleContinueToPayment}
      >
        <Text style={styles.purchaseButtonText}>
          Pre-Purchase for ${(betaPlan.price / 100).toFixed(2)}
        </Text>
        <Text style={styles.purchaseSubtext}>Save ${(betaPlan.savings / 100).toFixed(2)} • One-time payment</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By pre-purchasing, you support the development of Cook Smart and secure the best price available.
        </Text>
      </View>
      
      <PaymentErrorModal
        visible={!!paymentError}
        error={paymentError}
        onClose={handleCloseError}
        onRetry={paymentError?.retryable ? handleRetryPayment : undefined}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#FF9800',
    marginTop: 4,
  },
  dealCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  savingsBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  savingsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  priceComparison: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  benefit: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 6,
  },
  guaranteeCard: {
    backgroundColor: '#E8F5E8',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  guaranteeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  purchaseButton: {
    backgroundColor: '#FF9800',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  purchaseSubtext: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});