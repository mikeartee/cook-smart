import React, { useState, useEffect } from 'react';
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
import { useRecipes } from '../../contexts/RecipeContext';
import { RecipeDetails } from '../../services/recipeService';

interface RecipeDetailScreenProps {
  route: any;
  navigation: any;
}

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({ route, navigation }) => {
  const { recipeId } = route.params;
  const { getRecipeDetails, saveRecipe, isRecipeSaved, deleteSavedRecipe } = useRecipes();
  
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecipe();
    checkIfSaved();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await getRecipeDetails(recipeId);
      setRecipe(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
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
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save recipe');
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Icon 
            name={isSaved ? "favorite" : "favorite-border"} 
            size={24} 
            color={isSaved ? "#EF4444" : "#374151"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        <Image source={{ uri: recipe.image }} style={styles.image} />

        {/* Recipe Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="schedule" size={20} color="#10B981" />
              <Text style={styles.statText}>{recipe.readyInMinutes} min</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="restaurant" size={20} color="#10B981" />
              <Text style={styles.statText}>{recipe.servings} servings</Text>
            </View>
            {recipe.cuisines.length > 0 && (
              <View style={styles.statItem}>
                <Icon name="public" size={20} color="#10B981" />
                <Text style={styles.statText}>{recipe.cuisines[0]}</Text>
              </View>
            )}
          </View>

          {/* Provider Attribution */}
          {recipe.provider && (
            <View style={styles.providerBadge}>
              <Icon name="info-outline" size={14} color="#8B5CF6" />
              <Text style={styles.providerText}>
                Recipe from {recipe.provider === 'edamam' ? 'Edamam' : recipe.provider === 'themealdb' ? 'TheMealDB' : recipe.provider}
              </Text>
            </View>
          )}

          {/* Summary */}
          {recipe.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.summaryText}>{stripHtml(recipe.summary)}</Text>
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.extendedIngredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Icon name="fiber-manual-record" size={8} color="#10B981" />
                <Text style={styles.ingredientText}>{ingredient.original}</Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.analyzedInstructions.length > 0 ? (
              recipe.analyzedInstructions[0].steps.map((step) => (
                <View key={step.number} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.number}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.step}</Text>
                </View>
              ))
            ) : recipe.instructions ? (
              <Text style={styles.instructionsText}>{stripHtml(recipe.instructions)}</Text>
            ) : (
              <Text style={styles.noInstructionsText}>
                No instructions available. View original recipe for details.
              </Text>
            )}
          </View>

          {/* Source Link */}
          {recipe.sourceUrl && (
            <TouchableOpacity style={styles.sourceButton} onPress={handleOpenSource}>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
