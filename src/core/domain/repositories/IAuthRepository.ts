import { 
  User, 
  UserRole, 
  Permission,
  EmailSignUpDTO,
  EmailSignInDTO,
  SocialAuthDTO 
} from '../models/User';

/**
 * Enhanced authentication repository interface
 */
export interface IAuthRepository {
  // Email authentication
  signUpWithEmail(data: EmailSignUpDTO): Promise<User>;
  signInWithEmail(data: EmailSignInDTO): Promise<User>;
  
  // Social authentication
  signInWithGoogle(): Promise<User>;
  signInWithSocialProvider(data: SocialAuthDTO): Promise<User>;
  
  // Account linking
  linkEmailAccount(email: string, password: string): Promise<void>;
  linkGoogleAccount(): Promise<void>;
  unlinkProvider(provider: string): Promise<void>;
  
  // Session management
  getCurrentUser(): Promise<User | null>;
  refreshUserData(): Promise<User | null>;
  signOut(): Promise<void>;
  
  // Password management
  resetPassword(email: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  
  // Email verification
  sendEmailVerification(): Promise<void>;
  verifyEmail(): Promise<void>;
  
  // Profile management
  updateProfile(updates: Partial<User>): Promise<User>;
  uploadProfilePhoto(photoBlob: Blob): Promise<string>;
  
  // Admin functions
  initializeSuperAdmin(): Promise<User>;
  checkSuperAdminExists(): Promise<boolean>;
  
  // Server-side validation
  validateUserRole(userId: string): Promise<UserRole>;
  refreshUserPermissions(userId: string): Promise<Permission[]>;
}

/**
 * Authorization service interface for permission checking
 */
export interface IAuthorizationService {
  // Permission checking
  hasPermission(userId: string, permission: Permission): Promise<boolean>;
  hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean>;
  hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean>;
  
  // Role checking
  hasRole(userId: string, role: UserRole): Promise<boolean>;
  isAdminOrHigher(userId: string): Promise<boolean>;
  canAccessResource(userId: string, resource: string, action: string): Promise<boolean>;
  
  // Access control
  checkAccess(userId: string, requiredPermissions: Permission[]): Promise<void>;
  validateResourceAccess(userId: string, resourceId: string, action: string): Promise<void>;
  
  // Advanced features
  hasPermissionInContext(
    userId: string, 
    permission: Permission, 
    context: PermissionContext
  ): Promise<boolean>;
  getEffectivePermissions(userId: string): Promise<EffectivePermissions>;
  auditAccessAttempt(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    metadata?: Record<string, any>
  ): Promise<void>;
}

/**
 * Permission context for advanced permission checking
 */
export interface PermissionContext {
  resourceId?: string;
  ownerId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Effective permissions interface
 */
export interface EffectivePermissions {
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastRoleChange?: Date;
  context?: Record<string, any>;
}