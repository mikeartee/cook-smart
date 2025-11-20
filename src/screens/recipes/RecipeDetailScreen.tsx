import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRecipes} from '../../contexts/RecipeContext';
import {useIngredients} from '../../contexts/IngredientContext';
import {RecipeDetails} from '../../services/recipeService';
import {shoppingListService} from '../../services/shoppingListService';

interface RecipeDetailScreenProps {
  route: any;
  navigation: any;
}

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const {recipeId} = route.params;
  const {getRecipeDetails, saveRecipe, isRecipeSaved, deleteSavedRecipe} =
    useRecipes();
  const {ingredients} = useIngredients();

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState<number>(1);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);

  useEffect(() => {
    loadRecipe();
    checkIfSaved();
    loadUserIngredients();
  }, [recipeId]);

  const loadUserIngredients = () => {
    // Extract ingredient names from user's pantry
    const ingredientNames = ingredients
      .filter(ing => ing.name)
      .map(ing => ing.name!.toLowerCase().trim());
    setUserIngredients(ingredientNames);
  };

  const hasIngredient = (ingredientName: string): boolean => {
    let searchName = ingredientName.toLowerCase().trim();

    // Remove measurements (e.g., "1 cup flour" -> "flour")
    searchName = searchName.replace(/^[\d.\/\s]+/g, '').trim();

    // Remove units (cup, tbsp, oz, etc.)
    searchName = searchName
      .replace(/^(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l)\s+/i, '')
      .trim();

    // Check if user has this ingredient (smart matching that preserves types)
    const {ingredientsMatch} = require('../../utils/ingredientMatcher');
    return userIngredients.some(userIng => {
      return ingredientsMatch(searchName, userIng);
    });
  };

  const addMissingToShoppingList = async () => {
    if (!recipe) return;

    try {
      // Get missing ingredients with parsed quantities (TheMealDB format only)
      const missingIngredients: Array<{
        ingredient: string;
        quantity: string;
        unit: string;
      }> = [];

      if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ing => {
          if (!hasIngredient(ing)) {
            // Parse ingredient string to extract name, quantity, and unit
            const parts = ing.match(/^([\d./\s]+)?\s*(\w+)?\s*(.+)$/);
            missingIngredients.push({
              ingredient: parts?.[3] || ing,
              quantity: parts?.[1]?.trim() || '1',
              unit: parts?.[2] || '',
            });
          }
        });
      }

      if (missingIngredients.length === 0) {
        Alert.alert(
          'All Set!',
          'You have all the ingredients for this recipe!',
        );
        return;
      }

      // Add items to shopping list via API
      await shoppingListService.addItems(
        missingIngredients.map(item => ({
          ingredient: item.ingredient,
          quantity: item.quantity,
          unit: item.unit,
          category: 'other',
          recipeId: recipe.id.toString(),
        })),
      );

      Alert.alert(
        'Added to Shopping List',
        `${missingIngredients.length} missing ingredient(s) added to your shopping list.`,
      );
    } catch (err) {
      console.error('Error adding to shopping list:', err);
      Alert.alert('Error', 'Failed to add ingredients to shopping list');
    }
  };

  const loadRecipe = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await getRecipeDetails(recipeId);
      setRecipe(details);
      setServings(details.servings); // Set initial servings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const adjustServings = (newServings: number) => {
    if (newServings < 1) return;
    setServings(newServings);
  };

  const getScaledAmount = (original: string): string => {
    if (!recipe || servings === recipe.servings) return original;
    const scale = servings / recipe.servings;

    // Try to extract number from the beginning of the string
    const match = original.match(/^([\d.\/\s]+)/);
    if (match) {
      const numStr = match[1].trim();
      // Handle fractions like "1/2"
      if (numStr.includes('/')) {
        const parts = numStr.split('/');
        if (parts.length === 2) {
          const num = parseFloat(parts[0]?.trim() || '0');
          const denom = parseFloat(parts[1]?.trim() || '1');
          if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
            const scaled = (num / denom) * scale;
            const rest = original.substring(match[0].length);
            // Format nicely - show fractions if possible
            if (scaled < 1 && scaled > 0) {
              return `${scaled.toFixed(2)} ${rest}`;
            }
            return `${Math.round(scaled * 100) / 100} ${rest}`;
          }
        }
      }
      // Handle regular numbers
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        const scaled = num * scale;
        const rest = original.substring(match[0].length);
        return `${Math.round(scaled * 100) / 100} ${rest}`;
      }
    }
    return original;
  };

  const checkIfSaved = async () => {
    try {
      const saved = await isRecipeSaved(recipeId);
      setIsSaved(saved);
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const handleSave = async () => {
    if (!recipe) return;

    try {
      if (isSaved) {
        await deleteSavedRecipe(recipeId);
        setIsSaved(false);
        Alert.alert('Success', 'Recipe removed from saved recipes');
      } else {
        await saveRecipe(recipe);
        setIsSaved(true);
        Alert.alert('Success', 'Recipe saved successfully!');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save recipe',
      );
    }
  };

  const handleOpenSource = () => {
    if (recipe?.sourceUrl) {
      Linking.openURL(recipe.sourceUrl);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error || 'Recipe not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRecipe}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Icon
            name={isSaved ? 'favorite' : 'favorite-border'}
            size={24}
            color={isSaved ? '#EF4444' : '#374151'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        <Image source={{uri: recipe.image}} style={styles.image} />

        {/* Recipe Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="schedule" size={20} color="#10B981" />
              <Text style={styles.statText}>{recipe.readyInMinutes} min</Text>
            </View>
            {recipe.cuisines.length > 0 && (
              <View style={styles.statItem}>
                <Icon name="public" size={20} color="#10B981" />
                <Text style={styles.statText}>{recipe.cuisines[0]}</Text>
              </View>
            )}
          </View>

          {/* Servings Adjuster */}
          <View style={styles.servingsContainer}>
            <Text style={styles.servingsLabel}>Servings:</Text>
            <View style={styles.servingsControls}>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(servings - 1)}
                disabled={servings <= 1}>
                <Icon
                  name="remove"
                  size={20}
                  color={servings <= 1 ? '#D1D5DB' : '#10B981'}
                />
              </TouchableOpacity>
              <Text style={styles.servingsValue}>{servings}</Text>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(servings + 1)}>
                <Icon name="add" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
            {servings !== recipe.servings && (
              <TouchableOpacity onPress={() => setServings(recipe.servings)}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Provider Attribution */}
          {recipe.provider && (
            <View style={styles.providerBadge}>
              <Icon name="info-outline" size={14} color="#8B5CF6" />
              <Text style={styles.providerText}>Recipe from TheMealDB</Text>
            </View>
          )}

          {/* Summary */}
          {recipe.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.summaryText}>
                {stripHtml(recipe.summary)}
              </Text>
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ingredient: string, index: number) => {
                const haveIt = hasIngredient(ingredient);
                return (
                  <View key={index} style={styles.ingredientItem}>
                    <Icon
                      name={haveIt ? 'check-circle' : 'cancel'}
                      size={16}
                      color={haveIt ? '#10B981' : '#EF4444'}
                    />
                    <Text
                      style={[
                        styles.ingredientText,
                        haveIt && styles.ingredientHave,
                      ]}>
                      {getScaledAmount(ingredient)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noInstructionsText}>
                No ingredients available
              </Text>
            )}

            {/* Add Missing Ingredients Button */}
            <TouchableOpacity
              style={styles.shoppingListButton}
              onPress={addMissingToShoppingList}>
              <Icon name="add-shopping-cart" size={20} color="#10B981" />
              <Text style={styles.shoppingListButtonText}>
                Add Missing Ingredients to Shopping List
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions ? (
              <Text style={styles.instructionsText}>
                {stripHtml(recipe.instructions)}
              </Text>
            ) : (
              <Text style={styles.noInstructionsText}>
                No instructions available. View original recipe for details.
              </Text>
            )}
          </View>

          {/* Source Link */}
          {recipe.sourceUrl && (
            <TouchableOpacity
              style={styles.sourceButton}
              onPress={handleOpenSource}>
              <Icon name="open-in-new" size={20} color="#10B981" />
              <Text style={styles.sourceButtonText}>View Original Recipe</Text>
            </TouchableOpacity>
          )}

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#E5E7EB',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 16,
  },
  servingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  servingsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  providerText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingLeft: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  ingredientHave: {
    color: '#059669',
    fontWeight: '500',
  },
  shoppingListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  shoppingListButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  noInstructionsText: {
    fontSize: 15,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  sourceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
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
  bottomPadding: {
    height: 32,
  },
});
