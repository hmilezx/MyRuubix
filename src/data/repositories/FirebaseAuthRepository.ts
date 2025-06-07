import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  UserCredential,
  User as FirebaseUser,
  linkWithCredential,
  unlink,
  sendEmailVerification,
  reload,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
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
  SUPER_ADMIN_CREDENTIALS
} from '../../core/domain/models/User';
import { AuthError, AuthErrorFactory } from '../../core/domain/models/AuthError';
import { IFirebaseService } from '../../core/domain/services/IFirebaseService';
import { IUserRepository } from '../../core/domain/repositories/IUserRepository';
import { IRoleRepository } from '../../core/domain/repositories/IRoleRepository';

/**
 * Enhanced authentication repository interface with Google auth and server-side role validation
 */
export interface IEnhancedAuthRepository {
  // Email authentication
  signUpWithEmail(data: EmailSignUpDTO): Promise<User>;
  signInWithEmail(data: EmailSignInDTO): Promise<User>;
  
  // Social authentication
  signInWithGoogle(): Promise<User>;
  signInWithSocialProvider(data: SocialAuthDTO): Promise<User>;
  
  // Account linking
  linkEmailAccount(email: string, password: string): Promise<void>;
  linkGoogleAccount(): Promise<void>;
  unlinkProvider(provider: AuthProvider): Promise<void>;
  
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
  
  // Server-side role validation
  validateUserRole(userId: string): Promise<UserRole>;
  refreshUserPermissions(userId: string): Promise<Permission[]>;
}

/**
 * Firebase implementation with Google authentication and server-side security
 */
export class FirebaseAuthRepository implements FirebaseAuthRepository {
  private googleProvider: GoogleAuthProvider;

  constructor(
    private firebaseService: IFirebaseService,
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository
  ) {
    this.setupGoogleProvider();
  }

  /**
   * Setup Google authentication provider
   */
  private setupGoogleProvider(): void {
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
    
    // Configure Google provider
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
        throw new Error('You must accept the terms and conditions to sign up');
      }
      
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Update display name if provided
      if (data.displayName) {
        await firebaseUpdateProfile(userCredential.user, {
          displayName: data.displayName
        });
      }

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user document with default role
      const user = UserRoleUtils.createUser({
        id: userCredential.user.uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: userCredential.user.photoURL,
        emailVerified: false,
        authProvider: AuthProvider.EMAIL
      }, UserRole.USER);

      // Save to Firestore with server timestamp
      await this.saveUserToFirestore(user);

