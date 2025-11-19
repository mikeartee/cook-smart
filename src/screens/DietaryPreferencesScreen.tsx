import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';

const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: 'eco' },
  { id: 'vegan', label: 'Vegan', icon: 'spa' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: 'grain' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: 'no-meals' },
  { id: 'keto', label: 'Keto', icon: 'fitness-center' },
  { id: 'paleo', label: 'Paleo', icon: 'restaurant' },
  { id: 'low-carb', label: 'Low Carb', icon: 'trending-down' },
  { id: 'halal', label: 'Halal', icon: 'mosque' },
  { id: 'kosher', label: 'Kosher', icon: 'star' },
];

const COMMON_ALLERGIES = [
  { id: 'peanuts', label: 'Peanuts', icon: 'warning' },
  { id: 'tree-nuts', label: 'Tree Nuts', icon: 'warning' },
  { id: 'milk', label: 'Milk/Dairy', icon: 'warning' },
  { id: 'eggs', label: 'Eggs', icon: 'warning' },
  { id: 'wheat', label: 'Wheat/Gluten', icon: 'warning' },
  { id: 'soy', label: 'Soy', icon: 'warning' },
  { id: 'fish', label: 'Fish', icon: 'warning' },
  { id: 'shellfish', label: 'Shellfish', icon: 'warning' },
  { id: 'sesame', label: 'Sesame', icon: 'warning' },
];

interface DietaryPreferencesScreenProps {
  navigation: any;
}

const DietaryPreferencesScreen: React.FC<DietaryPreferencesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [showNutrition, setShowNutrition] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load user preferences
    if (user?.dietary_restrictions) {
      setSelectedDiets(user.dietary_restrictions);
    }
    if (user?.allergies) {
      setSelectedAllergies(user.allergies);
    }
    if (user?.show_nutrition !== undefined) {
      setShowNutrition(user.show_nutrition);
    }
  }, [user]);

  const toggleDiet = (dietId: string) => {
    setSelectedDiets(prev =>
      prev.includes(dietId)
        ? prev.filter(id => id !== dietId)
        : [...prev, dietId]
    );
  };

  const toggleAllergy = (allergyId: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergyId)
        ? prev.filter(id => id !== allergyId)
        : [...prev, allergyId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Call API to save preferences
      // await dietaryService.updatePreferences({
      //   dietary_restrictions: selectedDiets,
      //   allergies: selectedAllergies,
      //   show_nutrition: showNutrition
      // });
      
      Alert.alert('Success', 'Your dietary preferences have been saved!');
      navigation.goBack();
    } catch (_error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dietary Preferences</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Dietary Restrictions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          <Text style={styles.sectionSubtitle}>
            Select any dietary preferences you follow
          </Text>
          <View style={styles.optionsGrid}>
            {DIETARY_RESTRICTIONS.map(diet => (
              <TouchableOpacity
                key={diet.id}
                style={[
                  styles.optionCard,
                  selectedDiets.includes(diet.id) && styles.optionCardSelected,
                ]}
                onPress={() => toggleDiet(diet.id)}
              >
                <Icon
                  name={diet.icon}
                  size={24}
                  color={selectedDiets.includes(diet.id) ? '#10B981' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    selectedDiets.includes(diet.id) && styles.optionLabelSelected,
                  ]}
                >
                  {diet.label}
                </Text>
                {selectedDiets.includes(diet.id) && (
                  <Icon
                    name="check-circle"
                    size={20}
                    color="#10B981"
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies & Intolerances</Text>
          <Text style={styles.sectionSubtitle}>
            Select any foods you're allergic to or intolerant of
          </Text>
          <View style={styles.optionsGrid}>
            {COMMON_ALLERGIES.map(allergy => (
              <TouchableOpacity
                key={allergy.id}
                style={[
                  styles.optionCard,
                  styles.allergyCard,
                  selectedAllergies.includes(allergy.id) && styles.allergyCardSelected,
                ]}
                onPress={() => toggleAllergy(allergy.id)}
              >
                <Icon
                  name={allergy.icon}
                  size={24}
                  color={selectedAllergies.includes(allergy.id) ? '#EF4444' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    selectedAllergies.includes(allergy.id) && styles.allergyLabelSelected,
                  ]}
                >
                  {allergy.label}
                </Text>
                {selectedAllergies.includes(allergy.id) && (
                  <Icon
                    name="check-circle"
                    size={20}
                    color="#EF4444"
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutrition Display */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Show Nutrition Info</Text>
              <Text style={styles.settingSubtitle}>
                Display nutritional information in recipes
              </Text>
            </View>
            <Switch
              value={showNutrition}
              onValueChange={setShowNutrition}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={showNutrition ? '#10B981' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Icon name="info-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Your preferences will be used to filter recipes and provide personalized recommendations.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    paddingHorizontal: 8,
  },
  saveTextDisabled: {
    color: '#9CA3AF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 8,
  },
  optionCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  allergyCard: {
    borderColor: '#FEE2E2',
  },
  allergyCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  allergyLabelSelected: {
    color: '#EF4444',
    fontWeight: '600',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 32,
  },
});

export default DietaryPreferencesScreen;
