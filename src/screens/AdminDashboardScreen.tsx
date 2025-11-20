import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  betaUsers: number;
  totalRevenue: number;
  newUsersToday: number;
  failedPayments: number;
}

interface Props {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<Props> = ({navigation}) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    betaUsers: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    failedPayments: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardStats = async () => {
    try {
      console.log('📊 Loading dashboard stats...');
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(
        'http://3.237.38.24:3000/api/v1/admin/dashboard/stats',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.error('❌ Stats fetch failed:', response.status);
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      console.log('📈 Stats received:', data.stats);
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
      // Keep default zeros on error
    }
  };

  const onRefresh = async () => {
    console.log('🔄 Admin Dashboard: Refreshing data...');
    setRefreshing(true);
    await loadDashboardStats();
    setRefreshing(false);
    console.log('✅ Admin Dashboard: Refresh complete');
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const StatCard = ({title, value, color, subtitle}: any) => (
    <View style={[styles.statCard, {borderLeftColor: color}]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, {color}]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const QuickAction = ({title, icon, onPress}: any) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#10B981']} // Android
          tintColor="#10B981" // iOS
        />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Cook Smart Management</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          color="#4CAF50"
          subtitle={`+${stats.newUsersToday} today`}
        />
        <StatCard
          title="BETA Users"
          value={stats.betaUsers.toLocaleString()}
          color="#FF9800"
          subtitle="Free access"
        />
        <StatCard
          title="Paid Subscriptions"
          value={stats.activeSubscriptions}
          color="#2196F3"
          subtitle="Active paying"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 100).toFixed(2)}`}
          color="#9C27B0"
          subtitle="All time"
        />
        <StatCard
          title="Failed Payments"
          value={stats.failedPayments}
          color="#F44336"
          subtitle="Needs attention"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            title="User Management"
            icon="👥"
            onPress={() => navigation.navigate('AdminUsers')}
          />
          <QuickAction
            title="Subscriptions"
            icon="💳"
            onPress={() => navigation.navigate('SubscriptionManagement')}
          />
          <QuickAction
            title="Feedback"
            icon="💬"
            onPress={() => navigation.navigate('FeedbackManagement')}
          />
          <QuickAction
            title="Error Logs"
            icon="🐛"
            onPress={() => navigation.navigate('ErrorLogs')}
          />
          <QuickAction
            title="System Guardian"
            icon="🛡️"
            onPress={() => navigation.navigate('SystemGuardian')}
          />
          <QuickAction
            title="Cost Tracking"
            icon="💰"
            onPress={() => navigation.navigate('CostTracking')}
          />
          <QuickAction
            title="Referrals"
            icon="🎁"
            onPress={() => navigation.navigate('ReferralManagement')}
          />
          <QuickAction
            title="Analytics"
            icon="📊"
            onPress={() => navigation.navigate('AdminAnalytics')}
          />
          <QuickAction
            title="System Health"
            icon="⚡"
            onPress={() => navigation.navigate('AdminSystemHealth')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <Text style={styles.activityItem}>
            • {stats.newUsersToday} new users registered today
          </Text>
          <Text style={styles.activityItem}>
            • {stats.activeSubscriptions} active subscriptions
          </Text>
          <Text style={styles.activityItem}>
            • {stats.failedPayments} payment failures require attention
          </Text>
          <Text style={styles.activityItem}>
            • {stats.betaUsers} BETA users testing the app
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    minHeight: 80,
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  activityItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
