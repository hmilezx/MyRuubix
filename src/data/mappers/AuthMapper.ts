import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../../core/domain/models/User';

/**
 * Maps Firebase user data to domain user model
 */
export class AuthMapper {
  toDomain(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date(parseInt(firebaseUser.metadata.creationTime || '0')),
      lastLoginAt: new Date(parseInt(firebaseUser.metadata.lastSignInTime || '0'))
    };
  }
}