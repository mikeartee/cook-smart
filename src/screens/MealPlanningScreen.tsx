import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getMealPlans} from '../services/recipeEnhancementService';

export default function MealPlanningScreen() {
  const navigation = useNavigation();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState(new Date());

  useEffect(() => {
    loadMealPlans();
  }, [selectedDate]);

  const loadMealPlans = async () => {
    try {
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 3);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 3);

      const plans = await getMealPlans(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      );
      setMealPlans(plans);
    } catch (error) {
      console.error('Failed to load meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', {weekday: 'short'});
  };

  const getMealForDate = (date: Date, mealType: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealPlans.find(
      plan => plan.planned_date === dateStr && plan.meal_type === mealType,
    );
  };

  const days = getNext7Days();
  const mealTypes = ['breakfast', 'lunch', 'dinner'];

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
        <Icon name="calendar-today" size={32} color="#10B981" />
        <Text style={styles.title}>Meal Planning</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}>
        <View style={styles.calendarGrid} pointerEvents="box-none">
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.mealTypeCell}>
              <Text style={styles.mealTypeText}>Meal</Text>
            </View>
            {days.map((day, index) => (
              <View key={index} style={styles.dateCell}>
                <Text style={styles.dayName}>{getDayName(day)}</Text>
                <Text style={styles.dateText}>{formatDate(day)}</Text>
              </View>
            ))}
          </View>

          {/* Meal Rows */}
          {mealTypes.map(mealType => (
            <View
              key={mealType}
              style={styles.mealRow}
              pointerEvents="box-none">
              <View style={styles.mealTypeCell}>
                <Icon
                  name={
                    mealType === 'breakfast'
                      ? 'free-breakfast'
                      : mealType === 'lunch'
                        ? 'lunch-dining'
                        : 'dinner-dining'
                  }
                  size={20}
                  color="#6B7280"
                />
                <Text style={styles.mealTypeText}>
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </Text>
              </View>
              {days.map((day, index) => {
                const meal = getMealForDate(day, mealType);
                return (
                  <Pressable
                    key={index}
                    style={({pressed}) => [
                      styles.mealCell,
                      meal && styles.mealCellFilled,
                      pressed && styles.mealCellPressed,
                    ]}
                    onPress={() => {
                      const dateStr = day.toISOString().split('T')[0];
                      navigation.navigate('SavedRecipesList', {
                        selectMode: true,
                        date: dateStr,
                        mealType,
                      });
                    }}>
                    {meal ? (
                      <Text style={styles.mealText} numberOfLines={2}>
                        {meal.recipe_id}
                      </Text>
                    ) : (
                      <Icon name="add" size={24} color="#D1D5DB" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.infoBox}>
        <Icon name="info" size={20} color="#10B981" />
        <Text style={styles.infoText}>
          Tap any cell to add a recipe to your meal plan
        </Text>
      </View>
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
  calendarGrid: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mealRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mealTypeCell: {
    width: 100,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  dateCell: {
    width: 100,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginTop: 2,
  },
  mealCell: {
    width: 100,
    height: 80,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealCellFilled: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  mealCellPressed: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  mealText: {
    fontSize: 12,
    color: '#047857',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
  },
});
