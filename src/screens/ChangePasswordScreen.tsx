import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {getAuthToken} from '../utils/auth';
import {API_ENDPOINTS} from '../config/api';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        'Error',
        'New password must be different from current password',
      );
      return;
    }

    setLoading(true);

    try {
      const token = await getAuthToken();
      const response = await fetch(API_ENDPOINTS.password.change, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      Alert.alert('Success', 'Your password has been changed successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);

      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Change Password</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Icon name="info-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Your new password must be at least 8 characters long
          </Text>
        </View>

        {/* Current Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}>
              <Icon
                name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}>
              <Icon
                name={showNewPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}>
              <Icon
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Change Password</Text>
          )}
        </TouchableOpacity>

        {/* Security Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Password Tips:</Text>
          <Text style={styles.tipText}>• Use at least 8 characters</Text>
          <Text style={styles.tipText}>
            • Mix uppercase and lowercase letters
          </Text>
          <Text style={styles.tipText}>
            • Include numbers and special characters
          </Text>
          <Text style={styles.tipText}>
            • Don't use common words or patterns
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
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E40AF',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
});
