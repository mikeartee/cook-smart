import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {referralService, ReferralAccessInfo} from '../services/referralService';

interface Props {
  onPress?: () => void;
}

export const ReferFriendCard: React.FC<Props> = ({onPress}) => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [accessInfo, setAccessInfo] = useState<ReferralAccessInfo | null>(null);
  const [loading, setLoading] = useState(false);

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
      // Set a placeholder code so card still shows
      setReferralCode('LOADING');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;

    const message = `Join me on Cook Smart! Use my referral code ${referralCode} when you sign up. Get personalized recipes, smart meal planning, and more! 🍳\n\nDownload: [App Store Link]`;

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
    if (!referralCode) return;
    // Copy to clipboard functionality would go here
    Alert.alert('Copied!', `Referral code ${referralCode} copied to clipboard`);
  };

  // Always show the card, even if loading or error
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon name="card-giftcard" size={24} color="#4CAF50" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Refer a Friend</Text>
          <Text style={styles.subtitle}>
            Earn 1 month free per yearly subscription
          </Text>
        </View>
      </View>

      {accessInfo && accessInfo.totalMonthsEarned > 0 && (
        <View style={styles.rewardsSection}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardValue}>
              {accessInfo.totalMonthsEarned}
            </Text>
            <Text style={styles.rewardLabel}>Months Earned</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardValue}>{accessInfo.activeReferrals}</Text>
            <Text style={styles.rewardLabel}>Active Referrals</Text>
          </View>
        </View>
      )}

      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Your Referral Code:</Text>
        <View style={styles.codeContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <>
              <Text style={styles.code}>{referralCode || 'Loading...'}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyCode}
                disabled={!referralCode || referralCode === 'LOADING'}>
                <Icon name="content-copy" size={18} color="#4CAF50" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Icon name="share" size={20} color="#FFFFFF" />
        <Text style={styles.shareButtonText}>Share with Friends</Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>Friend signs up with your code</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>
            They purchase a yearly subscription
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>
            You get 1 month free + 100 bonus points!
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  rewardsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  codeSection: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  code: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
});
