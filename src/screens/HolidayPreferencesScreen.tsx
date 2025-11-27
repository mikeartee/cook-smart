import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {HOLIDAYS} from '../utils/holidays';

export default function HolidayPreferencesScreen({navigation}: any) {
  const [hiddenHolidays, setHiddenHolidays] = useState<string[]>([]);

  useEffect(() => {
    loadHiddenHolidays();
  }, []);

  const loadHiddenHolidays = async () => {
    try {
      const hidden = await AsyncStorage.getItem('hidden_holidays');
      if (hidden) {
        setHiddenHolidays(JSON.parse(hidden));
      }
    } catch (error) {
      console.error('Error loading hidden holidays:', error);
    }
  };

  const toggleHoliday = async (holidayName: string) => {
    try {
      let updated: string[];
      if (hiddenHolidays.includes(holidayName)) {
        updated = hiddenHolidays.filter(h => h !== holidayName);
      } else {
        updated = [...hiddenHolidays, holidayName];
      }
      await AsyncStorage.setItem('hidden_holidays', JSON.stringify(updated));
      setHiddenHolidays(updated);
    } catch (_error) {
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  const resetAll = async () => {
    Alert.alert('Reset Preferences', 'Show all holidays again?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Reset',
        onPress: async () => {
          await AsyncStorage.removeItem('hidden_holidays');
          setHiddenHolidays([]);
          Alert.alert('Success', 'All holidays will now be shown');
        },
      },
    ]);
  };

  const groupedHolidays = HOLIDAYS.reduce(
    (acc, holiday) => {
      if (!acc[holiday.culture]) {
        acc[holiday.culture] = [];
      }
      acc[holiday.culture].push(holiday);
      return acc;
    },
    {} as Record<string, typeof HOLIDAYS>,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Holiday Preferences</Text>
        <TouchableOpacity onPress={resetAll}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Icon name="info" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Toggle off holidays you don't celebrate. They won't appear on your
            home screen.
          </Text>
        </View>

        {Object.entries(groupedHolidays).map(([culture, holidays]) => (
          <View key={culture} style={styles.section}>
            <Text style={styles.sectionTitle}>{culture}</Text>
            {holidays.map(holiday => {
              const isHidden = hiddenHolidays.includes(holiday.name);
              return (
                <TouchableOpacity
                  key={holiday.name}
                  style={styles.holidayItem}
                  onPress={() => toggleHoliday(holiday.name)}>
                  <View style={styles.holidayInfo}>
                    <Text style={styles.holidayEmoji}>{holiday.emoji}</Text>
                    <Text style={styles.holidayName}>{holiday.name}</Text>
                  </View>
                  <Icon
                    name={isHidden ? 'visibility-off' : 'visibility'}
                    size={24}
                    color={isHidden ? '#9CA3AF' : '#10B981'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  content: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#D1FAE5',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  holidayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  holidayEmoji: {
    fontSize: 24,
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});
