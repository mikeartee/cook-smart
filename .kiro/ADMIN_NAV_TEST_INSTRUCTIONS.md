# Admin Navigation Test Instructions

## Current Status
- Code updated with debug logging
- Committed: d0b85bf
- Ready for testing (NO APK BUILD TONIGHT)

## What Changed
Added extensive debug logging to understand the navigation hierarchy when the Admin button is pressed.

## How to Test (Tomorrow with CodePush or Next APK)

### Step 1: Open the App
1. Launch Cook Smart
2. Login as Brad (bradturnbough80@gmail.com / Brad2024!)

### Step 2: Navigate to Profile
1. Tap the "Account" tab (bottom right)
2. You should see the Profile screen

### Step 3: Tap Admin Dashboard
1. Find the "Admin Dashboard" menu item (red icon)
2. Tap it
3. **Watch the console logs!**

### Step 4: Check Console Output
You should see logs like:
```
🔍 Admin button pressed - Starting navigation debug
📍 Level 0: [navigator-id]
📍 Level 1: [navigator-id]
📍 Level 2: [navigator-id]
✅ Found root at level X
🚀 Attempting to navigate to Admin from level X
✅ Navigation command sent
```

### Step 5: Observe Behavior

**If it works:**
- ✅ Admin screen opens
- ✅ You see the admin dashboard
- 🎉 Problem solved!

**If it doesn't work:**
- ❌ Nothing happens OR
- ❌ Error alert appears
- 📋 Check the console logs to see where it failed

## Expected Console Output

### Success Case:
```
🔍 Admin button pressed - Starting navigation debug
📍 Level 0: account-stack
📍 Level 1: main-tab
📍 Level 2: root-stack
✅ Found root at level 2
🚀 Attempting to navigate to Admin from level 2
✅ Navigation command sent
```

### Failure Case 1 - Can't find root:
```
🔍 Admin button pressed - Starting navigation debug
📍 Level 0: account-stack
📍 Level 1: main-tab
📍 Level 2: root-stack
📍 Level 3: unknown
📍 Level 4: unknown
❌ Could not find root navigator after 5 levels
```

### Failure Case 2 - Navigation error:
```
🔍 Admin button pressed - Starting navigation debug
📍 Level 0: account-stack
📍 Level 1: main-tab
📍 Level 2: root-stack
✅ Found root at level 2
🚀 Attempting to navigate to Admin from level 2
❌ Navigation error: [error message]
```

## What to Report Back

Please provide:
1. **Did it work?** (Yes/No)
2. **Console logs** (copy/paste the output)
3. **Any error messages** (if shown)
4. **What happened** (describe the behavior)

## Next Steps Based on Results

### If it works:
- Remove debug logs
- Clean up code
- Build final APK
- Celebrate! 🎉

### If it fails:
We'll try alternative approaches:

**Option A: Navigation Ref**
- Create a global navigation ref in App.tsx
- Access it from ProfileScreen
- Guaranteed to work

**Option B: Move Admin to Tabs**
- Make Admin a tab in the bottom navigation
- Easier to access
- Changes UX

**Option C: Use Linking**
- Configure deep linking
- Navigate using URL scheme
- More complex but reliable

**Option D: Event Emitter**
- Use EventEmitter to trigger navigation
- Decouple navigation logic
- More flexible

## Why No APK Tonight?

Building APKs takes time and we want to:
1. Understand the problem first
2. See the debug output
3. Make informed decisions
4. Avoid building 20 APKs

With CodePush (tomorrow), we can push updates instantly without rebuilding!

## Files Modified
- `src/screens/ProfileScreenNew.tsx` - Added debug logging
- `.kiro/ADMIN_NAV_DEBUG.md` - Documentation
- `.kiro/ADMIN_NAV_TEST_INSTRUCTIONS.md` - This file

## Commit
- Hash: d0b85bf
- Message: "Add debug logging for admin navigation troubleshooting"

---

**Status**: Ready for testing
**Next**: Test with current APK or wait for CodePush setup

