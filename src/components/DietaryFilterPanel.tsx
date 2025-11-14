import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface DietaryRestriction {
  id: string;
  name: string;
  category: string;
}

interface Allergy {
  id: string;
  name: string;
  severity: string;
}

interface Props {
  restrictions: DietaryRestriction[];
  allergies: Allergy[];
  selectedRestrictions: string[];
  selectedAllergies: string[];
  onRestrictionToggle: (id: string) => void;
  onAllergyToggle: (id: string) => void;
}

export const DietaryFilterPanel: React.FC<Props> = ({
  restrictions,
  allergies,
  selectedRestrictions,
  selectedAllergies,
  onRestrictionToggle,
  onAllergyToggle
}) => {
  const [activeTab, setActiveTab] = useState<'restrictions' | 'allergies'>('restrictions');

  const renderRestrictions = () => (
    <View style={styles.itemsContainer}>
      {restrictions.map(restriction => (
        <TouchableOpacity
          key={restriction.id}
          style={[
            styles.filterItem,
            selectedRestrictions.includes(restriction.id) && styles.selectedItem
          ]}
          onPress={() => onRestrictionToggle(restriction.id)}
        >
          <Text style={[
            styles.itemText,
            selectedRestrictions.includes(restriction.id) && styles.selectedText
          ]}>
            {restriction.name}
          </Text>
          <Text style={styles.categoryText}>{restriction.category}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAllergies = () => (
    <View style={styles.itemsContainer}>
      {allergies.map(allergy => (
        <TouchableOpacity
          key={allergy.id}
          style={[
            styles.filterItem,
            selectedAllergies.includes(allergy.id) && styles.selectedItem,
            allergy.severity === 'severe' && styles.severeItem
          ]}
          onPress={() => onAllergyToggle(allergy.id)}
        >
          <Text style={[
            styles.itemText,
            selectedAllergies.includes(allergy.id) && styles.selectedText
          ]}>
            {allergy.name}
          </Text>
          <Text style={[styles.severityText, allergy.severity === 'severe' ? styles.severeText : allergy.severity === 'moderate' ? styles.moderateText : styles.mildText]}>
            {allergy.severity}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'restrictions' && styles.activeTab]}
          onPress={() => setActiveTab('restrictions')}
        >
          <Text style={[styles.tabText, activeTab === 'restrictions' && styles.activeTabText]}>
            Dietary Restrictions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'allergies' && styles.activeTab]}
          onPress={() => setActiveTab('allergies')}
        >
          <Text style={[styles.tabText, activeTab === 'allergies' && styles.activeTabText]}>
            Allergies
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'restrictions' ? renderRestrictions() : renderAllergies()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemsContainer: {
    gap: 8,
  },
  filterItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  selectedItem: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  severeItem: {
    borderColor: '#f44336',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedText: {
    color: '#4CAF50',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  severeText: {
    color: '#f44336',
  },
  moderateText: {
    color: '#ff9800',
  },
  mildText: {
    color: '#4CAF50',
  },
});