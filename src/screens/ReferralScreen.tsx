import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {referralService, ReferralAccessInfo} from '../services/referralService';

const ReferralScreen: React.FC = () => {
  const navigation = useNavigation();
  const [referralCode, setReferralCode] = useState<string>('');
  const [accessInfo, setAccessInfo] = useState<ReferralAccessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const code = await referralService.createReferral();
      setReferralCode(code);

      const info = await referralService.getReferralAccessInfo();
      setAccessInfo(info);
    } catch (error) {
      console.error('Error loading referral data:', error);
      // Set placeholder so UI still shows
      setReferralCode('ERROR');
      Alert.alert(
        'Error',
        'Unable to load referral code. Please try again later.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!referralCode || referralCode === 'ERROR') return;

    const message = `Join me on Cook Smart! Use my referral code ${referralCode} when you subscribe. Get personalized recipes, smart meal planning, and more! 🍳\n\nDownload: https://cooksmartapp.com`;

    try {
      await Share.share({
        message,
        title: 'Join Cook Smart',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = () => {
    if (!referralCode || referralCode === 'ERROR') return;
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', `Referral code ${referralCode} copied to clipboard`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Icon name="card-giftcard" size={48} color="#10B981" />
          </View>
          <Text style={styles.heroTitle}>Share Cook Smart</Text>
          <Text style={styles.heroSubtitle}>
            Earn 1 month free for every friend who subscribes yearly
          </Text>
        </View>

        {/* Stats Section */}
        {accessInfo && accessInfo.totalMonthsEarned > 0 && (
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {accessInfo.totalMonthsEarned}
              </Text>
              <Text style={styles.statLabel}>Months Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{accessInfo.activeReferrals}</Text>
              <Text style={styles.statLabel}>Active Referrals</Text>
            </View>
          </View>
        )}

        {/* Referral Code Section */}
        <View style={styles.codeSection}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading your code...</Text>
            </View>
          ) : (
            <>
              <View style={styles.codeCard}>
                <Text style={styles.code}>{referralCode}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyCode}
                  disabled={referralCode === 'ERROR'}>
                  <Icon name="content-copy" size={20} color="#10B981" />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                disabled={referralCode === 'ERROR'}>
                <Icon name="share" size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share with Friends</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDescription}>
                Send your referral code to friends via text, email, or social
                media
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Subscribes</Text>
              <Text style={styles.stepDescription}>
                They use your code when purchasing a yearly subscription
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>You Both Win!</Text>
              <Text style={styles.stepDescription}>
                You get 1 month free + 100 bonus points. They get full access to
                Cook Smart!
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Referral Benefits</Text>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={24} color="#10B981" />
            <Text style={styles.benefitText}>
              1 month free access per yearly subscription
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={24} color="#10B981" />
            <Text style={styles.benefitText}>
              100 bonus points per successful referral
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={24} color="#10B981" />
            <Text style={styles.benefitText}>
              Unlimited referrals - no cap on free months!
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={24} color="#10B981" />
            <Text style={styles.benefitText}>
              Help friends discover amazing recipes
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  codeSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  code: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  howItWorksSection: {
    padding: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  benefitsSection: {
    padding: 16,
    paddingBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default ReferralScreen;
