import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRecipes} from '../../contexts/RecipeContext';
import {SavedRecipe} from '../../services/recipeService';
import {addMealPlan} from '../../services/recipeEnhancementService';

interface SavedRecipesScreenProps {
  navigation: any;
  route?: any;
}

export const SavedRecipesScreen: React.FC<SavedRecipesScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    savedRecipes,
    fetchSavedRecipes,
    deleteSavedRecipe,
    isLoading: _isLoading,
  } = useRecipes();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<number[]>([]);

  const selectMode = (route as any)?.params?.selectMode || false;
  const mealDate = (route as any)?.params?.date;
  const mealType = (route as any)?.params?.mealType;

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      await fetchSavedRecipes();
    } catch (err) {
      console.error('Error loading saved recipes:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedRecipes();
    setRefreshing(false);
  };

  const handleDelete = (recipeId: number, title: string) => {
    Alert.alert('Remove Recipe', `Remove "${title}" from saved recipes?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavedRecipe(recipeId);
          } catch (_err) {
            Alert.alert('Error', 'Failed to remove recipe');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handleRecipePress = (recipeId: number) => {
    if (selectMode) {
      if (selectedRecipes.includes(recipeId)) {
        setSelectedRecipes(selectedRecipes.filter(id => id !== recipeId));
      } else {
        setSelectedRecipes([...selectedRecipes, recipeId]);
      }
    } else {
      navigation.navigate('Recipes', {
        screen: 'RecipeDetail',
        params: {recipeId},
      });
    }
  };

  const renderRecipeCard = ({item}: {item: SavedRecipe}) => {
    const isSelected = selectedRecipes.includes(item.recipe.id);

    return (
      <TouchableOpacity
        style={[styles.recipeCard, isSelected && styles.recipeCardSelected]}
        onPress={() => handleRecipePress(item.recipe.id)}
        activeOpacity={0.7}>
        <Image source={{uri: item.recipe.image}} style={styles.recipeImage} />

        {selectMode && isSelected && (
          <View style={styles.selectedBadge}>
            <Icon name="check-circle" size={32} color="#10B981" />
          </View>
        )}

        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.recipe.title}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="schedule" size={16} color="#6B7280" />
              <Text style={styles.statText}>
                {item.recipe.readyInMinutes} min
              </Text>
            </View>
            <View style={styles.stat}>
              <Icon name="restaurant" size={16} color="#6B7280" />
              <Text style={styles.statText}>
                {item.recipe.servings} servings
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.savedDate}>
              Saved {formatDate(item.savedAt)}
            </Text>
            <TouchableOpacity
              onPress={() => handleDelete(item.recipe.id, item.recipe.title)}
              style={styles.deleteButton}>
              <Icon name="delete-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="favorite-border" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Saved Recipes</Text>
      <Text style={styles.emptyText}>
        Save your favorite recipes to access them quickly later
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Recipes')}>
        <Icon name="search" size={20} color="#FFFFFF" />
        <Text style={styles.exploreButtonText}>Find Recipes</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {selectMode ? (
          <View style={styles.selectHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Select recipes for {mealType}</Text>
            <TouchableOpacity
              onPress={async () => {
                if (selectedRecipes.length > 0) {
                  try {
                    for (const recipeId of selectedRecipes) {
                      await addMealPlan(
                        recipeId.toString(),
                        'api',
                        mealDate,
                        mealType,
                      );
                    }
                    Alert.alert(
                      'Success',
                      `Added ${selectedRecipes.length} recipe(s) to ${mealType}`,
                    );
                    navigation.goBack();
                  } catch (error: any) {
                    console.error('Error adding to meal plan:', error);
                    const errorMsg = error?.message || 'Unknown error';
                    Alert.alert('Error', `Failed to add recipes: ${errorMsg}`);
                  }
                } else {
                  Alert.alert(
                    'No Selection',
                    'Please select at least one recipe',
                  );
                }
              }}
              disabled={selectedRecipes.length === 0}>
              <Text
                style={[
                  styles.doneText,
                  selectedRecipes.length === 0 && styles.doneTextDisabled,
                ]}>
                Done ({selectedRecipes.length})
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.headerText}>
            {savedRecipes.length > 0
              ? `${savedRecipes.length} saved recipe${savedRecipes.length !== 1 ? 's' : ''}`
              : 'No saved recipes'}
          </Text>
        )}
      </View>

      {/* Recipe List */}
      <FlatList
        data={savedRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={item => item.recipe.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          savedRecipes.length === 0 && styles.listContentEmpty,
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
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
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeCardSelected: {
    borderWidth: 3,
    borderColor: '#10B981',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  selectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  doneTextDisabled: {
    color: '#9CA3AF',
  },
  recipeImage: {
    width: '100%',
    height: 180,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  savedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 4,
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
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
