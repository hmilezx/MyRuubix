import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';

import { Permission } from '../../../core/domain/models/User';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: SettingsItem[];
  requiresPermission?: Permission;
}

interface SettingsItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'action' | 'input' | 'select' | 'info' | 'danger';
  value?: boolean | string | number;
  options?: Array<{ label: string; value: string | number }>;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  onChange?: (value: string | number) => void;
  requiresPermission?: Permission;
  destructive?: boolean;
}

interface SystemInfo {
  appVersion: string;
  buildNumber: string;
  lastBackup: Date;
  totalUsers: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  uptime: string;
  storageUsed: string;
  apiCalls24h: number;
}

export default function SystemSettingsScreen() {
  const { theme } = useTheme();
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // State
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ title: string; action: () => void } | null>(null);
  
  // System settings state (in real app, fetch from server)
  const [settings, setSettings] = useState({
    // Security settings
    maintenanceMode: false,
    requireEmailVerification: true,
    enableTwoFactor: false,
    maxLoginAttempts: 5,
    sessionTimeout: 24, // hours
    
    // Feature flags
    enableGoogleAuth: true,
    enableCubeDetection: true,
    enableNotifications: true,
    enableAnalytics: true,
    
    // System limits
    maxUsersPerDay: 100,
    maxSolvesPerUser: 1000,
    maxFileUploadSize: 10, // MB
    
    // Performance
    enableCaching: true,
    cacheTimeout: 3600, // seconds
    enableCompression: true,
    
    // Notifications
    adminNotifications: true,
    errorNotifications: true,
    performanceAlerts: true,
  });

  // Mock system info (in real app, fetch from ISuperAdminRepository)
  const [systemInfo] = useState<SystemInfo>({
    appVersion: '1.0.0',
    buildNumber: '2024.1.15',
    lastBackup: new Date(Date.now() - 1000 * 60 * 60 * 6),
    totalUsers: 1247,
    activeUsers: 892,
    systemHealth: 'healthy',
    uptime: '15 days, 6 hours',
    storageUsed: '2.4 GB',
    apiCalls24h: 15420,
  });

  // Settings sections configuration
  const settingsSections: SettingsSection[] = [
    {
      id: 'security',
      title: 'Security & Authentication',
      description: 'Manage security settings and authentication options',
      icon: 'shield-checkmark',
      requiresPermission: Permission.MANAGE_SYSTEM,
      items: [
        {
          id: 'maintenance-mode',
          title: 'Maintenance Mode',
          description: 'Temporarily disable app access for all users',
          type: 'toggle',
          value: settings.maintenanceMode,
          onToggle: (value) => handleToggleSetting('maintenanceMode', value, 'Enable Maintenance Mode', 'This will prevent all users from accessing the app.'),
          destructive: true,
        },
        {
          id: 'email-verification',
          title: 'Require Email Verification',
          description: 'Force email verification for new accounts',
          type: 'toggle',
          value: settings.requireEmailVerification,
          onToggle: (value) => handleToggleSetting('requireEmailVerification', value),
        },
        {
          id: 'two-factor',
          title: 'Two-Factor Authentication',
          description: 'Enable 2FA for admin accounts',
          type: 'toggle',
          value: settings.enableTwoFactor,
          onToggle: (value) => handleToggleSetting('enableTwoFactor', value),
        },
        {
          id: 'max-login-attempts',
          title: 'Max Login Attempts',
          description: 'Maximum failed login attempts before lockout',
          type: 'select',
          value: settings.maxLoginAttempts,
          options: [
            { label: '3 attempts', value: 3 },
            { label: '5 attempts', value: 5 },
            { label: '10 attempts', value: 10 },
          ],
          onChange: (value) => updateSetting('maxLoginAttempts', value),
        },
        {
          id: 'session-timeout',
          title: 'Session Timeout',
          description: 'Automatically sign out users after inactivity',
          type: 'select',
          value: settings.sessionTimeout,
          options: [
            { label: '1 hour', value: 1 },
            { label: '8 hours', value: 8 },
            { label: '24 hours', value: 24 },
            { label: '7 days', value: 168 },
          ],
          onChange: (value) => updateSetting('sessionTimeout', value),
        },
      ],
    },
    {
      id: 'features',
      title: 'Feature Management',
      description: 'Enable or disable application features',
      icon: 'options',
      items: [
        {
          id: 'google-auth',
          title: 'Google Authentication',
          description: 'Allow users to sign in with Google',
          type: 'toggle',
          value: settings.enableGoogleAuth,
          onToggle: (value) => updateSetting('enableGoogleAuth', value),
        },
        {
          id: 'cube-detection',
          title: 'AI Cube Detection',
          description: 'Enable camera-based cube state detection',
          type: 'toggle',
          value: settings.enableCubeDetection,
          onToggle: (value) => updateSetting('enableCubeDetection', value),
        },
        {
          id: 'notifications',
          title: 'Push Notifications',
          description: 'Enable push notifications for users',
          type: 'toggle',
          value: settings.enableNotifications,
          onToggle: (value) => updateSetting('enableNotifications', value),
        },
        {
          id: 'analytics',
          title: 'Analytics Collection',
          description: 'Collect usage analytics for improvement',
          type: 'toggle',
          value: settings.enableAnalytics,
          onToggle: (value) => updateSetting('enableAnalytics', value),
        },
      ],
    },
    {
      id: 'limits',
      title: 'System Limits',
      description: 'Configure resource and usage limits',
      icon: 'speedometer',
      requiresPermission: Permission.MANAGE_SYSTEM,
      items: [
        {
          id: 'max-users-per-day',
          title: 'Daily User Registration Limit',
          description: 'Maximum new users per day',
          type: 'select',
          value: settings.maxUsersPerDay,
          options: [
            { label: '50 users', value: 50 },
            { label: '100 users', value: 100 },
            { label: '500 users', value: 500 },
            { label: 'Unlimited', value: -1 },
          ],
          onChange: (value) => updateSetting('maxUsersPerDay', value),
        },
        {
          id: 'max-solves-per-user',
          title: 'Max Solves Per User',
          description: 'Daily solve limit for regular users',
          type: 'select',
          value: settings.maxSolvesPerUser,
          options: [
            { label: '100 solves', value: 100 },
            { label: '500 solves', value: 500 },
            { label: '1000 solves', value: 1000 },
            { label: 'Unlimited', value: -1 },
          ],
          onChange: (value) => updateSetting('maxSolvesPerUser', value),
        },
        {
          id: 'max-file-upload',
          title: 'Max File Upload Size',
          description: 'Maximum size for file uploads',
          type: 'select',
          value: settings.maxFileUploadSize,
          options: [
            { label: '5 MB', value: 5 },
            { label: '10 MB', value: 10 },
            { label: '25 MB', value: 25 },
            { label: '50 MB', value: 50 },
          ],
          onChange: (value) => updateSetting('maxFileUploadSize', value),
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance & Optimization',
      description: 'Configure performance settings',
      icon: 'flash',
      items: [
        {
          id: 'enable-caching',
          title: 'Enable Caching',
          description: 'Cache frequently accessed data',
          type: 'toggle',
          value: settings.enableCaching,
          onToggle: (value) => updateSetting('enableCaching', value),
        },
        {
          id: 'cache-timeout',
          title: 'Cache Timeout',
          description: 'How long to keep cached data',
          type: 'select',
          value: settings.cacheTimeout,
          options: [
            { label: '30 minutes', value: 1800 },
            { label: '1 hour', value: 3600 },
            { label: '6 hours', value: 21600 },
            { label: '24 hours', value: 86400 },
          ],
          onChange: (value) => updateSetting('cacheTimeout', value),
        },
        {
          id: 'enable-compression',
          title: 'Response Compression',
          description: 'Compress API responses to reduce bandwidth',
          type: 'toggle',
          value: settings.enableCompression,
          onToggle: (value) => updateSetting('enableCompression', value),
        },
      ],
    },
    {
      id: 'notifications-admin',
      title: 'Admin Notifications',
      description: 'Configure administrative alerts',
      icon: 'notifications',
      items: [
        {
          id: 'admin-notifications',
          title: 'Admin Notifications',
          description: 'Receive notifications about system events',
          type: 'toggle',
          value: settings.adminNotifications,
          onToggle: (value) => updateSetting('adminNotifications', value),
        },
        {
          id: 'error-notifications',
          title: 'Error Alerts',
          description: 'Get notified of system errors',
          type: 'toggle',
          value: settings.errorNotifications,
          onToggle: (value) => updateSetting('errorNotifications', value),
        },
        {
          id: 'performance-alerts',
          title: 'Performance Alerts',
          description: 'Alerts for performance issues',
          type: 'toggle',
          value: settings.performanceAlerts,
          onToggle: (value) => updateSetting('performanceAlerts', value),
        },
      ],
    },
    {
      id: 'system-actions',
      title: 'System Actions',
      description: 'Administrative system operations',
      icon: 'construct',
      requiresPermission: Permission.MANAGE_SYSTEM,
      items: [
        {
          id: 'create-backup',
          title: 'Create System Backup',
          description: 'Generate a full system backup',
          type: 'action',
          onPress: () => handleSystemAction('Create Backup', handleCreateBackup),
        },
        {
          id: 'clear-cache',
          title: 'Clear System Cache',
          description: 'Clear all cached data',
          type: 'action',
          onPress: () => handleSystemAction('Clear Cache', handleClearCache),
        },
        {
          id: 'export-logs',
          title: 'Export System Logs',
          description: 'Download system logs for analysis',
          type: 'action',
          onPress: () => handleSystemAction('Export Logs', handleExportLogs),
        },
        {
          id: 'reset-system',
          title: 'Reset System Settings',
          description: 'Reset all settings to defaults',
          type: 'danger',
          onPress: () => handleSystemAction('Reset System', handleResetSystem, 'This will reset all settings to their default values. This action cannot be undone.'),
          destructive: true,
        },
      ],
    },
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
   * Update setting value
   */
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Handle toggle setting with confirmation
   */
  const handleToggleSetting = (key: string, value: boolean, title?: string, message?: string) => {
    if (title && message) {
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => updateSetting(key, value) }
        ]
      );
    } else {
      updateSetting(key, value);
    }
  };

  /**
   * Handle system actions with confirmation
   */
  const handleSystemAction = (title: string, action: () => void, customMessage?: string) => {
    setPendingAction({ title, action });
    setShowConfirmModal(true);
  };

  /**
   * System action implementations
   */
  const handleCreateBackup = () => {
    Alert.alert('Backup Started', 'System backup has been initiated. You will be notified when complete.');
  };

  const handleClearCache = () => {
    Alert.alert('Cache Cleared', 'All system cache has been cleared successfully.');
  };

  const handleExportLogs = () => {
    Alert.alert('Logs Exported', 'System logs have been exported and are ready for download.');
  };

  const handleResetSystem = () => {
    // Reset settings to defaults
    setSettings({
      maintenanceMode: false,
      requireEmailVerification: true,
      enableTwoFactor: false,
      maxLoginAttempts: 5,
      sessionTimeout: 24,
      enableGoogleAuth: true,
      enableCubeDetection: true,
      enableNotifications: true,
      enableAnalytics: true,
      maxUsersPerDay: 100,
      maxSolvesPerUser: 1000,
      maxFileUploadSize: 10,
      enableCaching: true,
      cacheTimeout: 3600,
      enableCompression: true,
      adminNotifications: true,
      errorNotifications: true,
      performanceAlerts: true,
    });
    Alert.alert('Settings Reset', 'All system settings have been reset to defaults.');
  };

  /**
   * Format last backup time
   */
  const formatLastBackup = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  /**
   * Render system info card
   */
  const renderSystemInfo = () => (
    <Card elevation="medium" style={styles.systemInfoCard}>
      <View style={styles.systemInfoHeader}>
        <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
        <Text style={[styles.systemInfoTitle, { color: theme.colors.textPrimary }]}>
          System Information
        </Text>
      </View>
      
      <View style={styles.systemInfoGrid}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Version</Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            {systemInfo.appVersion} ({systemInfo.buildNumber})
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Last Backup</Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            {formatLastBackup(systemInfo.lastBackup)}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Total Users</Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            {systemInfo.totalUsers.toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>System Health</Text>
          <View style={styles.healthContainer}>
            <View style={[
              styles.healthDot,
              { backgroundColor: systemInfo.systemHealth === 'healthy' ? '#00C851' : 
                systemInfo.systemHealth === 'warning' ? '#FF6B35' : '#FF4444' }
            ]} />
            <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
              {systemInfo.systemHealth.charAt(0).toUpperCase() + systemInfo.systemHealth.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Uptime</Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            {systemInfo.uptime}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Storage Used</Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            {systemInfo.storageUsed}
          </Text>
        </View>
      </View>
    </Card>
  );

  /**
   * Render settings section
   */
  const renderSection = (section: SettingsSection) => {
    // Check permissions
    if (section.requiresPermission && !hasPermission(section.requiresPermission)) {
      return null;
    }

    return (
      <View key={section.id} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={section.icon} size={20} color={theme.colors.primary} />
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              {section.description}
            </Text>
          </View>
        </View>
        
        <Card elevation="low" style={styles.sectionCard}>
          {section.items.map((item, index) => {
            // Check item permissions
            if (item.requiresPermission && !hasPermission(item.requiresPermission)) {
              return null;
            }

            return (
              <View
                key={item.id}
                style={[
                  styles.settingItem,
                  index === section.items.length - 1 && styles.lastItem,
                  item.destructive && { backgroundColor: theme.colors.error + '05' }
                ]}
              >
                <View style={styles.settingContent}>
                  <Text style={[
                    styles.settingTitle, 
                    { color: item.destructive ? theme.colors.error : theme.colors.textPrimary }
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
                
                <View style={styles.settingControl}>
                  {item.type === 'toggle' && (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={item.onToggle}
                      trackColor={{ 
                        false: theme.colors.border, 
                        true: theme.colors.primary + '40' 
                      }}
                      thumbColor={item.value ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  )}
                  
                  {item.type === 'select' && (
                    <TouchableOpacity 
                      style={styles.selectButton}
                      onPress={() => {
                        const option = item.options?.find(o => o.value === item.value);
                        Alert.alert('Select Option', option?.label || 'Select an option');
                      }}
                    >
                      <Text style={[styles.selectButtonText, { color: theme.colors.textPrimary }]}>
                        {item.options?.find(o => o.value === item.value)?.label || 'Select'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                  
                  {(item.type === 'action' || item.type === 'danger') && (
                    <TouchableOpacity 
                      style={[
                        styles.actionButton,
                        { borderColor: item.destructive ? theme.colors.error : theme.colors.primary }
                      ]}
                      onPress={item.onPress}
                    >
                      <Text style={[
                        styles.actionButtonText, 
                        { color: item.destructive ? theme.colors.error : theme.colors.primary }
                      ]}>
                        {item.type === 'danger' ? 'Reset' : 'Execute'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    );
  };

  /**
   * Render confirmation modal
   */
  const renderConfirmModal = () => (
    <Modal
      visible={showConfirmModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowConfirmModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Ionicons name="warning" size={24} color={theme.colors.error} />
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Confirm Action
            </Text>
          </View>
          
          <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
            Are you sure you want to {pendingAction?.title.toLowerCase()}?
            {pendingAction?.title.includes('Reset') && ' This action cannot be undone.'}
          </Text>
          
          <View style={styles.modalButtons}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setShowConfirmModal(false);
                setPendingAction(null);
              }}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Confirm"
              onPress={() => {
                pendingAction?.action();
                setShowConfirmModal(false);
                setPendingAction(null);
              }}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          System Settings
        </Text>
        <TouchableOpacity onPress={() => Alert.alert('Settings Saved', 'All settings have been saved successfully.')}>
          <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          {renderSystemInfo()}
          {settingsSections.map(renderSection)}
        </Animated.View>
      </ScrollView>

      {renderConfirmModal()}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 24,
  },
  systemInfoCard: {
    padding: 20,
    marginBottom: 24,
  },
  systemInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  systemInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  systemInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    minWidth: '45%',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
  },
});