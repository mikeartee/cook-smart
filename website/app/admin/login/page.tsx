'use client';

import { useState } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage(): React.ReactElement {
  const { login, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Don't auto-redirect - let the form submission handle it
  // This prevents redirect loops

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[LOGIN] Calling login function...');
      await login(email, password);
      console.log('[LOGIN] Login successful, navigating to dashboard...');

      // Small delay to ensure state is updated
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 100);
    } catch (err: any) {
      console.error('[LOGIN] Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground">Sign in to access the dashboard</p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg border bg-background p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cooksmartapp.com"
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <a href="/" className="hover:text-primary hover:underline">
              ← Back to website
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          <Lock className="mx-auto mb-2 h-4 w-4" />
          <p>This is a secure admin area. All login attempts are logged.</p>
        </div>
      </div>
    </div>
  );
}
