import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import {API_ENDPOINTS} from '../../config/api';
import {getAuthToken} from '../../utils/auth';

interface SystemStatus {
  isMonitoring: boolean;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  repairCount: number;
}

interface RepairAction {
  type: 'restart' | 'reconnect' | 'rebuild' | 'nuke';
  reason: string;
  timestamp: Date;
  success: boolean;
  details: string;
}

export const SystemGuardianScreen: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [repairs, setRepairs] = useState<RepairAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_ENDPOINTS.health}/api/v1/system-guardian/status`,
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      setStatus(response.data.status);
      setRepairs(response.data.recentRepairs || []);
    } catch (error) {
      console.error('Error loading System Guardian status:', error);
      Alert.alert('Error', 'Failed to load system status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStatus();
  };

  const handleStartMonitoring = async () => {
    try {
      const token = await getAuthToken();
      await axios.post(
        `${API_ENDPOINTS.health}/api/v1/system-guardian/start`,
        {},
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      Alert.alert('Success', 'System Guardian monitoring started');
      loadStatus();
    } catch (error) {
      console.error('Error starting monitoring:', error);
      Alert.alert('Error', 'Failed to start monitoring');
    }
  };

  const handleStopMonitoring = async () => {
    Alert.alert(
      'Stop Monitoring',
      'Are you sure you want to stop System Guardian monitoring?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              await axios.post(
                `${API_ENDPOINTS.health}/api/v1/system-guardian/stop`,
                {},
                {
                  headers: {Authorization: `Bearer ${token}`},
                },
              );

              Alert.alert('Success', 'System Guardian monitoring stopped');
              loadStatus();
            } catch (error) {
              console.error('Error stopping monitoring:', error);
              Alert.alert('Error', 'Failed to stop monitoring');
            }
          },
        },
      ],
    );
  };

  const handleNuclearOption = () => {
    Alert.alert(
      '☢️ NUCLEAR OPTION',
      'This will rebuild the entire system. Only use in emergencies!\n\nThe system will:\n• Stop all services\n• Pull latest code\n• Reinstall dependencies\n• Rebuild\n• Restart\n\nThis may take several minutes.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'INITIATE',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Nuclear Option',
              'Enter reason for initiating nuclear option:',
              async reason => {
                if (!reason) {
                  Alert.alert('Error', 'Reason is required');
                  return;
                }

                try {
                  const token = await getAuthToken();
                  await axios.post(
                    `${API_ENDPOINTS.health}/api/v1/system-guardian/nuke`,
                    {reason},
                    {
                      headers: {Authorization: `Bearer ${token}`},
                    },
                  );

                  Alert.alert(
                    'Nuclear Option Initiated',
                    'System is rebuilding. This may take several minutes.',
                  );
                } catch (error) {
                  console.error('Error initiating nuclear option:', error);
                  Alert.alert('Error', 'Failed to initiate nuclear option');
                }
              },
            );
          },
        },
      ],
    );
  };

  const getRepairIcon = (type: string) => {
    switch (type) {
      case 'restart':
        return 'refresh';
      case 'reconnect':
        return 'link';
      case 'rebuild':
        return 'build';
      case 'nuke':
        return 'warning';
      default:
        return 'help';
    }
  };

  const getRepairColor = (success: boolean) => {
    return success ? '#10B981' : '#EF4444';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading System Guardian...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="shield" size={48} color="#10B981" />
          <Text style={styles.headerTitle}>System Guardian</Text>
          <Text style={styles.headerSubtitle}>
            Automated Monitoring & Repair
          </Text>
        </View>

        {/* Status Card */}
        {status && (
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Monitoring Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: status.isMonitoring
                      ? '#D1FAE5'
                      : '#FEE2E2',
                  },
                ]}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    {color: status.isMonitoring ? '#10B981' : '#EF4444'},
                  ]}>
                  {status.isMonitoring ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last Health Check</Text>
              <Text style={styles.statusValue}>
                {new Date(status.lastHealthCheck).toLocaleTimeString()}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Consecutive Failures</Text>
              <Text
                style={[
                  styles.statusValue,
                  {
                    color:
                      status.consecutiveFailures > 0 ? '#EF4444' : '#6B7280',
                  },
                ]}>
                {status.consecutiveFailures}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Total Repairs</Text>
              <Text style={styles.statusValue}>{status.repairCount}</Text>
            </View>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Controls</Text>

          {status?.isMonitoring ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStopMonitoring}>
              <Icon name="stop" size={24} color="#EF4444" />
              <Text style={[styles.controlButtonText, {color: '#EF4444'}]}>
                Stop Monitoring
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={handleStartMonitoring}>
              <Icon name="play-arrow" size={24} color="#10B981" />
              <Text style={[styles.controlButtonText, {color: '#10B981'}]}>
                Start Monitoring
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, styles.nukeButton]}
            onPress={handleNuclearOption}>
            <Icon name="warning" size={24} color="#F59E0B" />
            <Text style={[styles.controlButtonText, {color: '#F59E0B'}]}>
              ☢️ Nuclear Option
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Repairs */}
        <View style={styles.repairsSection}>
          <Text style={styles.sectionTitle}>Recent Repairs</Text>

          {repairs.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="check-circle" size={48} color="#10B981" />
              <Text style={styles.emptyStateText}>No repairs needed</Text>
              <Text style={styles.emptyStateSubtext}>
                System is running smoothly
              </Text>
            </View>
          ) : (
            repairs.map((repair, index) => (
              <View key={index} style={styles.repairCard}>
                <View style={styles.repairHeader}>
                  <Icon
                    name={getRepairIcon(repair.type)}
                    size={24}
                    color={getRepairColor(repair.success)}
                  />
                  <View style={styles.repairInfo}>
                    <Text style={styles.repairType}>
                      {repair.type.toUpperCase()}
                    </Text>
                    <Text style={styles.repairTime}>
                      {new Date(repair.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <Icon
                    name={repair.success ? 'check-circle' : 'error'}
                    size={24}
                    color={getRepairColor(repair.success)}
                  />
                </View>

                <Text style={styles.repairReason}>{repair.reason}</Text>
                <Text style={styles.repairDetails}>{repair.details}</Text>
              </View>
            ))
          )}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Icon name="info-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            System Guardian monitors your backend 24/7 and automatically
            attempts repairs when issues are detected. It can restart services,
            reconnect to databases, and even rebuild the entire system if
            necessary.
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  controlSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  startButton: {
    borderColor: '#10B981',
  },
  stopButton: {
    borderColor: '#EF4444',
  },
  nukeButton: {
    borderColor: '#F59E0B',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  repairsSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  repairCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  repairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  repairInfo: {
    flex: 1,
    marginLeft: 12,
  },
  repairType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  repairTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  repairReason: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  repairDetails: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 20,
    marginLeft: 12,
  },
});
