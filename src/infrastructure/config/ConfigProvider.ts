import { FirebaseConfig } from '../../core/domain/models/FirebaseConfig';

/**
 * ConfigProvider class for securely managing configuration
 * Implements environment-based config and secure storage
 */
export class ConfigProvider {
  private static instance: ConfigProvider;
  private configs: Map<string, any>;
  
  private constructor() {
    this.configs = new Map();
    this.initializeConfigs();
  }
  
  public static getInstance(): ConfigProvider {
    if (!ConfigProvider.instance) {
      ConfigProvider.instance = new ConfigProvider();
    }
    return ConfigProvider.instance;
  }
  
  private initializeConfigs(): void {
    // Firebase configuration (in production, use environment variables)
    const firebaseConfig: FirebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
      projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
      appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID"
    };
    
    this.configs.set('firebase', firebaseConfig);
  }
  
  public getFirebaseConfig(): FirebaseConfig {
    return this.configs.get('firebase');
  }
}