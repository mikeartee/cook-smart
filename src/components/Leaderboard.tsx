import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  totalPoints: number;
  level: number;
}

interface Props {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  loading?: boolean;
}

export const Leaderboard: React.FC<Props> = ({
  entries,
  currentUserId,
  loading = false
}) => {
  const getLevelIcon = (level: number) => {
    const icons = ['🥄', '👨🍳', '👩🍳', '🔥', '⭐', '👑'];
    return icons[level] || '🥄';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const renderEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1;
    const isCurrentUser = item.userId === currentUserId;

    return (
      <View style={[
        styles.entryItem,
        isCurrentUser && styles.currentUserItem
      ]}>
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rank,
            rank <= 3 && styles.topRank
          ]}>
            {getRankIcon(rank)}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[
              styles.username,
              isCurrentUser && styles.currentUserText
            ]}>
              {item.username}
            </Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelIcon}>{getLevelIcon(item.level)}</Text>
              <Text style={styles.levelText}>Level {item.level}</Text>
            </View>
          </View>
        </View>
        
        <Text style={[
          styles.points,
          isCurrentUser && styles.currentUserPoints
        ]}>
          {item.totalPoints}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🏆</Text>
      <Text style={styles.emptyTitle}>No rankings yet</Text>
      <Text style={styles.emptyText}>
        Be the first to earn points!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Leaderboard</Text>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.userId}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    maxHeight: 400,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentUserItem: {
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderBottomColor: 'transparent',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  topRank: {
    fontSize: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  currentUserText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  levelText: {
    fontSize: 12,
    color: '#666',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  currentUserPoints: {
    color: '#2E7D32',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});