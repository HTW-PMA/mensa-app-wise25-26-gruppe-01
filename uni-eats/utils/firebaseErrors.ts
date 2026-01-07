/**
 * Firebase Authentication Error Message Mapping
 * Converts Firebase error codes to user-friendly messages
 */

export const getFirebaseAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    // Sign In Errors
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    
    // Sign Up Errors
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled',
    
    // Rate Limiting
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    
    // Network Errors
    'auth/network-request-failed': 'Network error. Please check your connection',
    
    // General
    'auth/internal-error': 'An internal error occurred. Please try again',
    'auth/invalid-api-key': 'Invalid API key. Please check your configuration',
  };
  
  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again';
};

/**
 * Extract error code from Firebase error
 */
export const extractFirebaseErrorCode = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code;
  }
  return 'unknown';
};

/**
 * Get user-friendly error message from Firebase error
 */
export const handleFirebaseError = (error: unknown): string => {
  const errorCode = extractFirebaseErrorCode(error);
  return getFirebaseAuthErrorMessage(errorCode);
};
