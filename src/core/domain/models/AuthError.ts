/**
 * Comprehensive authentication error handling for secure RBAC system
 * Provides detailed error types and user-friendly messages
 */

/**
 * Interface representing authentication errors
 */
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp?: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Comprehensive authentication error codes
 */
export enum AuthErrorCode {
  // Firebase Auth errors
  INVALID_EMAIL = 'auth/invalid-email',
  USER_DISABLED = 'auth/user-disabled',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  WEAK_PASSWORD = 'auth/weak-password',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
  NETWORK_REQUEST_FAILED = 'auth/network-request-failed',
  REQUIRES_RECENT_LOGIN = 'auth/requires-recent-login',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  
  // Google Auth specific errors
  GOOGLE_SIGNIN_CANCELLED = 'auth/google-signin-cancelled',
  GOOGLE_SIGNIN_FAILED = 'auth/google-signin-failed',
  GOOGLE_PLAY_SERVICES_NOT_AVAILABLE = 'auth/google-play-services-not-available',
  POPUP_CLOSED = 'auth/popup-closed',
  POPUP_BLOCKED = 'auth/popup-blocked',
  
  // Custom RBAC errors
  INSUFFICIENT_PRIVILEGES = 'auth/insufficient-privileges',
  ROLE_NOT_AUTHORIZED = 'auth/role-not-authorized',
  PERMISSION_DENIED = 'auth/permission-denied',
  ACCOUNT_NOT_VERIFIED = 'auth/account-not-verified',
  ACCOUNT_SUSPENDED = 'auth/account-suspended',
  ROLE_ASSIGNMENT_FAILED = 'auth/role-assignment-failed',
  
  // System errors
  INITIALIZATION_ERROR = 'auth/initialization-error',
  SESSION_EXPIRED = 'auth/session-expired',
  INVALID_TOKEN = 'auth/invalid-token',
  SERVER_ERROR = 'auth/server-error',
  UNKNOWN = 'auth/unknown',
  
  // Validation errors
  INVALID_CREDENTIALS = 'auth/invalid-credentials',
  TERMS_NOT_ACCEPTED = 'auth/terms-not-accepted',
  INVALID_PHONE_NUMBER = 'auth/invalid-phone-number',
  MISSING_PHONE_NUMBER = 'auth/missing-phone-number',
}

/**
 * User-friendly error messages mapping
 */
