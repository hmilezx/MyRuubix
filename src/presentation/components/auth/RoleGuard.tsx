import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { UserRole, Permission } from '../../../core/domain/models/User';
import { useTheme } from '../../theme/ThemeProvider';
import Card from '../common/Card';
import Button from '../common/Button';

/**
 * Role-based access control guard component
 * Renders children only if user has required role or permissions
 */

interface RoleGuardProps {
  children: ReactNode;
  roles?: UserRole[];
  permissions?: Permission[];
  requireAll?: boolean; // For permissions - require all vs any
  fallback?: ReactNode;
  showFallback?: boolean;
  redirectOnFail?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  permissions,
  requireAll = false,
  fallback,
  showFallback = true,
  redirectOnFail = false,
}) => {
  const { 
    user, 
    hasRole, 
    hasAnyPermission, 
    hasAllPermissions, 
    loading,
    isAuthenticated 
  } = useAuth();
  const { theme } = useTheme();

  // Show loading state
  if (loading) {
    return <LoadingGuard />;
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    return showFallback ? (
      <UnauthorizedGuard 
        title="Authentication Required" 
        message="Please sign in to access this feature."
        redirectOnFail={redirectOnFail}
      />
    ) : null;
  }

  // Check role requirements
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return showFallback ? (
        <UnauthorizedGuard 
          title="Insufficient Role Privileges" 
          message={`This feature requires one of the following roles: ${roles.join(', ')}`}
          currentRole={user.role}
          redirectOnFail={redirectOnFail}
        />
      ) : null;
    }
  }

  // Check permission requirements
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
      
    if (!hasRequiredPermissions) {
      return showFallback ? (
        <UnauthorizedGuard 
          title="Insufficient Permissions" 
          message={`This feature requires ${requireAll ? 'all' : 'one'} of the following permissions: ${permissions.join(', ')}`}
          redirectOnFail={redirectOnFail}
        />
      ) : null;
    }
  }

  // Custom fallback component
  if (fallback) {
    return <>{fallback}</>;
  }

  // Render children if all checks pass
  return <>{children}</>;
};

/**
 * Permission-specific guard for fine-grained access control
 */
