import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { RecipeSearchBar } from '../components/RecipeSearchBar';
import { RecipeFilterModal } from '../components/RecipeFilterModal';
import { SortSelector, SortOption } from '../components/SortSelector';
import { RecipeList } from '../components/RecipeList';

interface SearchFilters {
  ingredients?: string[];
  cuisine?: string;
  mealType?: string;
  cookingTime?: number;
  difficulty?: string;
  servings?: number;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  imageUrl?: string;
  isCompatible?: boolean;
  conflictCount?: number;
}

export const RecipeSearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      title: 'Vegetarian Pasta',
      description: 'Simple pasta with vegetables',
      cookingTime: 20,
      servings: 4,
      difficulty: 'easy',
      cuisine: 'italian',
      isCompatible: true,
      conflictCount: 0
    },
    {
      id: '2',
      title: 'Chicken Stir Fry',
      description: 'Quick chicken and vegetable stir fry',
      cookingTime: 15,
      servings: 2,
      difficulty: 'easy',
      cuisine: 'asian',
      isCompatible: false,
      conflictCount: 1
    }
  ];

  useEffect(() => {
    // Simulate search
    setLoading(true);
    setTimeout(() => {
      setRecipes(mockRecipes);
      setLoading(false);
    }, 500);
  }, [searchQuery, filters, sortBy]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  const handleRecipePress = (recipe: Recipe) => {
    // Navigate to recipe detail
    console.log('Recipe pressed:', recipe.title);
  };

  const conflictData = recipes.reduce((acc, recipe) => {
    acc[recipe.id] = recipe.conflictCount || 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={styles.container}>
      <RecipeSearchBar
        onSearch={handleSearch}
        onFilterPress={() => setShowFilterModal(true)}
      />
      
      <SortSelector
        selectedSort={sortBy}
        onSortChange={handleSortChange}
        showCompatibility={true}
      />
      
      <RecipeList
        recipes={recipes}
        loading={loading}
        onRecipePress={handleRecipePress}
        conflictData={conflictData}
      />
      
      <RecipeFilterModal
        visible={showFilterModal}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onClose={() => setShowFilterModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});