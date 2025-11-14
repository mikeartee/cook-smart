import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';

interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'suspended' | 'banned';
  subscriptionStatus: 'free_beta' | 'active' | 'canceled' | 'none';
  joinDate: string;
  lastActive: string;
}

export const AdminUsersScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      // Mock users data - replace with actual API
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john@example.com',
          name: 'John Doe',
          status: 'active',
          subscriptionStatus: 'free_beta',
          joinDate: '2024-01-15',
          lastActive: '2024-01-20'
        },
        {
          id: '2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          status: 'active',
          subscriptionStatus: 'active',
          joinDate: '2024-01-10',
          lastActive: '2024-01-19'
        },
        {
          id: '3',
          email: 'spam@example.com',
          name: 'Spam User',
          status: 'suspended',
          subscriptionStatus: 'none',
          joinDate: '2024-01-18',
          lastActive: '2024-01-18'
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (userId: string, action: 'suspend' | 'activate' | 'ban') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const actionText = action === 'suspend' ? 'suspend' : action === 'ban' ? 'ban' : 'activate';
    
    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User`,
      `Are you sure you want to ${actionText} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: action === 'ban' ? 'destructive' : 'default',
          onPress: () => {
            setUsers(prev => prev.map(u => 
              u.id === userId 
                ? { ...u, status: action === 'activate' ? 'active' : action as any }
                : u
            ));
            Alert.alert('Success', `User ${actionText}d successfully`);
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'suspended': return '#FF9800';
      case 'banned': return '#F44336';
      default: return '#666';
    }
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'free_beta': return { text: 'BETA', color: '#FF9800' };
      case 'active': return { text: 'PAID', color: '#4CAF50' };
      case 'canceled': return { text: 'ENDED', color: '#666' };
      default: return { text: 'NONE', color: '#999' };
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const UserCard = ({ user }: { user: User }) => {
    const subBadge = getSubscriptionBadge(user.subscriptionStatus);
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userMeta}>
            <Text style={styles.metaText}>Joined: {new Date(user.joinDate).toLocaleDateString()}</Text>
            <Text style={styles.metaText}>Last active: {new Date(user.lastActive).toLocaleDateString()}</Text>
          </View>
        </View>
        
        <View style={styles.userBadges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
            <Text style={styles.badgeText}>{user.status.toUpperCase()}</Text>
          </View>
          <View style={[styles.subBadge, { backgroundColor: subBadge.color }]}>
            <Text style={styles.badgeText}>{subBadge.text}</Text>
          </View>
        </View>
        
        <View style={styles.userActions}>
          {user.status === 'active' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.suspendButton]}
                onPress={() => handleUserAction(user.id, 'suspend')}
              >
                <Text style={styles.actionButtonText}>Suspend</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.banButton]}
                onPress={() => handleUserAction(user.id, 'ban')}
              >
                <Text style={styles.actionButtonText}>Ban</Text>
              </TouchableOpacity>
            </>
          )}
          {user.status !== 'active' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.activateButton]}
              onPress={() => handleUserAction(user.id, 'activate')}
            >
              <Text style={styles.actionButtonText}>Activate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>{users.length} total users</Text>
      </View>

      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterButtons}>
          {['all', 'active', 'suspended', 'banned'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.activeFilterButton
              ]}
              onPress={() => setFilterStatus(status as any)}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === status && styles.activeFilterButtonText
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.usersList}>
        {filteredUsers.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
        
        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
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
  controls: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  usersList: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userMeta: {
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  suspendButton: {
    backgroundColor: '#FF9800',
  },
  banButton: {
    backgroundColor: '#F44336',
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});