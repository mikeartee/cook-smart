# Barcode Scanner Design Document

## Overview

The Barcode Scanner feature integrates camera-based barcode scanning into the Cook Smart app, enabling users to quickly add ingredients by scanning product barcodes. The system uses **react-native-vision-camera** (the modern, actively maintained successor to react-native-camera) for camera access and **vision-camera-code-scanner** for barcode detection. Product information is retrieved from the free Open Food Facts API and auto-populated into the ingredient form.

### Key Design Decisions

1. **Camera Library**: react-native-vision-camera v4 (latest stable)
   - Modern, performant, actively maintained
   - Better performance than react-native-camera
   - Supports frame processors for real-time barcode scanning
   - Works with React Native 0.82.1 (current version)

2. **Barcode Detection**: vision-camera-code-scanner plugin
   - Native barcode scanning using MLKit (Android) and Vision (iOS)
   - Supports all major formats (UPC-A, UPC-E, EAN-8, EAN-13)
   - Real-time detection with frame processors
   - Zero cost, runs on-device

3. **Product Database**: Open Food Facts API
   - Completely free, no API key required
   - Large database (2.8M+ products)
   - RESTful API with JSON responses
   - No rate limits for reasonable use

4. **Architecture Pattern**: Service-based with React Context
   - BarcodeService handles scanning logic
   - ProductLookupService handles API calls
   - Integration with existing IngredientContext

## Architecture

### Component Hierarchy

```
AddIngredientScreen (existing)
├── SearchBar (existing)
├── "Scan Barcode" Button (NEW)
├── Search Results List (existing)
├── Custom Ingredient Modal (existing)
└── BarcodeScannerModal (NEW)
    ├── Camera View
    ├── Scanning Overlay
    ├── Control Buttons (Cancel, Manual Entry)
    └── Status Messages
```

### Service Layer

```
Services
├── BarcodeService (NEW)
│   ├── requestCameraPermission()
│   ├── checkCameraPermission()
│   └── openDeviceSettings()
├── ProductLookupService (NEW)
│   ├── lookupByBarcode(barcode: string)
│   ├── parseProductData(response)
│   └── getCachedProduct(barcode: string)
└── IngredientService (existing)
    └── addIngredient() - reused
```

### Data Flow

```
User taps "Scan Barcode"
    ↓
Check camera permission
    ↓
[Granted] → Open BarcodeScannerModal
    ↓
Camera activates with frame processor
    ↓
Barcode detected → Decode barcode
    ↓
Send to ProductLookupService
    ↓
Check local cache (AsyncStorage)
    ↓
[Cache miss] → Call Open Food Facts API
    ↓
Parse product data
    ↓
Cache result (30 days)
    ↓
Auto-populate ingredient form
    ↓
User reviews and saves
    ↓
Add to inventory via IngredientContext
```

## Components and Interfaces

### 1. BarcodeScannerModal Component

**Location**: `src/components/barcode/BarcodeScannerModal.tsx`

**Props Interface**:
```typescript
interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (productData: ScannedProduct) => void;
  onManualEntry: () => void;
}
```

**State**:
```typescript
interface ScannerState {
  hasPermission: boolean | null;
  isScanning: boolean;
  isLookingUp: boolean;
  error: string | null;
  scannedCode: string | null;
}
```

**Key Features**:
- Full-screen camera view with react-native-vision-camera
- Frame processor for real-time barcode detection
- Scanning overlay with crosshair guide
- Haptic feedback on successful scan
- Loading indicator during product lookup
- Error messages with retry options
- Cancel and Manual Entry buttons

### 2. ManualBarcodeEntryModal Component

**Location**: `src/components/barcode/ManualBarcodeEntryModal.tsx`

**Props Interface**:
```typescript
interface ManualBarcodeEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (barcode: string) => void;
}
```

**Key Features**:
- Text input for barcode number
- Numeric keyboard
- Validation (8-13 digits)
- Submit button
- Cancel button

### 3. BarcodeService

**Location**: `src/services/barcodeService.ts`

**Interface**:
```typescript
interface BarcodeService {
  requestCameraPermission(): Promise<PermissionStatus>;
  checkCameraPermission(): Promise<PermissionStatus>;
  openDeviceSettings(): void;
  validateBarcode(code: string): boolean;
}

type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';
```

