# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2025-12-07

### Fixed
- **Holiday Recipe Loading** - Fixed recipe IDs being returned as numbers instead of strings
  - Backend now ensures all recipe IDs from search results are strings
  - Resolves "Failed to fetch recipe" errors when clicking holiday recipes
  - Applies to New Year's recipes and all future holiday recipe sections

## [1.1.1] - 2025-12-07

### Fixed
- Holiday recipe detail loading (initial attempt)

## [1.1.0] - 2025-12-07

### Added
- **Referral System** - Complete refer-and-earn functionality
  - Unique referral code generation for each user
  - Dedicated Referral Screen with stats dashboard
  - "Refer & Earn" menu item in Profile
  - One-tap copy and share functionality
  - Real-time referral tracking (total, completed, pending)
  - Points rewards: 50 points per signup
  - Access rewards: 1 month free per yearly subscription
  - Bonus rewards: 100 points for subscription purchases
  - Secure backend API with JWT authentication
  - Referral code validation system
  - Subscription purchase tracking

### Fixed
- Referral routes now use authentication tokens instead of URL parameters
- Improved error handling for referral operations
- Fixed TypeScript warnings in referral routes

### Changed
- Bumped version from 1.0.39 to 1.1.0 (major feature release)
- Enhanced user profile with referral access

## [1.0.39] - 2025-12-07

### Fixed
- Referral system backend integration
- Authentication middleware for referral endpoints

## [1.0.38] - 2025-12-07

### Added
- Refer & Earn menu item in Profile screen
- Navigation route for Referral Screen

## [1.0.37] - 2025-12-07

### Added
- Initial Referral Screen UI implementation

## [1.0.36] - 2025-12-07

### Fixed
- Subscription payment system - removed canOpenURL check
- Stripe checkout now opens correctly in browser
- Trending and seasonal recipes now load details properly
- Recipe ID formatting for FatSecret API
- Meal type filters (Breakfast, Lunch, Dinner, Snack)
- Recipe rating and collections (500 errors resolved)
- User ID type handling for recipe enhancements

### Changed
- Updated all recipe attributions to FatSecret Platform API
- Removed outdated MealDB references

## [1.0.20] - 2025-11-20

### Added
- Live data integration for Admin Dashboard
- Real-time user statistics and active users tracking
- Pull-to-refresh functionality on Admin Dashboard
- Pull-to-refresh functionality on Profile screen
- Color-coded debug logging for admin features

### Fixed
- Admin dashboard now displays real backend data
- Improved data synchronization across screens
- Better error handling for data loading

### Changed
- Admin tab moved to dedicated bottom navigation tab
- Simplified admin navigation flow

## [1.0.19] - 2025-11-19

### Changed
- Refactored admin access to use dedicated tab instead of nested navigation
- Improved reliability of admin dashboard access

## [1.0.16] - 2025-11-18

### Fixed
- Admin parent navigation issues
- Role-based access control

## [1.0.29] - 2025-11-28

### Added
- Automatic seasonal recipe fetching from Spoonacular API
- Seasonal recipes now display by default regardless of ingredients
- Season-specific recipe tags (spring, summer, fall, winter)

### Fixed
- Seasonal tab no longer shows empty results
- Added node-fetch import for API calls in backend

### Changed
- Seasonal recipes automatically fetch from Spoonacular when database is empty
- Improved seasonal recipe display with images and cooking times

## [Unreleased]

### Added
- Initial project setup
