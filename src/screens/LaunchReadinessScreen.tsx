import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface ChecklistItem {
  id: string;
  category: 'technical' | 'content' | 'business' | 'legal' | 'marketing';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
}

export const LaunchReadinessScreen: React.FC = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const initializeChecklist = () => {
    const items: ChecklistItem[] = [
      // Technical
      {
        id: 'tech-1',
        category: 'technical',
        title: 'Database Migration Complete',
        description: 'All database schemas and data migrations are complete',
        status: 'completed',
        priority: 'critical'
      },
      {
        id: 'tech-2',
        category: 'technical',
        title: 'API Endpoints Tested',
        description: 'All API endpoints tested and documented',
        status: 'completed',
        priority: 'critical'
      },
      {
        id: 'tech-3',
        category: 'technical',
        title: 'Payment System Integration',
        description: 'Stripe integration tested with real transactions',
        status: 'in_progress',
        priority: 'critical'
      },
      {
        id: 'tech-4',
        category: 'technical',
        title: 'Performance Optimization',
        description: 'App load time under 3 seconds, smooth animations',
        status: 'completed',
        priority: 'high'
      },
      {
        id: 'tech-5',
        category: 'technical',
        title: 'Security Audit',
        description: 'Security vulnerabilities identified and fixed',
        status: 'in_progress',
        priority: 'critical'
      },
      
      // Content
      {
        id: 'content-1',
        category: 'content',
        title: 'Recipe Database Complete',
        description: '1000+ recipes with proper categorization',
        status: 'completed',
        priority: 'high'
      },
      {
        id: 'content-2',
        category: 'content',
        title: 'Ingredient Database',
        description: 'Comprehensive ingredient database with nutritional info',
        status: 'completed',
        priority: 'high'
      },
      {
        id: 'content-3',
        category: 'content',
        title: 'Help Documentation',
        description: 'User guides and FAQ completed',
        status: 'in_progress',
        priority: 'medium'
      },
      
      // Business
      {
        id: 'business-1',
        category: 'business',
        title: 'Pricing Strategy Finalized',
        description: 'Final pricing tiers and BETA transition plan',
        status: 'completed',
        priority: 'critical'
      },
      {
        id: 'business-2',
        category: 'business',
        title: 'Customer Support Setup',
        description: 'Support channels and processes established',
        status: 'in_progress',
        priority: 'high'
      },
      {
        id: 'business-3',
        category: 'business',
        title: 'Analytics Implementation',
        description: 'User analytics and business metrics tracking',
        status: 'completed',
        priority: 'high'
      },
      
      // Legal
      {
        id: 'legal-1',
        category: 'legal',
        title: 'Terms of Service',
        description: 'Legal terms reviewed and approved',
        status: 'completed',
        priority: 'critical'
      },
      {
        id: 'legal-2',
        category: 'legal',
        title: 'Privacy Policy',
        description: 'GDPR compliant privacy policy',
        status: 'completed',
        priority: 'critical'
      },
      {
        id: 'legal-3',
        category: 'legal',
        title: 'App Store Compliance',
        description: 'App store guidelines compliance verified',
        status: 'in_progress',
        priority: 'critical'
      },
      
      // Marketing
      {
        id: 'marketing-1',
        category: 'marketing',
        title: 'Launch Campaign Ready',
        description: 'Marketing materials and campaign prepared',
        status: 'in_progress',
        priority: 'high'
      },
      {
        id: 'marketing-2',
        category: 'marketing',
        title: 'App Store Listing',
        description: 'App store descriptions, screenshots, and metadata',
        status: 'in_progress',
        priority: 'high'
      },
      {
        id: 'marketing-3',
        category: 'marketing',
        title: 'Social Media Setup',
        description: 'Social media accounts and content calendar',
        status: 'pending',
        priority: 'medium'
      }
    ];
    
    setChecklist(items);
  };

  const updateItemStatus = (itemId: string, newStatus: ChecklistItem['status']) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: newStatus } : item
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'blocked': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'pending': return '⏳';
      case 'blocked': return '🚫';
      default: return '❓';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getFilteredItems = () => {
    if (selectedCategory === 'all') return checklist;
    return checklist.filter(item => item.category === selectedCategory);
  };

  const getCompletionStats = () => {
    const total = checklist.length;
    const completed = checklist.filter(item => item.status === 'completed').length;
    const inProgress = checklist.filter(item => item.status === 'in_progress').length;
    const blocked = checklist.filter(item => item.status === 'blocked').length;
    const critical = checklist.filter(item => item.priority === 'critical').length;
    const criticalCompleted = checklist.filter(item => item.priority === 'critical' && item.status === 'completed').length;
    
    return {
      total,
      completed,
      inProgress,
      blocked,
      completionRate: Math.round((completed / total) * 100),
      criticalRate: Math.round((criticalCompleted / critical) * 100)
    };
  };

  const ChecklistItemCard = ({ item }: { item: ChecklistItem }) => (
    <View style={[styles.itemCard, { borderLeftColor: getStatusColor(item.status) }]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemIcon}>{getStatusIcon(item.status)}</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.itemActions}>
        {['pending', 'in_progress', 'completed', 'blocked'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              item.status === status && { backgroundColor: getStatusColor(status) }
            ]}
            onPress={() => updateItemStatus(item.id, status as any)}
          >
            <Text style={[
              styles.statusButtonText,
              item.status === status && { color: '#fff' }
            ]}>
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const stats = getCompletionStats();
  const filteredItems = getFilteredItems();

  useEffect(() => {
    initializeChecklist();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Launch Readiness</Text>
        <Text style={styles.subtitle}>Pre-launch checklist and status</Text>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>Overall Complete</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>{stats.criticalRate}%</Text>
            <Text style={styles.statLabel}>Critical Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#2196F3' }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>{stats.blocked}</Text>
            <Text style={styles.statLabel}>Blocked</Text>
          </View>
        </View>
      </View>

      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {['all', 'technical', 'content', 'business', 'legal', 'marketing'].map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterButton,
                  selectedCategory === category && styles.activeFilterButton
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedCategory === category && styles.activeFilterButtonText
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.checklistSection}>
        {filteredItems.map(item => (
          <ChecklistItemCard key={item.id} item={item} />
        ))}
      </View>

      {stats.completionRate === 100 && (
        <View style={styles.readyBanner}>
          <Text style={styles.readyTitle}>🎉 Ready for Launch!</Text>
          <Text style={styles.readyText}>
            All checklist items completed. Cook Smart is ready for production launch.
          </Text>
        </View>
      )}
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
  statsSection: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filtersSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  checklistSection: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  readyBanner: {
    backgroundColor: '#E8F5E8',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  readyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  readyText: {
    fontSize: 16,
    color: '#388E3C',
    textAlign: 'center',
    lineHeight: 22,
  },
});