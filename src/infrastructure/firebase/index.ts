import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { IFirebaseService } from '../../core/domain/services/IFirebaseService';
import { FirebaseConfig } from '../../core/domain/models/FirebaseConfig';

/**
 * Implements the Firebase service interface providing dependency injection
 * for Firebase-related services
 */
export class FirebaseService implements IFirebaseService {
  private static instance: FirebaseService;
  private auth: Auth;
  private db: Firestore;
  private storage: FirebaseStorage;
  
  private constructor(config: FirebaseConfig) {
    // Initialize Firebase application
    const app = initializeApp(config);
    
    // Initialize services with enhanced security options
    this.auth = getAuth(app);
    this.auth.useDeviceLanguage();
    
    this.db = getFirestore(app);
    this.storage = getStorage(app);
    
    // Configure persistence for offline support
    // enableIndexedDbPersistence(this.db)
    //   .catch((error) => console.error("Firestore persistence error:", error));
  }
  
  /**
   * Singleton pattern implementation with lazy initialization
   */
  public static getInstance(config: FirebaseConfig): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService(config);
    }
    return FirebaseService.instance;
  }
  
  /**
   * Get authentication service
   */
  public getAuth(): Auth {
    return this.auth;
  }
  
  /**
   * Get Firestore database
   */
  public getFirestore(): Firestore {
    return this.db;
  }
  
  /**
   * Get Firebase storage
   */
  public getStorage(): FirebaseStorage {
    return this.storage;
  }
}