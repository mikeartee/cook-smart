import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Props {
  ingredients: string[];
  conflictingIngredients?: string[];
  substitutions?: Array<{
    original: string;
    substitutes: Array<{
      ingredient: string;
      ratio: string;
      notes?: string;
    }>;
  }>;
  servings: number;
  onServingsChange?: (servings: number) => void;
}

export const IngredientsList: React.FC<Props> = ({
  ingredients,
  conflictingIngredients = [],
  substitutions = [],
  servings,
  onServingsChange
}) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  const toggleIngredient = (ingredient: string) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(ingredient)) {
      newChecked.delete(ingredient);
    } else {
      newChecked.add(ingredient);
    }
    setCheckedIngredients(newChecked);
  };

  const isConflicting = (ingredient: string) => {
    return conflictingIngredients.some(conflict =>
      ingredient.toLowerCase().includes(conflict.toLowerCase())
    );
  };

  const getSubstitution = (ingredient: string) => {
    return substitutions.find(sub => sub.original === ingredient);
  };

  const adjustServings = (newServings: number) => {
    if (newServings > 0 && onServingsChange) {
      onServingsChange(newServings);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ingredients</Text>
        {onServingsChange && (
          <View style={styles.servingsControl}>
            <TouchableOpacity 
              style={styles.servingsButton}
              onPress={() => adjustServings(servings - 1)}
            >
              <Text style={styles.servingsButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.servingsText}>{servings} servings</Text>
            <TouchableOpacity 
              style={styles.servingsButton}
              onPress={() => adjustServings(servings + 1)}
            >
              <Text style={styles.servingsButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.list}>
        {ingredients.map((ingredient, index) => {
          const isChecked = checkedIngredients.has(ingredient);
          const hasConflict = isConflicting(ingredient);
          const substitution = getSubstitution(ingredient);

          return (
            <View key={index} style={styles.ingredientContainer}>
              <TouchableOpacity
                style={styles.ingredientRow}
                onPress={() => toggleIngredient(ingredient)}
              >
                <View style={styles.checkbox}>
                  <Text style={styles.checkboxText}>
                    {isChecked ? '✅' : '⬜'}
                  </Text>
                </View>
                <Text style={[
                  styles.ingredientText,
                  isChecked && styles.checkedText,
                  hasConflict && styles.conflictText
                ]}>
                  {ingredient}
                </Text>
                {hasConflict && (
                  <Text style={styles.warningIcon}>⚠️</Text>
                )}
              </TouchableOpacity>

              {substitution && (
                <View style={styles.substitutionContainer}>
                  <Text style={styles.substitutionLabel}>Alternative:</Text>
                  <Text style={styles.substitutionText}>
                    {substitution.substitutes[0].ingredient} ({substitution.substitutes[0].ratio})
                  </Text>
                  {substitution.substitutes[0].notes && (
                    <Text style={styles.substitutionNotes}>
                      {substitution.substitutes[0].notes}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  servingsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  servingsText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    maxHeight: 300,
  },
  ingredientContainer: {
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 18,
  },
  ingredientText: {
    fontSize: 16,
    flex: 1,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  conflictText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  warningIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  substitutionContainer: {
    marginLeft: 30,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  substitutionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  substitutionText: {
    fontSize: 14,
    color: '#333',
  },
  substitutionNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
});