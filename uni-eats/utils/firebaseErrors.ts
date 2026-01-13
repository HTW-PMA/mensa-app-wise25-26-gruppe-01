/**
 * Firebase Authentication Error Message Mapping
 * Converts Firebase error codes to user-friendly messages
 */

import { t } from '@/utils/i18n';

export const getFirebaseAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    // Sign In Errors
    'auth/user-not-found': t('authErrors.userNotFound'),
    'auth/wrong-password': t('authErrors.wrongPassword'),
    'auth/invalid-credential': t('authErrors.invalidCredential'),
    'auth/invalid-email': t('authErrors.invalidEmail'),
    'auth/user-disabled': t('authErrors.userDisabled'),
    
    // Sign Up Errors
    'auth/email-already-in-use': t('authErrors.emailAlreadyInUse'),
    'auth/weak-password': t('authErrors.weakPassword'),
    'auth/operation-not-allowed': t('authErrors.operationNotAllowed'),
    
    // Rate Limiting
    'auth/too-many-requests': t('authErrors.tooManyRequests'),
    
    // Network Errors
    'auth/network-request-failed': t('authErrors.networkRequestFailed'),
    
    // General
    'auth/internal-error': t('authErrors.internalError'),
    'auth/invalid-api-key': t('authErrors.invalidApiKey'),
  };
  
  return errorMessages[errorCode] || t('authErrors.default');
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
