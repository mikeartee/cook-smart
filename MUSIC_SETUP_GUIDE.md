# Music Setup Guide for Welcome Screens

## Current Status
The welcome screens are ready but need music files to play audio.

## Required Files
You need to add two MP3 files:
1. `briana_song.mp3` - For Briana's Co-Founder welcome screen
2. `mom_song.mp3` - For Mom's special user welcome screen

## Where to Place the Files

### Android
Place both MP3 files in:
```
android/app/src/main/res/raw/
```

**Important Notes:**
- File names MUST be lowercase
- File names MUST NOT contain spaces or special characters
- Only use letters, numbers, and underscores
- The `raw` folder already exists

### iOS (if you build for iOS later)
Place both MP3 files in:
```
ios/CookSmart/
```
Then add them to the Xcode project.

## Steps to Add Music

1. **Get your MP3 files ready**
   - Name them exactly: `briana_song.mp3` and `mom_song.mp3`
   - Keep file sizes reasonable (under 5MB each is good)

2. **Copy to Android**
   ```bash
   # From your project root
   copy path\to\your\briana_song.mp3 android\app\src\main\res\raw\
   copy path\to\your\mom_song.mp3 android\app\src\main\res\raw\
   ```

3. **Rebuild the app**
   ```bash
   cd android
   .\gradlew clean
   cd ..
   npx react-native run-android
   ```

## How It Works

When the welcome screens load:
- ✅ Music will auto-play when the screen appears
- ✅ Users can pause/play with the music button
- ✅ Music stops when they continue to the app
- ✅ If files are missing, the screen still works (just no music)

## Testing

After adding the files and rebuilding:
1. Log in as Briana (brianaolszewski1@gmail.com) - should hear her song
2. Log in as Mom (dwoodswoods2@gmail.com) - should hear her song
3. Check the console logs for "Music loaded successfully!" or error messages

## Troubleshooting

**No music plays:**
- Check file names are exactly `briana_song.mp3` and `mom_song.mp3`
- Verify files are in `android/app/src/main/res/raw/`
- Rebuild the app completely (clean build)
- Check React Native logs for error messages

**Music cuts off or doesn't loop:**
- This is expected - songs play once through
- Users can replay using the music button

**Want to change the songs later:**
- Just replace the MP3 files in the raw folder
- Rebuild the app
