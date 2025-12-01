'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-destructive" />
        <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
        <p className="mb-6 text-muted-foreground">
          We're sorry, but something unexpected happened. Please try again.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
