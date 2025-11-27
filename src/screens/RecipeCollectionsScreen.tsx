import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  getUserCollections,
  createCollection,
} from '../services/recipeEnhancementService';

export default function RecipeCollectionsScreen({navigation}: any) {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await getUserCollections();
      setCollections(data);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    try {
      await createCollection(newCollectionName.trim(), selectedIcon);
      setShowCreateModal(false);
      setNewCollectionName('');
      setSelectedIcon('folder');
      await loadCollections();
      Alert.alert('Success', 'Collection created!');
    } catch (_error) {
      Alert.alert('Error', 'Failed to create collection');
    }
  };

  const icons = [
    'folder',
    'favorite',
    'restaurant',
    'cake',
    'local-pizza',
    'fastfood',
    'lunch-dining',
    'dinner-dining',
  ];

  const renderCollection = ({item}: any) => (
    <TouchableOpacity
      style={styles.collectionCard}
      onPress={() =>
        navigation.navigate('CollectionDetail', {collectionId: item.id})
      }>
      <View style={styles.collectionIcon}>
        <Icon name={item.icon || 'folder'} size={32} color="#10B981" />
      </View>
      <View style={styles.collectionInfo}>
        <Text style={styles.collectionName}>{item.name}</Text>
        <Text style={styles.collectionCount}>
          {item.recipe_count} {item.recipe_count === 1 ? 'recipe' : 'recipes'}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color="#9CA3AF" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="collections-bookmark" size={32} color="#10B981" />
        <Text style={styles.title}>Recipe Collections</Text>
      </View>

      {collections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder-open" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Collections Yet</Text>
          <Text style={styles.emptySubtext}>
            Create collections to organize your favorite recipes
          </Text>
        </View>
      ) : (
        <FlatList
          data={collections}
          renderItem={renderCollection}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}>
        <Icon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Collection Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Collection</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Collection Name</Text>
              <TextInput
                style={styles.input}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                placeholder="e.g., Weeknight Dinners"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Choose Icon</Text>
              <View style={styles.iconGrid}>
                {icons.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setSelectedIcon(icon)}>
                    <Icon
                      name={icon}
                      size={28}
                      color={selectedIcon === icon ? '#10B981' : '#6B7280'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateCollection}>
              <Text style={styles.createButtonText}>Create Collection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  list: {
    padding: 16,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  collectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  collectionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  iconOptionSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  createButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
