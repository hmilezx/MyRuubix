/**
 * Interface representing authentication errors
 * Used to standardize error handling across authentication flows
 */
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Common authentication error codes
 * Provides type safety and standardization for error codes
 */
export enum AuthErrorCode {
  INVALID_EMAIL = 'auth/invalid-email',
  USER_DISABLED = 'auth/user-disabled',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  WEAK_PASSWORD = 'auth/weak-password',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
  NETWORK_REQUEST_FAILED = 'auth/network-request-failed',
  REQUIRES_RECENT_LOGIN = 'auth/requires-recent-login',
  INITIALIZATION_ERROR = 'auth/initialization-error',
  UNKNOWN = 'auth/unknown'
}

/**
 * Factory for creating standardized authentication errors
 */
export class AuthErrorFactory {
  /**
   * Create an AuthError instance from an error object
   */
  static fromError(error: any): AuthError {
    if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
      return {
        code: error.code,
        message: error.message || 'Authentication error occurred'
      };
    }
    
    return {
      code: AuthErrorCode.UNKNOWN,
      message: error.message || 'An unknown authentication error occurred'
    };
  }
  
  /**
   * Create a network error
   */
  static networkError(message?: string): AuthError {
    return {
      code: AuthErrorCode.NETWORK_REQUEST_FAILED,
      message: message || 'A network error occurred. Please check your connection.'
    };
  }
  
  /**
   * Create an initialization error
   */
  static initializationError(message?: string): AuthError {
    return {
      code: AuthErrorCode.INITIALIZATION_ERROR,
      message: message || 'Failed to initialize authentication'
    };
  }
}