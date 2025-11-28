# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
