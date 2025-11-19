import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';

const CoFounderWelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [sound, setSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicLoaded, setMusicLoaded] = useState(false);

  useEffect(() => {
    // Enable playback in silence mode
    Sound.setCategory('Playback');

    // Load the music file
    const music = new Sound('briana_song.mp3', Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.log('Failed to load the sound', error);
        return;
      }
      setMusicLoaded(true);
      setSound(music);
      // Auto-play when loaded
      music.play(success => {
        if (success) {
          setIsPlaying(false);
          music.setCurrentTime(0); // Reset to beginning
        }
      });
      setIsPlaying(true);
    });

    // Cleanup
    return () => {
      if (sound) {
        sound.release();
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!sound) return;

    if (isPlaying) {
      sound.pause();
      setIsPlaying(false);
    } else {
      sound.play(success => {
        if (success) {
          setIsPlaying(false);
          sound.setCurrentTime(0);
        }
      });
      setIsPlaying(true);
    }
  };

  const handleContinue = async () => {
    // Stop music before leaving
    if (sound) {
      sound.stop();
      sound.release();
    }
    // Mark that we've shown the welcome screen (only on first visit)
    const hasShown = await AsyncStorage.getItem('cofounder_welcome_shown');
    if (!hasShown) {
      await AsyncStorage.setItem('cofounder_welcome_shown', 'true');
    }
    // Go back to previous screen (or navigate to Main if this is first visit)
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.heart}>💕</Text>
            <Text style={styles.title}>Welcome Home, Briana!</Text>
          </View>

          <View style={styles.letterContainer}>
            <Text style={styles.paragraph}>
              This is all because of you - and you're so much more than just the
              inspiration behind Cook Smart.
            </Text>

            <Text style={styles.paragraph}>
              You've changed my life in ways I don't say out loud nearly enough.
              You're not just my partner - you're my best friend, my voice of
              reason, and the person who makes every day better just by being in
              it.
            </Text>

            <Text style={styles.paragraph}>
              Watching you as a mother has shown me what unconditional love
              really looks like. The way you nurture, protect, and guide with
              such grace and strength - it's beautiful and inspiring every
              single day.
            </Text>

            <Text style={styles.paragraph}>
              Being out on the road, mile after mile, I think about you
              constantly. Every sunset I see through the windshield, I wish you
              were there to share it. Every truck stop, every lonely night in
              the cab - I'm counting down until I can come home to you and the
              kids.
            </Text>

            <Text style={styles.paragraph}>
              This app journey isn't just about building something successful.
              It's about building a future where I don't have to choose between
              providing for our family and being present for the moments that
              matter. Where I can be there for bedtime stories, morning coffee
              with you, and all the little moments I'm missing now.
            </Text>

            <Text style={styles.paragraph}>
              You see solutions where others see problems. That conversation
              about recipe apps wasn't just frustration - it was your brilliant
              mind identifying what millions of people needed. Your insight that
              people need recipes for the real world is now helping families
              everywhere.
            </Text>

            <Text style={styles.paragraph}>
              I love your intelligence, your heart, your strength, and how you
              hold everything together when I can't be there.
            </Text>

            <Text style={styles.paragraphBold}>
              Welcome to Cook Smart, Co-Founder. This is our chance to build the
              life we both dream of.
            </Text>

            <Text style={styles.signature}>
              All my love from wherever these wheels take me,{'\n'}
              [Your name]
            </Text>

            <Text style={styles.postscript}>
              P.S. - Maybe someday soon, I won't have to end messages with "from
              the road."
            </Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              👑 CO-FOUNDER - LIFETIME ACCESS
            </Text>
          </View>

          {musicLoaded && (
            <TouchableOpacity style={styles.musicButton} onPress={toggleMusic}>
              <Text style={styles.musicButtonText}>
                {isPlaying ? '⏸️ Pause Music' : '▶️ Play Music'}
              </Text>
              <Text style={styles.songInfo}>A special song for you 💕</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              Continue to Cook Smart 🍳
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  heart: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#BE123C',
    textAlign: 'center',
  },
  letterContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paragraph: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
    marginBottom: 20,
    textAlign: 'left',
  },
  paragraphBold: {
    fontSize: 17,
    fontWeight: '600',
    color: '#BE123C',
    lineHeight: 26,
    marginBottom: 24,
    marginTop: 8,
    textAlign: 'left',
  },
  signature: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  postscript: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#D97706',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  musicButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  musicButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songInfo: {
    color: '#E9D5FF',
    fontSize: 13,
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: '#BE123C',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#BE123C',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default CoFounderWelcomeScreen;
