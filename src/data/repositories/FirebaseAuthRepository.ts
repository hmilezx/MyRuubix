import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile as firebaseUpdateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  reload,
  UserCredential,
  User as FirebaseUser,
  linkWithCredential,
  unlink,
  getAdditionalUserInfo
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  runTransaction,
  addDoc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { Platform } from 'react-native';

import { 
  User, 
  UserRole, 
  Permission,
  AuthProvider,
  EmailSignUpDTO,
  EmailSignInDTO,
  SocialAuthDTO,
  GoogleSignInResult,
  UserRoleUtils,
  SUPER_ADMIN_CREDENTIALS,
  CreateUserDTO
} from '../../core/domain/models/User';
import { AuthError, AuthErrorFactory, AuthErrorCode } from '../../core/domain/models/AuthError';
import { 
  IAuthRepository, 
  LoginHistoryEntry, 
  SecurityIssue, 
  SecurityCheck, 
  DeviceInfo 
} from '../../core/domain/repositories/IAuthRepository';
import { IFirebaseService } from '../../core/domain/services/IFirebaseService';
import { GoogleSignInService } from '../../infrastructure/services/GoogleSignInService';

/**
 * Complete Firebase authentication repository with RBAC and Google auth
 * Implements server-side security validation and comprehensive auth features
 */
export class FirebaseAuthRepository implements IAuthRepository {
  private readonly usersCollection = 'users';
  private readonly loginHistoryCollection = 'login_history';
  private readonly securityIssuesCollection = 'security_issues';
  private readonly devicesCollection = 'user_devices';
  
  private googleProvider: GoogleAuthProvider;
  private googleSignInService: GoogleSignInService;

  constructor(
    private firebaseService: IFirebaseService
  ) {
    this.setupProviders();
    this.googleSignInService = GoogleSignInService.getInstance();
  }

