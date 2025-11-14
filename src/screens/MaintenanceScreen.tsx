import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  type: 'security' | 'performance' | 'content' | 'feature' | 'bug';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  estimatedHours: number;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  api: 'healthy' | 'warning' | 'critical';
  payments: 'healthy' | 'warning' | 'critical';
  storage: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

export const MaintenanceScreen: React.FC = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  const initializeData = () => {
    const mockTasks: MaintenanceTask[] = [
      {
        id: '1',
        title: 'Security Patch Update',
        description: 'Apply latest security patches to all dependencies',
        type: 'security',
        priority: 'critical',
        status: 'pending',
        dueDate: '2024-01-25',
        estimatedHours: 4
      },
      {
        id: '2',
        title: 'Database Optimization',
        description: 'Optimize slow queries and update indexes',
        type: 'performance',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2024-01-30',
        estimatedHours: 8
      },
      {
        id: '3',
        title: 'Recipe Content Update',
        description: 'Add 100 new seasonal recipes',
        type: 'content',
        priority: 'medium',
        status: 'pending',
        dueDate: '2024-02-05',
        estimatedHours: 12
      },
      {
        id: '4',
        title: 'Payment Gateway Bug Fix',
        description: 'Fix intermittent payment processing errors',
        type: 'bug',
        priority: 'high',
        status: 'completed',
        dueDate: '2024-01-22',
        estimatedHours: 6
      },
      {
        id: '5',
        title: 'Dark Mode Feature',
        description: 'Implement dark mode theme option',
        type: 'feature',
        priority: 'low',
        status: 'pending',
        dueDate: '2024-02-15',
        estimatedHours: 16
      }
    ];

    const mockHealth: SystemHealth = {
      database: 'healthy',
      api: 'healthy',
      payments: 'warning',
      storage: 'healthy',
      lastUpdated: new Date().toISOString()
    };

    setTasks(mockTasks);
    setSystemHealth(mockHealth);
  };

  const updateTaskStatus = (taskId: string, newStatus: MaintenanceTask['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    Alert.alert('Success', 'Task status updated');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return '#F44336';
      case 'performance': return '#FF9800';
      case 'content': return '#4CAF50';
      case 'feature': return '#2196F3';
      case 'bug': return '#9C27B0';
      default: return '#666';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'pending': return '#FF9800';
      default: return '#666';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#666';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  const filteredTasks = selectedType === 'all' 
    ? tasks 
    : tasks.filter(task => task.type === selectedType);

  const TaskCard = ({ task }: { task: MaintenanceTask }) => (
    <View style={[styles.taskCard, { borderLeftColor: getTypeColor(task.type) }]}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
          <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.taskDescription}>{task.description}</Text>
      
      <View style={styles.taskMeta}>
        <Text style={styles.taskType}>{task.type.charAt(0).toUpperCase() + task.type.slice(1)}</Text>
        <Text style={styles.taskDue}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
        <Text style={styles.taskHours}>{task.estimatedHours}h estimated</Text>
      </View>
      
      <View style={styles.taskActions}>
        {['pending', 'in_progress', 'completed'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              task.status === status && { backgroundColor: getStatusColor(status) }
            ]}
            onPress={() => updateTaskStatus(task.id, status as any)}
          >
            <Text style={[
              styles.statusButtonText,
              task.status === status && { color: '#fff' }
            ]}>
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const HealthCard = ({ service, status }: { service: string; status: string }) => (
    <View style={styles.healthCard}>
      <Text style={styles.healthIcon}>{getHealthIcon(status)}</Text>
      <Text style={styles.healthService}>{service}</Text>
      <Text style={[styles.healthStatus, { color: getHealthColor(status) }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );

  useEffect(() => {
    initializeData();
  }, []);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = Math.round((completedTasks / totalTasks) * 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Maintenance Dashboard</Text>
        <Text style={styles.subtitle}>Post-launch support and maintenance</Text>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Tasks Complete</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#2196F3' }]}>
              {tasks.filter(t => t.status === 'in_progress').length}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>
              {tasks.filter(t => t.priority === 'critical').length}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
        </View>
      </View>

      {systemHealth && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.healthGrid}>
            <HealthCard service="Database" status={systemHealth.database} />
            <HealthCard service="API" status={systemHealth.api} />
            <HealthCard service="Payments" status={systemHealth.payments} />
            <HealthCard service="Storage" status={systemHealth.storage} />
          </View>
          <Text style={styles.healthUpdated}>
            Last updated: {new Date(systemHealth.lastUpdated).toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maintenance Tasks</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {['all', 'security', 'performance', 'content', 'feature', 'bug'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedType === type && styles.activeFilterButton
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedType === type && styles.activeFilterButtonText
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.tasksList}>
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support Guidelines</Text>
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesText}>
            🔒 <Text style={styles.bold}>Security:</Text> Apply patches within 24 hours{'\n'}
            ⚡ <Text style={styles.bold}>Performance:</Text> Monitor and optimize regularly{'\n'}
            📝 <Text style={styles.bold}>Content:</Text> Keep recipes and data fresh{'\n'}
            🐛 <Text style={styles.bold}>Bug Fixes:</Text> Address critical issues immediately{'\n'}
            ✨ <Text style={styles.bold}>Features:</Text> Plan and implement user requests
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  healthCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  healthIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  healthService: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  healthStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  healthUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
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
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskType: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  taskDue: {
    fontSize: 12,
    color: '#999',
  },
  taskHours: {
    fontSize: 12,
    color: '#999',
  },
  taskActions: {
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
  guidelinesCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  guidelinesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
});