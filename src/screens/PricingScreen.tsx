import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { BetaBanner } from '../components/BetaBanner';
import { BetaPricingCard } from '../components/BetaPricingCard';
import { paymentService, PricingPlan } from '../services/paymentService';



export const PricingScreen: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [plans, setPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const fetchedPlans = await paymentService.getPricingPlans();
        setPlans(fetchedPlans);
        setSelectedPlan('monthly');
      } catch (error) {
        console.error('Failed to load plans:', error);
      }
    };
    loadPlans();
  }, []);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePurchase = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    Alert.alert(
      'Confirm Purchase',
      `You selected ${plan.name} for $${(plan.price / 100).toFixed(2)}/${plan.interval}. Proceed to payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => proceedToPayment(plan) }
      ]
    );
  };

  const proceedToPayment = (plan: PricingPlan) => {
    // Navigate to payment screen or process payment
    console.log('Processing payment for plan:', plan.id);
    Alert.alert('Payment', 'Redirecting to payment processor...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BetaBanner />
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.description}>
            Pre-purchase now and save 30% on the yearly plan when we launch.
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <BetaPricingCard
              key={plan.id}
              planId={plan.id}
              name={plan.name}
              price={plan.price}
              interval={plan.interval}
              features={plan.features}
              isPopular={plan.id === 'monthly'}
              onSelect={handlePlanSelect}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>What's included in BETA:</Text>
          <View style={styles.betaFeatures}>
            <Text style={styles.betaFeature}>✅ All premium features unlocked</Text>
            <Text style={styles.betaFeature}>✅ No payment required during BETA</Text>
            <Text style={styles.betaFeature}>✅ Feedback directly shapes the app</Text>
            <Text style={styles.betaFeature}>✅ Early access to new features</Text>
            <Text style={styles.betaFeature}>✅ Pre-purchase discount available</Text>
          </View>
          
          <Text style={styles.disclaimer}>
            * BETA access is completely free. Pre-purchase is optional and provides a 30% discount for when the app launches.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  plansContainer: {
    padding: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  betaFeatures: {
    marginBottom: 16,
  },
  betaFeature: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 6,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});