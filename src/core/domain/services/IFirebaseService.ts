import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

/**
 * Interface for Firebase service to follow Dependency Inversion principle
 */
export interface IFirebaseService {
  getAuth(): Auth;
  getFirestore(): Firestore;
  getStorage(): FirebaseStorage;
}