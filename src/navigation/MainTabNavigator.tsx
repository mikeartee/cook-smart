import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { IngredientInventoryScreen } from '../screens/ingredients/IngredientInventoryScreen';
import { AddIngredientScreen } from '../screens/ingredients/AddIngredientScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Ingredients Stack Navigator
const IngredientsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="IngredientInventory" component={IngredientInventoryScreen} />
    <Stack.Screen name="AddIngredient" component={AddIngredientScreen} />
  </Stack.Navigator>
);

// Placeholder screens - will be replaced with actual screens
const RecipesPlaceholder = () => (
  <View style={styles.placeholder}>
    <Icon name="restaurant" size={48} color="#10B981" />
    <Text style={styles.placeholderText}>Recipes</Text>
    <Text style={styles.placeholderSubtext}>Coming soon...</Text>
  </View>
);

const SavedRecipesPlaceholder = () => (
  <View style={styles.placeholder}>
    <Icon name="favorite" size={48} color="#10B981" />
    <Text style={styles.placeholderText}>Saved Recipes</Text>
    <Text style={styles.placeholderSubtext}>Coming soon...</Text>
  </View>
);

const MainTabNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '600',
          color: '#374151',
        },
        headerRight: () => (
          <View style={styles.headerRight}>
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>BETA</Text>
            </View>
            {user?.is_co_founder && (
              <View style={styles.coFounderBadgeSmall}>
                <Text style={styles.coFounderTextSmall}>👑</Text>
              </View>
            )}
          </View>
        ),
      }}
    >
      <Tab.Screen
        name="Ingredients"
        component={IngredientsStack}
        options={{
          title: 'Cook Smart 🍳',
          tabBarIcon: ({ color, size }) => (
            <Icon name="kitchen" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipesPlaceholder}
        options={{
          title: 'Cook Smart 🍳',
          tabBarIcon: ({ color, size }) => (
            <Icon name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SavedRecipes"
        component={SavedRecipesPlaceholder}
        options={{
          title: 'Cook Smart 🍳',
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <Icon name="favorite" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 8,
  },
  betaBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  betaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  coFounderBadgeSmall: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coFounderTextSmall: {
    fontSize: 12,
  },
});

export default MainTabNavigator;
