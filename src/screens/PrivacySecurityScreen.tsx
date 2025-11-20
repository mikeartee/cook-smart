import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  navigation: any;
}

export const PrivacySecurityScreen: React.FC<Props> = ({navigation}) => {
  const [dataSharing, setDataSharing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            console.log('Delete account');
          },
        },
      ],
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'We will send a copy of your data to your registered email address within 24 hours.',
      [{text: 'OK'}],
    );
    // TODO: Implement data export
  };

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
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Data Sharing</Text>
              <Text style={styles.settingDescription}>
                Share anonymized usage data to help improve the app
              </Text>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
              trackColor={{false: '#D1D5DB', true: '#4CAF50'}}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Analytics</Text>
              <Text style={styles.settingDescription}>
                Help us understand how you use Cook Smart
              </Text>
            </View>
            <Switch
              value={analytics}
              onValueChange={setAnalytics}
              trackColor={{false: '#D1D5DB', true: '#4CAF50'}}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive updates about recipes, tips, and more
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{false: '#D1D5DB', true: '#4CAF50'}}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Location Services</Text>
              <Text style={styles.settingDescription}>
                Find nearby stores and local ingredients
              </Text>
            </View>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{false: '#D1D5DB', true: '#4CAF50'}}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleExportData}>
            <Icon name="download" size={24} color="#4CAF50" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Export My Data</Text>
              <Text style={styles.actionDescription}>
                Download a copy of your data
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('DataPolicy')}>
            <Icon name="policy" size={24} color="#3B82F6" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Data Usage Policy</Text>
              <Text style={styles.actionDescription}>
                How we use your information
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('ChangePassword')}>
            <Icon name="lock" size={24} color="#F59E0B" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Change Password</Text>
              <Text style={styles.actionDescription}>
                Update your account password
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('TwoFactor')}>
            <Icon name="security" size={24} color="#8B5CF6" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Two-Factor Authentication</Text>
              <Text style={styles.actionDescription}>
                Add an extra layer of security
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Icon name="description" size={24} color="#6B7280" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Privacy Policy</Text>
              <Text style={styles.actionDescription}>
                Read our privacy policy
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('TermsOfService')}>
            <Icon name="gavel" size={24} color="#6B7280" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Terms of Service</Text>
              <Text style={styles.actionDescription}>
                View terms and conditions
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>
            Danger Zone
          </Text>

          <TouchableOpacity
            style={[styles.actionItem, styles.dangerItem]}
            onPress={handleDeleteAccount}>
            <Icon name="delete-forever" size={24} color="#EF4444" />
            <View style={styles.actionInfo}>
              <Text style={[styles.actionLabel, styles.dangerLabel]}>
                Delete Account
              </Text>
              <Text style={styles.actionDescription}>
                Permanently delete your account and data
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Icon name="info-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            We take your privacy seriously. Your data is encrypted and stored
            securely. We never sell your personal information to third parties.
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
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dangerTitle: {
    color: '#EF4444',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dangerItem: {
    backgroundColor: '#FEF2F2',
  },
  actionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  dangerLabel: {
    color: '#EF4444',
  },
  actionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 20,
    marginLeft: 12,
  },
});
