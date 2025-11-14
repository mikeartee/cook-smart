import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

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
  recipe: Recipe;
  isFavorite: boolean;
  onFavoritePress: () => void;
  onSharePress: () => void;
}

export const RecipeDetailHeader: React.FC<Props> = ({
  recipe,
  isFavorite,
  onFavoritePress,
  onSharePress
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#666';
    }
  };

  return (
    <View style={styles.container}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>🍽️</Text>
        </View>
      )}
      
      <View style={styles.overlay}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onFavoritePress}>
            <Text style={styles.actionIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onSharePress}>
            <Text style={styles.actionIcon}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>
        
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statText}>{recipe.cookingTime} min</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statText}>{recipe.servings} servings</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={[styles.statText, { color: getDifficultyColor(recipe.difficulty) }]}>
              {recipe.difficulty}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>🌍</Text>
            <Text style={styles.statText}>{recipe.cuisine}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 250,
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 64,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});