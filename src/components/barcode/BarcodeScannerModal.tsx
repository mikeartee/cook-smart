import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { barcodeService } from '../../services/barcodeService';
import { productLookupService, ScannedProduct } from '../../services/productLookupService';

export interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (productData: ScannedProduct) => void;
  onManualEntry: () => void;
}

interface ScannerState {
  hasPermission: boolean | null;
  isScanning: boolean;
  isLookingUp: boolean;
  error: string | null;
  scannedCode: string | null;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onBarcodeScanned,
  onManualEntry,
}) => {
  const [state, setState] = useState<ScannerState>({
    hasPermission: null,
    isScanning: false,
    isLookingUp: false,
    error: null,
    scannedCode: null,
  });

  const device = useCameraDevice('back');
  const [isActive, setIsActive] = useState(false);

  // Request permission when modal opens
  useEffect(() => {
    if (visible) {
      checkAndRequestPermission();
      setIsActive(true);
    } else {
      setIsActive(false);
      // Reset state when modal closes
      setState({
        hasPermission: null,
        isScanning: false,
        isLookingUp: false,
        error: null,
        scannedCode: null,
      });
    }
  }, [visible]);

  const checkAndRequestPermission = async () => {
    try {
      const status = await barcodeService.checkCameraPermission();
      
      if (status === 'granted') {
        setState(prev => ({ ...prev, hasPermission: true, isScanning: true }));
        return;
      }

      if (status === 'denied') {
        const requestStatus = await barcodeService.requestCameraPermission();
        if (requestStatus === 'granted') {
          setState(prev => ({ ...prev, hasPermission: true, isScanning: true }));
        } else if (requestStatus === 'blocked') {
          setState(prev => ({
            ...prev,
            hasPermission: false,
            error: 'Camera access is blocked. Please enable it in Settings.',
          }));
        } else {
          setState(prev => ({
            ...prev,
            hasPermission: false,
            error: 'Camera access is needed to scan barcodes.',
          }));
        }
        return;
      }

      if (status === 'blocked') {
        setState(prev => ({
          ...prev,
          hasPermission: false,
          error: 'Camera access is blocked. Please enable it in Settings.',
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        hasPermission: false,
        error: 'Camera is not available on this device.',
      }));
    } catch (error) {
      console.error('Permission error:', error);
      setState(prev => ({
        ...prev,
        hasPermission: false,
        error: 'Failed to check camera permission.',
      }));
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['upc-a', 'upc-e', 'ean-8', 'ean-13'],
    onCodeScanned: (codes) => {
      if (state.isLookingUp || !state.isScanning) {
        return;
      }

      const code = codes[0];
      if (code && code.value) {
        handleBarcodeDetected(code.value);
      }
    },
  });

  const handleBarcodeDetected = async (barcode: string) => {
    try {
      // Validate barcode format
      if (!barcodeService.validateBarcode(barcode)) {
        setState(prev => ({ ...prev, error: 'Invalid barcode format' }));
        return;
      }

      // Haptic feedback
      ReactNativeHapticFeedback.trigger('impactMedium');

      // Stop scanning and start lookup
      setState(prev => ({
        ...prev,
        isScanning: false,
        isLookingUp: true,
        scannedCode: barcode,
        error: null,
      }));

      // Lookup product
      const product = await productLookupService.lookupByBarcode(barcode);

      if (product) {
        // Success - pass product data to parent
        onBarcodeScanned(product);
        onClose();
      } else {
        // Product not found
        Alert.alert(
          'Product Not Found',
          'This product is not in our database. You can add it manually.',
          [
            {
              text: 'Manual Entry',
              onPress: () => {
                onClose();
                onManualEntry();
              },
            },
            {
              text: 'Try Again',
              onPress: () => {
                setState(prev => ({
                  ...prev,
                  isScanning: true,
                  isLookingUp: false,
                  scannedCode: null,
                }));
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to lookup product';
      
      Alert.alert(
        'Lookup Failed',
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => {
              setState(prev => ({
                ...prev,
                isScanning: true,
                isLookingUp: false,
                scannedCode: null,
                error: null,
              }));
            },
          },
          {
            text: 'Manual Entry',
            onPress: () => {
              onClose();
              onManualEntry();
            },
          },
        ]
      );
    }
  };

  const handleOpenSettings = () => {
    barcodeService.openDeviceSettings();
  };

  const handleManualEntry = () => {
    onClose();
    onManualEntry();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Camera View */}
        {state.hasPermission && device && (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive && state.isScanning}
            codeScanner={codeScanner}
          />
        )}

        {/* Scanning Overlay */}
        {state.isScanning && (
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.instructionText}>
              Point camera at barcode
            </Text>
          </View>
        )}

        {/* Loading State */}
        {state.isLookingUp && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Looking up product...</Text>
            </View>
          </View>
        )}

        {/* Error State */}
        {state.error && (
          <View style={styles.errorOverlay}>
            <View style={styles.errorCard}>
              <Icon name="error-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{state.error}</Text>
              {state.error.includes('blocked') || state.error.includes('Settings') ? (
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={handleOpenSettings}
                >
                  <Text style={styles.settingsButtonText}>Open Settings</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onClose}
          >
            <Icon name="close" size={24} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleManualEntry}
          >
            <Icon name="keyboard" size={24} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#10B981',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionText: {
    marginTop: 32,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  settingsButton: {
    marginTop: 24,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