  /**
   * Setup authentication providers
   */
  private setupProviders(): void {
    // Configure Google provider
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
    this.googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(data: EmailSignUpDTO): Promise<User> {
    try {
      const auth = this.firebaseService.getAuth();
      
      // Validate terms acceptance
      if (!data.acceptTerms) {
        throw AuthErrorFactory.validationError('You must accept the terms and conditions to sign up');
      }
      
      // Validate email format
      if (!this.isValidEmail(data.email)) {
        throw AuthErrorFactory.validationError('Please enter a valid email address');
      }
      
      // Validate password strength
      this.validatePasswordStrength(data.password);
      
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim().toLowerCase(),
        data.password
      );

      // Update display name if provided
      if (data.displayName) {
        await firebaseUpdateProfile(userCredential.user, {
          displayName: data.displayName.trim()
        });
      }

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user document with default USER role
      const user = UserRoleUtils.createUser({
        id: userCredential.user.uid,
        email: data.email.trim().toLowerCase(),
        displayName: data.displayName?.trim(),
        photoURL: userCredential.user.photoURL,
        emailVerified: false, // Will be verified after email confirmation
        authProvider: AuthProvider.EMAIL
      }, UserRole.USER); // Default role is USER

      // Save to Firestore
      await this.saveUserToFirestore(user);
      
      // Log the registration
      await this.logAuthEvent({
        type: 'sign_up',
        userId: user.id,
        timestamp: new Date(),
        success: true,
        method: AuthProvider.EMAIL
      });

      return user;
    } catch (error: any) {
      console.error('Email sign up error:', error);
      
      // Log failed registration
      try {
        await this.logAuthEvent({
          type: 'sign_up',
          userId: '',
          timestamp: new Date(),
          success: false,
          method: AuthProvider.EMAIL,
          errorCode: error.code,
          errorMessage: error.message
        });
      } catch (logError) {
        console.error('Failed to log auth event:', logError);
      }
      
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(data: EmailSignInDTO): Promise<User> {
    try {
      const auth = this.firebaseService.getAuth();
      
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email.trim().toLowerCase(),
        data.password
      );

      // Get user data from Firestore with server-side role validation
      const user = await this.getUserFromFirestore(userCredential.user.uid);

      if (!user) {
        throw AuthErrorFactory.fromError({
          code: AuthErrorCode.USER_NOT_FOUND,
          message: 'User data not found. Please contact support.'
        });
      }

      // Check account status
      if (!user.isActive) {
        throw AuthErrorFactory.accountSuspendedError('Account has been deactivated');
      }

      // Update last login time and device info
      await this.updateLastLogin(user.id);
      await this.recordDeviceInfo(user.id, userCredential);

      // Server-side role and permission validation
      const validatedRole = await this.validateUserRole(user.id);
      const refreshedPermissions = await this.refreshUserPermissions(user.id);

      const authenticatedUser = {
        ...user,
        role: validatedRole,
        permissions: refreshedPermissions,
        lastLoginAt: new Date()
      };

      // Log successful login
      await this.logAuthEvent({
        type: 'sign_in',
        userId: user.id,
        timestamp: new Date(),
        success: true,
        method: AuthProvider.EMAIL
      });

      return authenticatedUser;
    } catch (error: any) {
      console.error('Email sign in error:', error);
      
      // Log failed login attempt
      try {
        await this.logAuthEvent({
          type: 'sign_in',
          userId: '',
          timestamp: new Date(),
          success: false,
          method: AuthProvider.EMAIL,
          errorCode: error.code,
          errorMessage: error.message
        });
      } catch (logError) {
        console.error('Failed to log auth event:', logError);
      }
      
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const auth = this.firebaseService.getAuth();
      let userCredential: UserCredential;
      
      if (Platform.OS === 'web') {
        // Web implementation
        userCredential = await signInWithPopup(auth, this.googleProvider);
      } else {
        // Mobile implementation
        const googleResult = await this.googleSignInService.signIn();
        const credential = GoogleAuthProvider.credential(
          googleResult.idToken,
          googleResult.accessToken
        );
        userCredential = await signInWithCredential(auth, credential);
      }

      const firebaseUser = userCredential.user;
      const additionalUserInfo = getAdditionalUserInfo(userCredential);
      const isNewUser = additionalUserInfo?.isNewUser || false;

      // Check if user exists in Firestore
      let user = await this.getUserFromFirestore(firebaseUser.uid);

      if (!user) {
        // Create new user document for new Google users
        user = UserRoleUtils.createUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          authProvider: AuthProvider.GOOGLE
        }, UserRole.USER); // Default role is USER

        await this.saveUserToFirestore(user);
        
        // Log new user registration via Google
        await this.logAuthEvent({
          type: 'sign_up',
          userId: user.id,
          timestamp: new Date(),
          success: true,
          method: AuthProvider.GOOGLE
        });
      } else {
        // Update existing user with Google provider if not already linked
        if (!user.authProviders.includes(AuthProvider.GOOGLE)) {
          await this.updateUserAuthProviders(user.id, [...user.authProviders, AuthProvider.GOOGLE]);
          user.authProviders.push(AuthProvider.GOOGLE);
        }
        
        // Update last login
        await this.updateLastLogin(user.id);
        await this.recordDeviceInfo(user.id, userCredential);
      }

      // Validate role from server (critical for security)
      const validatedRole = await this.validateUserRole(user.id);
      const refreshedPermissions = await this.refreshUserPermissions(user.id);

      const authenticatedUser = {
        ...user,
        role: validatedRole,
        permissions: refreshedPermissions,
        lastLoginAt: new Date()
      };

      // Log successful Google login
      await this.logAuthEvent({
        type: 'sign_in',
        userId: user.id,
        timestamp: new Date(),
        success: true,
        method: AuthProvider.GOOGLE
      });

      return authenticatedUser;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      // Log failed Google login
      try {
        await this.logAuthEvent({
          type: 'sign_in',
          userId: '',
          timestamp: new Date(),
          success: false,
          method: AuthProvider.GOOGLE,
          errorCode: error.code,
          errorMessage: error.message
        });
      } catch (logError) {
        console.error('Failed to log auth event:', logError);
      }
      
      throw AuthErrorFactory.googleSignInError(error.message);
    }
  }

  /**
   * Sign in with Google credential (for pre-obtained credentials)
   */
  async signInWithGoogleCredential(data: SocialAuthDTO): Promise<User> {
    try {
      const auth = this.firebaseService.getAuth();
      
      const credential = GoogleAuthProvider.credential(data.idToken, data.accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      // Similar logic to signInWithGoogle
      const firebaseUser = userCredential.user;
      let user = await this.getUserFromFirestore(firebaseUser.uid);

      if (!user) {
        user = UserRoleUtils.createUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: data.displayName || firebaseUser.displayName,
          photoURL: data.photoURL || firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          authProvider: AuthProvider.GOOGLE
        }, UserRole.USER);

        await this.saveUserToFirestore(user);
      }

      // Server-side validation
      const validatedRole = await this.validateUserRole(user.id);
      const refreshedPermissions = await this.refreshUserPermissions(user.id);

      return {
        ...user,
        role: validatedRole,
        permissions: refreshedPermissions,
        lastLoginAt: new Date()
      };
    } catch (error: any) {
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const auth = this.firebaseService.getAuth();
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        return null;
      }

      // Get user data from Firestore
      const user = await this.getUserFromFirestore(firebaseUser.uid);
      
      if (!user) {
        // User exists in Firebase Auth but not in Firestore - cleanup
        await signOut(auth);
        return null;
      }

      // Always validate role from server for security
      const validatedRole = await this.validateUserRole(user.id);
      const refreshedPermissions = await this.refreshUserPermissions(user.id);

      return {
        ...user,
        role: validatedRole,
        permissions: refreshedPermissions
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Refresh user data from server
   */
  async refreshUserData(): Promise<User | null> {
    return this.getCurrentUser();
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      const user = auth.currentUser;
      
      if (user) {
        // Log sign out event
        await this.logAuthEvent({
          type: 'sign_out',
          userId: user.uid,
          timestamp: new Date(),
          success: true,
          method: AuthProvider.EMAIL // Will be updated based on how they signed in
        });
      }
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Sign out from Google if applicable
      if (Platform.OS !== 'web') {
        await this.googleSignInService.signOut();
      }
    } catch (error: any) {
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      
      // Log password reset request
      await this.logAuthEvent({
        type: 'password_reset',
        userId: '', // We don't know the user ID at this point
        timestamp: new Date(),
        success: true,
        method: AuthProvider.EMAIL,
        metadata: { email: email.trim().toLowerCase() }
      });
    } catch (error: any) {
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Change password (requires current password)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        throw AuthErrorFactory.fromError({
          code: AuthErrorCode.USER_NOT_FOUND,
          message: 'No authenticated user found'
        });
      }
      
      // Validate new password strength
      this.validatePasswordStrength(newPassword);
      
      // Re-authenticate with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
    } catch (error: any) {
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Update password (for users who reset password)
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw AuthErrorFactory.fromError({
          code: AuthErrorCode.USER_NOT_FOUND,
          message: 'No authenticated user found'
        });
      }
      
      this.validatePasswordStrength(newPassword);
      await updatePassword(user, newPassword);
    } catch (error: any) {
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw AuthErrorFactory.fromError({
          code: AuthErrorCode.USER_NOT_FOUND,
          message: 'No authenticated user found'
        });
      }
      
      await sendEmailVerification(user);
    } catch (error: any) {
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Verify email after clicking verification link
   */
  async verifyEmail(): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw AuthErrorFactory.fromError({
          code: AuthErrorCode.USER_NOT_FOUND,
          message: 'No authenticated user found'
        });
      }
      
      // Reload user to get fresh email verification status
      await reload(user);
      
      if (user.emailVerified) {
        // Update Firestore
        await this.updateUserEmailVerification(user.uid, true);
        
        // Log email verification
        await this.logAuthEvent({
          type: 'email_verification',
          userId: user.uid,
          timestamp: new Date(),
          success: true,
          method: AuthProvider.EMAIL
        });
      }
    } catch (error: any) {
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    return this.sendEmailVerification();
  }

  /**
   * Initialize super admin account (first admin created)
   */
  async initializeSuperAdmin(): Promise<User> {
    try {
      const superAdminExists = await this.checkSuperAdminExists();
      
      if (superAdminExists) {
        throw AuthErrorFactory.fromError({
          code: AuthErrorCode.OPERATION_NOT_ALLOWED,
          message: 'Super admin already exists'
        });
      }

      // Create super admin with hardcoded credentials
      const auth = this.firebaseService.getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        SUPER_ADMIN_CREDENTIALS.email,
        SUPER_ADMIN_CREDENTIALS.password
      );

      // Update profile
      await firebaseUpdateProfile(userCredential.user, {
        displayName: SUPER_ADMIN_CREDENTIALS.displayName
      });

      // Create super admin user document
      const superAdmin = UserRoleUtils.createUser({
        id: userCredential.user.uid,
        email: SUPER_ADMIN_CREDENTIALS.email,
        displayName: SUPER_ADMIN_CREDENTIALS.displayName,
        photoURL: null,
        emailVerified: true, // Super admin is pre-verified
        authProvider: AuthProvider.EMAIL
      }, UserRole.SUPER_ADMIN);

      await this.saveUserToFirestore(superAdmin);

      console.log('✅ Super admin initialized successfully');
      return superAdmin;
    } catch (error: any) {
      console.error('❌ Failed to initialize super admin:', error);
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Check if super admin exists
   */
  async checkSuperAdminExists(): Promise<boolean> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const q = query(
        collection(firestore, this.usersCollection),
        where('role', '==', UserRole.SUPER_ADMIN),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking super admin existence:', error);
      return false;
    }
  }

  /**
   * Server-side role validation (critical for security)
   */
  async validateUserRole(userId: string): Promise<UserRole> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const userDoc = await getDoc(doc(firestore, this.usersCollection, userId));
      
      if (!userDoc.exists()) {
        throw AuthErrorFactory.fromError({
          code: AuthErrorCode.USER_NOT_FOUND,
          message: 'User not found'
        });
      }
      
      const userData = userDoc.data();
      return userData.role as UserRole || UserRole.USER;
    } catch (error) {
      console.error('Error validating user role:', error);
      return UserRole.USER; // Default to user role on error for security
    }
  }

  /**
   * Refresh user permissions from server
   */
  async refreshUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const role = await this.validateUserRole(userId);
      return UserRoleUtils.getPermissionsForRole(role);
    } catch (error) {
      console.error('Error refreshing permissions:', error);
      return UserRoleUtils.getPermissionsForRole(UserRole.USER);
    }
  }

  /**
   * Validate user permissions
   */
  async validateUserPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    try {
      const userPermissions = await this.refreshUserPermissions(userId);
      return permissions.every(permission => userPermissions.includes(permission));
    } catch (error) {
      console.error('Error validating permissions:', error);
      return false;
    }
  }

  // Helper methods...

  /**
   * Save user to Firestore
   */
  private async saveUserToFirestore(user: User): Promise<void> {
    const firestore = this.firebaseService.getFirestore();
    const userDoc = doc(firestore, this.usersCollection, user.id);
    
    await setDoc(userDoc, {
      ...user,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      lastRoleModifiedAt: user.lastRoleModifiedAt ? Timestamp.fromDate(user.lastRoleModifiedAt) : null,
    });
  }

  /**
   * Get user from Firestore
   */
  private async getUserFromFirestore(userId: string): Promise<User | null> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const userDoc = await getDoc(doc(firestore, this.usersCollection, userId));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      
      return {
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
        lastRoleModifiedAt: userData.lastRoleModifiedAt?.toDate(),
      } as User;
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      return null;
    }
  }

  /**
   * Update last login time
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const firestore = this.firebaseService.getFirestore();
      await updateDoc(doc(firestore, this.usersCollection, userId), {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Record device information for security tracking
   */
  private async recordDeviceInfo(userId: string, userCredential: UserCredential): Promise<void> {
    try {
      // Implementation would record device info for security monitoring
      // This is a placeholder for the full implementation
      console.log('Recording device info for user:', userId);
    } catch (error) {
      console.error('Error recording device info:', error);
    }
  }

  /**
   * Update user auth providers
   */
  private async updateUserAuthProviders(userId: string, providers: AuthProvider[]): Promise<void> {
    const firestore = this.firebaseService.getFirestore();
    await updateDoc(doc(firestore, this.usersCollection, userId), {
      authProviders: providers
    });
  }

  /**
   * Update email verification status
   */
  private async updateUserEmailVerification(userId: string, verified: boolean): Promise<void> {
    const firestore = this.firebaseService.getFirestore();
    await updateDoc(doc(firestore, this.usersCollection, userId), {
      isEmailVerified: verified,
      emailVerified: verified
    });
  }

  /**
   * Log authentication events for security monitoring
   */
  private async logAuthEvent(event: any): Promise<void> {
    try {
      const firestore = this.firebaseService.getFirestore();
      await addDoc(collection(firestore, 'auth_events'), {
        ...event,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging auth event:', error);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 6) {
      throw AuthErrorFactory.validationError('Password must be at least 6 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      throw AuthErrorFactory.validationError('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      throw AuthErrorFactory.validationError('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      throw AuthErrorFactory.validationError('Password must contain at least one number');
    }
  }

  // Placeholder implementations for interface completeness
  async linkEmailAccount(email: string, password: string): Promise<void> {
    throw new Error('Method not implemented');
  }

  async linkGoogleAccount(): Promise<void> {
    throw new Error('Method not implemented');
  }

  async unlinkProvider(provider: AuthProvider): Promise<void> {
    throw new Error('Method not implemented');
  }

  async getLinkedProviders(): Promise<AuthProvider[]> {
    throw new Error('Method not implemented');
  }

  async signOutAllDevices(): Promise<void> {
    throw new Error('Method not implemented');
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    throw new Error('Method not implemented');
  }

  async uploadProfilePhoto(photoFile: File | Blob): Promise<string> {
    throw new Error('Method not implemented');
  }

  async deleteProfilePhoto(): Promise<void> {
    throw new Error('Method not implemented');
  }

  async deleteAccount(): Promise<void> {
    throw new Error('Method not implemented');
  }

  async deactivateAccount(): Promise<void> {
    throw new Error('Method not implemented');
  }

  async reactivateAccount(): Promise<void> {
    throw new Error('Method not implemented');
  }

  async createAdminUser(userData: EmailSignUpDTO): Promise<User> {
    throw new Error('Method not implemented');
  }

  async getLoginHistory(userId?: string, limit?: number): Promise<LoginHistoryEntry[]> {
    throw new Error('Method not implemented');
  }

  async reportSecurityIssue(issue: SecurityIssue): Promise<void> {
    throw new Error('Method not implemented');
  }

  async checkAccountSecurity(userId: string): Promise<SecurityCheck> {
    throw new Error('Method not implemented');
  }

  async getActiveDevices(): Promise<DeviceInfo[]> {
    throw new Error('Method not implemented');
  }

  async revokeDevice(deviceId: string): Promise<void> {
    throw new Error('Method not implemented');
  }

  async revokeAllDevices(): Promise<void> {
    throw new Error('Method not implemented');
  }
}