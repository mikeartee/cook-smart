'use client';

import { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { newsletterApi } from '@/lib/api-client';

interface NewsletterSignupProps {
  variant?: 'default' | 'footer' | 'inline';
}

export function NewsletterSignup({ variant = 'default' }: NewsletterSignupProps): React.ReactElement {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await newsletterApi.subscribe(email);
      setIsSuccess(true);
      setEmail('');
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100">
        <CheckCircle className="h-5 w-5" />
        <p className="text-sm font-medium">Thanks for subscribing! Check your email to confirm.</p>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div>
        <h3 className="mb-2 font-semibold">Subscribe to our newsletter</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Get cooking tips and recipes delivered to your inbox
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="rounded-lg border bg-muted/50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">Get weekly cooking tips</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-primary p-8 text-center text-primary-foreground">
      <Mail className="mx-auto mb-4 h-12 w-12" />
      <h2 className="mb-2 text-2xl font-bold">Subscribe to Our Newsletter</h2>
      <p className="mb-6 text-lg opacity-90">
        Get weekly cooking tips, recipes, and exclusive content delivered to your inbox
      </p>
      <form onSubmit={handleSubmit} className="mx-auto max-w-md">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 bg-background text-foreground"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="secondary"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive-foreground">{error}</p>}
      </form>
      <p className="mt-4 text-sm opacity-75">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
}
