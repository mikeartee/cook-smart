import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AdminCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  onPress?: () => void;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = '#10B981',
  onPress,
}) => {
  const CardContent = (
    <View style={[styles.card, {borderLeftColor: color}]}>
      {icon && (
        <View style={[styles.iconContainer, {backgroundColor: `${color}15`}]}>
          <Icon name={icon} size={24} color={color} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, {color}]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {onPress && <Icon name="chevron-right" size={24} color="#9CA3AF" />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
