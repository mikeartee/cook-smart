import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';

interface ShoppingItem {
  id: string;
  ingredient: string;
  quantity: string;
  unit: string;
  category: string;
  isCompleted: boolean;
  recipeId?: string;
}

interface Props {
  item: ShoppingItem;
  onToggleCompleted: (itemId: string) => void;
  onUpdate: (
    itemId: string,
    ingredient: string,
    quantity: string,
    unit: string,
    category: string,
  ) => void;
  onDelete: (itemId: string) => void;
}

export const ShoppingListItem: React.FC<Props> = ({
  item,
  onToggleCompleted,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editIngredient, setEditIngredient] = useState(item.ingredient);
  const [editQuantity, setEditQuantity] = useState(item.quantity);
  const [editUnit, setEditUnit] = useState(item.unit);

  const handleSave = () => {
    const trimmedIngredient = editIngredient.trim();
    const trimmedQuantity = editQuantity.trim();
    const trimmedUnit = editUnit.trim();

    if (!trimmedIngredient) {
      Alert.alert('Error', 'Ingredient name is required');
      return;
    }

    // Clean up any extra spaces in the ingredient name
    const cleanedIngredient = trimmedIngredient.replace(/\s+/g, ' ');

    onUpdate(
      item.id,
      cleanedIngredient,
      trimmedQuantity,
      trimmedUnit,
      item.category,
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditIngredient(item.ingredient);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.ingredient}" from shopping list?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ],
    );
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.editRow}>
          <TextInput
            style={[styles.editInput, styles.ingredientInput]}
            value={editIngredient}
            onChangeText={setEditIngredient}
            placeholder="Ingredient"
          />
          <TextInput
            style={[styles.editInput, styles.quantityInput]}
            value={editQuantity}
            onChangeText={setEditQuantity}
            placeholder="Qty"
          />
          <TextInput
            style={[styles.editInput, styles.unitInput]}
            value={editUnit}
            onChangeText={setEditUnit}
            placeholder="Unit"
          />
        </View>
        <View style={styles.editActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, item.isCompleted && styles.completedContainer]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggleCompleted(item.id)}>
        <Text style={styles.checkboxText}>
          {item.isCompleted ? '✅' : '⬜'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.content}
        onPress={() => setIsEditing(true)}>
        <Text
          style={[styles.ingredient, item.isCompleted && styles.completedText]}>
          {item.ingredient.trim()}
        </Text>
        <Text
          style={[styles.quantity, item.isCompleted && styles.completedText]}>
          {[item.quantity.trim(), item.unit.trim()].filter(Boolean).join(' ')}
        </Text>
        {item.recipeId && <Text style={styles.recipeTag}>📝 Recipe</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  completedContainer: {
    backgroundColor: '#f0f8f0',
    opacity: 0.7,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  ingredient: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  quantity: {
    fontSize: 14,
    color: '#666',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  recipeTag: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 16,
  },
  editContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  editRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  ingredientInput: {
    flex: 2,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: '500',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