      return user;
    } catch (error: any) {
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(data: EmailSignInDTO): Promise<User> {
    try {
      const auth = this.firebaseService.getAuth();
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Get user data from Firestore with server-side role validation
      const user = await this.getUserFromFirestore(userCredential.user.uid);

      if (!user) {
        throw new Error('User data not found. Please contact support.');
      }

      if (!user.isActive) {
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      // Update last login time
      await this.updateLastLogin(user.id);

      // Validate and refresh role from server
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
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const auth = this.firebaseService.getAuth();
      
      // For web, use popup. For mobile, you'd use GoogleSignIn plugin
      let userCredential: UserCredential;
      
      if (Platform.OS === 'web') {
        // Web implementation
        userCredential = await signInWithPopup(auth, this.googleProvider);
      } else {
        // Mobile implementation (requires @react-native-google-signin/google-signin)
        const googleSignInResult = await this.signInWithGoogleMobile();
        const credential = GoogleAuthProvider.credential(
          googleSignInResult.idToken,
          googleSignInResult.accessToken
        );
        userCredential = await signInWithCredential(auth, credential);
      }

      // Check if user exists in Firestore
      let user = await this.getUserFromFirestore(userCredential.user.uid);

      if (!user) {
        // Create new user document
        user = UserRoleUtils.createUser({
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          emailVerified: userCredential.user.emailVerified,
          authProvider: AuthProvider.GOOGLE
        }, UserRole.USER);

        await this.saveUserToFirestore(user);
      } else {
        // Update existing user with Google provider if not already linked
        if (!user.authProviders.includes(AuthProvider.GOOGLE)) {
          await this.updateUserAuthProviders(user.id, [...user.authProviders, AuthProvider.GOOGLE]);
        }
        
        // Update last login
        await this.updateLastLogin(user.id);
      }

      // Validate role from server
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
   * Mobile Google Sign-In implementation
   */
  private async signInWithGoogleMobile(): Promise<GoogleSignInResult> {
    // This would use @react-native-google-signin/google-signin
    // For now, returning a mock implementation
    throw new Error('Google Sign-In for mobile not yet implemented. Please use web version.');
    
    /* 
    // Actual implementation would be:
    import { GoogleSignin } from '@react-native-google-signin/google-signin';
    
    await GoogleSignin.hasPlayServices();
    const { idToken, user } = await GoogleSignin.signIn();
    
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.name,
        photoURL: user.photo,
        emailVerified: true
      },
      idToken,
      accessToken: undefined
    };
    */
  }

  /**
   * Sign in with social provider credential
   */
  async signInWithSocialProvider(data: SocialAuthDTO): Promise<User> {
    try {
      const auth = this.firebaseService.getAuth();
      let credential;

      switch (data.provider) {
        case AuthProvider.GOOGLE:
          credential = GoogleAuthProvider.credential(data.idToken, data.accessToken);
          break;
        default:
          throw new Error(`Unsupported auth provider: ${data.provider}`);
      }

      const userCredential = await signInWithCredential(auth, credential);
      
      // Similar logic to signInWithGoogle
      let user = await this.getUserFromFirestore(userCredential.user.uid);

      if (!user) {
        user = UserRoleUtils.createUser({
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: data.displayName || userCredential.user.displayName,
          photoURL: data.photoURL || userCredential.user.photoURL,
          emailVerified: userCredential.user.emailVerified,
          authProvider: data.provider
        }, UserRole.USER);

        await this.saveUserToFirestore(user);
      }

      return user;
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

      // Get user data from Firestore with fresh role validation
      const user = await this.getUserFromFirestore(firebaseUser.uid);
      
      if (!user) {
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
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      await signOut(auth);
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
      await sendPasswordResetEmail(auth, email);
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
        throw new Error('No authenticated user found');
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
        throw new Error('No authenticated user found');
      }
      
      await reload(user);
      
      if (user.emailVerified) {
        // Update Firestore
        await this.updateUserEmailVerification(user.uid, true);
      }
    } catch (error: any) {
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Initialize super admin account
   */
  async initializeSuperAdmin(): Promise<User> {
    try {
      const superAdminExists = await this.checkSuperAdminExists();
      
      if (superAdminExists) {
        throw new Error('Super admin already exists');
      }

      // Create super admin with hardcoded credentials
      const auth = this.firebaseService.getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        SUPER_ADMIN_CREDENTIALS.email,
        SUPER_ADMIN_CREDENTIALS.password
      );

      await firebaseUpdateProfile(userCredential.user, {
        displayName: SUPER_ADMIN_CREDENTIALS.displayName
      });

      const superAdmin = UserRoleUtils.createUser({
        id: userCredential.user.uid,
        email: SUPER_ADMIN_CREDENTIALS.email,
        displayName: SUPER_ADMIN_CREDENTIALS.displayName,
        photoURL: null,
        emailVerified: true, // Super admin is pre-verified
        authProvider: AuthProvider.EMAIL
      }, UserRole.SUPER_ADMIN);

      await this.saveUserToFirestore(superAdmin);

      return superAdmin;
    } catch (error: any) {
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
        collection(firestore, 'users'),
        where('role', '==', UserRole.SUPER_ADMIN)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking super admin existence:', error);
      return false;
    }
  }

  /**
   * Server-side role validation
   */
  async validateUserRole(userId: string): Promise<UserRole> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      return userData.role as UserRole || UserRole.USER;
    } catch (error) {
      console.error('Error validating user role:', error);
      return UserRole.USER; // Default to user role on error
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
   * Save user to Firestore
   */
  private async saveUserToFirestore(user: User): Promise<void> {
    const firestore = this.firebaseService.getFirestore();
    const userDoc = doc(firestore, 'users', user.id);
    
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
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      
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
    const firestore = this.firebaseService.getFirestore();
    await updateDoc(doc(firestore, 'users', userId), {
      lastLoginAt: serverTimestamp()
    });
  }

  /**
   * Update user auth providers
   */
  private async updateUserAuthProviders(userId: string, providers: AuthProvider[]): Promise<void> {
    const firestore = this.firebaseService.getFirestore();
    await updateDoc(doc(firestore, 'users', userId), {
      authProviders: providers
    });
  }

  /**
   * Update email verification status
   */
  private async updateUserEmailVerification(userId: string, verified: boolean): Promise<void> {
    const firestore = this.firebaseService.getFirestore();
    await updateDoc(doc(firestore, 'users', userId), {
      isEmailVerified: verified,
      emailVerified: verified
    });
  }

  // Additional methods for complete functionality...
  async linkEmailAccount(email: string, password: string): Promise<void> {
    // Implementation for linking email to existing social account
    throw new Error('Method not implemented');
  }

  async linkGoogleAccount(): Promise<void> {
    // Implementation for linking Google to existing email account
    throw new Error('Method not implemented');
  }

  async unlinkProvider(provider: AuthProvider): Promise<void> {
    // Implementation for unlinking auth provider
    throw new Error('Method not implemented');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Implementation for password change
    throw new Error('Method not implemented');
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    // Implementation for profile updates
    throw new Error('Method not implemented');
  }

  async uploadProfilePhoto(photoBlob: Blob): Promise<string> {
    // Implementation for photo upload
    throw new Error('Method not implemented');
  }
}