import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
}

interface Props {
  referralCode: string;
  stats: ReferralStats;
  onGenerateCode?: () => void;
}

export const ReferralCard: React.FC<Props> = ({
  referralCode,
  stats,
  onGenerateCode
}) => {
  const handleShare = async () => {
    try {
      const message = `Join Cook Smart and get amazing recipes! Use my referral code: ${referralCode}\n\nDownload the app and start cooking smarter today! 🍳`;
      
      await Share.share({
        message,
        title: 'Join Cook Smart!'
      });
    } catch {
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const handleCopyCode = () => {
    // In a real app, this would copy to clipboard
    Alert.alert('Copied!', `Referral code ${referralCode} copied to clipboard`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎁 Refer Friends</Text>
        <Text style={styles.subtitle}>
          Earn 50 points for each friend who joins!
        </Text>
      </View>

      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.code}>{referralCode}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completedReferrals}</Text>
          <Text style={styles.statLabel}>Successful</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.pendingReferrals}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalPointsEarned}</Text>
          <Text style={styles.statLabel}>Points Earned</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Share Code</Text>
        </TouchableOpacity>
        {onGenerateCode && (
          <TouchableOpacity style={styles.generateButton} onPress={onGenerateCode}>
            <Text style={styles.generateButtonText}>🔄 New Code</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  codeSection: {
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  code: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 2,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  generateButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});