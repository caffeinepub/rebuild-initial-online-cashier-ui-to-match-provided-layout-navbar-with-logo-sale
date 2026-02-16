import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface SignInRequiredStateProps {
  title?: string;
  description?: string;
}

export default function SignInRequiredState({
  title = 'Sign In Required',
  description = 'You need to sign in with Internet Identity to access this feature.',
}: SignInRequiredStateProps) {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  const handleSignIn = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={handleSignIn}
            disabled={isLoggingIn}
            size="lg"
            className="gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In with Internet Identity
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
