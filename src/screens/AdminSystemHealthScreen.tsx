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

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  services: {
    database: 'online' | 'offline' | 'slow';
    api: 'online' | 'offline' | 'slow';
    payments: 'online' | 'offline' | 'slow';
    storage: 'online' | 'offline' | 'slow';
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    activeUsers: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  alerts: {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
  }[];
}

export const AdminSystemHealthScreen: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSystemHealth = async () => {
    try {
      console.log('🏥 Loading system health from API...');
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(
        'http://3.237.38.24:3000/api/v1/admin/health/overview',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.error('❌ Health fetch failed:', response.status);
        throw new Error('Failed to fetch system health');
      }

      const data = await response.json();
      console.log('✅ Health data received:', data);

      if (data.success && data.health) {
        setHealth(data.health);
      }
    } catch (error) {
      console.error('❌ Error loading system health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return '#4CAF50';
      case 'warning':
      case 'slow':
        return '#FF9800';
      case 'critical':
      case 'offline':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return '✅';
      case 'warning':
      case 'slow':
        return '⚠️';
      case 'critical':
      case 'offline':
        return '❌';
      default:
        return '❓';
    }
  };

  const ServiceStatus = ({name, status}: {name: string; status: string}) => (
    <View style={styles.serviceItem}>
      <Text style={styles.serviceIcon}>{getStatusIcon(status)}</Text>
      <Text style={styles.serviceName}>{name}</Text>
      <View
        style={[
          styles.serviceStatus,
          {backgroundColor: getStatusColor(status)},
        ]}>
        <Text style={styles.serviceStatusText}>{status.toUpperCase()}</Text>
      </View>
    </View>
  );

  const MetricCard = ({title, value, unit, color}: any) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, {color}]}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
  );

  const AlertItem = ({alert}: {alert: any}) => (
    <View
      style={[styles.alertItem, {borderLeftColor: getStatusColor(alert.type)}]}>
      <Text style={styles.alertIcon}>{getStatusIcon(alert.type)}</Text>
      <View style={styles.alertContent}>
        <Text style={styles.alertMessage}>{alert.message}</Text>
        <Text style={styles.alertTime}>
          {new Date(alert.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSystemHealth();
  };

  useEffect(() => {
    loadSystemHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading system health...</Text>
      </View>
    );
  }

  if (!health) {
    return (
      <View style={styles.centerContainer}>
        <Text>Failed to load system health</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>System Health</Text>
        <View
          style={[
            styles.overallStatus,
            {backgroundColor: getStatusColor(health.status)},
          ]}>
          <Text style={styles.overallStatusText}>
            {getStatusIcon(health.status)} {health.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services Status</Text>
        <View style={styles.servicesList}>
          <ServiceStatus name="Database" status={health.services.database} />
          <ServiceStatus name="API Server" status={health.services.api} />
          <ServiceStatus
            name="Payment Gateway"
            status={health.services.payments}
          />
          <ServiceStatus name="File Storage" status={health.services.storage} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Uptime"
            value={health.uptime}
            unit="%"
            color="#4CAF50"
          />
          <MetricCard
            title="Response Time"
            value={health.metrics.responseTime}
            unit="ms"
            color="#2196F3"
          />
          <MetricCard
            title="Error Rate"
            value={health.metrics.errorRate}
            unit="%"
            color="#FF9800"
          />
          <MetricCard
            title="Active Users"
            value={health.metrics.activeUsers.toLocaleString()}
            unit="users"
            color="#9C27B0"
          />
          <MetricCard
            title="Memory Usage"
            value={health.metrics.memoryUsage}
            unit="%"
            color="#FF5722"
          />
          <MetricCard
            title="CPU Usage"
            value={health.metrics.cpuUsage}
            unit="%"
            color="#607D8B"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        <View style={styles.alertsList}>
          {health.alerts.map(alert => (
            <AlertItem key={alert.id} alert={alert} />
          ))}

          {health.alerts.length === 0 && (
            <View style={styles.noAlerts}>
              <Text style={styles.noAlertsText}>✅ No recent alerts</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🔄 Restart Services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📊 View Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>⚙️ System Config</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🚨 Create Alert</Text>
          </TouchableOpacity>
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
  overallStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  overallStatusText: {
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
  servicesList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  serviceName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  serviceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metricUnit: {
    fontSize: 10,
    color: '#999',
  },
  alertsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  noAlerts: {
    alignItems: 'center',
    padding: 20,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});
