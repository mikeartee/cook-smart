import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  visible: boolean;
  badgeName: string;
  badgeIcon: string;
  badgeDescription: string;
  onClose: () => void;
}

export default function AchievementUnlockModal({
  visible,
  badgeName,
  badgeIcon,
  badgeDescription,
  onClose,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{scale: scaleAnim}],
              opacity: fadeAnim,
            },
          ]}>
          <View style={styles.header}>
            <Icon name="emoji-events" size={32} color="#FFD93D" />
            <Text style={styles.title}>Achievement Unlocked!</Text>
          </View>

          <View style={styles.badgeContainer}>
            <View style={styles.badgeIcon}>
              <Text style={styles.badgeEmoji}>{badgeIcon}</Text>
            </View>
            <Text style={styles.badgeName}>{badgeName}</Text>
            <Text style={styles.badgeDescription}>{badgeDescription}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD93D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeEmoji: {
    fontSize: 48,
  },
  badgeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
