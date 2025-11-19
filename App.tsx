import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {AuthProvider, useAuth} from './src/contexts/AuthContext';
import {IngredientProvider} from './src/contexts/IngredientContext';
import {RecipeProvider} from './src/contexts/RecipeContext';
import {SubscriptionProvider} from './src/contexts/SubscriptionContext';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import CoFounderWelcomeScreen from './src/screens/CoFounderWelcomeScreen';
import SpecialUserWelcomeScreen from './src/screens/SpecialUserWelcomeScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import CookieConsent from './src/components/CookieConsent';
// Recipe API Migration Complete - TheMealDB Active
import AsyncStorage from '@react-native-async-storage/async-storage';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {productLookupService} from './src/services/productLookupService';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
  </Stack.Navigator>
);

const AppContent = () => {
  const {isAuthenticated, isLoading, user} = useAuth();
  const [showCoFounderWelcome, setShowCoFounderWelcome] = useState(false);
  const [showSpecialUserWelcome, setShowSpecialUserWelcome] = useState(false);
  const [checkingWelcome, setCheckingWelcome] = useState(true);

  // Cleanup expired barcode cache on app startup
  useEffect(() => {
    productLookupService.clearExpiredCache().catch(error => {
      console.error('Failed to clear expired barcode cache:', error);
    });
  }, []);

  useEffect(() => {
    const checkWelcomeScreens = async () => {
      if (user?.is_co_founder) {
        const hasShown = await AsyncStorage.getItem('cofounder_welcome_shown');
        setShowCoFounderWelcome(!hasShown);
      } else if (user?.is_special_user) {
        const hasShown = await AsyncStorage.getItem(
          'special_user_welcome_shown',
        );
        setShowSpecialUserWelcome(!hasShown);
      }
      setCheckingWelcome(false);
    };

    if (!isLoading && isAuthenticated) {
      checkWelcomeScreens();
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
          <Stack.Navigator
            screenOptions={{headerShown: false}}
            initialRouteName={
              showCoFounderWelcome
                ? 'CoFounderWelcome'
                : showSpecialUserWelcome
                  ? 'SpecialUserWelcome'
                  : 'Main'
            }>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            {/* Special screens - always available for revisiting */}
            <Stack.Screen
              name="CoFounderWelcome"
              component={CoFounderWelcomeScreen}
            />
            <Stack.Screen
              name="SpecialUserWelcome"
              component={SpecialUserWelcomeScreen}
            />
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
      <SubscriptionProvider>
        <IngredientProvider>
          <RecipeProvider>
            <AppContent />
          </RecipeProvider>
        </IngredientProvider>
      </SubscriptionProvider>
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
