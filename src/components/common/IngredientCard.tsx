import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Ingredient } from '../../services/ingredientService';

interface IngredientCardProps {
  ingredient: Ingredient;
  onDelete: (id: number) => void;
}

const getCategoryIcon = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    proteins: 'set-meal',
    vegetables: 'eco',
    fruits: 'apple',
    grains: 'grain',
    dairy: 'local-drink',
    spices: 'spa',
    other: 'category',
  };
  return categoryMap[category.toLowerCase()] || 'category';
};

export const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  onDelete,
}) => {
  const displayName = ingredient.ingredient_name || ingredient.name || 'Unknown';
  const iconName = getCategoryIcon(ingredient.category);

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={24} color="#10B981" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.category}>{ingredient.category}</Text>
        {ingredient.quantity && ingredient.unit && (
          <Text style={styles.quantity}>
            {ingredient.quantity} {ingredient.unit}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(ingredient.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="delete" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  quantity: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
});
