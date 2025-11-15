# 🎵 TODO: Add Music to Briana's Welcome Screen

## ⚠️ REMINDER: This feature needs to be implemented with pure React Native

### Current Status:
❌ Removed expo-av (to keep app Expo-free)
❌ Need to implement with react-native-track-player or similar
❌ Need to purchase "Forever After All" by Luke Combs
❌ Need to add the MP3 file to the project

### What Needs to Be Done:
1. Install pure React Native audio library (react-native-track-player recommended)
2. Implement music player code
3. Purchase and add the song file
4. Test on device

---

## Quick Steps to Complete:

### 1. Purchase the Song ($1.29)

**Try these options:**

**Option A: iTunes (Recommended)**
- Download iTunes from Microsoft Store
- Search "Forever After All Luke Combs"
- Buy for $1.29
- Downloads as MP3 automatically

**Option B: Amazon Music**
- Go to: https://www.amazon.com/Forever-After-All/dp/B08JLQWZ9V
- Look for "Buy MP3" button
- Download after purchase

**Option C: Google Play Music**
- Use on Android phone
- Search the song
- Purchase and download
- Transfer to PC via USB/email/Google Drive

**Option D: YouTube Music**
- Available on phone or web
- Search and purchase
- Download the file

### 2. Add File to Project

Once you have the MP3:
```
Place it here: assets/audio/forever-after-all.mp3
```

### 3. Update the Code

Open `src/screens/CoFounderWelcomeScreen.tsx` and:

**Find line ~28 (in loadAndPlaySound function):**
```javascript
const loadAndPlaySound = async () => {
  // Disabled - waiting for song purchase
  // See .kiro/TODO_ADD_MUSIC.md
  return;
};
```

**Replace with:**
```javascript
const loadAndPlaySound = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    const { sound: newSound } = await Audio.Sound.createAsync(
      require('../../assets/audio/forever-after-all.mp3'),
      { shouldPlay: true, isLooping: false, volume: 0.7 }
    );
    
    setSound(newSound);
    setIsPlaying(true);

    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
      }
    });
  } catch (error) {
    console.log('Error loading sound:', error);
  }
};
```

**Find line ~33 (togglePlayPause function):**
```javascript
const togglePlayPause = async () => {
  // Disabled - waiting for song purchase
  return;
};
```

**Replace with:**
```javascript
const togglePlayPause = async () => {
  if (!sound) return;

  try {
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  } catch (error) {
    console.log('Error toggling playback:', error);
  }
};
```

**Find line ~20 (useEffect):**
```javascript
useEffect(() => {
  // loadAndPlaySound(); // Disabled for now
```

**Change to:**
```javascript
useEffect(() => {
  loadAndPlaySound(); // Re-enabled!
```

### 4. Test It

```bash
npm start
```

Login as Briana and the music should play!

---

## Why This Matters

This is a special touch for Briana - having "Forever After All" play while she reads your heartfelt message will make the moment even more memorable. 💕

The code is ready, just needs the song file!

---

## Need Help?

If you're stuck on purchasing:
1. Ask me to help find the file if you've already downloaded it
2. I can help with alternative songs if Luke Combs doesn't work out
3. We can use a free romantic song as a temporary placeholder

**Don't forget to come back to this!** 🎵
