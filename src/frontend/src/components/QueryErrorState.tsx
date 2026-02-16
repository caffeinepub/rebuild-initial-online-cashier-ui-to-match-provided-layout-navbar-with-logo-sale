import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { normalizeErrorMessage } from '../utils/errorMessage';

interface QueryErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  title?: string;
  message?: string;
}

export default function QueryErrorState({ 
  error, 
  onRetry, 
  title,
  message,
}: QueryErrorStateProps) {
  // Normalize error message if not provided
  const normalized = error ? normalizeErrorMessage(error) : null;
  
  const displayTitle = title || normalized?.title || 'Error';
  const displayMessage = message || normalized?.message || 'An unexpected error occurred. Please try again.';

  // Log error for debugging
  if (error) {
    console.error('Query error:', error);
  }

  return (
    <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-8 text-center">
      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-destructive mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground mb-4">
        {displayMessage}
      </p>
      <Button onClick={onRetry} variant="outline">
        Retry
      </Button>
    </div>
  );
}
