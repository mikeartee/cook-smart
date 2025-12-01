import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-9xl font-bold text-primary">404</h1>
        <h2 className="mb-2 text-2xl font-bold">Page Not Found</h2>
        <p className="mb-8 text-muted-foreground">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/recipes">
              <Search className="mr-2 h-4 w-4" />
              Browse Recipes
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
