import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getAuthToken} from '../utils/auth';
import {API_ENDPOINTS} from '../config/api';

interface Props {
  navigation: any;
}

export const TwoFactorScreen: React.FC<Props> = ({navigation}) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(API_ENDPOINTS.settings.twoFactor, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled || false);
      }
    } catch (error) {
      console.error('Error loading two-factor status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTwoFactor = async (value: boolean) => {
    if (value) {
      // Enabling 2FA
      Alert.alert(
        'Enable Two-Factor Authentication',
        'This will add an extra layer of security to your account. You will need to verify your identity with a code each time you log in.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Enable',
            onPress: () => enableTwoFactor(),
          },
        ],
      );
    } else {
      // Disabling 2FA
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => disableTwoFactor(),
          },
        ],
      );
    }
  };

  const enableTwoFactor = async () => {
    setUpdating(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(API_ENDPOINTS.settings.twoFactorEnable, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await response.json();
        setEnabled(true);
        Alert.alert(
          'Success',
          'Two-factor authentication has been enabled successfully.',
        );
      } else {
        throw new Error('Failed to enable two-factor authentication');
      }
    } catch (error) {
      console.error('Error enabling two-factor:', error);
      Alert.alert(
        'Error',
        'Failed to enable two-factor authentication. Please try again.',
      );
    } finally {
      setUpdating(false);
    }
  };

  const disableTwoFactor = async () => {
    setUpdating(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(API_ENDPOINTS.settings.twoFactorDisable, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setEnabled(false);
        Alert.alert(
          'Success',
          'Two-factor authentication has been disabled.',
        );
      } else {
        throw new Error('Failed to disable two-factor authentication');
      }
    } catch (error) {
      console.error('Error disabling two-factor:', error);
      Alert.alert(
        'Error',
        'Failed to disable two-factor authentication. Please try again.',
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusIcon,
                enabled ? styles.statusIconEnabled : styles.statusIconDisabled,
              ]}>
              <Icon
                name={enabled ? 'verified-user' : 'security'}
                size={32}
                color={enabled ? '#10B981' : '#9CA3AF'}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {enabled ? 'Enabled' : 'Disabled'}
              </Text>
              <Text style={styles.statusDescription}>
                {enabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security'}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggleTwoFactor}
              disabled={updating}
              trackColor={{false: '#D1D5DB', true: '#8B5CF6'}}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is Two-Factor Authentication?</Text>
          <Text style={styles.paragraph}>
            Two-factor authentication (2FA) adds an extra layer of security to
            your account. When enabled, you'll need to provide both your
            password and a verification code to log in.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={24} color="#10B981" />
            <Text style={styles.benefitText}>
              Protects your account even if your password is compromised
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={24} color="#10B981" />
            <Text style={styles.benefitText}>
              Prevents unauthorized access to your recipes and data
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={24} color="#10B981" />
            <Text style={styles.benefitText}>
              Adds peace of mind with enhanced security
            </Text>
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Enable 2FA</Text>
              <Text style={styles.stepDescription}>
                Toggle the switch above to enable two-factor authentication
              </Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verify Your Identity</Text>
              <Text style={styles.stepDescription}>
                You'll receive a verification code via email when logging in
              </Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Enter the Code</Text>
              <Text style={styles.stepDescription}>
                Enter the code to complete your login
              </Text>
            </View>
          </View>
        </View>

        {/* Warning */}
        {!enabled && (
          <View style={styles.warningBox}>
            <Icon name="warning" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Your account is currently not protected by two-factor
              authentication. We strongly recommend enabling it for better
              security.
            </Text>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Icon name="info-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            You can disable two-factor authentication at any time, but we
            recommend keeping it enabled for maximum security.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconEnabled: {
    backgroundColor: '#D1FAE5',
  },
  statusIconDisabled: {
    backgroundColor: '#F3F4F6',
  },
  statusInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginLeft: 12,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    marginLeft: 16,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
    marginLeft: 12,
  },
});

