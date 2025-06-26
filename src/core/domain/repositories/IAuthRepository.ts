import { 
  User, 
  UserRole, 
  Permission,
  EmailSignUpDTO,
  EmailSignInDTO,
  SocialAuthDTO,
  GoogleSignInResult,
  AuthProvider
} from '../models/User';
import { AuthError } from '../models/AuthError';

/**
 * Enhanced authentication repository interface with complete RBAC and Google auth
 * Follows Repository pattern with server-side security validation
 */
export interface IAuthRepository {
  // Email authentication methods
  signUpWithEmail(data: EmailSignUpDTO): Promise<User>;
  signInWithEmail(data: EmailSignInDTO): Promise<User>;
  
  // Google authentication methods
  signInWithGoogle(): Promise<User>;
  signInWithGoogleCredential(credential: SocialAuthDTO): Promise<User>;
  
  // Apple authentication (future implementation)
  signInWithApple?(): Promise<User>;
  
  // Account linking methods
  linkEmailAccount(email: string, password: string): Promise<void>;
  linkGoogleAccount(): Promise<void>;
  linkAppleAccount?(): Promise<void>;
  unlinkProvider(provider: AuthProvider): Promise<void>;
  getLinkedProviders(): Promise<AuthProvider[]>;
  
  // Session management
  getCurrentUser(): Promise<User | null>;
  refreshUserData(): Promise<User | null>;
  signOut(): Promise<void>;
  signOutAllDevices(): Promise<void>;
  
  // Password management
  resetPassword(email: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  
  // Email verification
  sendEmailVerification(): Promise<void>;
  verifyEmail(code?: string): Promise<void>;
  resendEmailVerification(): Promise<void>;
  
  // Phone verification (future implementation)
  sendPhoneVerification?(phoneNumber: string): Promise<void>;
  verifyPhoneNumber?(code: string): Promise<void>;
  
  // Profile management
  updateProfile(updates: Partial<User>): Promise<User>;
  uploadProfilePhoto(photoFile: File | Blob): Promise<string>;
  deleteProfilePhoto(): Promise<void>;
  
  // Account management
  deleteAccount(): Promise<void>;
  deactivateAccount(): Promise<void>;
  reactivateAccount(): Promise<void>;
  
  // Admin functions
  initializeSuperAdmin(): Promise<User>;
  checkSuperAdminExists(): Promise<boolean>;
  createAdminUser(userData: EmailSignUpDTO): Promise<User>;
  
  // Server-side role validation (critical for security)
  validateUserRole(userId: string): Promise<UserRole>;
  refreshUserPermissions(userId: string): Promise<Permission[]>;
  validateUserPermissions(userId: string, permissions: Permission[]): Promise<boolean>;
  
  // Security and audit
  getLoginHistory(userId?: string, limit?: number): Promise<LoginHistoryEntry[]>;
  reportSecurityIssue(issue: SecurityIssue): Promise<void>;
  checkAccountSecurity(userId: string): Promise<SecurityCheck>;
  
  // Multi-factor authentication (future implementation)
  enableTwoFactor?(): Promise<TwoFactorSetup>;
  disableTwoFactor?(): Promise<void>;
  verifyTwoFactor?(code: string): Promise<boolean>;
  
  // Device management
  getActiveDevices(): Promise<DeviceInfo[]>;
  revokeDevice(deviceId: string): Promise<void>;
  revokeAllDevices(): Promise<void>;
}

/**
 * Login history entry interface
 */
export interface LoginHistoryEntry {
  id: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  device: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  success: boolean;
  failureReason?: string;
  authMethod: AuthProvider;
}

/**
 * Security issue reporting interface
 */
export interface SecurityIssue {
  userId: string;
  issueType: 'suspicious_activity' | 'unauthorized_access' | 'account_compromise' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

/**
 * Security check result interface
 */
export interface SecurityCheck {
  userId: string;
  lastPasswordChange: Date;
  lastLoginDate: Date;
  suspiciousActivity: boolean;
  multipleDevices: boolean;
  unverifiedEmail: boolean;
  weakPassword: boolean;
  recommendations: string[];
  securityScore: number; // 0-100
}

/**
 * Two-factor authentication setup interface
 */
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Device information interface
 */
export interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser?: string;
  lastActive: Date;
  ipAddress: string;
  location?: string;
  current: boolean;
}

/**
 * Authorization service interface for permission checking
 * Separated from auth repository for single responsibility principle
 */
export interface IAuthorizationService {
  // Permission checking methods
  hasPermission(userId: string, permission: Permission): Promise<boolean>;
  hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean>;
  hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean>;
  