interface PermissionGuardProps {
  children: ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions,
  requireAll = false,
  fallback,
  showFallback = true,
}) => {
  return (
    <RoleGuard
      permissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Admin-only guard for administrative features
 */
interface AdminGuardProps {
  children: ReactNode;
  allowSuperAdminOnly?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  allowSuperAdminOnly = false,
  fallback,
  showFallback = true,
}) => {
  const roles = allowSuperAdminOnly 
    ? [UserRole.SUPER_ADMIN] 
    : [UserRole.SUPER_ADMIN, UserRole.ADMIN];

  return (
    <RoleGuard
      roles={roles}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Super Admin only guard for highest privilege features
 */
interface SuperAdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({
  children,
  fallback,
  showFallback = true,
}) => {
  return (
    <RoleGuard
      roles={[UserRole.SUPER_ADMIN]}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Premium user guard for premium features
 */
interface PremiumGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const PremiumGuard: React.FC<PremiumGuardProps> = ({
  children,
  fallback,
  showFallback = true,
}) => {
  const { hasPremiumAccess } = useAuth();

  if (!hasPremiumAccess()) {
    return showFallback ? (
      <PremiumRequiredGuard />
    ) : null;
  }

  return <>{children}</>;
};

/**
 * Loading state component
 */
const LoadingGuard: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.guardContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.guardContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name="hourglass-outline" size={32} color={theme.colors.primary} />
        </View>
        <Text style={[styles.guardTitle, { color: theme.colors.textPrimary }]}>
          Checking Permissions...
        </Text>
      </View>
    </View>
  );
};

/**
 * Unauthorized access component
 */
interface UnauthorizedGuardProps {
  title: string;
  message: string;
  currentRole?: UserRole;
  redirectOnFail?: boolean;
}

const UnauthorizedGuard: React.FC<UnauthorizedGuardProps> = ({
  title,
  message,
  currentRole,
  redirectOnFail = false,
}) => {
  const { theme } = useTheme();
  const { getUserDisplayName, getRoleInfo } = useAuth();

  const handleGoBack = () => {
    // Navigate back or to appropriate screen
    console.log('Navigate back or to home');
  };

  const handleContactSupport = () => {
    // Open support contact
    console.log('Contact support');
  };

  return (
    <View style={[styles.guardContainer, { backgroundColor: theme.colors.background }]}>
      <Card elevation="medium" style={styles.unauthorizedCard}>
        <View style={styles.guardContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '20' }]}>
            <Ionicons name="shield-outline" size={32} color={theme.colors.error} />
          </View>
          
          <Text style={[styles.guardTitle, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
          
          <Text style={[styles.guardMessage, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>
          
          {currentRole && (
            <View style={styles.roleInfoContainer}>
              <Text style={[styles.roleInfoLabel, { color: theme.colors.textSecondary }]}>
                Current Role:
              </Text>
              <View style={[
                styles.roleBadge, 
                { backgroundColor: getRoleInfo().color + '20' }
              ]}>
                <Text style={[styles.roleBadgeText, { color: getRoleInfo().color }]}>
                  {getRoleInfo().name}
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.guardActions}>
            <Button
              title="Go Back"
              variant="outline"
              onPress={handleGoBack}
              style={{ marginBottom: 12 }}
            />
            <Button
              title="Contact Support"
              variant="text"
              onPress={handleContactSupport}
            />
          </View>
        </View>
      </Card>
    </View>
  );
};

/**
 * Premium required component
 */
const PremiumRequiredGuard: React.FC = () => {
  const { theme } = useTheme();

  const handleUpgradeToPremium = () => {
    // Navigate to premium upgrade screen
    console.log('Navigate to premium upgrade');
  };

  const handleLearnMore = () => {
    // Show premium features info
    console.log('Show premium features info');
  };

  return (
    <View style={[styles.guardContainer, { backgroundColor: theme.colors.background }]}>
      <Card elevation="medium" style={styles.premiumCard}>
        <View style={styles.guardContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.tertiary + '20' }]}>
            <Ionicons name="diamond-outline" size={32} color={theme.colors.tertiary} />
          </View>
          
          <Text style={[styles.guardTitle, { color: theme.colors.textPrimary }]}>
            Premium Feature
          </Text>
          
          <Text style={[styles.guardMessage, { color: theme.colors.textSecondary }]}>
            This feature is available for premium users. Upgrade to unlock advanced cube solving tools, unlimited solves, and more!
          </Text>
          
          <View style={styles.guardActions}>
            <Button
              title="🚀 Upgrade to Premium"
              onPress={handleUpgradeToPremium}
              style={{ marginBottom: 12 }}
            />
            <Button
              title="Learn More"
              variant="text"
              onPress={handleLearnMore}
            />
          </View>
        </View>
      </Card>
    </View>
  );
};

/**
 * Feature coming soon component
 */
interface ComingSoonGuardProps {
  featureName: string;
  expectedRelease?: string;
}

export const ComingSoonGuard: React.FC<ComingSoonGuardProps> = ({
  featureName,
  expectedRelease,
}) => {
  const { theme } = useTheme();

  const handleNotifyMe = () => {
    // Add to notification list
    console.log('Add to notification list');
  };

  return (
    <View style={[styles.guardContainer, { backgroundColor: theme.colors.background }]}>
      <Card elevation="medium" style={styles.comingSoonCard}>
        <View style={styles.guardContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary + '20' }]}>
            <Ionicons name="rocket-outline" size={32} color={theme.colors.secondary} />
          </View>
          
          <Text style={[styles.guardTitle, { color: theme.colors.textPrimary }]}>
            Coming Soon!
          </Text>
          
          <Text style={[styles.guardMessage, { color: theme.colors.textSecondary }]}>
            {featureName} is currently in development and will be available soon.
            {expectedRelease && ` Expected release: ${expectedRelease}.`}
          </Text>
          
          <View style={styles.guardActions}>
            <Button
              title="🔔 Notify Me"
              variant="outline"
              onPress={handleNotifyMe}
            />
          </View>
        </View>
      </Card>
    </View>
  );
};

/**
 * Conditional rendering hook for role-based UI
 */
export const useConditionalRender = () => {
  const { hasRole, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  const renderIfRole = (role: UserRole, component: ReactNode) => {
    return hasRole(role) ? component : null;
  };

  const renderIfPermission = (permission: Permission, component: ReactNode) => {
    return hasPermission(permission) ? component : null;
  };

  const renderIfAnyPermission = (permissions: Permission[], component: ReactNode) => {
    return hasAnyPermission(permissions) ? component : null;
  };

  const renderIfAllPermissions = (permissions: Permission[], component: ReactNode) => {
    return hasAllPermissions(permissions) ? component : null;
  };

  return {
    renderIfRole,
    renderIfPermission,
    renderIfAnyPermission,
    renderIfAllPermissions,
  };
};

const styles = StyleSheet.create({
  guardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  guardContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  guardMessage: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  roleInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  roleInfoLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  guardActions: {
    width: '100%',
    alignItems: 'center',
  },
  unauthorizedCard: {
    padding: 24,
    maxWidth: 350,
  },
  premiumCard: {
    padding: 24,
    maxWidth: 350,
  },
  comingSoonCard: {
    padding: 24,
    maxWidth: 350,
  },
});

export default RoleGuard;