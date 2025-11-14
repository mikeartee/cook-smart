import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BillingItem {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending' | 'refunded';
  description: string;
  planName: string;
  receiptUrl?: string;
}

interface BillingHistoryItemProps {
  item: BillingItem;
  onViewReceipt?: (receiptUrl: string) => void;
}

export const BillingHistoryItem: React.FC<BillingHistoryItemProps> = ({
  item,
  onViewReceipt
}) => {
  const getStatusConfig = () => {
    switch (item.status) {
      case 'paid':
        return { color: '#4CAF50', text: 'PAID', icon: '✅' };
      case 'failed':
        return { color: '#F44336', text: 'FAILED', icon: '❌' };
      case 'pending':
        return { color: '#FF9800', text: 'PENDING', icon: '⏳' };
      case 'refunded':
        return { color: '#2196F3', text: 'REFUNDED', icon: '↩️' };
      default:
        return { color: '#666', text: 'UNKNOWN', icon: '❓' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateAmount}>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
          <Text style={styles.amount}>${(item.amount / 100).toFixed(2)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
          <Text style={styles.statusText}>{statusConfig.text}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.planName}>{item.planName}</Text>
      
      {item.receiptUrl && onViewReceipt && (
        <TouchableOpacity 
          style={styles.receiptButton}
          onPress={() => onViewReceipt(item.receiptUrl!)}
        >
          <Text style={styles.receiptButtonText}>📄 View Receipt</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateAmount: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  planName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  receiptButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  receiptButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
});