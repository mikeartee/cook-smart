import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import {ShoppingListItem} from '../components/ShoppingListItem';
import {AddShoppingItem} from '../components/AddShoppingItem';
import {
  shoppingListService,
  ShoppingListItem as ShoppingItem,
} from '../services/shoppingListService';

export const ShoppingListScreen: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    loadShoppingList();
  }, []);

  const loadShoppingList = async () => {
    try {
      setLoading(true);
      const data = await shoppingListService.getShoppingList();
      setItems(data);
    } catch (error) {
      console.error('Error loading shopping list:', error);
      Alert.alert('Error', 'Failed to load shopping list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompleted = async (itemId: string) => {
    try {
      const updatedItem = await shoppingListService.toggleCompleted(itemId);
      setItems(prev =>
        prev.map(item => (item.id === itemId ? updatedItem : item)),
      );
    } catch (error) {
      console.error('Error toggling item:', error);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    ingredient: string,
    quantity: string,
    unit: string,
    category: string,
  ) => {
    try {
      const updatedItem = await shoppingListService.updateItem(itemId, {
        ingredient,
        quantity,
        unit,
        category,
      });
      setItems(prev =>
        prev.map(item => (item.id === itemId ? updatedItem : item)),
      );
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await shoppingListService.deleteItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  };

  const handleAddItem = async (
    ingredient: string,
    quantity: string,
    unit: string,
    category: string,
  ) => {
    try {
      const newItem = await shoppingListService.addItem({
        ingredient,
        quantity,
        unit,
        category,
      });
      setItems(prev => [...prev, newItem]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
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
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await shoppingListService.clearCompleted();
              setItems(prev => prev.filter(item => !item.isCompleted));
            } catch (error) {
              console.error('Error clearing completed items:', error);
              Alert.alert(
                'Error',
                'Failed to clear completed items. Please try again.',
              );
            }
          },
        },
      ],
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
      other: '📦',
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
          onPress={() => setShowAddForm(true)}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearCompleted}>
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
              {getCategoryIcon(category)}{' '}
              {category.charAt(0).toUpperCase() + category.slice(1)}
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
