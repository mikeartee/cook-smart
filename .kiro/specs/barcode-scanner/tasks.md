# Barcode Scanner Implementation Plan

- [x] 1. Install dependencies and configure platform permissions


  - Install react-native-vision-camera, vision-camera-code-scanner, and react-native-haptic-feedback packages
  - Add camera permission declarations to iOS Info.plist with user-friendly description
  - Add camera permission declarations to Android AndroidManifest.xml
  - Run pod install for iOS native dependencies
  - _Requirements: 1.1, 1.4_



- [ ] 2. Implement BarcodeService for permission management
  - Create src/services/barcodeService.ts file
  - Implement requestCameraPermission() method using react-native-vision-camera API
  - Implement checkCameraPermission() method for permission status checking
  - Implement openDeviceSettings() method with platform-specific deep links
  - Implement validateBarcode() method for UPC/EAN format validation (8-13 digits)


  - Add TypeScript interfaces for PermissionStatus type
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 3. Implement ProductLookupService with smart caching
  - Create src/services/productLookupService.ts file
  - Implement lookupByBarcode() method that checks cache first, then calls API
  - Implement getCachedProduct() method to retrieve from AsyncStorage
  - Implement cacheProduct() method to store product data with access tracking
  - Implement updateCacheAccess() method to increment accessCount and update lastAccessedAt
  - Implement clearExpiredCache() method with smart expiration logic (5+ scans = never expire, 3-4 scans = 90 days, 1-2 scans = 30 days)
  - Add Open Food Facts API integration (https://world.openfoodfacts.org/api/v0/product/{barcode}.json)
  - Implement response parsing with fallbacks for missing data


  - Add rate limiting (1 request per second) using throttle mechanism
  - Add retry logic with exponential backoff (max 2 retries)
  - Add TypeScript interfaces for ScannedProduct and OpenFoodFactsResponse
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4_

- [ ] 4. Create BarcodeScannerModal component
  - Create src/components/barcode/BarcodeScannerModal.tsx file
  - Implement modal with full-screen camera view using react-native-vision-camera
  - Add frame processor for real-time barcode detection using vision-camera-code-scanner
  - Implement scanning overlay with centered crosshair guide
  - Add Cancel button that closes modal and returns to ingredient screen
  - Add Manual Entry button that switches to manual barcode input
  - Implement barcode detection handler that decodes within 1 second
  - Add haptic feedback on successful scan using react-native-haptic-feedback


  - Add visual confirmation (flash/checkmark) on successful scan
  - Implement loading indicator with "Looking up product..." message during API call
  - Add error message display for scanning failures with retry options
  - Implement auto-close after successful product lookup
  - Add TypeScript interfaces for BarcodeScannerModalProps and ScannerState
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5. Create ManualBarcodeEntryModal component
  - Create src/components/barcode/ManualBarcodeEntryModal.tsx file


  - Implement modal with text input for barcode number entry
  - Add numeric keyboard type for easier input
  - Implement barcode validation (8-13 digits) with real-time feedback
  - Add Submit button that triggers product lookup
  - Add Cancel button that closes modal
  - Add error message display for invalid barcode format
  - Add TypeScript interfaces for ManualBarcodeEntryModalProps
  - _Requirements: 2.4, 6.3, 6.4_

- [ ] 6. Integrate barcode scanner into AddIngredientScreen
  - Add "Scan Barcode" button above search bar in AddIngredientScreen
  - Add barcode icon to the button using react-native-vector-icons
  - Add state management for scanner modal visibility (showScannerModal)
  - Add state management for manual entry modal visibility (showManualEntryModal)


  - Add state management for scanned product data (scannedProduct)
  - Implement handleScanBarcode() method that checks camera permission and opens scanner
  - Implement handleBarcodeScanned() callback that receives ScannedProduct data
  - Implement handleManualEntry() callback that opens manual entry modal
  - Auto-populate custom ingredient modal with scanned product data (name, brand, category)
  - Set default quantity to 1 and unit to "item" for scanned products
  - Allow user to edit all auto-populated fields before saving
  - Add confirmation dialog if user scans while form has existing data
  - Hide "Scan Barcode" button if device has no camera (using BarcodeService check)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Implement error handling and fallback mechanisms


  - Add permission denied error handling with "Grant Permission" button
  - Add permission blocked error handling with "Open Settings" button
  - Add camera unavailable detection that hides scan button
  - Add camera initialization failure handler that auto-switches to manual entry
  - Add "no barcode detected" message after 3 seconds with manual entry suggestion
  - Add "product not found" error handling that allows manual ingredient entry
  - Add network error handling with retry button
  - Add API timeout handling (10 seconds) with retry and manual entry options
  - Add rate limit error handling with delayed retry
  - Integrate with NotificationService to log errors to Discord error monitoring channel
  - Add error context (barcode, error message, timestamp) to error logs
  - _Requirements: 1.2, 1.5, 3.4, 4.4, 4.5, 6.1, 6.2, 6.5_

- [ ] 8. Add performance optimizations
  - Implement cache-first lookup strategy (check AsyncStorage before API call)
  - Add cache cleanup on app startup (remove expired items based on access count)
  - Optimize camera frame rate to 30 FPS for smooth scanning
  - Set camera resolution to 720p (sufficient for barcodes, saves processing)
  - Ensure frame processor runs on separate thread (doesn't block UI)
  - Release camera resources immediately after successful scan
  - Add client-side rate limiting (1 request per second) to respect API limits
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9. Write unit tests for services
  - [ ] 9.1 Create BarcodeService unit tests
    - Test permission request handling for granted/denied/blocked states
    - Test permission status checking
    - Test barcode validation with valid formats (UPC-A, UPC-E, EAN-8, EAN-13)
    - Test barcode validation with invalid formats
    - Test settings deep link generation for iOS and Android
    - _Requirements: 1.1, 1.2, 3.3_

  - [ ] 9.2 Create ProductLookupService unit tests
    - Test API call with valid barcode returns correct product data
    - Test API call with invalid barcode returns null
    - Test response parsing with complete data
    - Test response parsing with missing optional fields (brand, category)
    - Test cache hit scenario (returns cached data without API call)
    - Test cache miss scenario (calls API and caches result)
    - Test cache expiration based on access count (5+ never expires, 3-4 = 90 days, 1-2 = 30 days)
    - Test access count increments correctly on each lookup
    - Test lastAccessedAt updates correctly
    - Test network error handling with retry logic
    - Test API timeout handling
    - Test rate limiting (1 request per second)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.2, 8.3, 8.4_

- [ ] 10. Write integration tests for components
  - [ ] 10.1 Create BarcodeScannerModal integration tests
    - Test modal opens and closes correctly
    - Test permission request triggers on mount
    - Test camera activates after permission granted
    - Test barcode scan triggers product lookup
    - Test successful lookup calls onBarcodeScanned callback with correct data
    - Test Manual Entry button opens manual entry modal
    - Test Cancel button closes modal
    - Test error messages display correctly for various error types
    - Test loading indicator shows during product lookup
    - Test haptic feedback triggers on successful scan
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.5_

  - [ ] 10.2 Create ManualBarcodeEntryModal integration tests
    - Test modal opens and closes correctly
    - Test barcode validation with valid input
    - Test barcode validation with invalid input (too short, too long, non-numeric)


    - Test Submit button triggers product lookup
    - Test Cancel button closes modal
    - Test error messages display for invalid input
    - _Requirements: 2.4, 6.3, 6.4_

  - [ ] 10.3 Create AddIngredientScreen integration tests
    - Test "Scan Barcode" button is visible and clickable
    - Test scanner modal opens when button is pressed
    - Test scanned product data pre-populates custom ingredient form
    - Test user can edit all fields after scanning
    - Test ingredient saves correctly with scanned data
    - Test confirmation dialog shows when scanning with existing form data
    - Test "Scan Barcode" button is hidden on devices without camera
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4_




- [ ] 11. Manual testing and bug fixes
  - Test on iOS device with real barcodes (UPC, EAN formats)
  - Test on Android device with real barcodes
  - Test permission flows (first-time, denied, blocked, re-granted)
  - Test scanning in various lighting conditions (bright, dim, low light)
  - Test with known products (should return data)
  - Test with unknown barcodes (should show "not found")
  - Test network error scenarios (airplane mode, slow connection)
  - Test manual entry fallback
  - Test cache functionality (scan same item twice, should be instant second time)
  - Test app backgrounding/foregrounding during scan
  - Test rapid scanning (multiple scans in quick succession)
  - Test on device without camera (should hide scan button)
  - Fix any bugs discovered during testing
  - _Requirements: All requirements_

- [ ] 12. Update documentation and user guidance
  - Add barcode scanner feature to app documentation
  - Create user guide for scanning barcodes (in-app help or tooltip)
  - Update MISSING_FEATURES_CHECKLIST.md to mark barcode scanner as complete
  - Document any known limitations or edge cases
  - Add troubleshooting guide for common scanning issues
  - _Requirements: 1.2, 2.1, 6.2_
