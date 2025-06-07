/**
 * Simplified User domain model with 3-tier role system
 * SuperAdmin: First admin created, highest privileges
 * Admin: Full administrative access (almost same as SuperAdmin)
 * User: Standard user access
 */

// Simplified user roles enumeration
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user'
}

// Permission types for the cube solver app
export enum Permission {
  // User management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  DELETE_USERS = 'delete_users',
  
  // Role management
  ASSIGN_ADMIN_ROLE = 'assign_admin_role',
  REVOKE_ADMIN_ROLE = 'revoke_admin_role',
  
  // System administration
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SYSTEM = 'manage_system',
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  
  // Cube solving features
  UNLIMITED_SOLVES = 'unlimited_solves',
  ACCESS_PREMIUM_FEATURES = 'access_premium_features',
  EXPORT_SOLVE_DATA = 'export_solve_data',
  
  // Content management
  MODERATE_CONTENT = 'moderate_content',
  MANAGE_LEADERBOARDS = 'manage_leaderboards',
}

// Simplified role permissions configuration
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // SuperAdmin has all permissions
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.DELETE_USERS,
    Permission.ASSIGN_ADMIN_ROLE,
    Permission.REVOKE_ADMIN_ROLE,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SYSTEM,
    Permission.ACCESS_ADMIN_PANEL,
    Permission.UNLIMITED_SOLVES,
    Permission.ACCESS_PREMIUM_FEATURES,
    Permission.EXPORT_SOLVE_DATA,
    Permission.MODERATE_CONTENT,
    Permission.MANAGE_LEADERBOARDS,
  ],
  [UserRole.ADMIN]: [
    // Admin has almost all permissions (can't assign/revoke admin roles)
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.DELETE_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SYSTEM,
    Permission.ACCESS_ADMIN_PANEL,
    Permission.UNLIMITED_SOLVES,
    Permission.ACCESS_PREMIUM_FEATURES,
    Permission.EXPORT_SOLVE_DATA,
    Permission.MODERATE_CONTENT,
    Permission.MANAGE_LEADERBOARDS,
  ],
  [UserRole.USER]: [
    // Standard user permissions
    Permission.ACCESS_PREMIUM_FEATURES, // Users can access premium features they've unlocked
    Permission.EXPORT_SOLVE_DATA, // Users can export their own data
  ],
};

/**
 * Authentication provider types
 */
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple', // For future iOS implementation
}

/**
 * Enhanced User interface
 */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  
  // Authentication info
  authProvider: AuthProvider;
  authProviders: AuthProvider[]; // Multiple auth methods
  
  // Role and permissions (fetched from server)
  role: UserRole;
  permissions: Permission[];
  
  // Account status
  isActive: boolean;
  isEmailVerified: boolean;
  
  // Timestamps
  createdAt: Date;
  lastLoginAt: Date;
  lastRoleModifiedAt?: Date;
  lastRoleModifiedBy?: string;
  
  // Profile data
  profile?: UserProfile;
  
  // App-specific data
  cubeStats?: CubeStats;
  preferences?: UserPreferences;
}

/**
 * User profile information
 */
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  country?: string;
  timezone?: string;
  language?: string;
  dateOfBirth?: Date;
  
  // Social features
  isPublicProfile: boolean;
  allowFriendRequests: boolean;
  showOnLeaderboard: boolean;
}

/**
 * Cube solving statistics
 */
export interface CubeStats {
  totalSolves: number;
  averageTime: number; // in seconds
  bestTime: number; // in seconds
  worstTime: number; // in seconds
  currentStreak: number;
  longestStreak: number;
  averageMoves: number;
  bestMoveCount: number;
  lastSolveDate?: Date;
  
  // Advanced statistics
  sub30Count: number; // Solves under 30 seconds
  sub60Count: number; // Solves under 1 minute
  totalSolveTime: number; // Total time spent solving
  favoriteAlgorithm?: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  // Display preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  
  // Cube preferences
  cubeSize: '2x2' | '3x3' | '4x4' | '5x5';
  solverAlgorithm: 'kociemba' | 'thistlethwaite' | 'beginner';
  showAnimations: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  
  // Notification preferences
  enableNotifications: boolean;
  dailyReminders: boolean;
  achievementNotifications: boolean;
  
  // Privacy preferences
  shareStatistics: boolean;
  allowAnalytics: boolean;
}

/**
 * Authentication data transfer objects
 */
