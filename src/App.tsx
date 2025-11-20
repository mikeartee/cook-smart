import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {AuthProvider, useAuth} from './contexts/AuthContext';
import {IngredientProvider} from './contexts/IngredientContext';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import CoFounderWelcomeScreen from './screens/CoFounderWelcomeScreen';
import {ForgotPasswordScreen} from './screens/ForgotPasswordScreen';
import {ResetPasswordScreen} from './screens/ResetPasswordScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import CookieConsent from './components/CookieConsent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

const AppContent = () => {
  const {isAuthenticated, isLoading, user} = useAuth();
  const [showCoFounderWelcome, setShowCoFounderWelcome] = useState(false);
  const [checkingWelcome, setCheckingWelcome] = useState(true);

  useEffect(() => {
    const checkCoFounderWelcome = async () => {
      // Show welcome screen for Briana (creator) or Donna (special user)
      if (user?.is_creator || user?.is_special_user) {
        const storageKey = user?.is_creator
          ? 'creator_welcome_shown'
          : 'special_user_welcome_shown';
        const hasShown = await AsyncStorage.getItem(storageKey);
        setShowCoFounderWelcome(!hasShown);
      }
      setCheckingWelcome(false);
    };

    if (!isLoading && isAuthenticated) {
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
          <Stack.Navigator screenOptions={{headerShown: false}}>
            {showCoFounderWelcome ? (
              <>
                <Stack.Screen
                  name="CoFounderWelcome"
                  component={CoFounderWelcomeScreen}
                />
                <Stack.Screen name="Main" component={MainTabNavigator} />
              </>
            ) : (
              <>
                <Stack.Screen name="Main" component={MainTabNavigator} />
              </>
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
        <AppContent />
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
