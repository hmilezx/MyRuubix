import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User, 
  UserRole, 
  Permission,
  AuthProvider,
  EmailSignUpDTO,
  EmailSignInDTO,
  UserRoleUtils
} from '../../core/domain/models/User';
import { AuthError, AuthErrorFactory } from '../../core/domain/models/AuthError';
import { IEnhancedAuthRepository } from '../../data/repositories/FirebaseAuthRepository';
import { SecureStorage } from '../../utils/security/SecureStorage';

/**
 * Enhanced AuthContext interface with Google auth and RBAC
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
  
  // Role and permission checking
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  
  // Utility functions
  clearError: () => void;
  getUserDisplayName: () => string;
  getRoleInfo: () => { name: string; color: string; icon: string };
  
  // Admin functions
  initializeSuperAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Enhanced AuthProvider with Google authentication and comprehensive RBAC
 */
export const AuthProvider: React.FC<{
  children: React.ReactNode;
  authRepository: IEnhancedAuthRepository;
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
        
        // Check for existing authentication
        const currentUser = await authRepository.getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          
          // Cache user data securely
          await secureStorage.setItem('user_cache', JSON.stringify({
            id: currentUser.id,
            role: currentUser.role,
            lastRefresh: new Date().toISOString()
          }));
        } else {
          // Clear any stale cache
          await secureStorage.removeItem('user_cache');
        }
        
        setIsInitialized(true);
      } catch (err: any) {
        console.error('Auth initialization error:', err);
        const authError = AuthErrorFactory.fromError(err);
        setError(authError);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [authRepository]);

  /**
   * Auto-refresh user data periodically to validate roles from server
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const refreshInterval = setInterval(async () => {
      try {
        // Silently refresh user data every 5 minutes to validate roles
        const refreshedUser = await authRepository.refreshUserData();
        if (refreshedUser && refreshedUser.id === user.id) {
          // Only update if role or permissions changed
          if (refreshedUser.role !== user.role || 
              JSON.stringify(refreshedUser.permissions) !== JSON.stringify(user.permissions)) {
            setUser(refreshedUser);
            
            // Update cache
            await secureStorage.setItem('user_cache', JSON.stringify({
              id: refreshedUser.id,
              role: refreshedUser.role,
              lastRefresh: new Date().toISOString()
            }));
          }
        }
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user, authRepository]);

  /**
   * Sign up with email and password
   */
  const signUpWithEmail = useCallback(async (data: EmailSignUpDTO) => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await authRepository.signUpWithEmail(data);
      setUser(user);
      setIsAuthenticated(true);
      
      // Cache user data
      await secureStorage.setItem('user_cache', JSON.stringify({
        id: user.id,
        role: user.role,
        lastRefresh: new Date().toISOString()
      }));
      
    } catch (err: any) {
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
      
      const user = await authRepository.signInWithEmail(data);
      setUser(user);
      setIsAuthenticated(true);
      
      // Cache user data
      await secureStorage.setItem('user_cache', JSON.stringify({
        id: user.id,
        role: user.role,
        lastRefresh: new Date().toISOString()
      }));
      
    } catch (err: any) {
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
      
      const user = await authRepository.signInWithGoogle();
      setUser(user);
      setIsAuthenticated(true);
      
      // Cache user data
      await secureStorage.setItem('user_cache', JSON.stringify({
        id: user.id,
        role: user.role,
        lastRefresh: new Date().toISOString()
      }));
      
    } catch (err: any) {
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      await authRepository.signOut();
      
      // Clear all state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      // Clear cache
      await secureStorage.removeItem('user_cache');
      
    } catch (err: any) {
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    try {
      const refreshedUser = await authRepository.refreshUserData();
      if (refreshedUser) {
        setUser(refreshedUser);
        
        // Update cache
        await secureStorage.setItem('user_cache', JSON.stringify({
          id: refreshedUser.id,
          role: refreshedUser.role,
          lastRefresh: new Date().toISOString()
        }));
      }
    } catch (err: any) {
      console.error('Error refreshing user:', err);
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
      
      await authRepository.resetPassword(email);
      
    } catch (err: any) {
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
      
      await authRepository.changePassword(currentPassword, newPassword);
      
    } catch (err: any) {
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
      await authRepository.sendEmailVerification();
    } catch (err: any) {
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
      await authRepository.verifyEmail();
      await refreshUser(); // Refresh to get updated verification status
    } catch (err: any) {
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    }
  }, [authRepository, refreshUser]);

  /**
   * Initialize super admin
   */
  const initializeSuperAdmin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const superAdmin = await authRepository.initializeSuperAdmin();
      console.log('Super admin initialized:', superAdmin.email);
      
    } catch (err: any) {
      const authError = AuthErrorFactory.fromError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  // Role and permission checking functions
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role || false;
  }, [user]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return UserRoleUtils.hasPermission(user, permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return UserRoleUtils.hasAnyPermission(user, permissions);
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    if (!user) return false;
    return UserRoleUtils.isAdminOrHigher(user);
  }, [user]);

  const isSuperAdmin = useCallback((): boolean => {
    if (!user) return false;
    return UserRoleUtils.isSuperAdmin(user);
  }, [user]);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUserDisplayName = useCallback((): string => {
    if (!user) return 'Guest';
    return UserRoleUtils.getDisplayName(user);
  }, [user]);

  const getRoleInfo = useCallback(() => {
    if (!user) return { name: 'Guest', color: '#666666', icon: 'person' };
    return UserRoleUtils.getRoleInfo(user.role);
  }, [user]);

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
    
    // Role and permission checking
    hasRole,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isSuperAdmin,
    
    // Utility functions
    clearError,
    getUserDisplayName,
    getRoleInfo,
    
    // Admin functions
    initializeSuperAdmin,
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
 * Higher-order component for route protection
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole,
  requiredPermissions?: Permission[]
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, loading, user, hasRole, hasAnyPermission } = useAuth();
    
    if (loading) {
      return null; // Or loading component
    }
    
    if (!isAuthenticated || !user) {
      throw new Error('Authentication required');
    }
    
    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
      throw new Error('Insufficient role privileges');
    }
    
    // Check permission requirements
    if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
      throw new Error('Insufficient permissions');
    }
    
    return <Component {...props} />;
  };
};

/**
 * Hook for role-based conditional rendering
 */
export const useRoleAccess = (role: UserRole) => {
  const { hasRole, loading } = useAuth();
  return { hasAccess: hasRole(role), loading };
};

/**
 * Hook for permission-based conditional rendering
 */
export const usePermissionAccess = (permissions: Permission[], requireAll: boolean = false) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = useAuth();
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);
    
  return { hasAccess, loading };
};

/**
 * Custom hook for admin access
 */
export const useAdminAccess = () => {
  const { isAdmin, loading } = useAuth();
  return { isAdmin: isAdmin(), loading };
};