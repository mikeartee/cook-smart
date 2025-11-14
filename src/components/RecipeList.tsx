import React from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { RecipeCard } from './RecipeCard';

interface Recipe {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  imageUrl?: string;
}

interface Props {
  recipes: Recipe[];
  loading?: boolean;
  onRecipePress: (recipe: Recipe) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  conflictData?: Record<string, number>;
}

export const RecipeList: React.FC<Props> = ({
  recipes,
  loading = false,
  onRecipePress,
  onLoadMore,
  hasMore = false,
  conflictData = {}
}) => {
  const renderRecipe = ({ item }: { item: Recipe }) => (
    <RecipeCard
      recipe={item}
      onPress={onRecipePress}
      showConflicts={Object.keys(conflictData).length > 0}
      conflictCount={conflictData[item.id] || 0}
    />
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading more recipes...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No recipes found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your search terms or filters
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={recipes}
      renderItem={renderRecipe}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={recipes.length === 0 ? styles.emptyContainer : undefined}
    />
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});