import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import CoFounderWelcomeScreen from './screens/CoFounderWelcomeScreen';
import CookieConsent from './components/CookieConsent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const HomeScreen = () => {
  const { user } = useAuth();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcome}>
          Welcome{user?.first_name ? `, ${user.first_name}` : ''}! 🍳
        </Text>
        <Text style={styles.betaLabel}>BETA VERSION</Text>
        
        {user?.is_co_founder && (
          <View style={styles.coFounderBadge}>
            <Text style={styles.coFounderText}>👑 CO-FOUNDER</Text>
            <Text style={styles.coFounderSubtext}>
              Thank you for inspiring Cook Smart!
            </Text>
          </View>
        )}
        
        <Text style={styles.comingSoon}>
          Recipe features coming soon...
        </Text>
      </View>
    </SafeAreaView>
  );
};

const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showCoFounderWelcome, setShowCoFounderWelcome] = useState(false);
  const [checkingWelcome, setCheckingWelcome] = useState(true);

  useEffect(() => {
    const checkCoFounderWelcome = async () => {
      if (user?.is_co_founder) {
        const hasShown = await AsyncStorage.getItem('cofounder_welcome_shown');
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
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {showCoFounderWelcome ? (
              <>
                <Stack.Screen name="CoFounderWelcome" component={CoFounderWelcomeScreen} />
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen}
                  options={{ headerShown: true, title: 'Cook Smart 🍳' }}
                />
              </>
            ) : (
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ headerShown: true, title: 'Cook Smart 🍳' }}
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
      <AppContent />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  betaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  coFounderBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  coFounderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  coFounderSubtext: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
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