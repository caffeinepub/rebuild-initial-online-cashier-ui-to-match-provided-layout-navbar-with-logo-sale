import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface QueryErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  title?: string;
  message?: string;
  isAuthenticated?: boolean;
}

export default function QueryErrorState({ 
  error, 
  onRetry, 
  title = 'Failed to load data',
  message = 'An error occurred while loading data. Please try again.',
  isAuthenticated = false
}: QueryErrorStateProps) {
  // Log error for debugging
  if (error) {
    console.error('Query error:', error);
  }

  // Check if it's an authentication error (not authorized/logged in)
  const errorMessage = error?.message?.toLowerCase() || '';
  const isAuthError = errorMessage.includes('unauthorized') || 
                      errorMessage.includes('not authenticated');
  
  // Check if it's an actor initialization/loading issue (technical error, not auth)
  const isActorLoadingError = errorMessage.includes('actor not available') ||
                              errorMessage.includes('actor not ready') ||
                              errorMessage.includes('actor belum siap');

  // Determine the appropriate message
  let displayMessage = message;
  
  // Only show auth-required message if:
  // 1. It's an auth error AND
  // 2. User is not authenticated AND
  // 3. It's NOT an actor loading error
  if (isAuthError && !isAuthenticated && !isActorLoadingError) {
    displayMessage = 'You need to log in to access this data.';
  } else if (isAuthenticated || isActorLoadingError) {
    // For authenticated users or actor loading issues, always show the technical error message
    displayMessage = message;
  }

  return (
    <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-8 text-center">
      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-destructive mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">
        {displayMessage}
      </p>
      <Button onClick={onRetry} variant="outline">
        Retry
      </Button>
    </div>
  );
}
