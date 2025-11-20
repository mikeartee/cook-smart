import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {API_ENDPOINTS} from '../config/api';

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const email = (route.params as any)?.email || '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    // Validation
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Error', 'Verification code must be 6 digits');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.password.reset, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token: code,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      Alert.alert(
        'Success!',
        'Your password has been reset successfully. You can now login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to login
              navigation.navigate('Login' as never);
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {email}
        </Text>

        {/* Verification Code */}
        <View style={styles.inputContainer}>
          <Icon
            name="verified-user"
            size={20}
            color="#6B7280"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <Icon
            name="lock"
            size={20}
            color="#6B7280"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            placeholder="New password"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}>
            <Icon
              name={showNewPassword ? 'visibility' : 'visibility-off'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Icon
            name="lock"
            size={20}
            color="#6B7280"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Icon
              name={showConfirmPassword ? 'visibility' : 'visibility-off'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        {/* Resend Code */}
        <TouchableOpacity
          style={styles.resendButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.resendText}>
            Didn't receive the code?{' '}
            <Text style={styles.resendLink}>Resend</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
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
  resendButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    color: '#10B981',
    fontWeight: '600',
  },
});
