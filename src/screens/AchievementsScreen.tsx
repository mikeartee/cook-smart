import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import achievementService, {Achievement} from '../services/achievementService';

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const [earned, progressData] = await Promise.all([
        achievementService.getUserAchievements(),
        achievementService.getAchievementProgress(),
      ]);
      setAchievements(earned);
      setProgress(progressData);
    } catch (_error) {
      console.error('Failed to load achievements:', _error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (type: string): string => {
    const icons: {[key: string]: string} = {
      first_recipe: '🎉',
      recipe_explorer: '🍽️',
      waste_warrior: '♻️',
      week_streak: '🔥',
      scanner_pro: '📱',
      stocked_kitchen: '🏪',
    };
    return icons[type] || '🏆';
  };

  const getBadgeColor = (type: string): string => {
    const colors: {[key: string]: string} = {
      first_recipe: '#FF6B6B',
      recipe_explorer: '#4ECDC4',
      waste_warrior: '#95E1D3',
      week_streak: '#FFD93D',
      scanner_pro: '#A8E6CF',
      stocked_kitchen: '#FFB6B9',
    };
    return colors[type] || '#ccc';
  };

  const renderBadge = (achievement: Achievement) => (
    <TouchableOpacity
      key={achievement.id}
      style={[
        styles.badgeCard,
        {borderColor: getBadgeColor(achievement.badge_type)},
      ]}>
      <View
        style={[
          styles.badgeIcon,
          {backgroundColor: getBadgeColor(achievement.badge_type)},
        ]}>
        <Text style={styles.badgeEmoji}>
          {getBadgeIcon(achievement.badge_type)}
        </Text>
      </View>
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeName}>{achievement.badge_name}</Text>
        <Text style={styles.badgeDescription}>
          {achievement.badge_description}
        </Text>
        <Text style={styles.badgeDate}>
          Earned {new Date(achievement.earned_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderProgressBadge = (type: string, data: any) => {
    const current = data?.current || 0;
    const target = data?.target || 1;
    const percentage = Math.min((current / target) * 100, 100);
    const isEarned = achievements.some(a => a.badge_type === type);

    if (isEarned) return null;

    return (
      <View
        key={type}
        style={[
          styles.progressCard,
          {borderColor: getBadgeColor(type), opacity: 0.6},
        ]}>
        <View
          style={[styles.badgeIcon, {backgroundColor: getBadgeColor(type)}]}>
          <Text style={styles.badgeEmoji}>{getBadgeIcon(type)}</Text>
        </View>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeName}>{data?.name || 'Badge'}</Text>
          <Text style={styles.badgeDescription}>{data?.description}</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: getBadgeColor(type),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {current} / {target}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={48} color="#FFD93D" />
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>
          {achievements.length} badge{achievements.length !== 1 ? 's' : ''}{' '}
          earned
        </Text>
      </View>

      {achievements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Earned Badges</Text>
          {achievements.map(renderBadge)}
        </View>
      )}

      {progress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 In Progress</Text>
          {Object.entries(progress).map(([type, data]) =>
            renderProgressBadge(type, data),
          )}
        </View>
      )}

      {achievements.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No badges yet</Text>
          <Text style={styles.emptySubtext}>
            Start cooking to earn your first achievement!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  badgeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  badgeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  badgeDate: {
    fontSize: 12,
    color: '#999',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
