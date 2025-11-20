import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AdminCard} from '../../components/admin/AdminCard';
import axios from 'axios';
import {API_ENDPOINTS} from '../../config/api';
import {getAuthToken} from '../../utils/auth';

export const CostTrackingScreen: React.FC = () => {
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [costs, setCosts] = useState({
    total: 0,
    rds: 0,
    s3: 0,
    ec2: 0,
    apis: 0,
    daily: 0,
    monthly: 0,
  });

  useEffect(() => {
    loadCosts();
  }, []);

  const loadCosts = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_ENDPOINTS.health.replace('/health', '')}/api/v1/admin/costs`,
        {headers: {Authorization: `Bearer ${token}`}},
      );
      setCosts(response.data.costs || costs);
    } catch (error) {
      console.error('Error loading costs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); loadCosts();}} />
        }>
        <View style={styles.content}>
          <AdminCard title="Total Monthly" value={`$${costs.monthly.toFixed(2)}`} icon="attach-money" color="#8B5CF6" />
          <AdminCard title="Daily Average" value={`$${costs.daily.toFixed(2)}`} icon="today" color="#3B82F6" />
          <AdminCard title="RDS Database" value={`$${costs.rds.toFixed(2)}`} icon="storage" color="#10B981" />
          <AdminCard title="S3 Storage" value={`$${costs.s3.toFixed(2)}`} icon="cloud" color="#F59E0B" />
          <AdminCard title="EC2 Compute" value={`$${costs.ec2.toFixed(2)}`} icon="computer" color="#EF4444" />
          <AdminCard title="API Calls" value={`$${costs.apis.toFixed(2)}`} icon="api" color="#6366F1" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  content: {padding: 16},
});
