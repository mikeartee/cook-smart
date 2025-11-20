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
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {AdminCard} from '../../components/admin/AdminCard';
import axios from 'axios';
import {API_ENDPOINTS} from '../../config/api';
import {getAuthToken} from '../../utils/auth';

interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  message: string;
  status: string;
  adminNotes?: string;
  createdAt: Date;
  hasScreenshot: boolean;
}

export const FeedbackManagementScreen: React.FC = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );
  const [adminNotes, setAdminNotes] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    bugs: 0,
    features: 0,
    general: 0,
    new: 0,
    reviewed: 0,
    resolved: 0,
  });

  useEffect(() => {
    loadFeedback();
  }, []);

  useEffect(() => {
    filterFeedbackList();
  }, [filterType, filterStatus, feedback]);

  const loadFeedback = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_ENDPOINTS.health.replace('/health', '')}/api/v1/admin/feedback`,
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      setFeedback(response.data.feedback || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error loading feedback:', error);
      Alert.alert('Error', 'Failed to load feedback');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterFeedbackList = () => {
    let filtered = feedback;

    if (filterType !== 'all') {
      filtered = filtered.filter(f => f.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }

    setFilteredFeedback(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeedback();
  };

  const handleViewFeedback = (item: Feedback) => {
    setSelectedFeedback(item);
    setAdminNotes(item.adminNotes || '');
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedFeedback) return;

    try {
      const token = await getAuthToken();
      await axios.put(
        `${API_ENDPOINTS.health.replace('/health', '')}/api/v1/admin/feedback/${selectedFeedback.id}/status`,
        {status},
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      Alert.alert('Success', 'Status updated');
      setSelectedFeedback(null);
      loadFeedback();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedFeedback) return;

    try {
      const token = await getAuthToken();
      await axios.post(
        `${API_ENDPOINTS.health.replace('/health', '')}/api/v1/admin/feedback/${selectedFeedback.id}/notes`,
        {notes: adminNotes},
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      Alert.alert('Success', 'Notes saved');
      setSelectedFeedback(null);
      loadFeedback();
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bug':
        return 'bug-report';
      case 'feature':
        return 'lightbulb';
      default:
        return 'chat';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bug':
        return '#EF4444';
      case 'feature':
        return '#3B82F6';
      default:
        return '#10B981';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return '#F59E0B';
      case 'reviewed':
        return '#3B82F6';
      case 'resolved':
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
            title="Total Feedback"
            value={stats.total}
            icon="feedback"
            color="#8B5CF6"
          />
          <AdminCard
            title="Bugs"
            value={stats.bugs}
            icon="bug-report"
            color="#EF4444"
          />
          <AdminCard
            title="Features"
            value={stats.features}
            icon="lightbulb"
            color="#3B82F6"
          />
          <AdminCard
            title="New"
            value={stats.new}
            icon="fiber-new"
            color="#F59E0B"
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Type:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterButtons}>
            {['all', 'bug', 'feature', 'general'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  filterType === type && styles.filterButtonActive,
                ]}
                onPress={() => setFilterType(type)}>
                <Text
                  style={[
                    styles.filterButtonText,
                    filterType === type && styles.filterButtonTextActive,
                  ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterButtons}>
            {['all', 'new', 'reviewed', 'resolved'].map(status => (
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

        {/* Feedback List */}
        <View style={styles.listContainer}>
          {filteredFeedback.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.feedbackCard}
              onPress={() => handleViewFeedback(item)}>
              <View style={styles.feedbackHeader}>
                <Icon
                  name={getTypeIcon(item.type)}
                  size={24}
                  color={getTypeColor(item.type)}
                />
                <View style={styles.feedbackInfo}>
                  <Text style={styles.feedbackType}>{item.type}</Text>
                  <Text style={styles.feedbackEmail}>{item.userEmail}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: `${getStatusColor(item.status)}15`},
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      {color: getStatusColor(item.status)},
                    ]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.feedbackMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <View style={styles.feedbackFooter}>
                <Text style={styles.feedbackDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.hasScreenshot && (
                  <View style={styles.screenshotBadge}>
                    <Icon name="image" size={14} color="#6B7280" />
                    <Text style={styles.screenshotText}>Screenshot</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {filteredFeedback.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="feedback" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No feedback found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selectedFeedback !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedFeedback(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Feedback Details</Text>
              <TouchableOpacity onPress={() => setSelectedFeedback(null)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedFeedback && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>
                      {selectedFeedback.type}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User:</Text>
                    <Text style={styles.detailValue}>
                      {selectedFeedback.userEmail}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={styles.detailValue}>
                      {selectedFeedback.status}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Message:</Text>
                    <Text style={styles.detailMessage}>
                      {selectedFeedback.message}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Admin Notes:</Text>
                    <TextInput
                      style={styles.notesInput}
                      multiline
                      numberOfLines={4}
                      value={adminNotes}
                      onChangeText={setAdminNotes}
                      placeholder="Add notes..."
                    />
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.reviewButton]}
                      onPress={() => handleUpdateStatus('reviewed')}>
                      <Text style={styles.actionButtonText}>
                        Mark Reviewed
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.resolveButton]}
                      onPress={() => handleUpdateStatus('resolved')}>
                      <Text style={styles.actionButtonText}>
                        Mark Resolved
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveNotes}>
                    <Text style={styles.saveButtonText}>Save Notes</Text>
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
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 12,
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  feedbackType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  feedbackEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  feedbackMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  screenshotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  screenshotText: {
    fontSize: 12,
    color: '#6B7280',
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
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButton: {
    backgroundColor: '#3B82F6',
  },
  resolveButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
