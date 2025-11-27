import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {SearchBar} from '../../components/common/SearchBar';
import {useIngredients} from '../../contexts/IngredientContext';
import PhotoPicker from '../../components/PhotoPicker';
import {uploadPhoto} from '../../services/userRecipeService';
import {Ingredient} from '../../services/ingredientService';
import {BarcodeScannerModal} from '../../components/barcode/BarcodeScannerModal';
import {ManualBarcodeEntryModal} from '../../components/barcode/ManualBarcodeEntryModal';
import {ScannedProduct} from '../../services/productLookupService';
import {barcodeService} from '../../services/barcodeService';

export const AddIngredientScreen: React.FC = () => {
  const navigation = useNavigation();
  const {searchIngredients, addIngredient} = useIngredients();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Barcode scanner state
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(
    null,
  );
  const [_hasCameraAvailable, setHasCameraAvailable] = useState(true);

  // Custom ingredient form state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Other');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('unit');
  const [photo, setPhoto] = useState('');

  // Check camera availability on mount
  useEffect(() => {
    checkCameraAvailability();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchIngredients(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchIngredients]);

  // Pre-populate form when product is scanned
  useEffect(() => {
    if (scannedProduct) {
      setCustomName(scannedProduct.name);
      setCustomCategory(scannedProduct.category || 'Other');
      setQuantity('1');
      setUnit('item');
      setShowCustomModal(true);
    }
  }, [scannedProduct]);

  const checkCameraAvailability = async () => {
    try {
      const status = await barcodeService.checkCameraPermission();
      setHasCameraAvailable(status !== 'unavailable');
    } catch (error) {
      console.error('Error checking camera availability:', error);
      setHasCameraAvailable(false);
    }
  };

  const handleScanBarcode = () => {
    // Check if form has data
    if (customName.trim()) {
      Alert.alert(
        'Discard Changes?',
        'Scanning a barcode will replace the current form data. Continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: () => {
              setCustomName('');
              setCustomCategory('Other');
              setQuantity('1');
              setUnit('unit');
              setShowScannerModal(true);
            },
          },
        ],
      );
    } else {
      setShowScannerModal(true);
    }
  };

  const handleBarcodeScanned = (productData: ScannedProduct) => {
    setScannedProduct(productData);
  };

  const handleManualEntry = () => {
    setShowManualEntryModal(true);
  };

  const handleSelectIngredient = async (ingredient: Ingredient) => {
    try {
      await addIngredient({
        ingredientId: ingredient.id,
        quantity: 1,
        unit: 'unit',
      });

      Alert.alert('Success', 'Ingredient added to your inventory', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to ingredients list
            navigation.navigate('IngredientInventory' as never);
          },
        },
      ]);
    } catch (_error) {
      Alert.alert('Error', 'Failed to add ingredient');
    }
  };

  const handleAddCustom = async () => {
    if (!customName.trim()) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }

    try {
      let photoUrl = '';
      if (photo) {
        photoUrl = await uploadPhoto(photo, 'ingredient');
      }

      await addIngredient({
        customName: customName.trim(),
        category: customCategory,
        quantity: parseFloat(quantity) || 1,
        unit: unit.trim() || 'unit',
        photo_url: photoUrl,
      });

      // Close modal first
      setShowCustomModal(false);

      // Reset form
      setCustomName('');
      setCustomCategory('Other');
      setQuantity('1');
      setUnit('unit');
      setPhoto('');

      // Show success and navigate back
      Alert.alert(
        'Success',
        'Custom ingredient added! Pull down to refresh the list.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to ingredients list
              navigation.goBack();
            },
          },
        ],
      );
    } catch (_error) {
      Alert.alert('Error', 'Failed to add custom ingredient');
    }
  };

  const categories = [
    'Proteins',
    'Vegetables',
    'Fruits',
    'Grains',
    'Dairy',
    'Spices',
    'Other',
  ];

  const renderSearchResult = ({item}: {item: Ingredient}) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectIngredient(item)}>
      <View style={styles.resultContent}>
        <Text style={styles.resultName}>
          {item.ingredient_name || item.name}
        </Text>
        <Text style={styles.resultCategory}>{item.category}</Text>
      </View>
      <Icon name="add-circle" size={24} color="#10B981" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Ingredient</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scan Barcode Button - Always show */}
      <TouchableOpacity style={styles.scanButton} onPress={handleScanBarcode}>
        <Icon name="qr-code-scanner" size={24} color="#10B981" />
        <Text style={styles.scanButtonText}>Scan Barcode</Text>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search ingredients..."
        />
      </View>

      {isSearching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : searchQuery.trim().length < 2 ? (
        <View style={styles.centerContainer}>
          <Icon name="search" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Search for Ingredients</Text>
          <Text style={styles.emptySubtext}>
            Type at least 2 characters to search
          </Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="search-off" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term or add a custom ingredient
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.customButton}
        onPress={() => setShowCustomModal(true)}>
        <Icon name="add" size={20} color="#FFFFFF" />
        <Text style={styles.customButtonText}>Add Custom Ingredient</Text>
      </TouchableOpacity>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onBarcodeScanned={handleBarcodeScanned}
        onManualEntry={handleManualEntry}
      />

      {/* Manual Barcode Entry Modal */}
      <ManualBarcodeEntryModal
        visible={showManualEntryModal}
        onClose={() => setShowManualEntryModal(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Custom Ingredient Modal */}
      <Modal
        visible={showCustomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Custom Ingredient</Text>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <PhotoPicker onPhotoSelected={setPhoto} currentPhoto={photo} />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ingredient Name *</Text>
              <TextInput
                style={styles.input}
                value={customName}
                onChangeText={setCustomName}
                placeholder="e.g., Organic Honey"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      customCategory === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setCustomCategory(cat)}>
                    <Text
                      style={[
                        styles.categoryChipText,
                        customCategory === cat && styles.categoryChipTextActive,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.flex1]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.formGroup, styles.flex1, styles.marginLeft]}>
                <Text style={styles.label}>Unit</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="unit"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddCustom}>
              <Text style={styles.saveButtonText}>Add Ingredient</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  placeholder: {
    width: 32,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  scanButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    maxHeight: '80%',
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
