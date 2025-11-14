import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

interface PointsTransaction {
  id: string;
  points: number;
  action: string;
  description: string;
  dateCreated: Date;
}

interface Props {
  transactions: PointsTransaction[];
  loading?: boolean;
}

export const PointsHistory: React.FC<Props> = ({
  transactions,
  loading = false
}) => {
  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      'recipe_view': '👀',
      'recipe_favorite': '❤️',
      'recipe_rating': '⭐',
      'recipe_review': '📝',
      'recipe_share': '📤',
      'shopping_list_complete': '✅',
      'daily_login': '📅',
      'profile_complete': '👤',
      'referral_signup': '🎁'
    };
    return icons[action] || '🎯';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const renderTransaction = ({ item }: { item: PointsTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Text style={styles.actionIcon}>{getActionIcon(item.action)}</Text>
        <View style={styles.transactionInfo}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.date}>{formatDate(item.dateCreated)}</Text>
        </View>
      </View>
      <Text style={[
        styles.points,
        item.points > 0 ? styles.positivePoints : styles.negativePoints
      ]}>
        {item.points > 0 ? '+' : ''}{item.points}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>No activity yet</Text>
      <Text style={styles.emptyText}>
        Start using the app to earn points!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Points History</Text>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Points History</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
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
  },
  list: {
    maxHeight: 300,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positivePoints: {
    color: '#4CAF50',
  },
  negativePoints: {
    color: '#f44336',
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