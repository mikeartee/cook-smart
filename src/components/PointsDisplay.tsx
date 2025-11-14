import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface UserPoints {
  totalPoints: number;
  level: number;
}

interface Props {
  userPoints: UserPoints;
  onPress?: () => void;
  compact?: boolean;
}

export const PointsDisplay: React.FC<Props> = ({
  userPoints,
  onPress,
  compact = false
}) => {
  const getLevelInfo = (level: number) => {
    const levels = [
      { name: 'Beginner', icon: '🥄', minPoints: 0, maxPoints: 99 },
      { name: 'Home Cook', icon: '👨‍🍳', minPoints: 100, maxPoints: 499 },
      { name: 'Chef', icon: '👩‍🍳', minPoints: 500, maxPoints: 1999 },
      { name: 'Master Chef', icon: '🔥', minPoints: 2000, maxPoints: 4999 },
      { name: 'Culinary Expert', icon: '⭐', minPoints: 5000, maxPoints: 9999 },
      { name: 'Kitchen Legend', icon: '👑', minPoints: 10000, maxPoints: Infinity }
    ];
    return levels[level] || levels[0];
  };

  const getProgressToNextLevel = () => {
    const currentLevel = getLevelInfo(userPoints.level);
    const nextLevel = getLevelInfo(userPoints.level + 1);
    
    if (currentLevel.maxPoints === Infinity) {
      return { progress: 1, pointsNeeded: 0 };
    }
    
    const pointsInCurrentLevel = userPoints.totalPoints - currentLevel.minPoints;
    const pointsNeededForLevel = nextLevel.minPoints - currentLevel.minPoints;
    const progress = pointsInCurrentLevel / pointsNeededForLevel;
    const pointsNeeded = nextLevel.minPoints - userPoints.totalPoints;
    
    return { progress: Math.min(progress, 1), pointsNeeded: Math.max(pointsNeeded, 0) };
  };

  const levelInfo = getLevelInfo(userPoints.level);
  const { progress, pointsNeeded } = getProgressToNextLevel();

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onPress}>
        <Text style={styles.compactIcon}>{levelInfo.icon}</Text>
        <Text style={styles.compactPoints}>{userPoints.totalPoints}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelIcon}>{levelInfo.icon}</Text>
          <View>
            <Text style={styles.levelName}>{levelInfo.name}</Text>
            <Text style={styles.levelNumber}>Level {userPoints.level}</Text>
          </View>
        </View>
        <Text style={styles.totalPoints}>{userPoints.totalPoints} pts</Text>
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        {pointsNeeded > 0 ? (
          <Text style={styles.progressText}>
            {pointsNeeded} points to next level
          </Text>
        ) : (
          <Text style={styles.progressText}>Max level reached!</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  compactPoints: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  levelNumber: {
    fontSize: 12,
    color: '#666',
  },
  totalPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});