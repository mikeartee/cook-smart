import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { IngredientProvider } from './src/contexts/IngredientContext';
import { RecipeProvider } from './src/contexts/RecipeContext';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import CoFounderWelcomeScreen from './src/screens/CoFounderWelcomeScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import CookieConsent from './src/components/CookieConsent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showCoFounderWelcome, setShowCoFounderWelcome] = useState(false);
  const [checkingWelcome, setCheckingWelcome] = useState(true);

  useEffect(() => {
    const checkCoFounderWelcome = async () => {
      // TEMPORARY: Always show welcome screen for testing
      const hasShown = await AsyncStorage.getItem('cofounder_welcome_shown');
      console.log('Welcome screen check:', { hasShown });
      setShowCoFounderWelcome(hasShown === null || hasShown === undefined);
      setCheckingWelcome(false);
    };

    // TEMPORARY: Run check even without auth for testing
    if (!isLoading) {
      checkCoFounderWelcome();
    } else {
      setCheckingWelcome(false);
    }
  }, [user, isAuthenticated, isLoading]);

  if (isLoading || checkingWelcome) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading Cook Smart...</Text>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        {isAuthenticated ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {showCoFounderWelcome ? (
              <>
                <Stack.Screen name="CoFounderWelcome" component={CoFounderWelcomeScreen} />
                <Stack.Screen 
                  name="Main" 
                  component={MainTabNavigator}
                />
              </>
            ) : (
              <Stack.Screen 
                name="Main" 
                component={MainTabNavigator}
              />
            )}
          </Stack.Navigator>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
      <CookieConsent />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <IngredientProvider>
        <RecipeProvider>
          <AppContent />
        </RecipeProvider>
      </IngredientProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default App;
