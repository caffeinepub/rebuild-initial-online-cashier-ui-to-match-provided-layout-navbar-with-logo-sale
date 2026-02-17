/**
 * Normalizes backend error messages into user-friendly English titles and messages.
 * Handles common error patterns with generic service error messaging.
 */

export interface NormalizedError {
  title: string;
  message: string;
  isAuthError: boolean;
}

export function normalizeErrorMessage(error: Error | unknown): NormalizedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Check for actor/connection errors
  if (
    lowerMessage.includes('actor not available') ||
    lowerMessage.includes('actor not initialized') ||
    lowerMessage.includes('service not ready') ||
    lowerMessage.includes('connection')
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

  // Check for permission/authorization errors - treat as generic service errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('only users can') ||
    lowerMessage.includes('only admin can') ||
    lowerMessage.includes('permission') ||
    lowerMessage.includes('access denied')
  ) {
    return {
      title: 'Service Error',
      message: 'Unable to complete the request. Please try again or contact support.',
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
