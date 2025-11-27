import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {subscriptionService} from '../services/subscriptionService';
import {useNavigation} from '@react-navigation/native';

export default function SubscriptionBanner() {
  const [accessInfo, setAccessInfo] = useState<any>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadAccessInfo();
  }, []);

  const loadAccessInfo = async () => {
    try {
      const info = await subscriptionService.getSubscriptionAccess();
      setAccessInfo(info);
    } catch (error) {
      console.error('Error loading access info:', error);
    }
  };

  if (!accessInfo) return null;

  // Show banner for grace period or restricted access
  if (accessInfo.accessLevel === 'full' && accessInfo.daysRemaining) {
    return (
      <View style={[styles.banner, styles.warningBanner]}>
        <Text style={styles.bannerText}>
          ⚠️ Payment issue - {accessInfo.daysRemaining} days remaining
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('PaymentMethods' as never)}>
          <Text style={styles.bannerLink}>Update Payment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (accessInfo.accessLevel === 'restricted') {
    return (
      <View style={[styles.banner, styles.errorBanner]}>
        <Text style={styles.bannerText}>
          🚫 Access restricted - Update payment to continue
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('PaymentMethods' as never)}>
          <Text style={styles.bannerLink}>Fix Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
  },
  errorBanner: {
    backgroundColor: '#F8D7DA',
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  bannerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
});
