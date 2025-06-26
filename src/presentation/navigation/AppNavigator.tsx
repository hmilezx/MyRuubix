import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { UserRole, Permission } from '../../core/domain/models/User';
import { useTheme } from '../theme/ThemeProvider';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
// import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/main/HomeScreen';
import SolveScreen from '../screens/main/SolveScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import SystemSettingsScreen from '../screens/admin/SystemSettingScreen';

// Navigation parameter types
export type RootStackParamList = {
  // Auth Stack
  AuthStack: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Main App Stack
  MainStack: undefined;
  MainTabs: undefined;
  Home: undefined;
  Solve: { cubeState?: string; algorithm?: string };
  Profile: undefined;
  Settings: undefined;
  
  // Admin Stack
  AdminStack: undefined;
  AdminDashboard: undefined;
  UserManagement: undefined;
  SystemSettings: undefined;
  
  // Modal Screens
  CameraCapture: undefined;
  Statistics: undefined;
  Tutorial: undefined;
  About: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Solve: { cubeState?: string };
  History: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const AdminStack = createStackNavigator();

/**
 * Loading screen component
 */
const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{
        marginTop: 16,
        fontSize: 16,
        color: theme.colors.textSecondary,
      }}>
        Loading Rubix Solver...
      </Text>
    </View>
  );
};

/**
 * Authentication stack for non-authenticated users
 */
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        animationTypeForReplace: 'push',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

/**
 * Main tab navigator for regular users
 */
const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { user, hasPermission } = useAuth();
  
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Solve':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'History':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <MainTab.Screen 
        name="Solve" 
        component={SolveScreen}
        options={{ title: 'Solve' }}
      />
      <MainTab.Screen 
        name="History" 
        component={ProfileScreen} // Reusing profile for now
        options={{ 
          title: 'History',
          tabBarBadge: hasPermission(Permission.ACCESS_PREMIUM_FEATURES) ? undefined : '🔒',
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </MainTab.Navigator>
  );
};

/**
 * Admin tab navigator for administrators
 */
const AdminTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Users':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <AdminTab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <AdminTab.Screen 
        name="Users" 
        component={UserManagementScreen}
        options={{ title: 'Users' }}
      />
      <AdminTab.Screen 
        name="Analytics" 
        component={AdminDashboardScreen} // Reusing dashboard for now
        options={{ title: 'Analytics' }}
      />
      <AdminTab.Screen 
        name="Settings" 
        component={SystemSettingsScreen}
        options={{ 
          title: 'Settings',
          tabBarBadge: user?.role === UserRole.SUPER_ADMIN ? '🛡️' : undefined,
        }}
      />
    </AdminTab.Navigator>
  );
};

/**
 * Main stack navigator for authenticated users
 */
const MainNavigator: React.FC = () => {
  const { user, canAccessAdminPanel } = useAuth();
  
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      {/* Main user interface */}
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      
      {/* Admin interface (conditionally rendered) */}
      {canAccessAdminPanel() && (
        <MainStack.Screen name="AdminStack" component={AdminNavigator} />
      )}
      
      {/* Modal screens */}
      <MainStack.Group screenOptions={{ presentation: 'modal' }}>
        <MainStack.Screen 
          name="CameraCapture" 
          component={SolveScreen} // Reusing solve screen for now
          options={{ title: 'Capture Cube' }}
        />
        <MainStack.Screen 
          name="Statistics" 
          component={ProfileScreen} // Reusing profile for now
          options={{ title: 'Statistics' }}
        />
        <MainStack.Screen 
          name="Tutorial" 
          component={HomeScreen} // Reusing home for now
          options={{ title: 'Tutorial' }}
        />
        <MainStack.Screen 
          name="About" 
          component={ProfileScreen} // Reusing profile for now
          options={{ title: 'About' }}
        />
      </MainStack.Group>
    </MainStack.Navigator>
  );
};

/**
 * Admin stack navigator
 */
const AdminNavigator: React.FC = () => {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AdminStack.Screen name="AdminTabs" component={AdminTabNavigator} />
    </AdminStack.Navigator>
  );
};

/**
 * Role-based navigation decision component
 */
const RoleBasedNavigator: React.FC = () => {
  const { user, isAuthenticated, canAccessAdminPanel } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <AuthNavigator />;
  }
  
  // For admin users, they can access both main and admin interfaces
  // The actual navigation between them would be handled by UI elements
  return <MainNavigator />;
};

/**
 * Root application navigator with authentication flow
 */
const AppNavigator: React.FC = () => {
  const { isInitialized, loading } = useAuth();
  const { theme } = useTheme();
  
  // Show loading screen while initializing
  if (!isInitialized || loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.mode === 'dark',
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.error,
        },
      }}
    >
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animationTypeForReplace: 'push',
        }}
      >
        <RootStack.Screen name="MainStack" component={RoleBasedNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

/**
 * Navigation helper hooks for role-based navigation
 */
export const useRoleBasedNavigation = () => {
  const { user, canAccessAdminPanel, isAdmin, isSuperAdmin } = useAuth();
  
  const canNavigateToAdmin = canAccessAdminPanel();
  const canNavigateToUserManagement = isAdmin();
  const canNavigateToSystemSettings = isSuperAdmin();
  
  const getAvailableScreens = () => {
    const screens = ['Home', 'Solve', 'Profile'];
    
    if (canNavigateToAdmin) {
      screens.push('AdminDashboard');
    }
    
    if (canNavigateToUserManagement) {
      screens.push('UserManagement');
    }
    
    if (canNavigateToSystemSettings) {
      screens.push('SystemSettings');
    }
    
    return screens;
  };
  
  const getDefaultScreen = () => {
    if (!user) return 'Login';
    return 'Home';
  };
  
  return {
    canNavigateToAdmin,
    canNavigateToUserManagement,
    canNavigateToSystemSettings,
    getAvailableScreens,
    getDefaultScreen,
  };
};

/**
 * Tab visibility hook for conditional tab rendering
 */
export const useTabVisibility = () => {
  const { user, hasPermission } = useAuth();
  
  const showHistoryTab = hasPermission(Permission.EXPORT_SOLVE_DATA);
  const showPremiumFeatures = hasPermission(Permission.ACCESS_PREMIUM_FEATURES);
  const showAdminBadge = user?.role === UserRole.SUPER_ADMIN;
  
  return {
    showHistoryTab,
    showPremiumFeatures,
    showAdminBadge,
  };
};

export default AppNavigator;