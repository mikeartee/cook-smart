import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

interface PaymentErrorModalProps {
  visible: boolean;
  error: PaymentError | null;
  onClose: () => void;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

export interface PaymentError {
  type: 'card_declined' | 'insufficient_funds' | 'expired_card' | 'network_error' | 'server_error' | 'validation_error';
  message: string;
  code?: string;
  retryable: boolean;
}

export const PaymentErrorModal: React.FC<PaymentErrorModalProps> = ({
  visible,
  error,
  onClose,
  onRetry,
  onContactSupport
}) => {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'card_declined':
      case 'insufficient_funds':
      case 'expired_card':
        return '💳';
      case 'network_error':
        return '📶';
      case 'server_error':
        return '⚠️';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'card_declined':
        return 'Card Declined';
      case 'insufficient_funds':
        return 'Insufficient Funds';
      case 'expired_card':
        return 'Card Expired';
      case 'network_error':
        return 'Connection Error';
      case 'server_error':
        return 'Server Error';
      case 'validation_error':
        return 'Invalid Information';
      default:
        return 'Payment Failed';
    }
  };

  const getSuggestion = () => {
    switch (error.type) {
      case 'card_declined':
        return 'Please try a different payment method or contact your bank.';
      case 'insufficient_funds':
        return 'Please check your account balance or try a different card.';
      case 'expired_card':
        return 'Please update your card information with a valid expiry date.';
      case 'network_error':
        return 'Please check your internet connection and try again.';
      case 'server_error':
        return 'Our servers are experiencing issues. Please try again in a few minutes.';
      case 'validation_error':
        return 'Please check your payment information and try again.';
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.icon}>{getErrorIcon()}</Text>
            <Text style={styles.title}>{getErrorTitle()}</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.message}>{error.message}</Text>
            <Text style={styles.suggestion}>{getSuggestion()}</Text>
            
            {error.code && (
              <Text style={styles.errorCode}>Error Code: {error.code}</Text>
            )}
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
            
            {error.retryable && onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
            
            {onContactSupport && (
              <TouchableOpacity style={styles.supportButton} onPress={onContactSupport}>
                <Text style={styles.supportText}>Contact Support</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  suggestion: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  errorCode: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  closeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  closeText: {
    color: '#666',
    fontWeight: '600',
  },
  retryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  supportButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  supportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});