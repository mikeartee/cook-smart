import { Platform, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';

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
      const permission = await Camera.requestCameraPermission();
      return this.mapPermissionStatus(permission);
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
      const permission = await Camera.getCameraPermissionStatus();
      return this.mapPermissionStatus(permission);
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

  /**
   * Map react-native-vision-camera permission status to our PermissionStatus type
   * @param permission - Camera permission status from react-native-vision-camera
   * @returns PermissionStatus
   */
  private mapPermissionStatus(permission: string): PermissionStatus {
    switch (permission) {
      case 'granted':
      case 'authorized':
        return 'granted';
      case 'denied':
      case 'not-determined':
        return 'denied';
      case 'restricted':
        return 'blocked';
      default:
        return 'unavailable';
    }
  }
}

// Export singleton instance
export const barcodeService = new BarcodeServiceImpl();
