/**
 * Normalizes backend error messages into user-friendly English titles and messages.
 * Handles common error patterns including authentication and authorization errors.
 */

export interface NormalizedError {
  title: string;
  message: string;
  isAuthError: boolean;
}

export function normalizeErrorMessage(error: Error | unknown): NormalizedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Check for authorization/authentication errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('only users can') ||
    lowerMessage.includes('only admins can') ||
    errorMessage.includes('Unauthorized:')
  ) {
    // Determine if it's a sign-in issue or permission issue
    const isSignInRequired = 
      lowerMessage.includes('only users can') ||
      lowerMessage.includes('only admins can');
    
    return {
      title: isSignInRequired ? 'Sign In Required' : 'Insufficient Permissions',
      message: isSignInRequired 
        ? 'You need to sign in to access this feature.'
        : 'You do not have permission to perform this action.',
      isAuthError: true,
    };
  }

  // Check for actor/connection errors
  if (
    lowerMessage.includes('actor not available') ||
    lowerMessage.includes('actor not initialized') ||
    lowerMessage.includes('service not ready')
  ) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the service. Please check your connection and try again.',
      isAuthError: false,
    };
  }

  // Check for network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return {
      title: 'Network Error',
      message: 'A network error occurred. Please check your internet connection and try again.',
      isAuthError: false,
    };
  }

  // Check for timeout errors
  if (lowerMessage.includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.',
      isAuthError: false,
    };
  }

  // Default error
  return {
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
    isAuthError: false,
  };
}
