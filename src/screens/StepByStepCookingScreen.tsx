import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import advancedRecipeService from '../services/advancedRecipeService';

export default function StepByStepCookingScreen({route, navigation}: any) {
  const {recipe} = route.params;
  const [currentStep, setCurrentStep] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [timers, setTimers] = useState<any>([]);

  const steps =
    recipe.instructions?.split('\n').filter((s: string) => s.trim()) || [];

  useEffect(() => {
    startSession();
    loadTimers();
  }, []);

  const startSession = async () => {
    try {
      const response = await advancedRecipeService.startCookingSession(
        recipe.id,
      );
      if (response.success) {
        setSession(response.session);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const loadTimers = async () => {
    try {
      const response = await advancedRecipeService.getTimers(recipe.id);
      if (response.success) {
        setTimers(response.timers);
      }
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (session) {
        await advancedRecipeService.updateCookingSession(session.id, nextStep);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (session) {
      await advancedRecipeService.completeCookingSession(session.id);
    }
    Alert.alert('Cooking Complete!', 'Enjoy your meal! 🍽️', [
      {text: 'Done', onPress: () => navigation.goBack()},
    ]);
  };

  const currentTimer = timers.find((t: any) => t.step_number === currentStep);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepCounter}>
          Step {currentStep + 1} of {steps.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {width: `${((currentStep + 1) / steps.length) * 100}%`},
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.stepText}>{steps[currentStep]}</Text>

        {currentTimer && (
          <View style={styles.timerCard}>
            <Icon name="timer" size={24} color="#10B981" />
            <Text style={styles.timerText}>
              {currentTimer.timer_label || 'Timer'}:{' '}
              {currentTimer.duration_minutes} min
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, currentStep === 0 && styles.buttonDisabled]}
          onPress={handlePrevious}
          disabled={currentStep === 0}>
          <Icon name="arrow-back" size={24} color="white" />
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <Icon name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  stepCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#10B981',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
