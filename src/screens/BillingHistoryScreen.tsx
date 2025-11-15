import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { BillingHistoryItem } from '../components/BillingHistoryItem';

interface BillingItem {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending' | 'refunded';
  description: string;
  planName: string;
  receiptUrl?: string;
}

export const BillingHistoryScreen: React.FC = () => {
  const [billingHistory, setBillingHistory] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBillingHistory = async () => {
    try {
      // Mock billing history - replace with actual API call
      const mockHistory: BillingItem[] = [
        {
          id: 'inv_1',
          date: '2024-01-15',
          amount: 2499,
          status: 'paid',
          description: 'BETA Pre-Purchase - Yearly Plan',
          planName: 'BETA Pre-Purchase',
          receiptUrl: 'https://example.com/receipt/inv_1'
        },
        {
          id: 'inv_2',
          date: '2023-12-15',
          amount: 699,
          status: 'paid',
          description: 'Monthly Subscription',
          planName: 'Monthly Plan',
          receiptUrl: 'https://example.com/receipt/inv_2'
        },
        {
          id: 'inv_3',
          date: '2023-11-15',
          amount: 699,
          status: 'failed',
          description: 'Monthly Subscription - Payment Failed',
          planName: 'Monthly Plan'
        }
      ];
      
      setBillingHistory(mockHistory);
    } catch {
      Alert.alert('Error', 'Failed to load billing history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewReceipt = (receiptUrl: string) => {
    // In a real app, this would open the receipt URL
    Alert.alert('Receipt', `Would open: ${receiptUrl}`);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBillingHistory();
  };

  const getTotalSpent = () => {
    return billingHistory
      .filter(item => item.status === 'paid')
      .reduce((total, item) => total + item.amount, 0);
  };

  useEffect(() => {
    loadBillingHistory();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading billing history...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Billing History</Text>
        <Text style={styles.subtitle}>Your payment history and receipts</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryAmount}>
            ${(getTotalSpent() / 100).toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryCount}>{billingHistory.length}</Text>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        
        {billingHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Billing History</Text>
            <Text style={styles.emptyText}>
              Your payment history will appear here once you make a purchase.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {billingHistory.map(item => (
              <BillingHistoryItem
                key={item.id}
                item={item}
                onViewReceipt={handleViewReceipt}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>💡 Billing Info</Text>
        <Text style={styles.footerText}>
          • All transactions are securely processed{'\n'}
          • Receipts are available for download{'\n'}
          • During BETA, pre-purchases are held until launch{'\n'}
          • Contact support for billing questions
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summary: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  historySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  historyList: {
    // No additional styling needed
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});