import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface NutritionFactsProps {
  servings: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  cholesterol?: number;
}

export const NutritionFacts: React.FC<NutritionFactsProps> = ({
  servings,
  calories,
  protein,
  carbs,
  fat,
  fiber,
  sugar,
  sodium,
  saturatedFat,
  cholesterol,
}) => {
  // If no nutrition data available, don't render
  if (!calories && !protein && !carbs && !fat) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="restaurant" size={24} color="#10B981" />
        <Text style={styles.title}>Nutrition Facts</Text>
      </View>

      <View style={styles.servingInfo}>
        <Text style={styles.servingText}>
          Per Serving ({servings} servings)
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Calories - Large Display */}
      {calories && (
        <View style={styles.caloriesSection}>
          <Text style={styles.caloriesLabel}>Calories</Text>
          <Text style={styles.caloriesValue}>{Math.round(calories)}</Text>
        </View>
      )}

      <View style={styles.dividerThick} />

      {/* Macronutrients */}
      <View style={styles.nutrientSection}>
        {fat !== undefined && (
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Total Fat</Text>
            <Text style={styles.nutrientValue}>{fat.toFixed(1)}g</Text>
          </View>
        )}

        {saturatedFat !== undefined && (
          <View style={[styles.nutrientRow, styles.indented]}>
            <Text style={styles.nutrientLabelSmall}>Saturated Fat</Text>
            <Text style={styles.nutrientValueSmall}>
              {saturatedFat.toFixed(1)}g
            </Text>
          </View>
        )}

        {cholesterol !== undefined && (
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Cholesterol</Text>
            <Text style={styles.nutrientValue}>
              {Math.round(cholesterol)}mg
            </Text>
          </View>
        )}

        {sodium !== undefined && (
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Sodium</Text>
            <Text style={styles.nutrientValue}>{Math.round(sodium)}mg</Text>
          </View>
        )}

        {carbs !== undefined && (
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Total Carbohydrate</Text>
            <Text style={styles.nutrientValue}>{carbs.toFixed(1)}g</Text>
          </View>
        )}

        {fiber !== undefined && (
          <View style={[styles.nutrientRow, styles.indented]}>
            <Text style={styles.nutrientLabelSmall}>Dietary Fiber</Text>
            <Text style={styles.nutrientValueSmall}>{fiber.toFixed(1)}g</Text>
          </View>
        )}

        {sugar !== undefined && (
          <View style={[styles.nutrientRow, styles.indented]}>
            <Text style={styles.nutrientLabelSmall}>Sugars</Text>
            <Text style={styles.nutrientValueSmall}>{sugar.toFixed(1)}g</Text>
          </View>
        )}

        {protein !== undefined && (
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Protein</Text>
            <Text style={styles.nutrientValue}>{protein.toFixed(1)}g</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Icon name="info-outline" size={14} color="#9CA3AF" />
        <Text style={styles.footerText}>
          Nutrition information is per serving
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  servingInfo: {
    paddingVertical: 8,
  },
  servingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  dividerThick: {
    height: 8,
    backgroundColor: '#111827',
    marginVertical: 8,
  },
  caloriesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  caloriesLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#EF4444',
  },
  nutrientSection: {
    gap: 4,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  indented: {
    paddingLeft: 16,
  },
  nutrientLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  nutrientLabelSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  nutrientValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
