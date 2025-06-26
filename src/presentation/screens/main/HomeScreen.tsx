import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Permission } from '../../../core/domain/models/User';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  requiresPermission?: Permission;
}

interface CubeStat {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, getUserDisplayName, getRoleInfo, hasPermission, isAdmin } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Mock cube stats (in real app, fetch from API)
  const [cubeStats] = useState<CubeStat[]>([
    {
      label: 'Total Solves',
      value: user?.cubeStats?.totalSolves || 0,
      icon: 'cube-outline',
      color: theme.colors.primary,
      trend: { value: 12, isPositive: true }
    },
    {
      label: 'Best Time',
      value: user?.cubeStats?.bestTime ? `${user.cubeStats.bestTime}s` : '--:--',
      icon: 'timer-outline',
      color: theme.colors.tertiary,
      trend: { value: 5, isPositive: true }
    },
    {
      label: 'Average Time',
      value: user?.cubeStats?.averageTime ? `${user.cubeStats.averageTime}s` : '--:--',
      icon: 'trending-up-outline',
      color: theme.colors.secondary,
      trend: { value: 2, isPositive: false }
    },
    {
      label: 'Current Streak',
      value: user?.cubeStats?.currentStreak || 0,
      icon: 'flame-outline',
      color: '#FF6B35',
      trend: { value: 3, isPositive: true }
    },
  ]);

  // Quick actions based on user permissions
  const quickActions: QuickAction[] = [
    {
      id: 'solve-cube',
      title: 'Solve Cube',
      subtitle: 'AI-powered solving',
      icon: 'cube',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Solve' as never),
    },
    {
      id: 'scan-cube',
      title: 'Scan Cube',
      subtitle: 'Use camera detection',
      icon: 'camera',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('CameraCapture' as never),
    },
    {
      id: 'view-history',
      title: 'View History',
      subtitle: 'Your solve history',
      icon: 'time',
      color: theme.colors.tertiary,
      onPress: () => navigation.navigate('History' as never),
      requiresPermission: Permission.EXPORT_SOLVE_DATA,
    },
    {
      id: 'tutorial',
      title: 'Tutorial',
      subtitle: 'Learn to solve',
      icon: 'school',
      color: '#FF6B35',
      onPress: () => navigation.navigate('Tutorial' as never),
    },
  ];

  // Admin quick actions
  const adminActions: QuickAction[] = [
    {
      id: 'admin-panel',
      title: 'Admin Panel',
      subtitle: 'Manage system',
      icon: 'shield',
      color: theme.colors.error,
      onPress: () => navigation.navigate('AdminStack' as never),
    },
  ];

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
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  /**
   * Render greeting section
   */
  const renderGreetingSection = () => {
    const currentHour = new Date().getHours();
    let greeting = 'Good evening';
    if (currentHour < 12) greeting = 'Good morning';
    else if (currentHour < 17) greeting = 'Good afternoon';

    const roleInfo = getRoleInfo();

    return (
      <View style={styles.greetingSection}>
        <View style={styles.greetingContent}>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            {greeting}
          </Text>
          <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
            {getUserDisplayName()}
          </Text>
          <View style={styles.roleContainer}>
            <Ionicons name={roleInfo.icon as any} size={16} color={roleInfo.color} />
            <Text style={[styles.roleText, { color: roleInfo.color }]}>
              {roleInfo.name}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="person" size={24} color={theme.colors.primary} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render stats grid
   */
  const renderStatsGrid = () => (
    <View style={styles.statsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Your Progress
      </Text>
      <View style={styles.statsGrid}>
        {cubeStats.map((stat, index) => (
          <Card 
            key={stat.label}
            elevation="low"
            style={[styles.statCard, { minWidth: (width - 72) / 2 }]}
          >
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
              {stat.label}
            </Text>
          </Card>
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
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Render admin section
   */
  const renderAdminSection = () => {
    if (!isAdmin()) return null;

    return (
      <View style={styles.adminContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Administration
        </Text>
        <Card elevation="medium" style={styles.adminCard}>
          <View style={styles.adminContent}>
            <View style={[styles.adminIcon, { backgroundColor: theme.colors.error + '20' }]}>
              <Ionicons name="shield-checkmark" size={32} color={theme.colors.error} />
            </View>
            <View style={styles.adminText}>
              <Text style={[styles.adminTitle, { color: theme.colors.textPrimary }]}>
                Admin Panel
              </Text>
              <Text style={[styles.adminSubtitle, { color: theme.colors.textSecondary }]}>
                Manage users, system settings, and view analytics
              </Text>
            </View>
          </View>
          <Button
            title="Open Admin Panel"
            variant="outline"
            onPress={() => navigation.navigate('AdminStack' as never)}
            style={{ marginTop: 16 }}
          />
        </Card>
      </View>
    );
  };

  /**
   * Render recent activity (placeholder)
   */
  const renderRecentActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Recent Activity
      </Text>
      <Card elevation="low" style={styles.activityCard}>
        <View style={styles.activityEmpty}>
          <Ionicons name="cube-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.activityEmptyText, { color: theme.colors.textSecondary }]}>
            No recent solves
          </Text>
          <Text style={[styles.activityEmptySubtext, { color: theme.colors.textSecondary }]}>
            Start solving to see your activity here
          </Text>
          <Button
            title="Solve Your First Cube"
            onPress={() => navigation.navigate('Solve' as never)}
            style={{ marginTop: 16 }}
            size="small"
          />
        </View>
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
          {renderGreetingSection()}
          {renderStatsGrid()}
          {renderQuickActions()}
          {renderAdminSection()}
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
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greetingContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 16,
    flex: 1,
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
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: (width - 72) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  adminContainer: {
    marginBottom: 32,
  },
  adminCard: {
    padding: 20,
  },
  adminContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  adminText: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adminSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  activityContainer: {
    marginBottom: 32,
  },
  activityCard: {
    padding: 32,
  },
  activityEmpty: {
    alignItems: 'center',
  },
  activityEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  activityEmptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});