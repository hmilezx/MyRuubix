import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleAuthConfigManager } from '../config/GoogleAuthConfig';
import { AuthErrorFactory } from '../../core/domain/models/AuthError';

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

/**
 * Google Sign-In service for React Native
 * Handles platform-specific Google authentication
 */
export class GoogleSignInService {
  private static instance: GoogleSignInService;
  private isConfigured = false;

  private constructor() {}

  public static getInstance(): GoogleSignInService {
    if (!GoogleSignInService.instance) {
      GoogleSignInService.instance = new GoogleSignInService();
    }
    return GoogleSignInService.instance;
  }

  /**
   * Configure Google Sign-In
   */
  public async configure(): Promise<void> {
    if (this.isConfigured) return;

    try {
      const config = GoogleAuthConfigManager.getInstance().getConfig();

      if (Platform.OS === 'web') {
        // Web configuration is handled by Firebase Auth
        this.isConfigured = true;
        return;
      }

      // Configure for React Native (iOS/Android)
      await GoogleSignin.configure({
        webClientId: config.webClientId,
        scopes: config.scopes,
        offlineAccess: config.offlineAccess,
        hostedDomain: config.hostedDomain,
        forceCodeForRefreshToken: config.forceCodeForRefreshToken,
      });

      this.isConfigured = true;
      console.log('✅ Google Sign-In configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure Google Sign-In:', error);
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Sign in with Google
   */
  public async signIn(): Promise<GoogleSignInResult> {
    try {
      await this.configure();

      if (Platform.OS === 'web') {
        return this.signInWeb();
      } else {
        return this.signInNative();
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw this.handleGoogleSignInError(error);
    }
  }

  /**
   * Web Google Sign-In implementation
   */
  private async signInWeb(): Promise<GoogleSignInResult> {
    // For web, we use Firebase Auth directly with popup
    const { signInWithPopup } = await import('firebase/auth');
    const auth = (await import('../../firebase')).FirebaseService.getInstance().getAuth();
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    return {
      user: {
        id: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName!,
        photoURL: result.user.photoURL || undefined,
        emailVerified: result.user.emailVerified,
      },
      idToken: credential?.idToken!,
      accessToken: credential?.accessToken,
    };
  }

  /**
   * Native Google Sign-In implementation
   */
  private async signInNative(): Promise<GoogleSignInResult> {
    // Check if device has Google Play Services (Android)
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices();
    }

    // Sign in
    const response = await GoogleSignin.signIn();
    
    if (!response.idToken) {
      throw new Error('No ID token received from Google Sign-In');
    }

    return {
      user: {
        id: response.user.id,
        email: response.user.email,
        displayName: response.user.name,
        photoURL: response.user.photo || undefined,
        emailVerified: true, // Google accounts are pre-verified
      },
      idToken: response.idToken,
      accessToken: response.serverAuthCode || undefined,
    };
  }

  /**
   * Sign out from Google
   */
  public async signOut(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await GoogleSignin.signOut();
      }
      console.log('✅ Google Sign-Out successful');
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      // Don't throw error for sign-out failures
    }
  }

  /**
   * Revoke Google access
   */
  public async revokeAccess(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await GoogleSignin.revokeAccess();
      }
      console.log('✅ Google access revoked');
    } catch (error) {
      console.error('Google revoke access error:', error);
      // Don't throw error for revoke failures
    }
  }

  /**
   * Handle Google Sign-In specific errors
   */
  private handleGoogleSignInError(error: any): Error {
    if (Platform.OS === 'web') {
      // Handle web-specific errors
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          return AuthErrorFactory.fromError({
            code: 'auth/popup-closed',
            message: 'Sign-in was cancelled. Please try again.'
          });
        case 'auth/popup-blocked':
          return AuthErrorFactory.fromError({
            code: 'auth/popup-blocked',
            message: 'Pop-up was blocked by your browser. Please enable pop-ups and try again.'
          });
        default:
          return AuthErrorFactory.fromError(error);
      }
    }

    // Handle React Native specific errors
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return AuthErrorFactory.fromError({
          code: 'auth/sign-in-cancelled',
          message: 'Sign-in was cancelled'
        });
      case statusCodes.IN_PROGRESS:
        return AuthErrorFactory.fromError({
          code: 'auth/sign-in-in-progress',
          message: 'Sign-in is already in progress'
        });
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return AuthErrorFactory.fromError({
          code: 'auth/play-services-not-available',
          message: 'Google Play Services not available or outdated'
        });
      default:
        return AuthErrorFactory.fromError(error);
    }
  }
}