const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  // Firebase Auth errors
  [AuthErrorCode.INVALID_EMAIL]: 'Please enter a valid email address.',
  [AuthErrorCode.USER_DISABLED]: 'This account has been disabled. Please contact support.',
  [AuthErrorCode.USER_NOT_FOUND]: 'No account found with this email address.',
  [AuthErrorCode.WRONG_PASSWORD]: 'Incorrect password. Please try again.',
  [AuthErrorCode.EMAIL_ALREADY_IN_USE]: 'An account with this email already exists.',
  [AuthErrorCode.WEAK_PASSWORD]: 'Password should be at least 6 characters with uppercase, lowercase, and numbers.',
  [AuthErrorCode.OPERATION_NOT_ALLOWED]: 'This operation is not allowed. Please contact support.',
  [AuthErrorCode.NETWORK_REQUEST_FAILED]: 'Network error. Please check your connection and try again.',
  [AuthErrorCode.REQUIRES_RECENT_LOGIN]: 'For security, please sign in again to continue.',
  [AuthErrorCode.TOO_MANY_REQUESTS]: 'Too many attempts. Please wait a moment before trying again.',
  
  // Google Auth specific errors
  [AuthErrorCode.GOOGLE_SIGNIN_CANCELLED]: 'Google sign-in was cancelled.',
  [AuthErrorCode.GOOGLE_SIGNIN_FAILED]: 'Google sign-in failed. Please try again.',
  [AuthErrorCode.GOOGLE_PLAY_SERVICES_NOT_AVAILABLE]: 'Google Play Services are required. Please update and try again.',
  [AuthErrorCode.POPUP_CLOSED]: 'Sign-in window was closed. Please try again.',
  [AuthErrorCode.POPUP_BLOCKED]: 'Pop-ups are blocked. Please enable pop-ups for this site.',
  
  // Custom RBAC errors
  [AuthErrorCode.INSUFFICIENT_PRIVILEGES]: 'You don\'t have permission to perform this action.',
  [AuthErrorCode.ROLE_NOT_AUTHORIZED]: 'Your account role is not authorized for this feature.',
  [AuthErrorCode.PERMISSION_DENIED]: 'Access denied. Please contact an administrator.',
  [AuthErrorCode.ACCOUNT_NOT_VERIFIED]: 'Please verify your email address before continuing.',
  [AuthErrorCode.ACCOUNT_SUSPENDED]: 'Your account has been suspended. Please contact support.',
  [AuthErrorCode.ROLE_ASSIGNMENT_FAILED]: 'Failed to assign role. Please try again.',
  
  // System errors
  [AuthErrorCode.INITIALIZATION_ERROR]: 'Authentication system failed to initialize. Please refresh the app.',
  [AuthErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AuthErrorCode.INVALID_TOKEN]: 'Invalid authentication token. Please sign in again.',
  [AuthErrorCode.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [AuthErrorCode.UNKNOWN]: 'An unexpected error occurred. Please try again.',
  
  // Validation errors
  [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password combination.',
  [AuthErrorCode.TERMS_NOT_ACCEPTED]: 'You must accept the terms and conditions to continue.',
  [AuthErrorCode.INVALID_PHONE_NUMBER]: 'Please enter a valid phone number.',
  [AuthErrorCode.MISSING_PHONE_NUMBER]: 'Phone number is required for this operation.',
};

/**
 * Factory for creating standardized authentication errors
 */
export class AuthErrorFactory {
  /**
   * Create an AuthError instance from an error object
   */
  static fromError(error: any): AuthError {
    const timestamp = new Date();
    
    // Handle Firebase errors
    if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
      const code = error.code as AuthErrorCode;
      const message = ERROR_MESSAGES[code] || error.message || 'Authentication error occurred';
      
      return {
        code,
        message,
        timestamp,
        severity: this.getErrorSeverity(code),
        details: {
          originalMessage: error.message,
          stack: error.stack,
        }
      };
    }
    
    // Handle Google Sign-In errors
    if (error.message?.includes('google')) {
      return this.googleSignInError(error.message);
    }
    
    // Handle network errors
    if (error.message?.toLowerCase().includes('network')) {
      return this.networkError(error.message);
    }
    
    // Handle validation errors
    if (error.message?.toLowerCase().includes('validation')) {
      return this.validationError(error.message);
    }
    
    // Default unknown error
    return {
      code: AuthErrorCode.UNKNOWN,
      message: error.message || 'An unknown authentication error occurred',
      timestamp,
      severity: 'medium',
      details: {
        originalError: error,
        stack: error.stack,
      }
    };
  }
  
  /**
   * Create a network error
   */
  static networkError(message?: string): AuthError {
    return {
      code: AuthErrorCode.NETWORK_REQUEST_FAILED,
      message: message || ERROR_MESSAGES[AuthErrorCode.NETWORK_REQUEST_FAILED],
      timestamp: new Date(),
      severity: 'medium',
    };
  }
  
  /**
   * Create an initialization error
   */
  static initializationError(message?: string): AuthError {
    return {
      code: AuthErrorCode.INITIALIZATION_ERROR,
      message: message || ERROR_MESSAGES[AuthErrorCode.INITIALIZATION_ERROR],
      timestamp: new Date(),
      severity: 'high',
    };
  }
  
  /**
   * Create a permission denied error
   */
  static permissionDeniedError(requiredPermission?: string): AuthError {
    const baseMessage = ERROR_MESSAGES[AuthErrorCode.PERMISSION_DENIED];
    const message = requiredPermission 
      ? `${baseMessage} Required permission: ${requiredPermission}`
      : baseMessage;
      
    return {
      code: AuthErrorCode.PERMISSION_DENIED,
      message,
      timestamp: new Date(),
      severity: 'high',
      details: {
        requiredPermission,
      }
    };
  }
  
  /**
   * Create an insufficient privileges error
   */
  static insufficientPrivilegesError(requiredRole?: string): AuthError {
    const baseMessage = ERROR_MESSAGES[AuthErrorCode.INSUFFICIENT_PRIVILEGES];
    const message = requiredRole 
      ? `${baseMessage} Required role: ${requiredRole}`
      : baseMessage;
      
    return {
      code: AuthErrorCode.INSUFFICIENT_PRIVILEGES,
      message,
      timestamp: new Date(),
      severity: 'high',
      details: {
        requiredRole,
      }
    };
  }
  
  /**
   * Create a Google Sign-In error
   */
  static googleSignInError(message?: string): AuthError {
    let code = AuthErrorCode.GOOGLE_SIGNIN_FAILED;
    
    // Determine specific Google error code
    if (message?.includes('cancelled') || message?.includes('canceled')) {
      code = AuthErrorCode.GOOGLE_SIGNIN_CANCELLED;
    } else if (message?.includes('play services')) {
      code = AuthErrorCode.GOOGLE_PLAY_SERVICES_NOT_AVAILABLE;
    } else if (message?.includes('popup_closed')) {
      code = AuthErrorCode.POPUP_CLOSED;
    } else if (message?.includes('popup_blocked')) {
      code = AuthErrorCode.POPUP_BLOCKED;
    }
    
    return {
      code,
      message: message || ERROR_MESSAGES[code],
      timestamp: new Date(),
      severity: 'medium',
    };
  }
  
  /**
   * Create a validation error
   */
  static validationError(message: string, field?: string): AuthError {
    return {
      code: AuthErrorCode.INVALID_CREDENTIALS,
      message: message || ERROR_MESSAGES[AuthErrorCode.INVALID_CREDENTIALS],
      timestamp: new Date(),
      severity: 'low',
      details: {
        field,
        validationError: true,
      }
    };
  }
  
  /**
   * Create a session expired error
   */
  static sessionExpiredError(): AuthError {
    return {
      code: AuthErrorCode.SESSION_EXPIRED,
      message: ERROR_MESSAGES[AuthErrorCode.SESSION_EXPIRED],
      timestamp: new Date(),
      severity: 'medium',
    };
  }
  
  /**
   * Create an account suspended error
   */
  static accountSuspendedError(reason?: string): AuthError {
    const baseMessage = ERROR_MESSAGES[AuthErrorCode.ACCOUNT_SUSPENDED];
    const message = reason ? `${baseMessage} Reason: ${reason}` : baseMessage;
    
    return {
      code: AuthErrorCode.ACCOUNT_SUSPENDED,
      message,
      timestamp: new Date(),
      severity: 'critical',
      details: {
        suspensionReason: reason,
      }
    };
  }
  
  /**
   * Create a role assignment failed error
   */
  static roleAssignmentError(targetRole?: string, reason?: string): AuthError {
    const baseMessage = ERROR_MESSAGES[AuthErrorCode.ROLE_ASSIGNMENT_FAILED];
    const message = reason ? `${baseMessage} ${reason}` : baseMessage;
    
    return {
      code: AuthErrorCode.ROLE_ASSIGNMENT_FAILED,
      message,
      timestamp: new Date(),
      severity: 'high',
      details: {
        targetRole,
        reason,
      }
    };
  }
  
  /**
   * Determine error severity based on error code
   */
  private static getErrorSeverity(code: AuthErrorCode): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<AuthErrorCode, 'low' | 'medium' | 'high' | 'critical'> = {
      // Low severity - user input errors
      [AuthErrorCode.INVALID_EMAIL]: 'low',
      [AuthErrorCode.WRONG_PASSWORD]: 'low',
      [AuthErrorCode.WEAK_PASSWORD]: 'low',
      [AuthErrorCode.TERMS_NOT_ACCEPTED]: 'low',
      [AuthErrorCode.INVALID_CREDENTIALS]: 'low',
      [AuthErrorCode.GOOGLE_SIGNIN_CANCELLED]: 'low',
      
      // Medium severity - recoverable errors
      [AuthErrorCode.USER_NOT_FOUND]: 'medium',
      [AuthErrorCode.EMAIL_ALREADY_IN_USE]: 'medium',
      [AuthErrorCode.NETWORK_REQUEST_FAILED]: 'medium',
      [AuthErrorCode.TOO_MANY_REQUESTS]: 'medium',
      [AuthErrorCode.SESSION_EXPIRED]: 'medium',
      [AuthErrorCode.GOOGLE_SIGNIN_FAILED]: 'medium',
      [AuthErrorCode.POPUP_CLOSED]: 'medium',
      [AuthErrorCode.UNKNOWN]: 'medium',
      
      // High severity - authorization errors
      [AuthErrorCode.INSUFFICIENT_PRIVILEGES]: 'high',
      [AuthErrorCode.ROLE_NOT_AUTHORIZED]: 'high',
      [AuthErrorCode.PERMISSION_DENIED]: 'high',
      [AuthErrorCode.REQUIRES_RECENT_LOGIN]: 'high',
      [AuthErrorCode.ROLE_ASSIGNMENT_FAILED]: 'high',
      [AuthErrorCode.INITIALIZATION_ERROR]: 'high',
      [AuthErrorCode.INVALID_TOKEN]: 'high',
      
      // Critical severity - account status issues
      [AuthErrorCode.USER_DISABLED]: 'critical',
      [AuthErrorCode.ACCOUNT_SUSPENDED]: 'critical',
      [AuthErrorCode.OPERATION_NOT_ALLOWED]: 'critical',
      [AuthErrorCode.SERVER_ERROR]: 'critical',
      
      // Other errors - medium by default
      [AuthErrorCode.ACCOUNT_NOT_VERIFIED]: 'medium',
      [AuthErrorCode.GOOGLE_PLAY_SERVICES_NOT_AVAILABLE]: 'medium',
      [AuthErrorCode.POPUP_BLOCKED]: 'medium',
      [AuthErrorCode.INVALID_PHONE_NUMBER]: 'low',
      [AuthErrorCode.MISSING_PHONE_NUMBER]: 'low',
    };
    
    return severityMap[code] || 'medium';
  }
  
  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: AuthError): boolean {
    const recoverableErrors = [
      AuthErrorCode.WRONG_PASSWORD,
      AuthErrorCode.INVALID_EMAIL,
      AuthErrorCode.WEAK_PASSWORD,
      AuthErrorCode.NETWORK_REQUEST_FAILED,
      AuthErrorCode.TOO_MANY_REQUESTS,
      AuthErrorCode.GOOGLE_SIGNIN_CANCELLED,
      AuthErrorCode.GOOGLE_SIGNIN_FAILED,
      AuthErrorCode.POPUP_CLOSED,
      AuthErrorCode.POPUP_BLOCKED,
    ];
    
    return recoverableErrors.includes(error.code as AuthErrorCode);
  }
  
  /**
   * Check if error requires immediate attention
   */
  static requiresImmediateAttention(error: AuthError): boolean {
    return error.severity === 'critical' || 
           error.code === AuthErrorCode.ACCOUNT_SUSPENDED ||
           error.code === AuthErrorCode.USER_DISABLED;
  }
  
  /**
   * Get suggested action for error
   */
  static getSuggestedAction(error: AuthError): string {
    const actionMap: Record<string, string> = {
      [AuthErrorCode.INVALID_EMAIL]: 'Please check your email format and try again.',
      [AuthErrorCode.WRONG_PASSWORD]: 'Please check your password or use "Forgot Password".',
      [AuthErrorCode.USER_NOT_FOUND]: 'Please check your email or create a new account.',
      [AuthErrorCode.EMAIL_ALREADY_IN_USE]: 'Please sign in with this email or use a different email.',
      [AuthErrorCode.WEAK_PASSWORD]: 'Please create a stronger password with mixed characters.',
      [AuthErrorCode.NETWORK_REQUEST_FAILED]: 'Please check your internet connection and try again.',
      [AuthErrorCode.TOO_MANY_REQUESTS]: 'Please wait a few minutes before trying again.',
      [AuthErrorCode.ACCOUNT_NOT_VERIFIED]: 'Please check your email and click the verification link.',
      [AuthErrorCode.SESSION_EXPIRED]: 'Please sign in again to continue.',
      [AuthErrorCode.GOOGLE_SIGNIN_CANCELLED]: 'Please try Google sign-in again.',
      [AuthErrorCode.INSUFFICIENT_PRIVILEGES]: 'Please contact an administrator for access.',
      [AuthErrorCode.ACCOUNT_SUSPENDED]: 'Please contact support to resolve this issue.',
    };
    
    return actionMap[error.code] || 'Please try again or contact support if the problem persists.';
  }
}