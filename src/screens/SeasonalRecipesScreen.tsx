import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import advancedRecipeService from '../services/advancedRecipeService';

export default function SeasonalRecipesScreen({navigation}: any) {
  const [season, setSeason] = useState('');
  const [recipes, setRecipes] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSeasonalRecipes();
  }, []);

  const loadSeasonalRecipes = async () => {
    try {
      const response = await advancedRecipeService.getCurrentSeasonalRecipes();
      if (response.success && response.recipes) {
        setSeason(response.season);

        // Recipes from FatSecret cache have full details
        setRecipes(
          response.recipes.map((item: any) => ({
            id: item.recipe_id || item.id, // Use FatSecret recipe_id for navigation
            title: item.title || item.recipe_name || 'Seasonal Recipe',
            image: item.image_url || item.image,
            readyInMinutes: item.ready_in_minutes || item.readyInMinutes,
            servings: item.servings,
            calories: item.nutrition?.calories,
            // Rating aggregates surfaced from recipe_cache by the trending pipeline
            // (slice #5). May be missing on older cache rows; renderRecipe handles
            // that gracefully by hiding the chip when count is 0 / undefined.
            rating_average: item.rating_average,
            rating_count: item.rating_count,
          })),
        );
      }
    } catch (error) {
      console.error('Error loading seasonal recipes:', error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSeasonalRecipes();
    setRefreshing(false);
  };

  const getSeasonIcon = () => {
    switch (season) {
      case 'spring':
        return '🌸';
      case 'summer':
        return '☀️';
      case 'fall':
        return '🍂';
      case 'winter':
        return '❄️';
      default:
        return '🍽️';
    }
  };

  const renderRecipe = ({item}: any) => {
    // Per slice #6 / PRD #1: render the rating chip only when at least one
    // rating exists. Avoid showing "0.0 stars" for unrated recipes.
    const ratingAverage =
      typeof item.rating_average === 'number'
        ? item.rating_average
        : typeof item.rating_average === 'string'
          ? parseFloat(item.rating_average)
          : NaN;
    const ratingCount =
      typeof item.rating_count === 'number'
        ? item.rating_count
        : typeof item.rating_count === 'string'
          ? parseInt(item.rating_count, 10)
          : 0;
    const showRating = Number.isFinite(ratingAverage) && ratingCount > 0;

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() =>
          navigation.navigate('RecipeDetail', {recipeId: item.id})
        }>
        {item.image && (
          <Image source={{uri: item.image}} style={styles.recipeImage} />
        )}
        <View style={styles.recipeContent}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
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
          {item.readyInMinutes && (
            <View style={styles.timeContainer}>
              <Icon name="schedule" size={16} color="#666" />
              <Text style={styles.timeText}>{item.readyInMinutes} min</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.seasonEmoji}>{getSeasonIcon()}</Text>
        <Text style={styles.seasonTitle}>
          {season.charAt(0).toUpperCase() + season.slice(1)} Recipes
        </Text>
        <Text style={styles.seasonSubtitle}>
          Perfect recipes for this season
        </Text>
      </View>

      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No seasonal recipes yet</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        alwaysBounceVertical={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  seasonEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  seasonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  seasonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 200,
  },
  recipeContent: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
