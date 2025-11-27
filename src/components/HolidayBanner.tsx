import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Holiday, getDaysUntilHoliday} from '../utils/holidays';

interface HolidayBannerProps {
  holiday: Holiday;
  onPress: () => void;
}

export default function HolidayBanner({holiday, onPress}: HolidayBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const daysUntil = getDaysUntilHoliday(holiday);

  if (dismissed) return null;

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{holiday.emoji}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {holiday.name}{' '}
            {daysUntil === 0
              ? 'is Today!'
              : `in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`}
          </Text>
          <Text style={styles.subtitle}>
            Tap to explore {holiday.name} recipes
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={e => {
          e.stopPropagation();
          setDismissed(true);
        }}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Icon name="close" size={20} color="#6B7280" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#B45309',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
