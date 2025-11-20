# Admin Navigation Fix Attempt

**Issue**: Admin Dashboard button does nothing when tapped

**Root Cause**: Navigation hierarchy issue
- Profile screen is in: ProfileStack → TabNavigator → MainStack
- Admin screen is in: MainStack (root level)
- Need to navigate up 2 levels to reach root stack

**Fix Applied**: 
Updated `src/screens/ProfileScreenNew.tsx` to use `getParent().getParent()` to reach the root navigator.

**Code Change**:
```typescript
const parent = navigation.getParent();
const grandParent = parent?.getParent();

if (grandParent) {
  grandParent.navigate('Admin' as never);
} else if (parent) {
  parent.navigate('Admin' as never);
} else {
  navigation.navigate('Admin' as never);
}
```

**Testing Needed**:
1. Build new APK
2. Login as Brad or Briana
3. Go to Profile
4. Tap "Admin Dashboard"
5. Should navigate to Admin screen

**Alternative Solutions** (if this doesn't work):
1. Move Admin screen into Tab Navigator
2. Use React Navigation's `navigation.dispatch()` with reset action
3. Use a global navigation ref
4. Create a separate Admin tab in the bottom navigation

**Status**: Code updated, needs APK build to test
