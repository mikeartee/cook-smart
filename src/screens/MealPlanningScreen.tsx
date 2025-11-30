import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  getMealPlans,
  deleteMealPlan,
} from '../services/recipeEnhancementService';
import recipeService from '../services/recipeService';

export default function MealPlanningScreen() {
  const navigation = useNavigation();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadMealPlans();
    }, [selectedDate]),
  );

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMealPlans();
    setRefreshing(false);
  };

  const handleDeleteMeal = async (mealPlanId: number) => {
    try {
      await deleteMealPlan(mealPlanId);

      // Update the modal list immediately
      const updatedMeals = selectedMeals.filter(meal => meal.id !== mealPlanId);
      setSelectedMeals(updatedMeals);

      // Close modal if no more meals
      if (updatedMeals.length === 0) {
        setModalVisible(false);
      }

      // Reload meal plans in background
      await loadMealPlans();
    } catch (_error) {
      Alert.alert('Error', 'Failed to delete meal');
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

  const getMealsForDate = (date: Date, mealType: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const filtered = mealPlans.filter(plan => {
      // Normalize both dates for comparison - handle both string and Date formats
      let planDate = plan.planned_date;
      if (typeof planDate === 'string') {
        planDate = planDate.split('T')[0];
      } else if (planDate instanceof Date) {
        planDate = planDate.toISOString().split('T')[0];
      }
      return planDate === dateStr && plan.meal_type === mealType;
    });
    return filtered;
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
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }>
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
                const meals = getMealsForDate(day, mealType);
                const hasMeals = meals.length > 0;
                return (
                  <Pressable
                    key={index}
                    style={({pressed}) => [
                      styles.mealCell,
                      hasMeals && styles.mealCellFilled,
                      pressed && styles.mealCellPressed,
                    ]}
                    onPress={async () => {
                      if (hasMeals) {
                        // Show modal with existing meals and fetch recipe details
                        setSelectedMeals(meals);
                        setModalVisible(true);
                        setLoadingRecipes(true);

                        // Fetch recipe details for each meal
                        const mealsWithDetails = await Promise.all(
                          meals.map(async meal => {
                            try {
                              const recipe = await recipeService.getRecipeById(
                                meal.recipe_id,
                              );
                              if (recipe) {
                                return {
                                  ...meal,
                                  recipeName:
                                    recipe.title || `Recipe #${meal.recipe_id}`,
                                  recipeImage: recipe.image,
                                };
                              }
                              return {
                                ...meal,
                                recipeName: `Recipe #${meal.recipe_id}`,
                              };
                            } catch (error) {
                              console.error(
                                'Failed to load recipe details:',
                                error,
                              );
                              return {
                                ...meal,
                                recipeName: `Recipe #${meal.recipe_id}`,
                              };
                            }
                          }),
                        );

                        setSelectedMeals(mealsWithDetails);
                        setLoadingRecipes(false);
                      } else {
                        // Navigate to add new meals
                        const dateStr = day.toISOString().split('T')[0];
                        (navigation as any).navigate('SavedRecipesList', {
                          selectMode: true,
                          date: dateStr,
                          mealType,
                        });
                      }
                    }}>
                    {hasMeals ? (
                      <View style={styles.mealsContainer}>
                        <Text style={styles.mealCount}>
                          {meals.length} recipe{meals.length > 1 ? 's' : ''}
                        </Text>
                      </View>
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

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Planned Meals</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {loadingRecipes ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text style={styles.loadingText}>Loading recipes...</Text>
                </View>
              ) : (
                selectedMeals.map(meal => (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.mealItem}
                    onPress={() => {
                      setModalVisible(false);
                      (navigation as any).navigate('Recipes', {
                        screen: 'RecipeDetail',
                        params: {recipeId: meal.recipe_id},
                      });
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.mealItemInfo}>
                      <Text style={styles.mealItemTitle}>
                        {meal.recipeName || `Recipe #${meal.recipe_id}`}
                      </Text>
                      <Text style={styles.mealItemDate}>
                        {meal.planned_date?.split('T')[0]}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={e => {
                        e.stopPropagation();
                        handleDeleteMeal(meal.id);
                      }}
                      style={styles.deleteButton}>
                      <Icon name="delete" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
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
  mealsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalList: {
    padding: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  mealItemDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});
