import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  betaUsers: number;
  totalRevenue: number;
  newUsersToday: number;
  failedPayments: number;
}

export const AdminDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    betaUsers: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    failedPayments: 0
  });

  const loadDashboardStats = async () => {
    // Mock stats - replace with actual API
    setStats({
      totalUsers: 1247,
      activeSubscriptions: 89,
      betaUsers: 1158,
      totalRevenue: 2199,
      newUsersToday: 23,
      failedPayments: 3
    });
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const StatCard = ({ title, value, color, subtitle }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const QuickAction = ({ title, icon, onPress }: any) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
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
            onPress={() => console.log('Navigate to users')}
          />
          <QuickAction
            title="Subscription Analytics"
            icon="📊"
            onPress={() => console.log('Navigate to analytics')}
          />
          <QuickAction
            title="Payment Issues"
            icon="💳"
            onPress={() => console.log('Navigate to payments')}
          />
          <QuickAction
            title="BETA Management"
            icon="🚧"
            onPress={() => console.log('Navigate to beta')}
          />
          <QuickAction
            title="Content Moderation"
            icon="🛡️"
            onPress={() => console.log('Navigate to moderation')}
          />
          <QuickAction
            title="System Health"
            icon="⚡"
            onPress={() => console.log('Navigate to health')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <Text style={styles.activityItem}>• 23 new users registered today</Text>
          <Text style={styles.activityItem}>• 5 new subscriptions this week</Text>
          <Text style={styles.activityItem}>• 3 payment failures require attention</Text>
          <Text style={styles.activityItem}>• BETA feedback: 4.8/5 average rating</Text>
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