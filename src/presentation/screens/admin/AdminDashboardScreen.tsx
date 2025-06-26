import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

import { UserRole, Permission } from '../../../core/domain/models/User';

const { width } = Dimensions.get('window');

interface SystemStat {
  id: string;
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  requiresPermission?: Permission;
  destructive?: boolean;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'role_changed' | 'system_alert' | 'solve_completed';
  message: string;
  timestamp: Date;
  user?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Mock system statistics (in real app, fetch from ISuperAdminRepository)
  const [systemStats] = useState<SystemStat[]>([
    {
      id: 'total-users',
      title: 'Total Users',
      value: 1247,
      icon: 'people',
      color: theme.colors.primary,
      trend: { value: 12, isPositive: true },
      onPress: () => navigation.navigate('UserManagement' as never),
    },
    {
      id: 'active-users',
      title: 'Active Users',
      value: 892,
      icon: 'pulse',
      color: theme.colors.tertiary,
      trend: { value: 8, isPositive: true },
    },
    {
      id: 'total-solves',
      title: 'Total Solves',
      value: '12.4K',
      icon: 'cube',
      color: theme.colors.secondary,
      trend: { value: 15, isPositive: true },
    },
    {
      id: 'system-health',
      title: 'System Health',
      value: '99.8%',
      icon: 'shield-checkmark',
      color: '#00C851',
      trend: { value: 0.2, isPositive: true },
    },
  ]);