**Implementation Details**:
- Uses react-native-vision-camera's permission API
- Platform-specific permission handling (iOS/Android)
- Deep link to device settings for blocked permissions
- Barcode format validation (UPC/EAN)

### 4. ProductLookupService

**Location**: `src/services/productLookupService.ts`

**Interface**:
```typescript
interface ProductLookupService {
  lookupByBarcode(barcode: string): Promise<ScannedProduct | null>;
  getCachedProduct(barcode: string): Promise<ScannedProduct | null>;
  cacheProduct(barcode: string, product: ScannedProduct): Promise<void>;
  updateCacheAccess(barcode: string): Promise<void>;
  clearExpiredCache(): Promise<void>;
}

interface ScannedProduct {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  cachedAt?: number;
  lastAccessedAt?: number;
  accessCount?: number;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name: string;
    brands?: string;
    categories?: string;
    image_url?: string;
  };
}
```

**Implementation Details**:
- API endpoint: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
- Response parsing with fallbacks for missing data
- AsyncStorage for caching (key: `barcode_cache_{barcode}`)
- Smart cache expiration: Similar to recipe caching
  - Track access count and last accessed timestamp
  - Frequently scanned items (5+ scans) kept indefinitely
  - Rarely scanned items (1-2 scans) expire after 30 days
  - Medium usage items (3-4 scans) expire after 90 days
  - Cache cleanup only when storage limit approached
- Network error handling with retry logic
- Rate limiting: 1 request per second

### 5. Updated AddIngredientScreen

**Changes**:
- Add "Scan Barcode" button above search bar
- Add state for scanner modal visibility
- Add state for scanned product data
- Add handler for barcode scan results
- Pre-populate custom ingredient modal with scanned data

**New State**:
```typescript
const [showScannerModal, setShowScannerModal] = useState(false);
const [showManualEntryModal, setShowManualEntryModal] = useState(false);
const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
```

## Data Models

### ScannedProduct Model

```typescript
interface ScannedProduct {
  barcode: string;           // The scanned barcode number
  name: string;              // Product name from API
  brand?: string;            // Brand name (optional)
  category?: string;         // Product category (optional)
  imageUrl?: string;         // Product image URL (optional)
  cachedAt?: number;         // Timestamp when cached (for expiration)
}
```

### Cache Storage Schema

**AsyncStorage Key**: `barcode_cache_{barcode}`

**Value Structure**:
```json
{
  "barcode": "0123456789012",
  "name": "Organic Honey",
  "brand": "Nature's Best",
  "category": "Sweeteners",
  "imageUrl": "https://...",
  "cachedAt": 1700000000000,
  "lastAccessedAt": 1700000000000,
  "accessCount": 1
}
```

**Cache Management** (Smart Expiration):
- **Frequently scanned** (accessCount >= 5): Never expires
- **Medium usage** (accessCount 3-4): Expires after 90 days of no access
- **Rarely scanned** (accessCount 1-2): Expires after 30 days of no access
- **Cleanup**: Only when storage approaches limit (lazy cleanup)
- **Access tracking**: Increment accessCount and update lastAccessedAt on each scan
- **Max cache size**: No hard limit (AsyncStorage handles this)

## Error Handling

### Permission Errors

| Error | User Message | Action |
|-------|-------------|--------|
| Permission denied (first time) | "Camera access is needed to scan barcodes" | Show "Grant Permission" button |
| Permission blocked | "Camera access is blocked. Please enable it in Settings" | Show "Open Settings" button |
| Camera unavailable | "Camera is not available on this device" | Hide scan button, show manual entry only |

### Scanning Errors

| Error | User Message | Action |
|-------|-------------|--------|
| No barcode detected (3s) | "Having trouble? Try better lighting or manual entry" | Show manual entry button |
| Invalid barcode format | "Invalid barcode format" | Allow retry or manual entry |
| Camera initialization failed | "Camera failed to start" | Auto-switch to manual entry |

### API Errors

| Error | User Message | Action |
|-------|-------------|--------|
| Product not found | "Product not found in database. You can add it manually" | Pre-fill barcode, allow manual entry |
| Network error | "Network error. Check your connection and try again" | Show retry button |
| API timeout (10s) | "Lookup timed out. Try again or enter manually" | Show retry and manual entry buttons |
| Rate limit exceeded | "Too many requests. Please wait a moment" | Show retry button with 2s delay |

