import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { ShoppingListItem } from '../components/ShoppingListItem';
import { AddShoppingItem } from '../components/AddShoppingItem';

interface ShoppingItem {
  id: string;
  ingredient: string;
  quantity: string;
  unit: string;
  category: string;
  isCompleted: boolean;
  recipeId?: string;
}

export const ShoppingListScreen: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Mock data
  const mockItems: ShoppingItem[] = [
    { id: '1', ingredient: 'Tomatoes', quantity: '2', unit: 'lbs', category: 'produce', isCompleted: false },
    { id: '2', ingredient: 'Chicken Breast', quantity: '1', unit: 'lb', category: 'meat', isCompleted: true },
    { id: '3', ingredient: 'Milk', quantity: '1', unit: 'gallon', category: 'dairy', isCompleted: false, recipeId: 'recipe1' },
    { id: '4', ingredient: 'Bread', quantity: '1', unit: 'loaf', category: 'bakery', isCompleted: false }
  ];

  useEffect(() => {
    setItems(mockItems);
  }, []);

  const handleToggleCompleted = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };

  const handleUpdateItem = (itemId: string, ingredient: string, quantity: string, unit: string, category: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ingredient, quantity, unit, category } : item
    ));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddItem = (ingredient: string, quantity: string, unit: string, category: string) => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      ingredient,
      quantity,
      unit,
      category,
      isCompleted: false
    };
    setItems(prev => [...prev, newItem]);
    setShowAddForm(false);
  };

  const handleClearCompleted = () => {
    const completedCount = items.filter(item => item.isCompleted).length;
    if (completedCount === 0) {
      Alert.alert('No Items', 'No completed items to clear.');
      return;
    }

    Alert.alert(
      'Clear Completed',
      `Remove ${completedCount} completed item${completedCount > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          setItems(prev => prev.filter(item => !item.isCompleted));
        }}
      ]
    );
  };

  const categorizeItems = () => {
    const categorized: Record<string, ShoppingItem[]> = {};
    items.forEach(item => {
      if (!categorized[item.category]) {
        categorized[item.category] = [];
      }
      categorized[item.category].push(item);
    });
    return categorized;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      produce: '🥬',
      meat: '🥩',
      dairy: '🥛',
      pantry: '🥫',
      frozen: '🧊',
      bakery: '🍞',
      other: '📦'
    };
    return icons[category] || '📦';
  };

  const categorizedItems = categorizeItems();
  const completedCount = items.filter(item => item.isCompleted).length;
  const totalCount = items.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        <Text style={styles.progress}>
          {completedCount}/{totalCount} completed
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={handleClearCompleted}
        >
          <Text style={styles.clearButtonText}>Clear Completed</Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <AddShoppingItem
          onAdd={handleAddItem}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {Object.entries(categorizedItems).map(([category, categoryItems]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryHeader}>
              {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            {categoryItems.map(item => (
              <ShoppingListItem
                key={item.id}
                item={item}
                onToggleCompleted={handleToggleCompleted}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </View>
        ))}
        
        {items.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your shopping list is empty</Text>
            <Text style={styles.emptyText}>Add items to get started</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progress: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  addButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    paddingLeft: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
});