# Cook Smart v1.0.22 - Release Notes

**Release Date**: November 21, 2025  
**Build**: v1.0.22  
**APK**: `CookSmart-v1.0.22-substitution-selection.apk`

---

## 🎉 New Features

### 1. Selectable Ingredient Substitutions ⭐ NEW!
Users can now select their preferred ingredient substitutions when viewing recipes!

**How it works:**
- View a recipe with dietary restrictions or allergies
- See substitution suggestions with radio buttons
- Tap to select your preferred alternative
- Selected substitution shows with checkmark and green background
- Add to shopping list → Selected substitution is added (not original ingredient)
- Quantities automatically adjusted based on substitution ratio

**Example:**
```
Recipe needs: "2 cups milk"
User has: Dairy allergy
Substitutions shown:
  ○ Almond milk (1:1)
  ○ Oat milk (1:1)

User taps: Almond milk
Result: ✅ Almond milk selected

Adds to shopping list: "2 cups almond milk" ✅
```

---

## 🐛 Bug Fixes

### 1. Ingredient Quantity Updates Now Save ✅
**Fixed**: Ingredient quantities now properly save to database when edited

**Before**: 
- Edit ingredient quantity → Shows "changed" → Doesn't save
- Quantity reverts after closing app

**After**:
- Edit ingredient quantity → Saves to database ✅
- Quantity persists across app restarts ✅

---

### 2. Spanish Category Names Fixed ✅
**Fixed**: All ingredient categories now display in English

**Before**:
- Categories showed in Spanish: "ALIMENTOS Y BEBIDAS DE ORIGEN VEGETAL"
- Mixed language categories from barcode scanning

**After**:
- All categories in English: "vegetables", "proteins", "fruits", etc.
- Barcode scanning now maps Spanish categories to English
- 29 existing ingredients updated in database

---

## 🔧 Backend Improvements

### 1. Email Service Configured ✅
- AWS SES integrated with SMTP credentials
- Password reset emails ready to send
- Beautiful HTML email templates
- Domain registered: cooksmartapp.com
- Domain verified in AWS SES
- Production access request submitted (pending approval)

### 2. Enhanced Barcode Service ✅
- Improved category mapping for multiple languages
- Better handling of Spanish product data
- More accurate ingredient categorization

---

## 📋 What's Included

### Core Features:
- ✅ Recipe search and browsing
- ✅ Ingredient inventory management
- ✅ Shopping list with checkbox functionality
- ✅ Barcode scanning
- ✅ Dietary preferences and allergies
- ✅ **NEW: Selectable ingredient substitutions**
- ✅ Favorites and saved recipes
- ✅ Subscription management (Stripe Live Mode)
- ✅ User profiles and settings
- ✅ Feedback system with image attachments

### Recent Fixes:
- ✅ Ingredient quantity updates save correctly
- ✅ Spanish categories converted to English
- ✅ Shopping list checkbox crash-proof
- ✅ Subscription payment errors fixed
- ✅ Dietary system fully functional

---

## 🧪 Testing Instructions

### Test New Substitution Feature:
1. Open app and log in
2. Go to Recipe Search
3. Find a recipe with ingredients you have restrictions for
4. View recipe details
5. Look for ingredients with ⚠️ warning
6. See substitution suggestions below
7. **Tap on a substitution** → Should show checkmark and green background
8. Tap "Add Missing to Shopping List"
9. Go to Shopping List
10. Verify selected substitution was added (not original ingredient)

### Test Ingredient Quantity Fix:
1. Go to Ingredient Inventory
2. Tap edit on any ingredient
3. Change quantity
4. Save
5. Close app completely
6. Reopen app
7. Verify quantity is still changed ✅

### Test English Categories:
1. Go to Ingredient Inventory
2. Check all category labels
3. Verify all are in English (no Spanish)
4. Scan a new product with barcode
5. Verify category is in English

---

## 📊 File Size

**APK Size**: ~108 MB (112,911,547 bytes)

---

## 🚀 Installation

1. Uninstall previous version (if installed)
2. Install `CookSmart-v1.0.22-substitution-selection.apk`
3. Open app and test new features!

---

## 🐛 Known Issues

None currently! All major bugs have been fixed.

---

## 📝 Notes for Testers

### Focus Areas:
1. **Substitution selection** - Does it work smoothly?
2. **Shopping list integration** - Are substitutions added correctly?
3. **Quantity calculations** - Are ratios calculated properly?
4. **Visual feedback** - Is it clear what's selected?

### What to Report:
- Any crashes or errors
- Confusing UI/UX
- Incorrect quantity calculations
- Substitutions not being added to shopping list
- Any other unexpected behavior

---

## 🎯 Next Steps

### This Weekend:
- Comprehensive testing (see WEEKEND_TESTING_PLAN.md)
- Test critical flows (payments, cancellation, account deletion)
- Test error handling and edge cases
- Gather feedback from testers

### After Testing:
- Fix any bugs found
- Build final BETA release
- Prepare for public BETA launch

---

## 💡 Feedback

Please report any issues or feedback through:
- In-app feedback system
- Direct message
- Discord channel

---

**Thank you for testing! Your feedback helps make Cook Smart better! 🙏**

