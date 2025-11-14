import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RecipeConflict {
  type: 'dietary' | 'allergy';
  restriction: string;
  conflictingIngredients: string[];
}

interface Props {
  ingredients: string[];
  conflicts: RecipeConflict[];
}

export const RecipeConflictHighlight: React.FC<Props> = ({ ingredients, conflicts }) => {
  const getConflictingIngredients = () => {
    const conflicting = new Set<string>();
    conflicts.forEach(conflict => {
      conflict.conflictingIngredients.forEach(ingredient => {
        conflicting.add(ingredient.toLowerCase());
      });
    });
    return conflicting;
  };

  const conflictingIngredients = getConflictingIngredients();

  const isConflicting = (ingredient: string) => {
    return Array.from(conflictingIngredients).some(conflict =>
      ingredient.toLowerCase().includes(conflict.toLowerCase())
    );
  };

  return (
    <View style={styles.container}>
      {ingredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientRow}>
          <Text style={[
            styles.ingredient,
            isConflicting(ingredient) && styles.conflicting
          ]}>
            {ingredient}
          </Text>
          {isConflicting(ingredient) && (
            <Text style={styles.warningIcon}>⚠️</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ingredient: {
    fontSize: 16,
    flex: 1,
  },
  conflicting: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  warningIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
});