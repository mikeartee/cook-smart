import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import socialService from '../services/socialService';

export default function CommunityFeedScreen({navigation}: any) {
  const [feed, setFeed] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const response = await socialService.getCommunityFeed();
      if (response.success) {
        setFeed(response.feed);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const renderActivity = ({item}: any) => {
    let icon = 'restaurant';
    let text = '';

    switch (item.activity_type) {
      case 'created_recipe':
        icon = 'add-circle';
        text = `${item.username} created a new recipe`;
        break;
      case 'liked_recipe':
        icon = 'favorite';
        text = `${item.username} liked a recipe`;
        break;
      case 'commented':
        icon = 'comment';
        text = `${item.username} commented on a recipe`;
        break;
      case 'followed_user':
        icon = 'person-add';
        text = `${item.username} followed someone`;
        break;
    }

    return (
      <TouchableOpacity
        style={styles.activityCard}
        onPress={() => {
          if (item.recipe_id) {
            navigation.navigate('RecipeDetail', {recipeId: item.recipe_id});
          }
        }}>
        <Icon name={icon} size={24} color="#10B981" />
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>{text}</Text>
          <Text style={styles.activityTime}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={feed}
        renderItem={renderActivity}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtext}>
              Follow users to see their activity
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
