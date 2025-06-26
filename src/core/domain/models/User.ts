/**
 * Complete User domain model with 3-tier RBAC system
 * SuperAdmin: First admin created, highest privileges
 * Admin: Full administrative access (almost same as SuperAdmin)
 * User: Standard user access (default registration role)
 */

// 3-tier user roles enumeration
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user'
}

// Comprehensive permission types for the cube solver app
export enum Permission {
  // User management permissions
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  DELETE_USERS = 'delete_users',
  EDIT_USER_PROFILES = 'edit_user_profiles',
  
  // Role management permissions (only SuperAdmin)
  ASSIGN_ADMIN_ROLE = 'assign_admin_role',
  REVOKE_ADMIN_ROLE = 'revoke_admin_role',
  MANAGE_ROLES = 'manage_roles',
  
  // System administration permissions
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SYSTEM = 'manage_system',
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  EXPORT_USER_DATA = 'export_user_data',
  
  // Cube solving features
  UNLIMITED_SOLVES = 'unlimited_solves',
  ACCESS_PREMIUM_FEATURES = 'access_premium_features',
  EXPORT_SOLVE_DATA = 'export_solve_data',
  ACCESS_AI_SOLVER = 'access_ai_solver',
  
  // Content management
  MODERATE_CONTENT = 'moderate_content',
  MANAGE_LEADERBOARDS = 'manage_leaderboards',
  SEND_NOTIFICATIONS = 'send_notifications',
  
  // Advanced features
  API_ACCESS = 'api_access',
  BETA_FEATURES = 'beta_features',
}

