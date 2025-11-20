import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {AdminCard} from '../../components/admin/AdminCard';
import {AdminTable} from '../../components/admin/AdminTable';
import axios from 'axios';
import {API_ENDPOINTS} from '../../config/api';
import {getAuthToken} from '../../utils/auth';

interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: string;
  plan: string;
  amount: number;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
}

export const SubscriptionManagementScreen: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<Subscription[]>([]);
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    cancelled: 0,
    expired: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [searchQuery, filterStatus, subscriptions]);

  const loadSubscriptions = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_ENDPOINTS.health.replace('/health', '')}/api/v1/admin/subscriptions`,
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      setSubscriptions(response.data.subscriptions || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      Alert.alert('Error', 'Failed to load subscriptions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        sub =>
          sub.userEmail?.toLowerCase().includes(query) ||
          sub.userName?.toLowerCase().includes(query) ||
          sub.id?.toLowerCase().includes(query),
      );
    }

    setFilteredSubs(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSubscriptions();
  };

  const handleCancelSubscription = (subscription: Subscription) => {
    Alert.alert(
      'Cancel Subscription',
      `Cancel subscription for ${subscription.userEmail}?`,
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              await axios.post(
                `${API_ENDPOINTS.health.replace('/health', '')}/api/v1/admin/subscriptions/${subscription.id}/cancel`,
                {},
                {
                  headers: {Authorization: `Bearer ${token}`},
                },
              );

              Alert.alert('Success', 'Subscription cancelled');
              loadSubscriptions();
            } catch (error) {
              console.error('Error cancelling subscription:', error);
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'expired':
        return '#6B7280';
      default:
        return '#F59E0B';
    }
  };

  const columns = [
    {
      key: 'userEmail',
      title: 'User',
      width: 200,
    },
    {
      key: 'plan',
      title: 'Plan',
      width: 120,
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: (value: string) => (
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: `${getStatusColor(value)}15`},
          ]}>
          <Text style={[styles.statusText, {color: getStatusColor(value)}]}>
            {value}
          </Text>
        </View>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      width: 100,
      render: (value: number) => (
        <Text style={styles.cellText}>${(value / 100).toFixed(2)}</Text>
      ),
    },
    {
      key: 'startDate',
      title: 'Start Date',
      width: 120,
      render: (value: Date) => (
        <Text style={styles.cellText}>
          {new Date(value).toLocaleDateString()}
        </Text>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (_: any, row: Subscription) => (
        <TouchableOpacity
          onPress={() => handleCancelSubscription(row)}
          disabled={row.status !== 'active'}>
          <Icon
            name="cancel"
            size={20}
            color={row.status === 'active' ? '#EF4444' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <AdminCard
            title="Total Subscriptions"
            value={stats.total}
            icon="card-membership"
            color="#3B82F6"
          />
          <AdminCard
            title="Active"
            value={stats.active}
            icon="check-circle"
            color="#10B981"
          />
          <AdminCard
            title="Cancelled"
            value={stats.cancelled}
            icon="cancel"
            color="#EF4444"
          />
          <AdminCard
            title="Total Revenue"
            value={`$${(stats.revenue / 100).toFixed(2)}`}
            icon="attach-money"
            color="#8B5CF6"
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by email or name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterButtons}>
            {['all', 'active', 'cancelled', 'expired'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filterStatus === status && styles.filterButtonActive,
                ]}
                onPress={() => setFilterStatus(status)}>
                <Text
                  style={[
                    styles.filterButtonText,
                    filterStatus === status && styles.filterButtonTextActive,
                  ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <AdminTable
            columns={columns}
            data={filteredSubs}
            emptyMessage="No subscriptions found"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  tableContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cellText: {
    fontSize: 14,
    color: '#1F2937',
  },
});
