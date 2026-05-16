import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import socialService from '../services/socialService';

export default function TrendingRecipesScreen({navigation}: any) {
  const [trending, setTrending] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const response = await socialService.getTrendingRecipes();
      if (response.success && response.recipes) {
        // The API returns recipes directly
        setTrending(response.recipes);
      }
    } catch (error) {
      console.error('Error loading trending:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrending();
    setRefreshing(false);
  };

  const renderTrending = ({item}: {item: any}) => {
    // The API now returns recipes directly, not trending items with recipe references
    const recipe = item;
    if (!recipe) return null;

    // Per slice #6 / PRD #1: render the rating chip only when at least one
    // rating exists. Avoid showing "0.0 stars" for unrated recipes.
    const ratingAverage =
      typeof recipe.rating_average === 'number'
        ? recipe.rating_average
        : typeof recipe.rating_average === 'string'
          ? parseFloat(recipe.rating_average)
          : NaN;
    const ratingCount =
      typeof recipe.rating_count === 'number'
        ? recipe.rating_count
        : typeof recipe.rating_count === 'string'
          ? parseInt(recipe.rating_count, 10)
          : 0;
    const showRating = Number.isFinite(ratingAverage) && ratingCount > 0;

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() =>
          navigation.navigate('RecipeDetail', {
            recipeId: recipe.recipe_id || recipe.id,
          })
        }>
        {(recipe.recipe_image || recipe.image_url || recipe.image) && (
          <Image
            source={{
              uri: recipe.recipe_image || recipe.image_url || recipe.image,
            }}
            style={styles.recipeImage}
          />
        )}
        <View style={styles.recipeContent}>
          <Text style={styles.recipeTitle}>
            {recipe.title || recipe.recipe_name || 'Untitled Recipe'}
          </Text>
          {showRating && (
            <View
              style={styles.ratingChip}
              accessibilityLabel={`Rated ${ratingAverage.toFixed(1)} out of 5 stars from ${ratingCount} ${
                ratingCount === 1 ? 'rating' : 'ratings'
              }`}>
              <Icon name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingValue}>{ratingAverage.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({ratingCount})</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="schedule" size={16} color="#10B981" />
              <Text style={styles.statText}>
                {recipe.ready_in_minutes || recipe.readyInMinutes || '--'} min
              </Text>
            </View>
            <View style={styles.stat}>
              <Icon name="restaurant" size={16} color="#3B82F6" />
              <Text style={styles.statText}>
                {recipe.servings || '--'} servings
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Icon name="trending-up" size={20} color="#10B981" />
          <Text style={styles.scoreText}>Popular</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={trending}
        renderItem={renderTrending}
        keyExtractor={(item: any) =>
          item.recipe_id || item.id || Math.random().toString()
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="trending-up" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No trending recipes yet</Text>
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
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  recipeImage: {
    width: 100,
    height: 100,
  },
  recipeContent: {
    flex: 1,
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  ratingCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
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
});