### Error Logging

All errors are logged to the Discord error monitoring channel via the existing NotificationService:

```typescript
await NotificationService.sendError({
  message: 'Barcode scan failed',
  severity: 'medium',
  context: {
    barcode,
    error: error.message,
    timestamp: new Date().toISOString()
  }
});
```

## Testing Strategy

### Unit Tests

**BarcodeService Tests** (`src/services/__tests__/barcodeService.test.ts`):
- ✓ Permission request handling
- ✓ Permission status checking
- ✓ Barcode validation (valid/invalid formats)
- ✓ Settings deep link generation

**ProductLookupService Tests** (`src/services/__tests__/productLookupService.test.ts`):
- ✓ API call with valid barcode
- ✓ API call with invalid barcode
- ✓ Response parsing
- ✓ Cache hit scenario
- ✓ Cache miss scenario
- ✓ Cache expiration based on access count
- ✓ Access count increments correctly
- ✓ Frequently scanned items never expire
- ✓ Network error handling

### Integration Tests

**BarcodeScannerModal Tests** (`src/components/barcode/__tests__/BarcodeScannerModal.test.tsx`):
- ✓ Modal opens and closes
- ✓ Permission request on mount
- ✓ Camera activation after permission granted
- ✓ Barcode scan triggers lookup
- ✓ Successful lookup calls onBarcodeScanned
- ✓ Manual entry button works
- ✓ Error messages display correctly

**AddIngredientScreen Integration** (`src/screens/ingredients/__tests__/AddIngredientScreen.test.tsx`):
- ✓ Scan button visible and clickable
- ✓ Scanner modal opens on button press
- ✓ Scanned data pre-populates custom ingredient form
- ✓ User can edit scanned data before saving
- ✓ Ingredient saves correctly with scanned data

### Manual Testing Checklist

**Permissions**:
- [ ] First-time permission request shows system dialog
- [ ] Denied permission shows helpful message
- [ ] "Open Settings" button works on both platforms
- [ ] Re-granting permission allows scanning

**Scanning**:
- [ ] Camera activates within 2 seconds
- [ ] Barcode detection works in good lighting
- [ ] Barcode detection works in low lighting
- [ ] Haptic feedback on successful scan
- [ ] Multiple barcode formats work (UPC, EAN)

**Product Lookup**:
- [ ] Known product returns correct data
- [ ] Unknown product shows "not found" message
- [ ] Network error shows retry option
- [ ] Cached product loads instantly

**Integration**:
- [ ] Scanned data pre-fills ingredient form
- [ ] User can edit all fields
- [ ] Saving works correctly
- [ ] Manual entry fallback works

**Edge Cases**:
- [ ] Device without camera hides scan button
- [ ] Rapid scanning doesn't cause crashes
- [ ] App backgrounding/foregrounding works
- [ ] Low memory doesn't crash scanner

## Performance Considerations

### Camera Performance

