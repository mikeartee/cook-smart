import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export type SortOption = 
  | 'relevance'
  | 'cookingTime'
  | 'difficulty'
  | 'servings'
  | 'alphabetical'
  | 'compatibility';

interface Props {
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  showCompatibility?: boolean;
}

export const SortSelector: React.FC<Props> = ({
  selectedSort,
  onSortChange,
  showCompatibility = false
}) => {
  const sortOptions = [
    { value: 'relevance' as SortOption, label: 'Relevance', icon: '🎯' },
    ...(showCompatibility ? [{ value: 'compatibility' as SortOption, label: 'Compatibility', icon: '✅' }] : []),
    { value: 'cookingTime' as SortOption, label: 'Time', icon: '⏱️' },
    { value: 'difficulty' as SortOption, label: 'Difficulty', icon: '📊' },
    { value: 'servings' as SortOption, label: 'Servings', icon: '👥' },
    { value: 'alphabetical' as SortOption, label: 'A-Z', icon: '🔤' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sort by:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortOptions.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortButton,
              selectedSort === option.value && styles.selectedButton
            ]}
            onPress={() => onSortChange(option.value)}
          >
            <Text style={styles.icon}>{option.icon}</Text>
            <Text style={[
              styles.buttonText,
              selectedSort === option.value && styles.selectedText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});