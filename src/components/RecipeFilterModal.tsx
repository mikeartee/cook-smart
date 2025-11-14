import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';

interface SearchFilters {
  ingredients?: string[];
  cuisine?: string;
  mealType?: string;
  cookingTime?: number;
  difficulty?: string;
  servings?: number;
}

interface Props {
  visible: boolean;
  filters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
  onClose: () => void;
}

export const RecipeFilterModal: React.FC<Props> = ({
  visible,
  filters,
  onApplyFilters,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const cuisines = ['italian', 'asian', 'mexican', 'american', 'indian', 'french'];
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
  const difficulties = ['easy', 'medium', 'hard'];

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filter Recipes</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuisine</Text>
            <View style={styles.optionsGrid}>
              {cuisines.map(cuisine => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.option,
                    localFilters.cuisine === cuisine && styles.selectedOption
                  ]}
                  onPress={() => updateFilter('cuisine', 
                    localFilters.cuisine === cuisine ? undefined : cuisine
                  )}
                >
                  <Text style={[
                    styles.optionText,
                    localFilters.cuisine === cuisine && styles.selectedOptionText
                  ]}>
                    {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meal Type</Text>
            <View style={styles.optionsGrid}>
              {mealTypes.map(mealType => (
                <TouchableOpacity
                  key={mealType}
                  style={[
                    styles.option,
                    localFilters.mealType === mealType && styles.selectedOption
                  ]}
                  onPress={() => updateFilter('mealType', 
                    localFilters.mealType === mealType ? undefined : mealType
                  )}
                >
                  <Text style={[
                    styles.optionText,
                    localFilters.mealType === mealType && styles.selectedOptionText
                  ]}>
                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty</Text>
            <View style={styles.optionsGrid}>
              {difficulties.map(difficulty => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.option,
                    localFilters.difficulty === difficulty && styles.selectedOption
                  ]}
                  onPress={() => updateFilter('difficulty', 
                    localFilters.difficulty === difficulty ? undefined : difficulty
                  )}
                >
                  <Text style={[
                    styles.optionText,
                    localFilters.difficulty === difficulty && styles.selectedOptionText
                  ]}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Max Cooking Time (minutes)</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="e.g., 30"
              value={localFilters.cookingTime?.toString() || ''}
              onChangeText={(text) => updateFilter('cookingTime', 
                text ? parseInt(text) || undefined : undefined
              )}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Min Servings</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="e.g., 4"
              value={localFilters.servings?.toString() || ''}
              onChangeText={(text) => updateFilter('servings', 
                text ? parseInt(text) || undefined : undefined
              )}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  clearText: {
    color: '#f44336',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    color: '#666',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});