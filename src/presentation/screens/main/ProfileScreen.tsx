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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';

import { Permission, UserRoleUtils } from '../../../core/domain/models/User';

interface ProfileSection {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: ProfileItem[];
}

interface ProfileItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value?: string | boolean;
  type: 'action' | 'toggle' | 'info' | 'navigation';
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  requiresPermission?: Permission;
  destructive?: boolean;
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { 
    user, 
    signOut, 
    getUserDisplayName, 
    getRoleInfo, 
    hasPermission,
    refreshUser,
    sendEmailVerification
  } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(getUserDisplayName());
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Mock preferences state (in real app, sync with user preferences)
  const [preferences, setPreferences] = useState({
    notifications: user?.preferences?.enableNotifications ?? true,
    darkMode: theme.mode === 'dark',
    analytics: user?.preferences?.allowAnalytics ?? true,
    sounds: true,
  });

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

  // Profile sections configuration
  const profileSections: ProfileSection[] = [
    {
      id: 'account',
      title: 'Account',
      icon: 'person',
      items: [
        {
          id: 'email-verification',
          title: user?.isEmailVerified ? 'Email Verified' : 'Verify Email',
          subtitle: user?.email || '',
          icon: user?.isEmailVerified ? 'checkmark-circle' : 'mail-outline',
          type: user?.isEmailVerified ? 'info' : 'action',
          onPress: user?.isEmailVerified ? undefined : handleResendVerification,
        },
        {
          id: 'change-password',
          title: 'Change Password',
          subtitle: 'Update your password',
          icon: 'lock-closed-outline',
          type: 'navigation',
          onPress: () => Alert.alert('Coming Soon', 'Password change feature coming soon!'),
        },
        {
          id: 'linked-accounts',
          title: 'Linked Accounts',
          subtitle: `${user?.authProviders?.length || 1} account(s) linked`,
          icon: 'link-outline',
          type: 'navigation',
          onPress: () => Alert.alert('Coming Soon', 'Account linking management coming soon!'),
        },
      ],
    },
    {
      id: 'cube-stats',
      title: 'Cube Statistics',
      icon: 'analytics',
      items: [
        {
          id: 'total-solves',
          title: 'Total Solves',
          subtitle: `${user?.cubeStats?.totalSolves || 0} cubes solved`,
          icon: 'cube-outline',
          type: 'info',
        },
        {
          id: 'best-time',
          title: 'Personal Best',
          subtitle: user?.cubeStats?.bestTime ? `${user.cubeStats.bestTime}s` : 'No solves yet',
          icon: 'trophy-outline',
          type: 'info',
        },
        {
          id: 'average-time',
          title: 'Average Time',
          subtitle: user?.cubeStats?.averageTime ? `${user.cubeStats.averageTime}s` : 'No solves yet',
          icon: 'time-outline',
          type: 'info',
        },
        {
          id: 'export-data',
          title: 'Export Statistics',
          subtitle: 'Download your solve data',
          icon: 'download-outline',
          type: 'action',
          onPress: handleExportData,
          requiresPermission: Permission.EXPORT_SOLVE_DATA,
        },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      icon: 'settings',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive notifications',
          type: 'toggle',
          value: preferences.notifications,
          onToggle: (value) => setPreferences(prev => ({ ...prev, notifications: value })),
        },
        {
          id: 'analytics',
          title: 'Analytics',
          subtitle: 'Help improve the app',
          type: 'toggle',
          value: preferences.analytics,
          onToggle: (value) => setPreferences(prev => ({ ...prev, analytics: value })),
        },
        {
          id: 'sounds',
          title: 'Sound Effects',
          subtitle: 'App sounds and feedback',
          type: 'toggle',
          value: preferences.sounds,
          onToggle: (value) => setPreferences(prev => ({ ...prev, sounds: value })),
        },
        {
          id: 'cube-size',
          title: 'Default Cube Size',
          subtitle: user?.preferences?.cubeSize || '3x3',
          icon: 'resize-outline',
          type: 'navigation',
          onPress: () => Alert.alert('Coming Soon', 'Cube size preference coming soon!'),
        },
      ],
    },
    {
      id: 'support',
      title: 'Support & About',
      icon: 'help-circle',
      items: [
        {
          id: 'tutorial',
          title: 'Tutorial',
          subtitle: 'Learn how to solve cubes',
          icon: 'school-outline',
          type: 'navigation',
          onPress: () => navigation.navigate('Tutorial' as never),
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and info',
          icon: 'information-circle-outline',
          type: 'navigation',
          onPress: () => navigation.navigate('About' as never),
        },
        {
          id: 'contact',
          title: 'Contact Support',
          subtitle: 'Get help and feedback',
          icon: 'mail-outline',
          type: 'action',
          onPress: handleContactSupport,
        },
        {
          id: 'sign-out',
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          icon: 'log-out-outline',
          type: 'action',
          onPress: handleSignOut,
          destructive: true,
        },
      ],
    },
  ];

  /**
   * Handle save profile changes
   */
  const handleSaveProfile = async () => {
    try {
      // In real app, call updateProfile API
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  /**
   * Handle email verification resend
   */
  async function handleResendVerification() {
    try {
      await sendEmailVerification();
      Alert.alert(
        'Verification Email Sent',
        'Please check your inbox for the verification email.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification email. Please try again.');
    }
  }

  /**
   * Handle export statistics data
   */
  function handleExportData() {
    Alert.alert(
      'Export Data',
      'Your cube solving statistics will be exported as a CSV file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          // In real app, implement data export
          Alert.alert('Success', 'Data exported successfully!');
        }}
      ]
    );
  }

  /**
   * Handle contact support
   */
  function handleContactSupport() {
    Alert.alert(
      'Contact Support',
      'How would you like to contact support?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => {} },
        { text: 'In-App Chat', onPress: () => {} }
      ]
    );
  }

  /**
   * Handle sign out
   */
  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  }

  /**
   * Render profile header
   */
  const renderProfileHeader = () => {
    const roleInfo = getRoleInfo();

    return (
      <Card elevation="medium" style={styles.profileHeader}>
        <View style={styles.profileContent}>
          <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="person" size={32} color={theme.colors.primary} />
          </View>
          
          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextField
                label="Display Name"
                value={editedName}
                onChangeText={setEditedName}
                style={styles.nameInput}
              />
            ) : (
              <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>
                {getUserDisplayName()}
              </Text>
            )}
            
            <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>
              {user?.email}
            </Text>
            
            <View style={styles.roleContainer}>
              <Ionicons name={roleInfo.icon as any} size={16} color={roleInfo.color} />
              <Text style={[styles.roleText, { color: roleInfo.color }]}>
                {roleInfo.name}
              </Text>
              {!user?.isEmailVerified && (
                <View style={[styles.unverifiedBadge, { backgroundColor: theme.colors.error + '20' }]}>
                  <Text style={[styles.unverifiedText, { color: theme.colors.error }]}>
                    Unverified
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Ionicons 
              name={isEditing ? "checkmark" : "pencil"} 
              size={20} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  /**
   * Render profile section
   */
  const renderSection = (section: ProfileSection) => (
    <View key={section.id} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={section.icon} size={20} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          {section.title}
        </Text>
      </View>
      
      <Card elevation="low" style={styles.sectionCard}>
        {section.items.map((item, index) => {
          // Check permissions
          if (item.requiresPermission && !hasPermission(item.requiresPermission)) {
            return null;
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.sectionItem,
                index === section.items.length - 1 && styles.lastItem,
                item.destructive && { backgroundColor: theme.colors.error + '05' }
              ]}
              onPress={item.onPress}
              disabled={item.type === 'info' || item.type === 'toggle'}
              activeOpacity={item.type === 'info' || item.type === 'toggle' ? 1 : 0.7}
            >
              <View style={styles.itemContent}>
                {item.icon && (
                  <Ionicons 
                    name={item.icon} 
                    size={20} 
                    color={item.destructive ? theme.colors.error : theme.colors.textSecondary} 
                  />
                )}
                <View style={styles.itemText}>
                  <Text style={[
                    styles.itemTitle, 
                    { color: item.destructive ? theme.colors.error : theme.colors.textPrimary }
                  ]}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </View>
              
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
              
              {item.type === 'navigation' && (
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          );
        })}
      </Card>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Profile
        </Text>
        <TouchableOpacity onPress={refreshUser}>
          <Ionicons name="refresh" size={24} color={theme.colors.textPrimary} />
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
          {renderProfileHeader()}
          
          {profileSections.map(renderSection)}
        </Animated.View>
      </ScrollView>
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
  profileHeader: {
    padding: 20,
    marginBottom: 24,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unverifiedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  unverifiedText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  nameInput: {
    marginBottom: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionItem: {
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
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
  },
});