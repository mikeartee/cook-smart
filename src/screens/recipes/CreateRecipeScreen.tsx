import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {userRecipeService} from '../../services/userRecipeService';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Props {
  navigation: any;
}

export const CreateRecipeScreen: React.FC<Props> = ({navigation}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('4');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {name: '', quantity: '', unit: ''},
  ]);
  const [instructions, setInstructions] = useState(['']);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium',
  );
  const [saving, setSaving] = useState(false);

  const addIngredient = () => {
    setIngredients([...ingredients, {name: '', quantity: '', unit: ''}]);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string,
  ) => {
    const newIngredients = [...ingredients];
    if (newIngredients[index]) {
      newIngredients[index][field] = value;
      setIngredients(newIngredients);
    }
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    const newInstructions = instructions.filter((_, i) => i !== index);
    setInstructions(newInstructions);
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const validateRecipe = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (ingredients.filter(i => i.name.trim()).length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return false;
    }
    if (instructions.filter(i => i.trim()).length === 0) {
      Alert.alert('Error', 'Please add at least one instruction');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateRecipe()) return;

    setSaving(true);
    try {
      await userRecipeService.createRecipe({
        title: title.trim(),
        description: description.trim(),
        prepTime: parseInt(prepTime) || 0,
        cookTime: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 4,
        ingredients: ingredients.filter(i => i.name.trim()),
        instructions: instructions.filter(i => i.trim()),
        category: category.trim() || 'Other',
        difficulty,
        isPublic: false,
      });

      Alert.alert(
        'Success!',
        'Your recipe has been saved! You earned 25 points! 🎉',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}>
          <Icon name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Recipe</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Recipe Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Grandma's Chocolate Chip Cookies"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your recipe..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Prep Time (min)</Text>
              <TextInput
                style={styles.input}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="15"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Cook Time (min)</Text>
              <TextInput
                style={styles.input}
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="30"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Servings</Text>
              <TextInput
                style={styles.input}
                value={servings}
                onChangeText={setServings}
                placeholder="4"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Dessert, Main Course, Appetizer"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.difficultyButtons}>
              {(['easy', 'medium', 'hard'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    difficulty === level && styles.difficultyButtonActive,
                  ]}
                  onPress={() => setDifficulty(level)}>
                  <Text
                    style={[
                      styles.difficultyText,
                      difficulty === level && styles.difficultyTextActive,
                    ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Ingredients <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
              <Icon name="add" size={20} color="#4CAF50" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, styles.ingredientName]}
                value={ingredient.name}
                onChangeText={value => updateIngredient(index, 'name', value)}
                placeholder="Ingredient name"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={[styles.input, styles.ingredientQty]}
                value={ingredient.quantity}
                onChangeText={value =>
                  updateIngredient(index, 'quantity', value)
                }
                placeholder="Qty"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.ingredientUnit]}
                value={ingredient.unit}
                onChangeText={value => updateIngredient(index, 'unit', value)}
                placeholder="Unit"
                placeholderTextColor="#9CA3AF"
              />
              {ingredients.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeIngredient(index)}
                  style={styles.removeButton}>
                  <Icon name="remove-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Instructions <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity onPress={addInstruction} style={styles.addButton}>
              <Icon name="add" size={20} color="#4CAF50" />
              <Text style={styles.addButtonText}>Add Step</Text>
            </TouchableOpacity>
          </View>

          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.instructionInput]}
                value={instruction}
                onChangeText={value => updateInstruction(index, value)}
                placeholder="Describe this step..."
                placeholderTextColor="#9CA3AF"
                multiline
              />
              {instructions.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeInstruction(index)}
                  style={styles.removeButton}>
                  <Icon name="remove-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
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
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  required: {
    color: '#EF4444',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  difficultyTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 4,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  ingredientName: {
    flex: 2,
  },
  ingredientQty: {
    flex: 1,
  },
  ingredientUnit: {
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionInput: {
    flex: 1,
    minHeight: 80,
  },
  bottomPadding: {
    height: 32,
  },
});
