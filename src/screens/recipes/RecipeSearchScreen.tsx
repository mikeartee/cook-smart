import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRecipes } from '../../contexts/RecipeContext';
import ingredientService from '../../services/ingredientService';
import { Recipe } from '../../services/recipeService';

interface RecipeSearchScreenProps {
  navigation: any;
}

export const RecipeSearchScreen: React.FC<RecipeSearchScreenProps> = ({ navigation }) => {
  const { recipes, isLoading, error, provider, searchRecipes } = useRecipes();
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Auto-search on mount
    handleSearch();
  }, []);

  // Re-search when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      handleSearch();
    });

    return unsubscribe;
  }, [navigation]);

  const handleSearch = async () => {
    try {
      console.log('🔍 Starting recipe search...');
      setHasSearched(true);
      
      // Get user's ingredients
      const response = await ingredientService.getUserIngredients();
      console.log('📦 Got ingredients:', response);
      
      if (!response || (!response.ingredients && !response.customIngredients)) {
        console.log('⚠️  No ingredients response');
        return;
      }
      
      const allIngredients = [
        ...(response.ingredients || []), 
        ...(response.customIngredients || [])
      ];
      
      if (allIngredients.length === 0) {
        console.log('⚠️  No ingredients found');
        return;
      }

      // Extract ingredient names
      const ingredientNames = allIngredients
        .map(ing => ing?.ingredient_name || ing?.name || '')
        .filter(name => name && name.length > 0);

      console.log('🥘 Ingredient names:', ingredientNames);

      if (ingredientNames.length === 0) {
        console.log('⚠️  No valid ingredient names');
        return;
      }

      // Search recipes
      console.log('🚀 Calling searchRecipes with:', ingredientNames);
      await searchRecipes(ingredientNames);
      console.log('✅ Search complete');
    } catch (err) {
      const errorMsg = err && typeof err === 'object' && 'message' in err 
        ? (err as Error).message 
        : 'Unknown error';
      console.error('❌ Search error:', errorMsg);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleSearch();
    setRefreshing(false);
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.image }} style={styles.recipeImage} />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon name="check-circle" size={16} color="#10B981" />
            <Text style={styles.statText}>{item.usedIngredientCount} have</Text>
          </View>
          <View style={styles.stat}>
            <Icon name="shopping-cart" size={16} color="#F59E0B" />
            <Text style={styles.statText}>{item.missedIngredientCount} need</Text>
          </View>
          <View style={styles.stat}>
            <Icon name="favorite" size={16} color="#EF4444" />
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
        </View>

        {item.missedIngredientCount > 0 && (
          <View style={styles.missingIngredientsContainer}>
            <Text style={styles.missingLabel}>Missing:</Text>
            <Text style={styles.missingText} numberOfLines={1}>
              {item.missedIngredients.map(ing => ing.name).join(', ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return null;
    }

    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Icon name="restaurant" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Finding Recipes...</Text>
          <Text style={styles.emptyText}>
            We're searching for recipes based on your ingredients
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Icon name="error-outline" size={64} color="#EF4444" />
          <Text style={styles.emptyTitle}>Oops!</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (recipes.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="search-off" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Recipes Found</Text>
          <Text style={styles.emptyText}>
            Add more ingredients to find recipes you can make!
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // Navigate to the Ingredients tab
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Ingredients');
              }
            }}
          >
            <Icon name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Ingredients</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Beta Label */}
      <View style={styles.betaBanner}>
        <Icon name="science" size={16} color="#8B5CF6" />
        <Text style={styles.betaText}>Beta - Recipe Database</Text>
        {provider && (
          <Text style={styles.providerText}>• {provider}</Text>
        )}
      </View>

      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {recipes.length > 0 
            ? `Found ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}`
            : 'Searching for recipes...'}
        </Text>
        <TouchableOpacity onPress={handleSearch} disabled={isLoading}>
          <Icon name="refresh" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Recipe List */}
      <FlatList
        data={recipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          recipes.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Loading Overlay */}
      {isLoading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Finding recipes...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  recipeInfo: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
  },
  missingIngredientsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  missingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  missingText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  betaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3E8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  betaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerText: {
    fontSize: 11,
    color: '#A78BFA',
    textTransform: 'capitalize',
  },
});
