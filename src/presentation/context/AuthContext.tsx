import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  User, 
  UserRole, 
  Permission,
  EmailSignUpDTO,
  EmailSignInDTO,
  UserRoleUtils
} from '../../core/domain/models/User';
import { AuthError, AuthErrorFactory } from '../../core/domain/models/AuthError';
import { IAuthRepository } from '../../core/domain/repositories/IAuthRepository';
import { SecureStorage } from '../../utils/security/SecureStorage';

/**
 * Enhanced AuthContext interface with complete RBAC and Google auth
 */
interface AuthContextType {
  // User state
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Email authentication
  signUpWithEmail: (data: EmailSignUpDTO) => Promise<void>;
  signInWithEmail: (data: EmailSignInDTO) => Promise<void>;
  
  // Google authentication
  signInWithGoogle: () => Promise<void>;
  
  // Session management
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Password management
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Email verification
  sendEmailVerification: () => Promise<void>;
  verifyEmail: () => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  
  // Role and permission checking
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  canAccessAdminPanel: () => boolean;
  
  // User utility functions
  clearError: () => void;
  getUserDisplayName: () => string;
  getFullName: () => string;
  getRoleInfo: () => { name: string; color: string; icon: string; badge: string };
  getSolvingLevel: () => 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
  hasPremiumAccess: () => boolean;
  
  // Admin functions
  initializeSuperAdmin: () => Promise<void>;
  
