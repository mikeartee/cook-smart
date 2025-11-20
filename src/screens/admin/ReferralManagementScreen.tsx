import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AdminCard} from '../../components/admin/AdminCard';
import {AdminTable} from '../../components/admin/AdminTable';
import axios from 'axios';
import {API_ENDPOINTS} from '../../config/api';
import {getAuthToken} from '../../utils/auth';

export const ReferralManagementScreen: React.FC = () => {
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({total: 0, completed: 0, pending: 0, rewards: 0});

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_ENDPOINTS.health.replace('/health', '')}/api/v1/admin/referrals`,
        {headers: {Authorization: `Bearer ${token}`}},
      );
      setReferrals(response.data.referrals || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const columns = [
    {key: 'referrerEmail', title: 'Referrer', width: 180},
    {key: 'referredEmail', title: 'Referred', width: 180},
    {key: 'status', title: 'Status', width: 100},
    {key: 'reward', title: 'Reward', width: 100, render: (v: number) => <Text>${v}</Text>},
    {key: 'createdAt', title: 'Date', width: 120, render: (v: Date) => <Text>{new Date(v).toLocaleDateString()}</Text>},
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); loadReferrals();}} />}>
        <View style={styles.content}>
          <AdminCard title="Total Referrals" value={stats.total} icon="people" color="#8B5CF6" />
          <AdminCard title="Completed" value={stats.completed} icon="check-circle" color="#10B981" />
          <AdminCard title="Pending" value={stats.pending} icon="hourglass-empty" color="#F59E0B" />
          <AdminCard title="Total Rewards" value={`$${stats.rewards}`} icon="card-giftcard" color="#EF4444" />
          <AdminTable columns={columns} data={referrals} emptyMessage="No referrals yet" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  content: {padding: 16},
});
