import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  UserCredential,
  User as FirebaseUser
} from 'firebase/auth';
import { IAuthRepository } from '../../core/domain/repositories/IAuthRepository';
import { User } from '../../core/domain/models/User';
import { IFirebaseService } from '../../core/domain/services/IFirebaseService';
import { AuthMapper } from '../mappers/AuthMapper';

/**
 * Firebase implementation of the authentication repository
 * Following Single Responsibility and Dependency Inversion principles
 */
export class FirebaseAuthRepository implements IAuthRepository {
  private authMapper: AuthMapper;
  
  constructor(private firebaseService: IFirebaseService) {
    this.authMapper = new AuthMapper();
  }
  
  async getCurrentUser(): Promise<User | null> {
    const auth = this.firebaseService.getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return null;
    }
    
    return this.authMapper.toDomain(currentUser);
  }
  
  async login(email: string, password: string): Promise<User> {
    try {
      const auth = this.firebaseService.getAuth();
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      return this.authMapper.toDomain(userCredential.user);
    } catch (error) {
      // Enhanced error handling with proper error types
      throw this.handleAuthError(error);
    }
  }
  
  async register(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const auth = this.firebaseService.getAuth();
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      if (displayName) {
        await this.updateProfile({ displayName });
      }
      
      return this.authMapper.toDomain(userCredential.user);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }
  
  async logout(): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }
  
  async resetPassword(email: string): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }
  
  async updateProfile(userData: Partial<User>): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      const { displayName, photoURL } = userData;
      
      await firebaseUpdateProfile(currentUser, {
        displayName: displayName || null,
        photoURL: photoURL || null
      });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }
  
  private handleAuthError(error: any): Error {
    // Enhanced error handling with specific error types
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'auth/invalid-email':
        return new Error('Invalid email address format');
      case 'auth/user-disabled':
        return new Error('This user account has been disabled');
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return new Error('Invalid login credentials');
      case 'auth/email-already-in-use':
        return new Error('Email address is already in use');
      case 'auth/weak-password':
        return new Error('Password is too weak. Please use a stronger password');
      case 'auth/operation-not-allowed':
        return new Error('Operation not allowed');
      case 'auth/network-request-failed':
        return new Error('Network error. Please check your connection');
      default:
        console.error('Unhandled auth error:', error);
        return new Error('Authentication failed. Please try again later');
    }
  }
}