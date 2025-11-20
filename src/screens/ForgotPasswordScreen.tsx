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
import {useNavigation} from '@react-navigation/native';
import {API_ENDPOINTS} from '../config/api';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.password.forgot, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code');
      }

      Alert.alert(
        'Code Sent!',
        'If an account exists with this email, you will receive a verification code shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to reset password screen
              (navigation as any).navigate('ResetPassword', {email});
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset code');
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

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Icon name="lock-reset" size={64} color="#10B981" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a verification code to
          reset your password.
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Icon
            name="email"
            size={20}
            color="#6B7280"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Send Code Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon
                name="send"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Send Verification Code</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backToLoginText}>
            Remember your password? <Text style={styles.loginLink}>Login</Text>
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
  iconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
    marginBottom: 20,
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLogin: {
    marginTop: 24,
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    color: '#10B981',
    fontWeight: '600',
  },
});
