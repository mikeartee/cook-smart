# Android Build Issue - react-native-worklets-core

## Problem

The Android build is failing due to a compatibility issue with `react-native-worklets-core` and the new React Native architecture in RN 0.82.

**Error**: `Target "rnworklets" links to target "hermes-engine::libhermes" but the target was not found`

## Root Cause

- `react-native-vision-camera` requires `react-native-worklets-core` for frame processors
- `react-native-worklets-core` has compatibility issues with React Native 0.82's new architecture
- This is a known issue in the community

## Options

### Option 1: Remove Camera Features Temporarily (RECOMMENDED FOR BETA)
**Pros:**
- Get app distributed to testers immediately
- Barcode scanner isn't critical for initial testing
- Can add back later once compatibility is fixed

**Cons:**
- No barcode scanning in beta

**Steps:**
1. Remove `react-native-vision-camera`, `react-native-worklets-core`, and `vision-camera-code-scanner` from package.json
2. Comment out barcode scanner screen/navigation
3. Build APK successfully
4. Distribute to testers
5. Add back later when library is updated

### Option 2: Downgrade React Native
**Pros:**
- Keep all features

**Cons:**
- Lose new architecture benefits
- More work to upgrade later
- May have other compatibility issues

### Option 3: Wait for Library Updates
**Pros:**
- Keep everything as-is

**Cons:**
- Could take weeks/months
- Delays beta testing

## Recommendation

**Go with Option 1** - Remove camera features temporarily:

1. The barcode scanner is a "nice to have" feature
2. Core functionality (recipes, meal planning, subscriptions) works fine
3. You can test the important features with beta users now
4. Add barcode scanning back in a future update

## What Works Without Camera

✅ User authentication
✅ Recipe browsing and search
✅ Meal planning
✅ Shopping lists
✅ Subscription system
✅ All backend features

❌ Barcode scanning (temporarily disabled)

## Next Steps

Would you like me to:
1. Remove the camera dependencies and get a working build?
2. Try another approach?
3. Investigate alternative barcode scanning libraries?
