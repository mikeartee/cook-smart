# Cook Smart v1.0.36 - Release Notes
**Release Date:** December 7, 2025  
**Build:** Production Release

---

## 🎉 Welcome New Testers!

Thank you for joining the Cook Smart beta! This release includes major fixes and improvements to make your recipe discovery experience smooth and reliable.

---

## ✨ What's New & Fixed

### 🔧 Major Fixes

**Trending & Seasonal Recipes Now Working**
- Fixed critical issue where trending and seasonal recipes failed to load details
- Recipe IDs are now properly formatted for the FatSecret API
- All recipes now display full ingredients, instructions, and nutrition info

**Meal Type Filters Fixed**
- Breakfast, Lunch, Dinner, and Snack filters now return relevant recipes
- Improved search algorithm for better meal-specific results
- No more empty results when filtering by meal type

**Recipe Rating & Collections Fixed**
- Fixed 500 errors when rating recipes or adding to collections
- User ID handling improved for better reliability
- All recipe enhancement features now working perfectly

**Subscription Payment System - CONFIRMED WORKING ✅**
- Fixed "Unable to open payment page" error
- Stripe checkout now opens correctly in browser
- Payment processing fully functional and tested
- Card validation working (declined cards properly rejected)
- Beta users can subscribe at discounted rate for post-beta access
- Free beta access still available for all testers

### 🏷️ Proper Attribution

**FatSecret Platform API Integration**
- Updated all recipe attributions to properly credit FatSecret
- Removed outdated MealDB references
- Clear attribution displayed on every recipe detail page
- Clickable link to FatSecret.com for transparency

---

## 🚀 Current Features

### Recipe Discovery
- **1M+ Recipes** powered by FatSecret Platform API
- **Smart Search** by ingredients you have on hand
- **Meal Type Filters** - Breakfast, Lunch, Dinner, Snacks
- **Calorie Filtering** - Find recipes that fit your goals
- **Trending Recipes** - See what's popular right now
- **Seasonal Recipes** - Discover recipes perfect for the current season

### Recipe Details
- **Full Ingredients List** with measurements
- **Step-by-Step Instructions**
- **Comprehensive Nutrition Info** - Calories, protein, carbs, fat, fiber, and more
- **Cooking Time & Servings**
- **Recipe Images**

### User Features
- **"I Cooked This" Tracking** - Mark recipes you've made
- **Recipe Rating System** - Rate recipes 1-5 stars
- **Favorites & Collections** - Save recipes for later
- **User Points & Achievements** - Earn rewards for cooking
- **Recipe Comments** - Share your cooking experience

### Dietary Management
- **Allergy Tracking** - Mark your food allergies
- **Dietary Restrictions** - Set preferences (vegetarian, vegan, gluten-free, etc.)
- **Personalized Recommendations** - Recipes filtered by your dietary needs

### Community
- **Discord Integration** - Join our community for support and recipe sharing
- **Bug Reports** - Easy in-app bug reporting
- **Feature Requests** - Tell us what you want to see next

---

## 🧪 Beta Testing Focus Areas

We'd love your feedback on:

1. **Recipe Search Quality** - Are you finding recipes you want to cook?
2. **Meal Type Filters** - Do the filters return relevant results?
3. **Recipe Details** - Is all the information you need displayed clearly?
4. **User Experience** - Is the app intuitive and easy to navigate?
5. **Performance** - How fast do recipes load? Any lag or crashes?
6. **Dietary Features** - Do allergy/restriction filters work as expected?

---

## 🐛 Known Issues

- Some recipe images may not load (working on fallback images)
- Occasional slow loading on first app launch (API warming up)
- Recipe comments feature still in development

---

## 📱 Technical Details

- **API:** Production (api.cooksmartapp.com)
- **Recipe Provider:** FatSecret Platform API (500K calls/month, 1M+ recipes)
- **Backend:** Node.js/Express on AWS EC2
- **Database:** PostgreSQL on AWS RDS
- **Platform:** React Native (Android)

---

## 🔗 Important Links

- **Discord Community:** https://discord.gg/7mAeMvjGVH
- **Support Email:** services.cooksmart@gmail.com
- **Website:** https://cooksmartapp.com
- **FatSecret Platform:** https://www.fatsecret.com/

---

## 📝 How to Report Issues

1. **In-App:** Use the bug report feature in Settings
2. **Discord:** Post in #bug-reports channel
3. **Email:** services.cooksmart@gmail.com

Please include:
- What you were trying to do
- What happened instead
- Screenshots if possible
- Your device model

---

## 🙏 Thank You!

Your feedback is invaluable in making Cook Smart the best recipe app possible. We're committed to building features that help you cook smarter, eat healthier, and discover amazing recipes.

Happy cooking! 👨‍🍳👩‍🍳

---

**Previous Versions:**
- v1.0.34 - Frontend fixes for trending/seasonal recipes
- v1.0.33 - Recipe enhancement fixes
- v1.0.32 - Meal type filter improvements
- v1.0.31 - Initial beta release

**Next Up:**
- Recipe image optimization
- Advanced search filters
- Meal planning features
- Grocery list generation
- More dietary preference options

---

*Cook Smart is currently in BETA. All features are free during the beta period. We appreciate your patience as we continue to improve the app!*