// Role permissions configuration - SuperAdmin and Admin have almost same permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // SuperAdmin has all permissions including role management
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.DELETE_USERS,
    Permission.EDIT_USER_PROFILES,
    Permission.ASSIGN_ADMIN_ROLE,      // Only SuperAdmin can assign admin roles
    Permission.REVOKE_ADMIN_ROLE,      // Only SuperAdmin can revoke admin roles
    Permission.MANAGE_ROLES,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SYSTEM,
    Permission.ACCESS_ADMIN_PANEL,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_USER_DATA,
    Permission.UNLIMITED_SOLVES,
    Permission.ACCESS_PREMIUM_FEATURES,
    Permission.EXPORT_SOLVE_DATA,
    Permission.ACCESS_AI_SOLVER,
    Permission.MODERATE_CONTENT,
    Permission.MANAGE_LEADERBOARDS,
    Permission.SEND_NOTIFICATIONS,
    Permission.API_ACCESS,
    Permission.BETA_FEATURES,
  ],
  [UserRole.ADMIN]: [
    // Admin has almost all permissions except role management
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.DELETE_USERS,
    Permission.EDIT_USER_PROFILES,
    // Note: Admin cannot assign/revoke admin roles
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SYSTEM,
    Permission.ACCESS_ADMIN_PANEL,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_USER_DATA,
    Permission.UNLIMITED_SOLVES,
    Permission.ACCESS_PREMIUM_FEATURES,
    Permission.EXPORT_SOLVE_DATA,
    Permission.ACCESS_AI_SOLVER,
    Permission.MODERATE_CONTENT,
    Permission.MANAGE_LEADERBOARDS,
    Permission.SEND_NOTIFICATIONS,
    Permission.API_ACCESS,
    Permission.BETA_FEATURES,
  ],
  [UserRole.USER]: [
    // Standard user permissions - basic cube solving features
    Permission.EXPORT_SOLVE_DATA,      // Users can export their own data
    Permission.ACCESS_PREMIUM_FEATURES, // If they have premium access
    Permission.ACCESS_AI_SOLVER,       // Basic AI solver access
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
 * Enhanced User interface with comprehensive profile data
 */
export interface User {
  // Basic user info
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  
  // Authentication info
  authProvider: AuthProvider;
  authProviders: AuthProvider[]; // Multiple auth methods supported
  
  // Role and permissions (server-validated)
  role: UserRole;
  permissions: Permission[];
  
  // Account status
  isActive: boolean;
  isEmailVerified: boolean;
  isPremiumUser: boolean;
  
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
  
  // Subscription info
  subscription?: UserSubscription;
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
  bio?: string;
  
  // Social features
  isPublicProfile: boolean;
  allowFriendRequests: boolean;
  showOnLeaderboard: boolean;
  
  // Privacy settings
  shareStatistics: boolean;
  allowAnalytics: boolean;
}

/**
 * Comprehensive cube solving statistics
 */
export interface CubeStats {
  // Basic stats
  totalSolves: number;
  averageTime: number; // in seconds
  bestTime: number; // in seconds
  worstTime: number; // in seconds
  
  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  
  // Move efficiency
  averageMoves: number;
  bestMoveCount: number;
  
  // Time-based achievements
  sub30Count: number; // Solves under 30 seconds
  sub60Count: number; // Solves under 1 minute
  sub15Count: number; // Advanced solvers
  
  // Advanced statistics
  totalSolveTime: number; // Total time spent solving
  favoriteAlgorithm?: string;
  preferredCubeSize: string;
  lastSolveDate?: Date;
  
  // Weekly/Monthly progress
  weeklyAverage?: number;
  monthlyAverage?: number;
  improvementRate?: number; // percentage improvement
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  // Display preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  
  // Cube preferences
  cubeSize: '2x2' | '3x3' | '4x4' | '5x5' | '6x6' | '7x7';
  solverAlgorithm: 'kociemba' | 'thistlethwaite' | 'beginner' | 'cfop';
  showAnimations: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  
  // Timer preferences
  timerPrecision: 'seconds' | 'milliseconds';
  useInspectionTime: boolean;
  inspectionTime: number; // seconds
  
  // Sound preferences
  enableSounds: boolean;
  timerSounds: boolean;
  achievementSounds: boolean;
  
  // Notification preferences
  enableNotifications: boolean;
  dailyReminders: boolean;
  achievementNotifications: boolean;
  weeklyProgress: boolean;
  
  // Training preferences
  scrambleLength: number;
  practiceMode: 'normal' | 'blind' | 'one_handed';
  autoScramble: boolean;
}

/**
 * User subscription information
 */
export interface UserSubscription {
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  features: string[];
}

/**
 * Authentication data transfer objects
 */
export interface EmailSignUpDTO {
  email: string;
  password: string;
  displayName?: string;
  acceptTerms: boolean;
  acceptMarketing?: boolean;
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
 * Role management DTOs
 */
export interface RoleAssignmentDTO {
  userId: string;
  newRole: UserRole;
  assignedBy: string;
  reason?: string;
}

export interface RoleChangeRequest {
  id: string;
  userId: string;
  requestedRole: UserRole;
  currentRole: UserRole;
  reason: string;
  requestedBy: string;
  timestamp: Date;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Create user DTOs
 */
export interface CreateUserDTO {
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  authProvider: AuthProvider;
  role?: UserRole;
}

export interface UpdateUserDTO {
  displayName?: string;
  photoURL?: string;
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  isPremiumUser?: boolean;
}

/**
 * Hardcoded super admin credentials for first-time setup
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
  timerPrecision: 'milliseconds',
  useInspectionTime: true,
  inspectionTime: 15,
  enableSounds: true,
  timerSounds: true,
  achievementSounds: true,
  enableNotifications: true,
  dailyReminders: false,
  achievementNotifications: true,
  weeklyProgress: true,
  scrambleLength: 25,
  practiceMode: 'normal',
  autoScramble: true,
};

/**
 * Comprehensive user role utility class
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
   * Check if user can manage roles
   */
  static canManageRoles(user: User): boolean {
    return this.hasPermission(user, Permission.MANAGE_ROLES);
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
   * Get role hierarchy level (higher number = more privileges)
   */
  static getRoleLevel(role: UserRole): number {
    const levels = {
      [UserRole.USER]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPER_ADMIN]: 3,
    };
    return levels[role] || 0;
  }

  /**
   * Compare roles (true if role1 >= role2)
   */
  static roleHasEqualOrHigherPrivileges(role1: UserRole, role2: UserRole): boolean {
    return this.getRoleLevel(role1) >= this.getRoleLevel(role2);
  }

  /**
   * Get role display information
   */
  static getRoleInfo(role: UserRole): { name: string; color: string; icon: string; badge: string } {
    const roleInfo = {
      [UserRole.SUPER_ADMIN]: {
        name: 'Super Administrator',
        color: '#FF0066',
        icon: 'shield-checkmark',
        badge: 'SUPER'
      },
      [UserRole.ADMIN]: {
        name: 'Administrator',
        color: '#FF6B35',
        icon: 'shield',
        badge: 'ADMIN'
      },
      [UserRole.USER]: {
        name: 'User',
        color: '#00AEBA',
        icon: 'person',
        badge: 'USER'
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
      isPremiumUser: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      profile: {
        isPublicProfile: false,
        allowFriendRequests: true,
        showOnLeaderboard: true,
        shareStatistics: true,
        allowAnalytics: true,
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
        sub15Count: 0,
        totalSolveTime: 0,
        preferredCubeSize: '3x3',
      },
      preferences: DEFAULT_USER_PREFERENCES,
      subscription: {
        plan: 'free',
        status: 'active',
        startDate: new Date(),
        autoRenew: false,
        features: ['basic_solver', 'statistics', 'timer'],
      },
    };
  }

  /**
   * Validate role transition - check if promoter can assign target role
   */
  static canPromoteUser(promoter: User, targetRole: UserRole): boolean {
    // Only SuperAdmin can promote to Admin
    if (targetRole === UserRole.ADMIN) {
      return promoter.role === UserRole.SUPER_ADMIN;
    }
    
    // Admins and SuperAdmins can promote to User (though this is demotion)
    if (targetRole === UserRole.USER) {
      return this.isAdminOrHigher(promoter);
    }
    
    // Nobody can promote to SuperAdmin (it's created programmatically)
    return false;
  }

  /**
   * Get user's display name with fallback
   */
  static getDisplayName(user: User): string {
    return user.displayName || 
           user.profile?.firstName || 
           user.email.split('@')[0] || 
           'Anonymous User';
  }

  /**
   * Get user's full name
   */
  static getFullName(user: User): string {
    const { firstName, lastName } = user.profile || {};
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return this.getDisplayName(user);
  }

  /**
   * Check if user has premium access
   */
  static hasPremiumAccess(user: User): boolean {
    return user.isPremiumUser || 
           user.subscription?.plan !== 'free' ||
           this.hasPermission(user, Permission.ACCESS_PREMIUM_FEATURES) ||
           this.isAdminOrHigher(user);
  }

  /**
   * Check if user can access admin features
   */
  static canAccessAdminPanel(user: User): boolean {
    return this.hasPermission(user, Permission.ACCESS_ADMIN_PANEL);
  }

  /**
   * Get user's solving level based on stats
   */
  static getSolvingLevel(user: User): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master' {
    const stats = user.cubeStats;
    if (!stats || stats.totalSolves < 10) return 'Beginner';
    
    if (stats.averageTime > 120) return 'Beginner';        // > 2 minutes
    if (stats.averageTime > 60) return 'Intermediate';     // 1-2 minutes
    if (stats.averageTime > 30) return 'Advanced';         // 30s-1min
    if (stats.averageTime > 15) return 'Expert';           // 15-30s
    return 'Master';                                        // < 15s
  }

  /**
   * Calculate user's achievement score
   */
  static getAchievementScore(user: User): number {
    const stats = user.cubeStats;
    if (!stats) return 0;
    
    let score = 0;
    score += stats.totalSolves * 10;          // 10 points per solve
    score += stats.sub60Count * 50;           // 50 bonus for sub-1min
    score += stats.sub30Count * 100;          // 100 bonus for sub-30s
    score += stats.sub15Count * 200;          // 200 bonus for sub-15s
    score += stats.longestStreak * 25;        // 25 points per streak day
    
    return score;
  }
}