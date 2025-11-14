import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface Props {
  onAddRestriction: (name: string, description: string, excludedIngredients: string[]) => void;
  onAddAllergy: (name: string, severity: string, description: string, triggerIngredients: string[]) => void;
  onClose: () => void;
}

export const CustomDietaryEntry: React.FC<Props> = ({
  onAddRestriction,
  onAddAllergy,
  onClose
}) => {
  const [type, setType] = useState<'restriction' | 'allergy'>('restriction');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [severity, setSeverity] = useState('moderate');

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const ingredientList = ingredients
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    if (ingredientList.length === 0) {
      Alert.alert('Error', 'Please enter at least one ingredient');
      return;
    }

    if (type === 'restriction') {
      onAddRestriction(name, description, ingredientList);
    } else {
      onAddAllergy(name, severity, description, ingredientList);
    }

    // Reset form
    setName('');
    setDescription('');
    setIngredients('');
    setSeverity('moderate');
    onClose();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Custom {type === 'restriction' ? 'Dietary Restriction' : 'Allergy'}</Text>
      
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'restriction' && styles.activeType]}
          onPress={() => setType('restriction')}
        >
          <Text style={[styles.typeText, type === 'restriction' && styles.activeTypeText]}>
            Dietary Restriction
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, type === 'allergy' && styles.activeType]}
          onPress={() => setType('allergy')}
        >
          <Text style={[styles.typeText, type === 'allergy' && styles.activeTypeText]}>
            Allergy
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name (e.g., Low Sodium, Shellfish)"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Ingredients to avoid (comma separated)"
        value={ingredients}
        onChangeText={setIngredients}
        multiline
        numberOfLines={3}
      />

      {type === 'allergy' && (
        <View style={styles.severityContainer}>
          <Text style={styles.label}>Severity:</Text>
          <View style={styles.severityButtons}>
            {['mild', 'moderate', 'severe'].map(sev => (
              <TouchableOpacity
                key={sev}
                style={[
                  styles.severityButton,
                  severity === sev && styles.activeSeverity,
                  sev === 'severe' && styles.severeButton
                ]}
                onPress={() => setSeverity(sev)}
              >
                <Text style={[
                  styles.severityText,
                  severity === sev && styles.activeSeverityText
                ]}>
                  {sev}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Add {type === 'restriction' ? 'Restriction' : 'Allergy'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeType: {
    backgroundColor: '#4CAF50',
  },
  typeText: {
    color: '#666',
  },
  activeTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  severityContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeSeverity: {
    backgroundColor: '#4CAF50',
  },
  severeButton: {
    backgroundColor: '#ffebee',
  },
  severityText: {
    color: '#666',
    textTransform: 'capitalize',
  },
  activeSeverityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});