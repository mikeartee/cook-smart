import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CoFounderWelcomeScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleContinue = async () => {
    // Mark that we've shown the welcome screen
    await AsyncStorage.setItem('cofounder_welcome_shown', 'true');
    // Navigate to main app - will be handled by navigation state
    navigation.navigate('Home' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.crown}>👑</Text>
            <Text style={styles.title}>Welcome, Co-Founder!</Text>
            <Text style={styles.subtitle}>Briana Olszewski</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>CO-FOUNDER</Text>
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              Thank you for inspiring Cook Smart! 🍳
            </Text>
            <Text style={styles.description}>
              Your vision and support made this app possible. As a Co-Founder, you have:
            </Text>
          </View>

          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✨</Text>
              <Text style={styles.benefitText}>Lifetime Premium Access</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={styles.benefitText}>All Features Unlocked Forever</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🚀</Text>
              <Text style={styles.benefitText}>Early Access to New Features</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💎</Text>
              <Text style={styles.benefitText}>Exclusive Co-Founder Badge</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎁</Text>
              <Text style={styles.benefitText}>Special Recognition Throughout App</Text>
            </View>
          </View>

          <View style={styles.thankYou}>
            <Text style={styles.thankYouText}>
              Your support means everything to us. Let's cook something amazing together!
            </Text>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue to Cook Smart</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  crown: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#B45309',
    textAlign: 'center',
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#D97706',
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  messageContainer: {
    marginBottom: 32,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefits: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  thankYou: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  thankYouText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default CoFounderWelcomeScreen;
