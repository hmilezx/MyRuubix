import { Platform } from 'react-native';

export interface GoogleAuthConfig {
  webClientId: string;
  iosClientId?: string;
  androidClientId?: string;
  scopes: string[];
  offlineAccess: boolean;
  hostedDomain?: string;
  forceCodeForRefreshToken?: boolean;
}

/**
 * Google Authentication configuration manager
 */
export class GoogleAuthConfigManager {
  private static instance: GoogleAuthConfigManager;
  private config: GoogleAuthConfig;

  private constructor() {
    this.config = this.getEnvironmentConfig();
  }

  public static getInstance(): GoogleAuthConfigManager {
    if (!GoogleAuthConfigManager.instance) {
      GoogleAuthConfigManager.instance = new GoogleAuthConfigManager();
    }
    return GoogleAuthConfigManager.instance;
  }

  private getEnvironmentConfig(): GoogleAuthConfig {
    // In production, these should come from environment variables
    const isDevelopment = __DEV__;
    
    return {
      // Web Client ID (from Google Cloud Console)
      webClientId: process.env.GOOGLE_WEB_CLIENT_ID || 
        '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
      
      // iOS Client ID (from GoogleService-Info.plist)
      iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      
      // Android Client ID (from google-services.json)
      androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
      
      // Requested scopes
      scopes: ['email', 'profile'],
      
      // Whether to request offline access (refresh token)
      offlineAccess: true,
      
      // Optional: restrict to specific domain
      hostedDomain: undefined,
      
      // Force code for refresh token (useful for server-side verification)
      forceCodeForRefreshToken: true,
    };
  }

  public getConfig(): GoogleAuthConfig {
    return this.config;
  }

  public getPlatformClientId(): string {
    switch (Platform.OS) {
      case 'ios':
        return this.config.iosClientId || this.config.webClientId;
      case 'android':
        return this.config.androidClientId || this.config.webClientId;
      default:
        return this.config.webClientId;
    }
  }
}