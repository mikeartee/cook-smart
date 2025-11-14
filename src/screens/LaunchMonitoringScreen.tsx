import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';

interface LaunchMetrics {
  userSignups: { today: number; total: number; growth: number };
  subscriptions: { active: number; revenue: number; conversion: number };
  performance: { uptime: number; responseTime: number; errorRate: number };
  feedback: { rating: number; count: number; issues: number };
  betaTransition: { betaUsers: number; converted: number; rate: number };
}

interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export const LaunchMonitoringScreen: React.FC = () => {
  const [metrics, setMetrics] = useState<LaunchMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);

  const loadLaunchMetrics = async () => {
    // Mock launch metrics - replace with actual API
    const mockMetrics: LaunchMetrics = {
      userSignups: {
        today: 47,
        total: 1294,
        growth: 12.5
      },
      subscriptions: {
        active: 156,
        revenue: 1847,
        conversion: 12.1
      },
      performance: {
        uptime: 99.8,
        responseTime: 245,
        errorRate: 0.02
      },
      feedback: {
        rating: 4.7,
        count: 89,
        issues: 3
      },
      betaTransition: {
        betaUsers: 1158,
        converted: 140,
        rate: 12.1
      }
    };

    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'success',
        title: 'Launch Milestone',
        message: 'Successfully reached 1000+ total users!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: false
      },
      {
        id: '2',
        type: 'warning',
        title: 'High Server Load',
        message: 'Server CPU usage at 85%. Consider scaling.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        resolved: false
      },
      {
        id: '3',
        type: 'info',
        title: 'BETA Transition',
        message: '12% of BETA users have converted to paid plans',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        resolved: false
      }
    ];

    setMetrics(mockMetrics);
    setAlerts(mockAlerts);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLaunchMetrics();
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'info': return '#2196F3';
      default: return '#666';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return '🎉';
      case 'warning': return '⚠️';
      case 'error': return '🚨';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const MetricCard = ({ title, value, subtitle, color, trend }: any) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
      {trend && (
        <Text style={[styles.metricTrend, { color: trend > 0 ? '#4CAF50' : '#F44336' }]}>
          {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
        </Text>
      )}
    </View>
  );

  const AlertCard = ({ alert }: { alert: Alert }) => (
    <View style={[
      styles.alertCard,
      { borderLeftColor: getAlertColor(alert.type) },
      alert.resolved && styles.resolvedAlert
    ]}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertMessage}>{alert.message}</Text>
          <Text style={styles.alertTime}>
            {new Date(alert.timestamp).toLocaleString()}
          </Text>
        </View>
        {!alert.resolved && (
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => resolveAlert(alert.id)}
          >
            <Text style={styles.resolveButtonText}>✓</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  useEffect(() => {
    loadLaunchMetrics();
    
    // Auto-refresh every 30 seconds when live
    const interval = setInterval(() => {
      if (isLive) {
        loadLaunchMetrics();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isLive]);

  if (!metrics) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading launch metrics...</Text>
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
        <Text style={styles.title}>📊 Launch Monitoring</Text>
        <TouchableOpacity
          style={[styles.liveButton, { backgroundColor: isLive ? '#4CAF50' : '#666' }]}
          onPress={() => setIsLive(!isLive)}
        >
          <Text style={styles.liveButtonText}>
            {isLive ? '● LIVE' : '○ PAUSED'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="User Signups"
            value={metrics.userSignups.total.toLocaleString()}
            subtitle={`+${metrics.userSignups.today} today`}
            color="#4CAF50"
            trend={metrics.userSignups.growth}
          />
          <MetricCard
            title="Active Subscriptions"
            value={metrics.subscriptions.active}
            subtitle={`$${(metrics.subscriptions.revenue / 100).toFixed(2)} revenue`}
            color="#2196F3"
          />
          <MetricCard
            title="System Uptime"
            value={`${metrics.performance.uptime}%`}
            subtitle={`${metrics.performance.responseTime}ms avg response`}
            color={metrics.performance.uptime > 99 ? '#4CAF50' : '#FF9800'}
          />
          <MetricCard
            title="User Rating"
            value={metrics.feedback.rating.toFixed(1)}
            subtitle={`${metrics.feedback.count} reviews`}
            color="#FF9800"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BETA Transition</Text>
        <View style={styles.betaCard}>
          <View style={styles.betaStats}>
            <View style={styles.betaStat}>
              <Text style={styles.betaStatValue}>{metrics.betaTransition.betaUsers}</Text>
              <Text style={styles.betaStatLabel}>BETA Users</Text>
            </View>
            <View style={styles.betaStat}>
              <Text style={[styles.betaStatValue, { color: '#4CAF50' }]}>
                {metrics.betaTransition.converted}
              </Text>
              <Text style={styles.betaStatLabel}>Converted</Text>
            </View>
            <View style={styles.betaStat}>
              <Text style={[styles.betaStatValue, { color: '#2196F3' }]}>
                {metrics.betaTransition.rate}%
              </Text>
              <Text style={styles.betaStatLabel}>Conversion Rate</Text>
            </View>
          </View>
          <Text style={styles.betaNote}>
            BETA to paid conversion is {metrics.betaTransition.rate > 10 ? 'exceeding' : 'meeting'} expectations
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {alerts.filter(alert => !alert.resolved).length === 0 ? (
          <View style={styles.noAlerts}>
            <Text style={styles.noAlertsText}>✅ No active alerts</Text>
          </View>
        ) : (
          alerts.filter(alert => !alert.resolved).map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Launch Status</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>🚀 Cook Smart Launch Status</Text>
          <Text style={styles.statusText}>
            • Launch successful with {metrics.userSignups.total}+ users{'\n'}
            • {metrics.subscriptions.active} active subscriptions generating revenue{'\n'}
            • System performance stable at {metrics.performance.uptime}% uptime{'\n'}
            • User satisfaction high with {metrics.feedback.rating}/5 rating{'\n'}
            • BETA transition proceeding smoothly
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  liveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  metricTrend: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  betaCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  betaStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  betaStat: {
    alignItems: 'center',
  },
  betaStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  betaStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  betaNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  resolvedAlert: {
    opacity: 0.6,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  resolveButton: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noAlerts: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  noAlertsText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  statusCard: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#388E3C',
    lineHeight: 20,
  },
});