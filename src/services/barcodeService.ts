import { Platform, Linking, PermissionsAndroid } from 'react-native';
import { Camera } from 'react-native-camera-kit';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

export interface BarcodeService {
  requestCameraPermission(): Promise<PermissionStatus>;
  checkCameraPermission(): Promise<PermissionStatus>;
  openDeviceSettings(): void;
  validateBarcode(code: string): boolean;
}

class BarcodeServiceImpl implements BarcodeService {
  /**
   * Request camera permission from the device
   * @returns Promise<PermissionStatus>
   */
  async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Cook Smart needs access to your camera to scan barcodes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return 'granted';
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return 'blocked';
        } else {
          return 'denied';
        }
      } else {
        // iOS - camera-kit handles permissions automatically
        const status = await Camera.requestCameraPermission();
        return status ? 'granted' : 'denied';
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return 'unavailable';
    }
  }

  /**
   * Check current camera permission status
   * @returns Promise<PermissionStatus>
   */
  async checkCameraPermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        return hasPermission ? 'granted' : 'denied';
      } else {
        // iOS - camera-kit handles permissions automatically
        const status = await Camera.checkDeviceCameraAuthorizationStatus();
        return status ? 'granted' : 'denied';
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return 'unavailable';
    }
  }

  /**
   * Open device settings for the app
   */
  openDeviceSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  /**
   * Validate barcode format (UPC/EAN: 8-13 digits)
   * @param code - The barcode string to validate
   * @returns boolean
   */
  validateBarcode(code: string): boolean {
    // Remove any whitespace
    const cleanCode = code.trim();
    
    // Check if it's numeric and between 8-13 digits
    const isNumeric = /^\d+$/.test(cleanCode);
    const validLength = cleanCode.length >= 8 && cleanCode.length <= 13;
    
    return isNumeric && validLength;
  }

}

// Export singleton instance
export const barcodeService = new BarcodeServiceImpl();