  // Quick actions based on permissions
  const quickActions: QuickAction[] = [
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage users and roles',
      icon: 'people',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('UserManagement' as never),
      requiresPermission: Permission.MANAGE_USERS,
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure system settings',
      icon: 'settings',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('SystemSettings' as never),
      requiresPermission: Permission.MANAGE_SYSTEM,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed analytics',
      icon: 'analytics',
      color: theme.colors.tertiary,
      onPress: () => Alert.alert('Coming Soon', 'Analytics dashboard coming soon!'),
      requiresPermission: Permission.VIEW_ANALYTICS,
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs',
      description: 'View system audit logs',
      icon: 'document-text',
      color: '#FF6B35',
      onPress: () => Alert.alert('Coming Soon', 'Audit logs viewer coming soon!'),
    },
    {
      id: 'backup',
      title: 'System Backup',
      description: 'Create system backup',
      icon: 'cloud-download',
      color: '#9C27B0',
      onPress: handleSystemBackup,
    },
    {
      id: 'maintenance',
      title: 'Maintenance Mode',
      description: 'Toggle maintenance mode',
      icon: 'construct',
      color: theme.colors.error,
      onPress: handleMaintenanceMode,
      destructive: true,
    },
  ];

  // Mock recent activity (in real app, fetch from audit logs)
  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'user_registered',
      message: 'New user registered: john.doe@example.com',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      user: 'john.doe@example.com',
      severity: 'low',
    },
    {
      id: '2',
      type: 'role_changed',
      message: 'User role changed to Admin: jane.smith@example.com',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      user: 'jane.smith@example.com',
      severity: 'medium',
    },
    {
      id: '3',
      type: 'system_alert',
      message: 'High API usage detected',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      severity: 'high',
    },
    {
      id: '4',
      type: 'solve_completed',
      message: '1000th cube solved milestone reached',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      severity: 'low',
    },
  ]);

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call to refresh data
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  /**
   * Handle system backup
   */
  function handleSystemBackup() {
    Alert.alert(
      'System Backup',
      'This will create a full system backup. This process may take several minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Backup', 
          onPress: () => {
            Alert.alert('Backup Started', 'System backup has been initiated. You will be notified when complete.');
          }
        }
      ]
    );
  }

  /**
   * Handle maintenance mode toggle
   */
  function handleMaintenanceMode() {
    Alert.alert(
      'Maintenance Mode',
      'Are you sure you want to enable maintenance mode? This will prevent users from accessing the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enable', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Maintenance Mode Enabled', 'The app is now in maintenance mode.');
          }
        }
      ]
    );
  }

  /**
   * Get activity icon and color
   */
  const getActivityDisplay = (activity: RecentActivity) => {
    const displays = {
      user_registered: { icon: 'person-add' as const, color: theme.colors.tertiary },
      role_changed: { icon: 'shield' as const, color: theme.colors.secondary },
      system_alert: { icon: 'warning' as const, color: theme.colors.error },
      solve_completed: { icon: 'checkmark-circle' as const, color: '#00C851' },
    };

    return displays[activity.type] || { icon: 'information-circle' as const, color: theme.colors.textSecondary };
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
   * Render admin header
   */
  const renderHeader = () => (
    <View style={styles.adminHeader}>
      <View style={styles.headerContent}>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Admin Dashboard
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            System overview and management
          </Text>
        </View>
        <View style={[styles.adminBadge, { backgroundColor: theme.colors.error + '20' }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.error} />
          <Text style={[styles.adminBadgeText, { color: theme.colors.error }]}>
            {isSuperAdmin() ? 'Super Admin' : 'Admin'}
          </Text>
        </View>
      </View>
    </View>
  );

  /**
   * Render system statistics
   */
  const renderSystemStats = () => (
    <View style={styles.statsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        System Statistics
      </Text>
      <View style={styles.statsGrid}>
        {systemStats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={[styles.statCard, { minWidth: (width - 72) / 2 }]}
            onPress={stat.onPress}
            activeOpacity={stat.onPress ? 0.7 : 1}
          >
            <Card elevation="low" style={styles.statCardInner}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                </View>
                {stat.trend && (
                  <View style={[
                    styles.trendContainer,
                    { backgroundColor: stat.trend.isPositive ? '#00C851' : '#FF4444' }
                  ]}>
                    <Ionicons 
                      name={stat.trend.isPositive ? 'trending-up' : 'trending-down'} 
                      size={12} 
                      color="white" 
                    />
                    <Text style={styles.trendText}>
                      {stat.trend.value}%
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {stat.title}
              </Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  /**
   * Render quick actions
   */
  const renderQuickActions = () => {
    const filteredActions = quickActions.filter(action => 
      !action.requiresPermission || hasPermission(action.requiresPermission)
    );

    return (
      <View style={styles.actionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          {filteredActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Card elevation="low" style={[
                styles.actionCardInner,
                action.destructive && { borderColor: theme.colors.error + '40', borderWidth: 1 }
              ]}>
                <View style={[
                  styles.actionIcon, 
                  { backgroundColor: action.destructive ? theme.colors.error + '20' : action.color + '20' }
                ]}>
                  <Ionicons 
                    name={action.icon} 
                    size={24} 
                    color={action.destructive ? theme.colors.error : action.color} 
                  />
                </View>
                <Text style={[
                  styles.actionTitle, 
                  { color: action.destructive ? theme.colors.error : theme.colors.textPrimary }
                ]}>
                  {action.title}
                </Text>
                <Text style={[styles.actionDescription, { color: theme.colors.textSecondary }]}>
                  {action.description}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Render recent activity
   */
  const renderRecentActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Recent Activity
      </Text>
      <Card elevation="low" style={styles.activityCard}>
        {recentActivity.map((activity, index) => {
          const display = getActivityDisplay(activity);
          
          return (
            <View 
              key={activity.id}
              style={[
                styles.activityItem,
                index === recentActivity.length - 1 && styles.lastActivityItem
              ]}
            >
              <View style={[styles.activityIcon, { backgroundColor: display.color + '20' }]}>
                <Ionicons name={display.icon} size={16} color={display.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityMessage, { color: theme.colors.textPrimary }]}>
                  {activity.message}
                </Text>
                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </View>
              <View style={[
                styles.severityBadge,
                { backgroundColor: activity.severity === 'critical' ? theme.colors.error + '20' :
                  activity.severity === 'high' ? '#FF6B35' + '20' :
                  activity.severity === 'medium' ? theme.colors.secondary + '20' :
                  theme.colors.tertiary + '20'
                }
              ]}>
                <Text style={[
                  styles.severityText,
                  { color: activity.severity === 'critical' ? theme.colors.error :
                    activity.severity === 'high' ? '#FF6B35' :
                    activity.severity === 'medium' ? theme.colors.secondary :
                    theme.colors.tertiary
                  }
                ]}>
                  {activity.severity.toUpperCase()}
                </Text>
              </View>
            </View>
          );
        })}
        
        <Button
          title="View All Activity"
          variant="outline"
          onPress={() => Alert.alert('Coming Soon', 'Full activity log coming soon!')}
          style={{ marginTop: 16 }}
          size="small"
        />
      </Card>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          {renderHeader()}
          {renderSystemStats()}
          {renderQuickActions()}
          {renderRecentActivity()}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 24,
  },
  adminHeader: {
    marginBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    minWidth: (width - 72) / 2,
    flex: 1,
  },
  actionCardInner: {
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  activityContainer: {
    marginBottom: 32,
  },
  activityCard: {
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastActivityItem: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});