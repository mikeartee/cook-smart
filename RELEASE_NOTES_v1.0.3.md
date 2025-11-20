# Cook Smart v1.0.3 - Release Notes
**Release Date:** November 20, 2025

## 🎵 New Features

### Special Welcome Screens with Music
- **Co-Founder Welcome Screen** - Personalized welcome for Briana with custom music and heartfelt message
- **Special User Welcome Screen** - Personalized welcome for Mom with custom music and personal message
- Music auto-plays when special users log in
- Pause/play controls for music playback
- Lifetime access badges for special users

### User Account Management
- Created special user accounts with database flags:
  - `is_co_founder` flag for co-founder access
  - `is_special_user` flag for special user access
- Automatic routing to special welcome screens on first login

## 🔧 Technical Improvements

### Audio Integration
- Integrated `react-native-sound` library for audio playback
- Added MP3 files to Android resources (raw folder)
- Implemented proper audio lifecycle management (play, pause, stop, release)
- Added error handling for missing audio files
- Enabled playback in silence mode

### Code Quality
- Better error logging for audio playback issues
- Improved cleanup on component unmount
- Fixed dependency arrays in useEffect hooks
- Added console logging for debugging audio issues

### Database Updates
- Added `is_special_user` column to users table
- Created migration scripts for user account setup
- Implemented password hashing with bcrypt
- Set up special user accounts with proper flags

## 📦 Build Information
- **APK Size:** 113 MB (increased from 103 MB due to audio files)
- **Audio Files Included:**
  - `briana_song.mp3` (5.3 MB)
  - `mom_song.mp3` (3.9 MB)

## 🐛 Bug Fixes
- Fixed music not playing on welcome screens
- Improved audio error handling to prevent crashes
- Fixed cleanup issues with audio resources

## 📝 Notes
- Welcome screens only show on first login for special users
- Music can be controlled with pause/play button
- All previous features and fixes from v1.0.2 are included
- Special user flags are permanent and stored in database

## 🔐 Special Users
- **Briana** (brianaolszewski1@gmail.com) - Co-Founder access
- **Mom** (dwoodswoods2@gmail.com) - Special user access with temporary password

---

## Previous Version (v1.0.2) Features Included:
- Shopping list fixes
- Ingredient inventory improvements
- Recipe search enhancements
- All core functionality
