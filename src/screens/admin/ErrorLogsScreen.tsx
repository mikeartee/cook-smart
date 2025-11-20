import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {AdminCard} from '../../components/admin/AdminCard';
import axios from 'axios';
import {API_ENDPOINTS} from '../../config/api';
import {getAuthToken} from '../../utils/auth';

interface ErrorLog {
  id: string;
  message: string;
  stack: string;
  severity: string;
  endpoint: string;
  userId?: string;
  timestamp: Date;
  resolved: boolean;
}

export const ErrorLogsScreen: React.FC = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorLog[]>([]);
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    resolved: 0,
  });

  useEffect(() => {
    loadErrors();
  }, []);

  useEffect(() => {
    filterErrors();
  }, [filterSeverity, errors]);

  const loadErrors = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_ENDPOINTS.health.replace('/health', '')}/api/v1/admin/errors`,
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      setErrors(response.data.errors || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error loading errors:', error);
      Alert.alert('Error', 'Failed to load error logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterErrors = () => {
    let filtered = errors;

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(e => e.severity === filterSeverity);
    }

    setFilteredErrors(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadErrors();
  };

  const handleMarkResolved = async (errorId: string) => {
    try {
      const token = await getAuthToken();
      await axios.delete(
        `${API_ENDPOINTS.health.replace('/health', '')}/api/v1/admin/errors/${errorId}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      Alert.alert('Success', 'Error marked as resolved');
      setSelectedError(null);
      loadErrors();
    } catch (error) {
      console.error('Error marking resolved:', error);
      Alert.alert('Error', 'Failed to mark as resolved');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#DC2626';
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

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
            title="Total Errors"
            value={stats.total}
            icon="error"
            color="#EF4444"
          />
          <AdminCard
            title="Critical"
            value={stats.critical}
            icon="warning"
            color="#DC2626"
          />
          <AdminCard
            title="High"
            value={stats.high}
            icon="error-outline"
            color="#EF4444"
          />
          <AdminCard
            title="Resolved"
            value={stats.resolved}
            icon="check-circle"
            color="#10B981"
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterButtons}>
            {['all', 'critical', 'high', 'medium', 'low'].map(severity => (
              <TouchableOpacity
                key={severity}
                style={[
                  styles.filterButton,
                  filterSeverity === severity && styles.filterButtonActive,
                ]}
                onPress={() => setFilterSeverity(severity)}>
                <Text
                  style={[
                    styles.filterButtonText,
                    filterSeverity === severity && styles.filterButtonTextActive,
                  ]}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Error List */}
        <View style={styles.listContainer}>
          {filteredErrors.map(error => (
            <TouchableOpacity
              key={error.id}
              style={styles.errorCard}
              onPress={() => setSelectedError(error)}>
              <View style={styles.errorHeader}>
                <Icon
                  name="error"
                  size={24}
                  color={getSeverityColor(error.severity)}
                />
                <View style={styles.errorInfo}>
                  <Text style={styles.errorMessage} numberOfLines={1}>
                    {error.message}
                  </Text>
                  <Text style={styles.errorEndpoint}>{error.endpoint}</Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    {backgroundColor: `${getSeverityColor(error.severity)}15`},
                  ]}>
                  <Text
                    style={[
                      styles.severityText,
                      {color: getSeverityColor(error.severity)},
                    ]}>
                    {error.severity}
                  </Text>
                </View>
              </View>
              <Text style={styles.errorDate}>
                {new Date(error.timestamp).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}

          {filteredErrors.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="check-circle" size={48} color="#10B981" />
              <Text style={styles.emptyText}>No errors found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selectedError !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedError(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Error Details</Text>
              <TouchableOpacity onPress={() => setSelectedError(null)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedError && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Severity:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        {color: getSeverityColor(selectedError.severity)},
                      ]}>
                      {selectedError.severity}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Endpoint:</Text>
                    <Text style={styles.detailValue}>
                      {selectedError.endpoint}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedError.timestamp).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Message:</Text>
                    <Text style={styles.detailMessage}>
                      {selectedError.message}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Stack Trace:</Text>
                    <ScrollView style={styles.stackContainer}>
                      <Text style={styles.stackText}>{selectedError.stack}</Text>
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => handleMarkResolved(selectedError.id)}>
                    <Icon name="check-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.resolveButtonText}>
                      Mark as Resolved
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  errorEndpoint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  errorDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 80,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 8,
  },
  stackContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    maxHeight: 200,
  },
  stackText: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: 'monospace',
  },
  resolveButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
