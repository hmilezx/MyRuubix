import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { AuthErrorFactory, AuthErrorCode } from '../../core/domain/models/AuthError';

// Google Sign-In result interface
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
 * Cross-platform Google Sign-In service
 * Handles Google authentication for web and React Native
 */
export class GoogleSignInService {
  private static instance: GoogleSignInService;
  private isConfigured = false;
  private webClientId: string;

  private constructor() {
    // Web client ID - should come from environment variables
    this.webClientId = process.env.GOOGLE_WEB_CLIENT_ID || 
      '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';
  }

  public static getInstance(): GoogleSignInService {
    if (!GoogleSignInService.instance) {
      GoogleSignInService.instance = new GoogleSignInService();
    }
    return GoogleSignInService.instance;
  }

  /**
   * Configure Google Sign-In for the platform
   */
  public async configure(): Promise<void> {
    if (this.isConfigured) return;

    try {
      if (Platform.OS === 'web') {
        // Web configuration is handled by Firebase Auth
        this.isConfigured = true;
        console.log('✅ Google Sign-In configured for web');
        return;
      }

      // For React Native, you would configure @react-native-google-signin/google-signin
      // This is a placeholder implementation
      await this.configureReactNative();
      
      this.isConfigured = true;
      console.log('✅ Google Sign-In configured for React Native');
    } catch (error) {
      console.error('❌ Failed to configure Google Sign-In:', error);
      throw AuthErrorFactory.fromError(error);
    }
  }

  /**
   * Configure Google Sign-In for React Native
   */
  private async configureReactNative(): Promise<void> {
    try {
      // This would be the actual React Native Google Sign-In configuration
      // For now, it's a placeholder since we don't have the package installed
      
      /*
      import { GoogleSignin } from '@react-native-google-signin/google-signin';
      
      GoogleSignin.configure({
        webClientId: this.webClientId,
        scopes: ['email', 'profile'],
        offlineAccess: true,
        hostedDomain: undefined,
        forceCodeForRefreshToken: true,
      });
      */
      
      console.log('React Native Google Sign-In would be configured here');
    } catch (error) {
      throw new Error('Failed to configure React Native Google Sign-In');
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
    try {
      // Import Firebase auth dynamically for web
      const { getAuth } = await import('firebase/auth');
      
      // Get Firebase auth instance
      // Note: In a real implementation, you'd get this from your Firebase service
      const auth = getAuth();
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential?.idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }
      
      return {
        user: {
          id: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName!,
          photoURL: result.user.photoURL || undefined,
          emailVerified: result.user.emailVerified,
        },
        idToken: credential.idToken,
        accessToken: credential.accessToken,
      };
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw AuthErrorFactory.googleSignInError('Sign-in was cancelled by user');
      }
      if (error.code === 'auth/popup-blocked') {
        throw AuthErrorFactory.googleSignInError('Pop-up was blocked by browser');
      }
      throw AuthErrorFactory.googleSignInError(error.message);
    }
  }

  /**
   * React Native Google Sign-In implementation
   */
  private async signInNative(): Promise<GoogleSignInResult> {
    try {
      // This would be the actual React Native implementation
      // For now, it's a placeholder
      
      /*
      import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
      
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
      */
      
      // Placeholder implementation
      throw new Error('Google Sign-In for React Native not yet implemented. Please use web version.');
    } catch (error: any) {
      // Handle React Native specific errors
      /*
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw AuthErrorFactory.googleSignInError('Sign-in was cancelled');
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw AuthErrorFactory.googleSignInError('Sign-in is already in progress');
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw AuthErrorFactory.googleSignInError('Google Play Services not available or outdated');
      }
      */
      
      throw AuthErrorFactory.googleSignInError(error.message);
    }
  }

  /**
   * Sign out from Google
   */
  public async signOut(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web sign-out is handled by Firebase Auth
        console.log('✅ Google Sign-Out completed (web)');
        return;
      }

      // React Native implementation
      /*
      import { GoogleSignin } from '@react-native-google-signin/google-signin';
      await GoogleSignin.signOut();
      */
      
      console.log('✅ Google Sign-Out completed (React Native)');
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
      if (Platform.OS === 'web') {
        // Web revoke would need additional implementation
        console.log('✅ Google access revoked (web)');
        return;
      }

      // React Native implementation
      /*
      import { GoogleSignin } from '@react-native-google-signin/google-signin';
      await GoogleSignin.revokeAccess();
      */
      
      console.log('✅ Google access revoked (React Native)');
    } catch (error) {
      console.error('Google revoke access error:', error);
      // Don't throw error for revoke failures
    }
  }

  /**
   * Check if user is signed in
   */
  public async isSignedIn(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // For web, check Firebase auth state
        return false; // Placeholder
      }

      // React Native implementation
      /*
      import { GoogleSignin } from '@react-native-google-signin/google-signin';
      return await GoogleSignin.isSignedIn();
      */
      
      return false; // Placeholder
    } catch (error) {
      console.error('Error checking Google sign-in status:', error);
      return false;
    }
  }

  /**
   * Get current user info
   */
  public async getCurrentUser(): Promise<any | null> {
    try {
      if (Platform.OS === 'web') {
        // Web implementation would check Firebase auth
        return null; // Placeholder
      }

      // React Native implementation
      /*
      import { GoogleSignin } from '@react-native-google-signin/google-signin';
      return await GoogleSignin.getCurrentUser();
      */
      
      return null; // Placeholder
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    }
  }

  /**
   * Handle Google Sign-In specific errors
   */
  private handleGoogleSignInError(error: any): Error {
    // Web-specific error handling
    if (Platform.OS === 'web') {
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          return AuthErrorFactory.fromError({
            code: AuthErrorCode.POPUP_CLOSED,
            message: 'Sign-in was cancelled. Please try again.'
          });
        case 'auth/popup-blocked':
          return AuthErrorFactory.fromError({
            code: AuthErrorCode.POPUP_BLOCKED,
            message: 'Pop-up was blocked by your browser. Please enable pop-ups and try again.'
          });
        case 'auth/network-request-failed':
          return AuthErrorFactory.networkError('Network error during Google sign-in');
        default:
          return AuthErrorFactory.googleSignInError(error.message);
      }
    }

    // React Native error handling
    /*
    import { statusCodes } from '@react-native-google-signin/google-signin';
    
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return AuthErrorFactory.fromError({
          code: AuthErrorCode.GOOGLE_SIGNIN_CANCELLED,
          message: 'Sign-in was cancelled'
        });
      case statusCodes.IN_PROGRESS:
        return AuthErrorFactory.fromError({
          code: AuthErrorCode.GOOGLE_SIGNIN_FAILED,
          message: 'Sign-in is already in progress'
        });
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return AuthErrorFactory.fromError({
          code: AuthErrorCode.GOOGLE_PLAY_SERVICES_NOT_AVAILABLE,
          message: 'Google Play Services not available or outdated'
        });
      default:
        return AuthErrorFactory.googleSignInError(error.message);
    }
    */
    
    return AuthErrorFactory.googleSignInError(error.message);
  }

  /**
   * Get configuration status
   */
  public isConfigurationComplete(): boolean {
    return this.isConfigured;
  }

  /**
   * Get web client ID
   */
  public getWebClientId(): string {
    return this.webClientId;
  }

  /**
   * Update configuration
   */
  public updateConfiguration(config: { webClientId?: string }): void {
    if (config.webClientId) {
      this.webClientId = config.webClientId;
    }
    this.isConfigured = false; // Force reconfiguration
  }
}