- **Frame Rate**: 30 FPS for smooth scanning
- **Resolution**: 720p (sufficient for barcodes, saves processing)
- **Frame Processor**: Runs on separate thread (doesn't block UI)
- **Memory**: Camera released immediately after scan

### API Performance

- **Cache First**: Check AsyncStorage before API call (< 10ms)
- **API Timeout**: 10 seconds max
- **Rate Limiting**: 1 request per second (client-side throttle)
- **Retry Logic**: Max 2 retries with exponential backoff

### Storage Performance

- **Cache Size**: ~600 bytes per product (includes access tracking)
- **Estimated Usage**: 1000 products = 600KB (negligible)
- **Smart Cleanup**: Only removes rarely-used items when needed
- **Access Tracking**: Minimal overhead (< 1ms per scan)
- **No Impact**: AsyncStorage is fast for small data
- **Popular Items**: Frequently scanned items stay cached indefinitely

## Security Considerations

### Camera Access

- **Permissions**: Requested only when needed (just-in-time)
- **Privacy**: No video recording, only frame processing
- **User Control**: Clear explanation of why camera is needed
- **Settings Access**: Easy path to revoke permissions

### API Security

- **No Authentication**: Open Food Facts requires no API key
- **HTTPS Only**: All API calls use secure connection
- **No PII**: No user data sent to API
- **Rate Limiting**: Prevents abuse

### Data Storage

- **Local Only**: Cache stored in AsyncStorage (device-only)
- **No Sensitive Data**: Only public product information cached
- **User Control**: Cache can be cleared from app settings

## Cost Analysis

### Development Costs

- **Libraries**: $0 (all open-source)
- **API**: $0 (Open Food Facts is free)
- **Infrastructure**: $0 (client-side only, no backend changes)

### Operational Costs

- **API Calls**: $0 (no limits, no charges)
- **Storage**: $0 (AsyncStorage is free)
- **Bandwidth**: Negligible (< 5KB per lookup)

### Total Cost

**$0/month** - Completely free feature with no ongoing costs

## Implementation Phases

### Phase 1: Core Scanning (Priority: HIGH)
- Install dependencies (react-native-vision-camera, vision-camera-code-scanner)
- Configure iOS/Android permissions
- Create BarcodeScannerModal component
- Implement BarcodeService
- Add "Scan Barcode" button to AddIngredientScreen

### Phase 2: Product Lookup (Priority: HIGH)
- Implement ProductLookupService
- Integrate Open Food Facts API
- Add caching with AsyncStorage
- Handle API errors and edge cases

### Phase 3: Integration (Priority: HIGH)
- Connect scanner to ingredient form
- Auto-populate scanned data
- Add manual entry fallback
- Test end-to-end flow

### Phase 4: Polish (Priority: MEDIUM)
- Add haptic feedback
- Improve error messages
- Add loading states
- Optimize performance

### Phase 5: Testing (Priority: MEDIUM)
- Write unit tests
- Write integration tests
- Manual testing on real devices
- Fix bugs and edge cases

## Dependencies

### New Dependencies to Install

```json
{
  "react-native-vision-camera": "^4.0.0",
  "vision-camera-code-scanner": "^0.2.0",
  "react-native-haptic-feedback": "^2.2.0"
}
```

### Platform Configuration

**iOS (Info.plist)**:
```xml
<key>NSCameraUsageDescription</key>
<string>Cook Smart needs camera access to scan product barcodes and quickly add ingredients to your inventory.</string>
```

**Android (AndroidManifest.xml)**:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

### Build Configuration

**iOS**: Requires camera permission in Info.plist (already covered above)

**Android**: Requires camera permission in manifest (already covered above)

**Metro Config**: No changes needed

**Babel Config**: No changes needed

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Batch Scanning**: Scan multiple items in one session
2. **Shopping List Integration**: Scan items to add to shopping list
3. **Nutrition Data**: Show nutritional information from Open Food Facts
4. **Product Images**: Display product images in ingredient list
5. **Barcode History**: Keep history of scanned items
6. **Offline Mode**: Queue scans when offline, process when online
7. **Alternative APIs**: Fallback to other product databases if Open Food Facts fails

### Performance Optimizations

1. **Smart Cache Analytics**: Track most scanned products across all users
2. **Image Caching**: Cache product images locally for frequently scanned items
3. **Background Sync**: Update stale cache data in background
4. **Compression**: Compress cached data to save space (if needed)

### UX Improvements

1. **Scan Feedback**: Visual animation on successful scan
2. **Tutorial**: First-time user guide for scanning
3. **Quick Actions**: Swipe gestures for common actions
4. **Voice Feedback**: Audio confirmation of scans (accessibility)

## Rollout Plan

### Beta Testing (Week 1)

- Deploy to TestFlight/Internal Testing
- Test with 10-20 beta users
- Collect feedback on scanning accuracy
- Monitor error rates via Discord notifications

### Soft Launch (Week 2)

- Enable for 50% of users (feature flag)
- Monitor performance metrics
- Fix critical bugs
- Gather user feedback

### Full Launch (Week 3)

- Enable for 100% of users
- Announce feature in app
- Update app store description
- Monitor adoption rate

### Success Metrics

- **Adoption Rate**: % of users who try scanning
- **Success Rate**: % of scans that find products
- **Time Saved**: Average time to add ingredient (scan vs manual)
- **User Satisfaction**: Feedback ratings
- **Error Rate**: % of scans that fail