  // Security functions
  checkAccountSecurity: () => Promise<any>;
  getLoginHistory: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Enhanced AuthProvider with comprehensive RBAC and security features
 */
export const AuthProvider: React.FC<{
  children: ReactNode;
  authRepository: IAuthRepository;
}> = ({ children, authRepository }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const secureStorage = SecureStorage.getInstance();

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🔄 Initializing authentication...');
        
        // Check for existing authentication
        const currentUser = await authRepository.getCurrentUser();
        
        if (currentUser) {
          console.log('✅ User authenticated:', currentUser.email);
          setUser(currentUser);
          setIsAuthenticated(true);
          
          // Cache user data securely with role info
          await secureStorage.setItem('user_cache', JSON.stringify({
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            permissions: currentUser.permissions,
            lastRefresh: new Date().toISOString()
          }));
        } else {
          console.log('ℹ️ No authenticated user found');
          // Clear any stale cache
          await secureStorage.removeItem('user_cache');
        }
        
        setIsInitialized(true);
      } catch (err: any) {
        console.error('❌ Auth initialization error:', err);
        const authError = AuthErrorFactory.fromError(err);
        setError(authError);
        setIsAuthenticated(false);
        
        // Clear potentially corrupted cache
        try {
          await secureStorage.removeItem('user_cache');
        } catch (cacheError) {
          console.error('Error clearing cache:', cacheError);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [authRepository]);

  /**
   * Auto-refresh user data periodically for server-side role validation
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const refreshInterval = setInterval(async () => {
      try {
        console.log('🔄 Auto-refreshing user data for security validation...');
        
        // Silently refresh user data every 5 minutes to validate roles from server
        const refreshedUser = await authRepository.refreshUserData();
        
        if (refreshedUser && refreshedUser.id === user.id) {
          // Check if role or permissions changed (critical for security)
          const roleChanged = refreshedUser.role !== user.role;
          const permissionsChanged = JSON.stringify(refreshedUser.permissions) !== JSON.stringify(user.permissions);
          
          if (roleChanged || permissionsChanged) {
            console.log('⚠️ User role/permissions changed, updating...', {
              oldRole: user.role,
              newRole: refreshedUser.role,
              roleChanged,
              permissionsChanged
            });
            
            setUser(refreshedUser);
            
            // Update cache with new role info
            await secureStorage.setItem('user_cache', JSON.stringify({
              id: refreshedUser.id,
              email: refreshedUser.email,
              role: refreshedUser.role,
              permissions: refreshedUser.permissions,
              lastRefresh: new Date().toISOString()
            }));
            
            // If user was demoted, they might need to be redirected
            if (roleChanged && UserRoleUtils.getRoleLevel(refreshedUser.role) < UserRoleUtils.getRoleLevel(user.role)) {
              console.log('⚠️ User was demoted, may need to redirect from admin areas');
            }
          }
        }
      } catch (error) {
        console.error('❌ Auto-refresh error:', error);
        // Don't logout user on refresh errors, but log for monitoring
      }
    }, 5 * 60 * 1000); // 5 minutes - critical for security

    return () => {
      clearInterval(refreshInterval);
      console.log('🛑 Auth auto-refresh stopped');
    };
  }, [isAuthenticated, user, authRepository]);

  /**
   * Sign up with email and password
   */
  const signUpWithEmail = useCallback(async (data: EmailSignUpDTO) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Signing up with email:', data.email);
      
      const user = await authRepository.signUpWithEmail(data);
      
      console.log('✅ Email sign up successful:', user.email);
      setUser(user);
      setIsAuthenticated(true);
      
      // Cache user data
      await secureStorage.setItem('user_cache', JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        lastRefresh: new Date().toISOString()
      }));
      
    } catch (err: any) {
      console.error('❌ Email sign up error:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  /**
   * Sign in with email and password
   */
  const signInWithEmail = useCallback(async (data: EmailSignInDTO) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Signing in with email:', data.email);
      
      const user = await authRepository.signInWithEmail(data);
      
      console.log('✅ Email sign in successful:', user.email, 'Role:', user.role);
      setUser(user);
      setIsAuthenticated(true);
      
      // Cache user data with role info
      await secureStorage.setItem('user_cache', JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        lastRefresh: new Date().toISOString()
      }));
      
    } catch (err: any) {
      console.error('❌ Email sign in error:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  /**
   * Sign in with Google
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Signing in with Google...');
      
      const user = await authRepository.signInWithGoogle();
      
      console.log('✅ Google sign in successful:', user.email, 'Role:', user.role);
      setUser(user);
      setIsAuthenticated(true);
      
      // Cache user data
      await secureStorage.setItem('user_cache', JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        lastRefresh: new Date().toISOString()
      }));
      
    } catch (err: any) {
      console.error('❌ Google sign in error:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  /**
   * Sign out user
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Signing out user...');
      
      await authRepository.signOut();
      
      // Clear all state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      // Clear cache
      await secureStorage.removeItem('user_cache');
      
      console.log('✅ Sign out successful');
    } catch (err: any) {
      console.error('❌ Sign out error:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    try {
      console.log('🔄 Refreshing user data...');
      const refreshedUser = await authRepository.refreshUserData();
      
      if (refreshedUser) {
        console.log('✅ User data refreshed:', refreshedUser.email);
        setUser(refreshedUser);
        
        // Update cache
        await secureStorage.setItem('user_cache', JSON.stringify({
          id: refreshedUser.id,
          email: refreshedUser.email,
          role: refreshedUser.role,
          permissions: refreshedUser.permissions,
          lastRefresh: new Date().toISOString()
        }));
      }
    } catch (err: any) {
      console.error('❌ Error refreshing user:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
    }
  }, [authRepository]);

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Sending password reset email to:', email);
      
      await authRepository.resetPassword(email);
      console.log('✅ Password reset email sent');
      
    } catch (err: any) {
      console.error('❌ Password reset error:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Changing password...');
      
      await authRepository.changePassword(currentPassword, newPassword);
      console.log('✅ Password changed successfully');
      
    } catch (err: any) {
      console.error('❌ Password change error:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  /**
   * Send email verification
   */
  const sendEmailVerification = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Sending email verification...');
      
      await authRepository.sendEmailVerification();
      console.log('✅ Email verification sent');
      
    } catch (err: any) {
      console.error('❌ Email verification error:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    }
  }, [authRepository]);

  /**
   * Verify email
   */
  const verifyEmail = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Verifying email...');
      
      await authRepository.verifyEmail();
      console.log('✅ Email verified');
      
      // Refresh user to get updated verification status
      await refreshUser();
      
    } catch (err: any) {
      console.error('❌ Email verification error:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    }
  }, [authRepository, refreshUser]);

  /**
   * Resend email verification
   */
  const resendEmailVerification = useCallback(async () => {
    return sendEmailVerification();
  }, [sendEmailVerification]);

  /**
   * Initialize super admin
   */
  const initializeSuperAdmin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Initializing super admin...');
      
      const superAdmin = await authRepository.initializeSuperAdmin();
      console.log('✅ Super admin initialized:', superAdmin.email);
      
    } catch (err: any) {
      console.error('❌ Super admin initialization error:', err);
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  // Role and permission checking functions
  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return UserRoleUtils.hasPermission(user, permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return UserRoleUtils.hasAnyPermission(user, permissions);
  }, [user]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return UserRoleUtils.hasAllPermissions(user, permissions);
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    if (!user) return false;
    return UserRoleUtils.isAdminOrHigher(user);
  }, [user]);

  const isSuperAdmin = useCallback((): boolean => {
    if (!user) return false;
    return UserRoleUtils.isSuperAdmin(user);
  }, [user]);

  const canAccessAdminPanel = useCallback((): boolean => {
    if (!user) return false;
    return UserRoleUtils.canAccessAdminPanel(user);
  }, [user]);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUserDisplayName = useCallback((): string => {
    if (!user) return 'Guest';
    return UserRoleUtils.getDisplayName(user);
  }, [user]);

  const getFullName = useCallback((): string => {
    if (!user) return 'Guest User';
    return UserRoleUtils.getFullName(user);
  }, [user]);

  const getRoleInfo = useCallback(() => {
    if (!user) return { name: 'Guest', color: '#666666', icon: 'person', badge: 'GUEST' };
    return UserRoleUtils.getRoleInfo(user.role);
  }, [user]);

  const getSolvingLevel = useCallback(() => {
    if (!user) return 'Beginner';
    return UserRoleUtils.getSolvingLevel(user);
  }, [user]);

  const hasPremiumAccess = useCallback((): boolean => {
    if (!user) return false;
    return UserRoleUtils.hasPremiumAccess(user);
  }, [user]);

  // Security functions
  const checkAccountSecurity = useCallback(async () => {
    if (!user) return null;
    try {
      return await authRepository.checkAccountSecurity(user.id);
    } catch (error) {
      console.error('Error checking account security:', error);
      return null;
    }
  }, [user, authRepository]);

  const getLoginHistory = useCallback(async () => {
    if (!user) return [];
    try {
      return await authRepository.getLoginHistory(user.id, 20);
    } catch (error) {
      console.error('Error getting login history:', error);
      return [];
    }
  }, [user, authRepository]);

  const value: AuthContextType = {
    // State
    user,
    loading,
    error,
    isAuthenticated,
    isInitialized,
    
    // Authentication methods
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    refreshUser,
    
    // Password management
    resetPassword,
    changePassword,
    
    // Email verification
    sendEmailVerification,
    verifyEmail,
    resendEmailVerification,
    
    // Role and permission checking
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSuperAdmin,
    canAccessAdminPanel,
    
    // Utility functions
    clearError,
    getUserDisplayName,
    getFullName,
    getRoleInfo,
    getSolvingLevel,
    hasPremiumAccess,
    
    // Admin functions
    initializeSuperAdmin,
    
    // Security functions
    checkAccountSecurity,
    getLoginHistory,
  };

  // Only render children after initialization is complete
  return (
    <AuthContext.Provider value={value}>
      {isInitialized ? children : null}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Higher-order component for route protection with role/permission requirements
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: UserRole;
    requiredPermissions?: Permission[];
    requireAll?: boolean; // For permissions - require all vs any
    redirectTo?: string;
  }
): React.FC<P> => {
  return (props: P) => {
    const { 
      isAuthenticated, 
      loading, 
      user, 
      hasRole, 
      hasAnyPermission, 
      hasAllPermissions 
    } = useAuth();
    
    if (loading) {
      return null; // Or loading component
    }
    
    if (!isAuthenticated || !user) {
      throw new Error('Authentication required');
    }
    
    // Check role requirement
    if (options?.requiredRole && !hasRole(options.requiredRole)) {
      throw new Error(`Role '${options.requiredRole}' required. Current role: '${user.role}'`);
    }
    
    // Check permission requirements
    if (options?.requiredPermissions) {
      const hasPermissions = options.requireAll 
        ? hasAllPermissions(options.requiredPermissions)
        : hasAnyPermission(options.requiredPermissions);
        
      if (!hasPermissions) {
        throw new Error(`Required permissions not met: ${options.requiredPermissions.join(', ')}`);
      }
    }
    
    return <Component {...props} />;
  };
};

