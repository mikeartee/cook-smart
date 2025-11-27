import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  navigation: any;
}

export const DataPolicyScreen: React.FC<Props> = ({navigation}) => {
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
          <Text style={styles.headerTitle}>Data Usage Policy</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Data</Text>
            <Text style={styles.paragraph}>
              At Cook Smart, we are committed to protecting your privacy and
              being transparent about how we use your data. This policy explains
              what data we collect and how we use it to provide you with the
              best possible experience.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data We Collect</Text>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Account Information:</Text> Email,
                name, and password (encrypted)
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Ingredient Data:</Text> Your saved
                ingredients and dietary preferences
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Recipe Data:</Text> Recipes you save,
                create, and search for
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Usage Analytics:</Text> How you
                interact with the app (if enabled)
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Device Information:</Text> Device
                type, OS version, and app version
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Data</Text>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                To provide personalized recipe recommendations
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                To save your preferences and settings
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                To improve app performance and features
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                To send you important updates and notifications
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                To provide customer support
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sharing</Text>
            <Text style={styles.paragraph}>
              We <Text style={styles.bold}>never sell</Text> your personal data
              to third parties. We only share data in the following limited
              circumstances:
            </Text>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                With service providers who help us operate the app (e.g., cloud
                hosting)
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                When required by law or to protect our rights
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                Anonymized usage data for analytics (if you opt in)
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.paragraph}>
              You have complete control over your data:
            </Text>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Access:</Text> View all data we have
                about you
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Export:</Text> Download a copy of
                your data
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Delete:</Text> Permanently delete
                your account and data
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Opt-out:</Text> Disable analytics and
                data sharing
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Security</Text>
            <Text style={styles.paragraph}>
              We take security seriously and implement industry-standard
              measures to protect your data:
            </Text>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                Encrypted data transmission (HTTPS)
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                Encrypted password storage
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                Secure cloud infrastructure (AWS)
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Icon name="fiber-manual-record" size={8} color="#6B7280" />
              <Text style={styles.bulletText}>
                Regular security audits and updates
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Retention</Text>
            <Text style={styles.paragraph}>
              We retain your data for as long as your account is active. When
              you delete your account, we permanently delete all your personal
              data within 30 days, except where we're required by law to retain
              it longer.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have questions about how we use your data, please contact
              us at:
            </Text>
            <Text style={styles.contactText}>privacy@cooksmart.app</Text>
          </View>

          <View style={styles.infoBox}>
            <Icon name="info-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              This policy is part of our commitment to GDPR and CCPA compliance.
              We respect your privacy and give you full control over your data.
            </Text>
          </View>
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
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginLeft: 12,
  },
  bold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  contactText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '500',
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
    marginLeft: 12,
  },
});

