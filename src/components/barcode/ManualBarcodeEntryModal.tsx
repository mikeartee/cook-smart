import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { barcodeService } from '../../services/barcodeService';
import { productLookupService, ScannedProduct } from '../../services/productLookupService';

export interface ManualBarcodeEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (productData: ScannedProduct) => void;
}

export const ManualBarcodeEntryModal: React.FC<ManualBarcodeEntryModalProps> = ({
  visible,
  onClose,
  onBarcodeScanned,
}) => {
  const [barcode, setBarcode] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validate barcode
    if (!barcode.trim()) {
      setError('Please enter a barcode');
      return;
    }

    if (!barcodeService.validateBarcode(barcode)) {
      setError('Invalid barcode format (must be 8-13 digits)');
      return;
    }

    setError(null);
    setIsLookingUp(true);

    try {
      const product = await productLookupService.lookupByBarcode(barcode);

      if (product) {
        // Success - pass product data to parent
        onBarcodeScanned(product);
        handleClose();
      } else {
        // Product not found
        Alert.alert(
          'Product Not Found',
          'This product is not in our database. You can add it as a custom ingredient.',
          [
            {
              text: 'OK',
              onPress: handleClose,
            },
          ]
        );
      }
    } catch (err) {
      console.error('Manual barcode lookup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup product';
      
      Alert.alert(
        'Lookup Failed',
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => setIsLookingUp(false),
          },
          {
            text: 'Cancel',
            onPress: handleClose,
          },
        ]
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleClose = () => {
    setBarcode('');
    setError(null);
    setIsLookingUp(false);
    onClose();
  };

  const handleBarcodeChange = (text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    setBarcode(numericText);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter Barcode</Text>
            <TouchableOpacity onPress={handleClose} disabled={isLookingUp}>
              <Icon name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Enter the barcode number manually (8-13 digits)
          </Text>

          <View style={styles.inputContainer}>
            <Icon name="qr-code-scanner" size={24} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={handleBarcodeChange}
              placeholder="e.g., 0123456789012"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={13}
              editable={!isLookingUp}
              autoFocus
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Icon name="info-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Barcodes are usually found below the product name
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (isLookingUp || !barcode.trim()) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLookingUp || !barcode.trim()}
          >
            {isLookingUp ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Looking up...</Text>
              </>
            ) : (
              <>
                <Icon name="search" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Lookup Product</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={isLookingUp}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#374151',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