export interface EmailSignUpDTO {
  email: string;
  password: string;
  displayName?: string;
  acceptTerms: boolean;
}

export interface EmailSignInDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface GoogleSignInResult {
  user: {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    emailVerified: boolean;
  };
  idToken: string;
  accessToken?: string;
}

export interface SocialAuthDTO {
  provider: AuthProvider;
  idToken: string;
  accessToken?: string;
  displayName?: string;
  photoURL?: string;
}

/**
 * Hardcoded super admin credentials
 * These will be used to create the first admin account
 */
export const SUPER_ADMIN_CREDENTIALS = {
  email: 'superadmin@rubixsolver.app',
  password: 'RubixSuperAdmin2024!',
  displayName: 'Super Administrator',
  role: UserRole.SUPER_ADMIN,
} as const;

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  cubeSize: '3x3',
  solverAlgorithm: 'kociemba',
  showAnimations: true,
  animationSpeed: 'normal',
  enableNotifications: true,
  dailyReminders: false,
  achievementNotifications: true,
  shareStatistics: true,
  allowAnalytics: true,
};

/**
 * Simplified user role utility class
 */
export class UserRoleUtils {
  /**
   * Check if user has specific permission
   */
  static hasPermission(user: User, permission: Permission): boolean {
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(user: User, permissions: Permission[]): boolean {
    return permissions.some(permission => user.permissions.includes(permission));
  }

  /**
   * Check if user has all specified permissions
   */
  static hasAllPermissions(user: User, permissions: Permission[]): boolean {
    return permissions.every(permission => user.permissions.includes(permission));
  }

  /**
   * Check if user can assign admin role (only SuperAdmin can)
   */
  static canAssignAdminRole(user: User): boolean {
    return user.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Get permissions for a role
   */
  static getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if user is super admin
   */
  static isSuperAdmin(user: User): boolean {
    return user.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Check if user is admin or higher
   */
  static isAdminOrHigher(user: User): boolean {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role);
  }

  /**
   * Check if user is regular user
   */
  static isRegularUser(user: User): boolean {
    return user.role === UserRole.USER;
  }

  /**
   * Get role display information
   */
  static getRoleInfo(role: UserRole): { name: string; color: string; icon: string } {
    const roleInfo = {
      [UserRole.SUPER_ADMIN]: {
        name: 'Super Administrator',
        color: '#FF0066',
        icon: 'shield-checkmark'
      },
      [UserRole.ADMIN]: {
        name: 'Administrator',
        color: '#FF6B35',
        icon: 'shield'
      },
      [UserRole.USER]: {
        name: 'User',
        color: '#00AEBA',
        icon: 'person'
      },
    };

    return roleInfo[role] || roleInfo[UserRole.USER];
  }

  /**
   * Create user with default settings
   */
  static createUser(
    authData: {
      id: string;
      email: string;
      displayName?: string;
      photoURL?: string;
      emailVerified: boolean;
      authProvider: AuthProvider;
    },
    role: UserRole = UserRole.USER
  ): User {
    return {
      ...authData,
      authProviders: [authData.authProvider],
      role,
      permissions: this.getPermissionsForRole(role),
      isActive: true,
      isEmailVerified: authData.emailVerified,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      profile: {
        isPublicProfile: false,
        allowFriendRequests: true,
        showOnLeaderboard: true,
      },
      cubeStats: {
        totalSolves: 0,
        averageTime: 0,
        bestTime: 0,
        worstTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageMoves: 0,
        bestMoveCount: 0,
        sub30Count: 0,
        sub60Count: 0,
        totalSolveTime: 0,
      },
      preferences: DEFAULT_USER_PREFERENCES,
    };
  }

  /**
   * Validate role transition
   */
  static canPromoteUser(promoter: User, targetRole: UserRole): boolean {
    // Only SuperAdmin can promote to Admin
    if (targetRole === UserRole.ADMIN) {
      return promoter.role === UserRole.SUPER_ADMIN;
    }
    
    // Admins and SuperAdmins can promote to User (though this is demotion)
    return this.isAdminOrHigher(promoter);
  }

  /**
   * Get user's display name with fallback
   */
  static getDisplayName(user: User): string {
    return user.displayName || 
           user.email.split('@')[0] || 
           'Anonymous User';
  }

  /**
   * Check if user has premium access
   */
  static hasPremiumAccess(user: User): boolean {
    return this.hasPermission(user, Permission.ACCESS_PREMIUM_FEATURES) ||
           this.isAdminOrHigher(user);
  }
}