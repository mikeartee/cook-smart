import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

interface Props {
  onAdd: (
    ingredient: string,
    quantity: string,
    unit: string,
    category: string,
  ) => void;
  onCancel: () => void;
}

export const AddShoppingItem: React.FC<Props> = ({onAdd, onCancel}) => {
  const [ingredient, setIngredient] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('other');

  const categories = [
    {value: 'produce', label: '🥬 Produce'},
    {value: 'meat', label: '🥩 Meat'},
    {value: 'dairy', label: '🥛 Dairy'},
    {value: 'pantry', label: '🥫 Pantry'},
    {value: 'frozen', label: '🧊 Frozen'},
    {value: 'bakery', label: '🍞 Bakery'},
    {value: 'other', label: '📦 Other'},
  ];

  const handleAdd = () => {
    const trimmedIngredient = ingredient.trim();
    const trimmedQuantity = quantity.trim();
    const trimmedUnit = unit.trim();

    if (!trimmedIngredient) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }

    // Clean up any extra spaces in the ingredient name
    const cleanedIngredient = trimmedIngredient.replace(/\s+/g, ' ');

    onAdd(cleanedIngredient, trimmedQuantity, trimmedUnit, category);

    // Reset form
    setIngredient('');
    setQuantity('');
    setUnit('');
    setCategory('other');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Shopping Item</Text>

      <TextInput
        style={styles.input}
        placeholder="Ingredient name"
        value={ingredient}
        onChangeText={setIngredient}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.quantityInput]}
          placeholder="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.unitInput]}
          placeholder="Unit"
          value={unit}
          onChangeText={setUnit}
        />
      </View>

      <Text style={styles.label}>Category:</Text>
      <View style={styles.categoryGrid}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryButton,
              category === cat.value && styles.selectedCategory,
            ]}
            onPress={() => setCategory(cat.value)}>
            <Text
              style={[
                styles.categoryText,
                category === cat.value && styles.selectedCategoryText,
              ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategory: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  addButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
