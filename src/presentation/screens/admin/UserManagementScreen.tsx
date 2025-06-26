import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';

import { UserRole, Permission, User, UserRoleUtils } from '../../../core/domain/models/User';

interface UserListItem {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  authProviders: string[];
  cubeStats?: {
    totalSolves: number;
    bestTime: number;
  };
}

interface FilterOption {
  id: string;
  label: string;
  value: string | UserRole | boolean;
  type: 'role' | 'status' | 'provider';
}

export default function UserManagementScreen() {
  const { theme } = useTheme();
  const { user: currentUser, hasPermission, isSuperAdmin } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Mock users data (in real app, fetch from IUserRepository)
  const [users, setUsers] = useState<UserListItem[]>([
    {
      id: '1',
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      role: UserRole.USER,
      isActive: true,
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 30),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      authProviders: ['email'],
      cubeStats: { totalSolves: 45, bestTime: 32.5 },
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      displayName: 'Jane Smith',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      authProviders: ['email', 'google'],
      cubeStats: { totalSolves: 128, bestTime: 18.7 },
    },
    {
      id: '3',
      email: 'bob.wilson@example.com',
      displayName: 'Bob Wilson',
      role: UserRole.USER,
      isActive: false,
      emailVerified: false,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      authProviders: ['google'],
      cubeStats: { totalSolves: 8, bestTime: 85.2 },
    },
    {
      id: '4',
      email: 'superadmin@rubixsolver.app',
      displayName: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 5),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
      authProviders: ['email'],
      cubeStats: { totalSolves: 0, bestTime: 0 },
    },
  ]);

  // Filter options
  const filterOptions: FilterOption[] = [
    { id: 'all', label: 'All Users', value: 'all', type: 'status' },
    { id: 'active', label: 'Active', value: true, type: 'status' },
    { id: 'inactive', label: 'Inactive', value: false, type: 'status' },
    { id: 'verified', label: 'Email Verified', value: true, type: 'status' },
    { id: 'unverified', label: 'Unverified', value: false, type: 'status' },
    { id: 'super_admin', label: 'Super Admins', value: UserRole.SUPER_ADMIN, type: 'role' },
    { id: 'admin', label: 'Admins', value: UserRole.ADMIN, type: 'role' },
    { id: 'user', label: 'Users', value: UserRole.USER, type: 'role' },
    { id: 'email_provider', label: 'Email Auth', value: 'email', type: 'provider' },
    { id: 'google_provider', label: 'Google Auth', value: 'google', type: 'provider' },
  ];

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call to refresh users
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  /**
   * Filter users based on search and filters
   */
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Selected filter
    if (selectedFilter === 'all') return true;

    const filterOption = filterOptions.find(f => f.id === selectedFilter);
    if (!filterOption) return true;

    switch (filterOption.type) {
      case 'status':
        if (filterOption.id === 'active') return user.isActive;
        if (filterOption.id === 'inactive') return !user.isActive;
        if (filterOption.id === 'verified') return user.emailVerified;
        if (filterOption.id === 'unverified') return !user.emailVerified;
        break;
      case 'role':
        return user.role === filterOption.value;
      case 'provider':
        return user.authProviders.includes(filterOption.value as string);
    }

    return true;
  });

  /**
   * Handle role change
   */
  const handleRoleChange = (user: UserListItem, newRole: UserRole) => {
    // Check permissions
    if (!isSuperAdmin() && newRole === UserRole.ADMIN) {
      Alert.alert('Permission Denied', 'Only Super Admins can assign Admin roles.');
      return;
    }

    if (user.role === UserRole.SUPER_ADMIN && !isSuperAdmin()) {
      Alert.alert('Permission Denied', 'Cannot modify Super Admin role.');
      return;
    }

    Alert.alert(
      'Change User Role',
      `Change ${user.displayName}'s role from ${UserRoleUtils.getRoleInfo(user.role).name} to ${UserRoleUtils.getRoleInfo(newRole).name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Role',
          style: 'destructive',
          onPress: () => {
            // In real app, call IRoleRepository.assignRole
            setUsers(prevUsers => 
              prevUsers.map(u => 
                u.id === user.id ? { ...u, role: newRole } : u
              )
            );
            Alert.alert('Success', `Role changed to ${UserRoleUtils.getRoleInfo(newRole).name}`);
            setShowUserModal(false);
          }
        }
      ]
    );
  };

  /**
   * Handle user activation/deactivation
   */
  const handleToggleUserStatus = (user: UserListItem) => {
    if (user.role === UserRole.SUPER_ADMIN) {
      Alert.alert('Permission Denied', 'Cannot deactivate Super Admin account.');
      return;
    }

    const action = user.isActive ? 'deactivate' : 'activate';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: user.isActive ? 'destructive' : 'default',
          onPress: () => {
            // In real app, call IUserRepository.activateUser/deactivateUser
            setUsers(prevUsers => 
              prevUsers.map(u => 
                u.id === user.id ? { ...u, isActive: !u.isActive } : u
              )
            );
            Alert.alert('Success', `User ${action}d successfully`);
            setShowUserModal(false);
          }
        }
      ]
    );
  };

  /**
   * Handle delete user
   */
  const handleDeleteUser = (user: UserListItem) => {
    if (user.role === UserRole.SUPER_ADMIN) {
      Alert.alert('Permission Denied', 'Cannot delete Super Admin account.');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${user.displayName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In real app, call IUserRepository.deleteUser
            setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
            Alert.alert('Success', 'User deleted successfully');
            setShowUserModal(false);
          }
        }
      ]
    );
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  /**
   * Render user item
   */
  const renderUserItem = ({ item: user }: { item: UserListItem }) => {
    const roleInfo = UserRoleUtils.getRoleInfo(user.role);
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => {
          setSelectedUser(user);
          setShowUserModal(true);
        }}
        activeOpacity={0.7}
      >
        <Card elevation="low" style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                  {user.displayName}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                  {user.email}
                </Text>
              </View>
            </View>
            
            <View style={styles.userMeta}>
              <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20' }]}>
                <Ionicons name={roleInfo.icon as any} size={12} color={roleInfo.color} />
                <Text style={[styles.roleText, { color: roleInfo.color }]}>
                  {roleInfo.name}
                </Text>
              </View>
              
              <View style={styles.statusIndicators}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: user.isActive ? '#00C851' : '#FF4444' }
                ]} />
                {user.emailVerified && (
                  <Ionicons name="checkmark-circle" size={14} color={theme.colors.tertiary} />
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {user.cubeStats?.totalSolves || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Solves
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {user.cubeStats?.bestTime ? `${user.cubeStats.bestTime}s` : '--'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Best Time
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {formatTimeAgo(user.lastLoginAt)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Last Login
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  /**
   * Render user detail modal
   */
  const renderUserModal = () => {
    if (!selectedUser) return null;

    const roleInfo = UserRoleUtils.getRoleInfo(selectedUser.role);
    const canModifyRole = isSuperAdmin() || (selectedUser.role !== UserRole.SUPER_ADMIN && selectedUser.role !== UserRole.ADMIN);
    const canDelete = hasPermission(Permission.DELETE_USERS) && selectedUser.role !== UserRole.SUPER_ADMIN;

    return (
      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              User Details
            </Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* User Info */}
            <Card elevation="low" style={styles.modalSection}>
              <View style={styles.modalUserHeader}>
                <View style={[styles.modalUserAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Ionicons name="person" size={32} color={theme.colors.primary} />
                </View>
                <View style={styles.modalUserInfo}>
                  <Text style={[styles.modalUserName, { color: theme.colors.textPrimary }]}>
                    {selectedUser.displayName}
                  </Text>
                  <Text style={[styles.modalUserEmail, { color: theme.colors.textSecondary }]}>
                    {selectedUser.email}
                  </Text>
                  <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20', marginTop: 8 }]}>
                    <Ionicons name={roleInfo.icon as any} size={14} color={roleInfo.color} />
                    <Text style={[styles.roleText, { color: roleInfo.color }]}>
                      {roleInfo.name}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Account Status */}
            <Card elevation="low" style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: theme.colors.textPrimary }]}>
                Account Status
              </Text>
              <View style={styles.statusGrid}>
                <View style={styles.statusItem}>
                  <Ionicons 
                    name={selectedUser.isActive ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={selectedUser.isActive ? "#00C851" : "#FF4444"} 
                  />
                  <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons 
                    name={selectedUser.emailVerified ? "mail" : "mail-outline"} 
                    size={20} 
                    color={selectedUser.emailVerified ? theme.colors.tertiary : theme.colors.textSecondary} 
                  />
                  <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                    {selectedUser.emailVerified ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Role Management */}
            {canModifyRole && (
              <Card elevation="low" style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.colors.textPrimary }]}>
                  Role Management
                </Text>
                <View style={styles.roleButtons}>
                  {Object.values(UserRole).map((role) => {
                    if (role === UserRole.SUPER_ADMIN && !isSuperAdmin()) return null;
                    
                    const isCurrentRole = selectedUser.role === role;
                    const roleDisplayInfo = UserRoleUtils.getRoleInfo(role);
                    
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleButton,
                          {
                            borderColor: isCurrentRole ? roleDisplayInfo.color : theme.colors.border,
                            backgroundColor: isCurrentRole ? roleDisplayInfo.color + '20' : 'transparent',
                          }
                        ]}
                        onPress={() => !isCurrentRole && handleRoleChange(selectedUser, role)}
                        disabled={isCurrentRole}
                      >
                        <Ionicons name={roleDisplayInfo.icon as any} size={16} color={roleDisplayInfo.color} />
                        <Text style={[styles.roleButtonText, { color: roleDisplayInfo.color }]}>
                          {roleDisplayInfo.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* Actions */}
            <Card elevation="low" style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: theme.colors.textPrimary }]}>
                Actions
              </Text>
              <View style={styles.actionButtons}>
                <Button
                  title={selectedUser.isActive ? "Deactivate User" : "Activate User"}
                  variant={selectedUser.isActive ? "outline" : "primary"}
                  onPress={() => handleToggleUserStatus(selectedUser)}
                  style={{ marginBottom: 12 }}
                />
                
                {canDelete && (
                  <Button
                    title="Delete User"
                    variant="outline"
                    onPress={() => handleDeleteUser(selectedUser)}
                    style={{ borderColor: theme.colors.error, marginBottom: 12 }}
                  />
                )}
                
                <Button
                  title="View Solve History"
                  variant="outline"
                  onPress={() => Alert.alert('Coming Soon', 'User solve history coming soon!')}
                />
              </View>
            </Card>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          User Management
        </Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="filter" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextField
          label="Search Users"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by email or name..."
          leftIcon={<Ionicons name="search" size={20} color={theme.colors.textSecondary} />}
          style={styles.searchInput}
        />
        
        {showFilters && (
          <Card elevation="low" style={styles.filtersCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterButtons}>
                {filterOptions.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.filterButton,
                      {
                        borderColor: selectedFilter === filter.id ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selectedFilter === filter.id ? theme.colors.primary + '20' : 'transparent',
                      }
                    ]}
                    onPress={() => setSelectedFilter(filter.id)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      { color: selectedFilter === filter.id ? theme.colors.primary : theme.colors.textSecondary }
                    ]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Card>
        )}
      </View>

      {/* User List */}
      <Animated.View 
        style={[
          styles.listContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }] 
          }
        ]}
      >
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: theme.colors.textPrimary }]}>
            {filteredUsers.length} Users
          </Text>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'User export coming soon!')}>
            <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={() => (
            <Card elevation="low" style={styles.emptyCard}>
              <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No users found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Try adjusting your search or filters
              </Text>
            </Card>
          )}
        />
      </Animated.View>

      {renderUserModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 16,
  },
  filtersCard: {
    padding: 12,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userItem: {
    marginBottom: 12,
  },
  userCard: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  userMeta: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    padding: 16,
    marginBottom: 16,
  },
  modalUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: 14,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
  },
  roleButtons: {
    gap: 8,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    gap: 8,
  },
});