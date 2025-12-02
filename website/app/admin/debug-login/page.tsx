'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DebugLoginPage(): React.ReactElement {
  const [email, setEmail] = useState('bradturnbough80@gmail.com');
  const [password, setPassword] = useState('June172018!');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDirectFetch = async (): Promise<void> => {
    setLoading(true);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cooksmartapp.com';
      const fullUrl = `${apiUrl}/api/v1/auth/login`;

      console.log('Testing login with:');
      console.log('API URL:', apiUrl);
      console.log('Full URL:', fullUrl);
      console.log('Email:', email);
      console.log('Password length:', password.length);
      console.log('Password:', password);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      setResult({
        status: response.status,
        statusText: response.statusText,
        apiUrl,
        fullUrl,
        emailSent: email,
        emailTrimmed: email.trim(),
        passwordLength: password.length,
        passwordHasSpaces: password !== password.trim(),
        response: data,
      });

      console.log('Response:', data);
    } catch (error: any) {
      setResult({
        error: error.message,
        stack: error.stack,
      });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Admin Login Debug Tool</h1>

      <div className="space-y-6 rounded-lg border bg-background p-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Password is visible for debugging. Length: {password.length} chars
          </p>
        </div>

        <Button onClick={testDirectFetch} disabled={loading} className="w-full">
          {loading ? 'Testing...' : 'Test Direct API Call'}
        </Button>

        {result && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold">Results:</h2>
            <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>

            {result.response?.success && (
              <div className="rounded-lg bg-green-100 p-4 text-green-900">
                ✅ Login successful! Token received.
              </div>
            )}

            {result.error && (
              <div className="rounded-lg bg-red-100 p-4 text-red-900">❌ Error: {result.error}</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-lg border bg-muted/50 p-4">
        <h3 className="mb-2 font-semibold">Environment Info:</h3>
        <ul className="space-y-1 text-sm">
          <li>
            NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'not set (using default)'}
          </li>
          <li>Default API: https://api.cooksmartapp.com</li>
          <li>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</li>
        </ul>
      </div>
    </div>
  );
}