/**
 * Hook for role-based conditional rendering
 */
export const useRoleAccess = (role: UserRole) => {
  const { hasRole, loading } = useAuth();
  return { 
    hasAccess: hasRole(role), 
    loading,
    role: role
  };
};

/**
 * Hook for permission-based conditional rendering
 */
export const usePermissionAccess = (permissions: Permission[], requireAll: boolean = false) => {
  const { hasAnyPermission, hasAllPermissions, loading } = useAuth();
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);
    
  return { 
    hasAccess, 
    loading,
    permissions,
    requireAll
  };
};

/**
 * Hook for admin access checking
 */
export const useAdminAccess = () => {
  const { isAdmin, canAccessAdminPanel, loading } = useAuth();
  return { 
    isAdmin: isAdmin(), 
    canAccessAdminPanel: canAccessAdminPanel(),
    loading 
  };
};

/**
 * Hook for super admin access checking
 */
export const useSuperAdminAccess = () => {
  const { isSuperAdmin, loading } = useAuth();
  return { 
    isSuperAdmin: isSuperAdmin(), 
    loading 
  };
};

/**
 * Hook for premium access checking
 */
export const usePremiumAccess = () => {
  const { hasPremiumAccess, loading } = useAuth();
  return { 
    hasPremiumAccess: hasPremiumAccess(), 
    loading 
  };
};