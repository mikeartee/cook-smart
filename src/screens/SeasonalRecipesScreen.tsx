import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import advancedRecipeService from '../services/advancedRecipeService';
import recipeService from '../services/recipeService';

export default function SeasonalRecipesScreen({navigation}: any) {
  const [season, setSeason] = useState('');
  const [recipes, setRecipes] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeasonalRecipes();
  }, []);

  const loadSeasonalRecipes = async () => {
    try {
      const response = await advancedRecipeService.getCurrentSeasonalRecipes();
      if (response.success) {
        setSeason(response.season);

        // Check if recipes already have full details (from API)
        if (response.recipes.length > 0 && response.recipes[0].title) {
          // Recipes already have details from API
          setRecipes(
            response.recipes.map((item: any) => ({
              id: item.recipe_id,
              title: item.title,
              image: item.image,
              readyInMinutes: item.readyInMinutes,
            })),
          );
        } else {
          // Load recipe details from database
          const recipeDetails = await Promise.all(
            response.recipes.map(async (item: any) => {
              const recipe = await recipeService.getRecipeById(item.recipe_id);
              return recipe;
            }),
          );
          setRecipes(recipeDetails.filter(r => r));
        }
      }
    } catch (error) {
      console.error('Error loading seasonal recipes:', error);
    }
    setLoading(false);
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

  const renderRecipe = ({item}: any) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', {recipeId: item.id})}>
      {item.image && (
        <Image source={{uri: item.image}} style={styles.recipeImage} />
      )}
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        {item.readyInMinutes && (
          <View style={styles.timeContainer}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.timeText}>{item.readyInMinutes} min</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