  // Role checking methods
  hasRole(userId: string, role: UserRole): Promise<boolean>;
  hasRoleOrHigher(userId: string, minimumRole: UserRole): Promise<boolean>;
  isAdminOrHigher(userId: string): Promise<boolean>;
  
  // Resource-based access control
  canAccessResource(userId: string, resource: string, action: string): Promise<boolean>;
  canModifyUser(actorId: string, targetUserId: string): Promise<boolean>;
  canAssignRole(actorId: string, targetRole: UserRole): Promise<boolean>;
  
  // Access validation methods
  checkAccess(userId: string, requiredPermissions: Permission[]): Promise<void>;
  validateResourceAccess(userId: string, resourceId: string, action: string): Promise<void>;
  enforceRoleAccess(userId: string, minimumRole: UserRole): Promise<void>;
  
  // Context-aware permissions
  hasPermissionInContext(
    userId: string, 
    permission: Permission, 
    context: PermissionContext
  ): Promise<boolean>;
  
  getEffectivePermissions(userId: string, context?: PermissionContext): Promise<EffectivePermissions>;
  
  // Audit and monitoring
  auditAccessAttempt(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    metadata?: Record<string, any>
  ): Promise<void>;
  
  getAccessAuditLog(
    userId?: string,
    resource?: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<AccessAuditEntry[]>;
  
  // Permission caching
  clearPermissionCache(userId: string): Promise<void>;
  refreshPermissionCache(userId: string): Promise<void>;
  
  // Real-time permission updates
  subscribeToPermissionChanges(userId: string, callback: (permissions: Permission[]) => void): () => void;
  notifyPermissionChange(userId: string, newPermissions: Permission[]): Promise<void>;
}

/**
 * Permission context for advanced permission checking
 */
export interface PermissionContext {
  resourceId?: string;
  resourceType?: string;
  ownerId?: string;
  organizationId?: string;
  teamId?: string;
  metadata?: Record<string, any>;
}

/**
 * Effective permissions interface
 */
export interface EffectivePermissions {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  contextualPermissions?: Permission[];
  isActive: boolean;
  lastUpdated: Date;
  expiresAt?: Date;
  context?: PermissionContext;
}

/**
 * Access audit entry interface
 */
export interface AccessAuditEntry {
  id: string;
  userId: string;
  resource: string;
  action: string;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  permissionsAtTime: Permission[];
  roleAtTime: UserRole;
  context?: PermissionContext;
  metadata?: Record<string, any>;
}

/**
 * Password policy interface
 */
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  prohibitCommonPasswords: boolean;
  maxAge?: number; // days
  preventReuse?: number; // number of previous passwords to check
}

/**
 * Account security settings interface
 */
export interface AccountSecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number; // minutes
  maxConcurrentSessions: number;
  requireEmailVerification: boolean;
  enableLoginNotifications: boolean;
  suspiciousActivityMonitoring: boolean;
  autoLockAfterFailedAttempts: number;
  lockoutDuration: number; // minutes
}

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  enableEmailAuth: boolean;
  enableGoogleAuth: boolean;
  enableAppleAuth: boolean;
  enablePhoneAuth: boolean;
  enableTwoFactor: boolean;
  securitySettings: AccountSecuritySettings;
  allowAccountLinking: boolean;
  maxLinkedAccounts: number;
}

/**
 * Authentication events interface for monitoring
 */
export interface AuthEvent {
  type: 'sign_in' | 'sign_up' | 'sign_out' | 'password_reset' | 'email_verification' | 'role_change' | 'permission_change';
  userId: string;
  timestamp: Date;
  success: boolean;
  method: AuthProvider;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Authentication metrics interface
 */
export interface AuthMetrics {
  totalUsers: number;
  activeUsers: number;
  signUpsToday: number;
  signInsToday: number;
  failedAttemptsToday: number;
  verificationsPending: number;
  suspiciousActivities: number;
  authMethodsUsage: Record<AuthProvider, number>;
  roleDistribution: Record<UserRole, number>;
}

/**
 * Batch operation interfaces for admin functions
 */
export interface BatchUserOperation {
  operation: 'activate' | 'deactivate' | 'delete' | 'verify_email' | 'reset_password' | 'change_role';
  userIds: string[];
  performedBy: string;
  reason?: string;
  newRole?: UserRole;
}

export interface BatchOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
  results: Array<{
    userId: string;
    success: boolean;
    result?: any;
  }>;
}