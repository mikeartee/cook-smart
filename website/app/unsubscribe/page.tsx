'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UnsubscribePage(): React.ReactElement {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    // Verify token and get email
    // In production, this would call an API
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [emailFromToken] = decoded.split(':');
      setEmail(emailFromToken);
    } catch {
      setStatus('error');
    }
  }, [searchParams]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In production, call API to unsubscribe
    // await fetch('/api/unsubscribe', { method: 'POST', body: JSON.stringify({ token, reason }) });
    
    setStatus('success');
  };

  if (status === 'error') {
    return (
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-red-900 mb-4">Invalid Link</h1>
          <p className="text-red-700 mb-6">
            This unsubscribe link is invalid or has expired. Please try again from a recent email.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-green-900 mb-4">You've Been Unsubscribed</h1>
          <p className="text-green-700 mb-6">
            {email} has been removed from our marketing email list.
          </p>
          
          <div className="bg-white border border-green-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What This Means</h2>
            <p className="text-gray-700 mb-4">You will no longer receive:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Weekly recipe newsletters</li>
              <li>Cooking tips and tricks</li>
              <li>Promotional offers and updates</li>
            </ul>
            
            <p className="text-gray-700 mt-4 mb-2">You will still receive:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Account-related emails (password resets, etc.)</li>
              <li>Important service updates</li>
              <li>Security notifications</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Return Home
            </Link>
            <Link
              href="/email-preferences"
              className="inline-block px-6 py-3 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              Manage Preferences
            </Link>
          </div>
          
          <p className="text-sm text-gray-600 mt-6">
            Changed your mind?{' '}
            <Link href="/newsletter" className="text-green-600 hover:underline">
              Resubscribe here
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Unsubscribe from Emails</h1>
        <p className="text-gray-700 mb-6">
          We're sorry to see you go! Please confirm you want to unsubscribe from our marketing emails.
        </p>
        
        <form onSubmit={handleUnsubscribe} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Why are you unsubscribing? (Optional)
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              <option value="too_many">Too many emails</option>
              <option value="not_relevant">Content not relevant</option>
              <option value="never_signed_up">I never signed up</option>
              <option value="privacy">Privacy concerns</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You'll still receive important account-related emails like password resets and security notifications.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Confirm Unsubscribe
            </button>
            <Link
              href="/"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
