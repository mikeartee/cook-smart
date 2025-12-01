'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface EmailPreferences {
  newsletter: boolean;
  recipes: boolean;
  tips: boolean;
  promotions: boolean;
  updates: boolean;
}

export default function EmailPreferencesPage(): React.ReactElement {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    newsletter: true,
    recipes: true,
    tips: true,
    promotions: false,
    updates: true,
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof EmailPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In production, call API to save preferences
    // await fetch('/api/email-preferences', { method: 'POST', body: JSON.stringify(preferences) });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUnsubscribeAll = () => {
    if (confirm('Are you sure you want to unsubscribe from all marketing emails?')) {
      setPreferences({
        newsletter: false,
        recipes: false,
        tips: false,
        promotions: false,
        updates: false,
      });
    }
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Preferences</h1>
        <p className="text-gray-700 mb-8">
          Choose which emails you'd like to receive from Cook Smart. You can update these preferences at any time.
        </p>

        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">✓ Your preferences have been saved!</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="newsletter"
                  checked={preferences.newsletter}
                  onChange={() => handleToggle('newsletter')}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-4">
                <label htmlFor="newsletter" className="font-medium text-gray-900 cursor-pointer">
                  Weekly Newsletter
                </label>
                <p className="text-sm text-gray-600">
                  Get our weekly roundup of the best recipes, cooking tips, and community highlights.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="recipes"
                  checked={preferences.recipes}
                  onChange={() => handleToggle('recipes')}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-4">
                <label htmlFor="recipes" className="font-medium text-gray-900 cursor-pointer">
                  New Recipe Alerts
                </label>
                <p className="text-sm text-gray-600">
                  Be the first to know when we add new recipes that match your preferences.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="tips"
                  checked={preferences.tips}
                  onChange={() => handleToggle('tips')}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-4">
                <label htmlFor="tips" className="font-medium text-gray-900 cursor-pointer">
                  Cooking Tips & Tricks
                </label>
                <p className="text-sm text-gray-600">
                  Learn new cooking techniques, kitchen hacks, and expert advice.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="promotions"
                  checked={preferences.promotions}
                  onChange={() => handleToggle('promotions')}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-4">
                <label htmlFor="promotions" className="font-medium text-gray-900 cursor-pointer">
                  Promotions & Special Offers
                </label>
                <p className="text-sm text-gray-600">
                  Exclusive deals, discounts, and special promotions just for subscribers.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="updates"
                  checked={preferences.updates}
                  onChange={() => handleToggle('updates')}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-4">
                <label htmlFor="updates" className="font-medium text-gray-900 cursor-pointer">
                  Product Updates
                </label>
                <p className="text-sm text-gray-600">
                  Stay informed about new features, improvements, and important changes.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You'll always receive important account-related emails like password resets, security alerts, and service notifications regardless of these preferences.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save Preferences
            </button>
            <button
              type="button"
              onClick={handleUnsubscribeAll}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Unsubscribe from All
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Need More Help?</h2>
          <div className="space-y-2 text-sm">
            <p>
              <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              {' - '}Learn how we protect your data
            </p>
            <p>
              <Link href="/contact" className="text-blue-600 hover:underline">
                Contact Support
              </Link>
              {' - '}Get help with your account
            </p>
            <p>
              <Link href="/legal/data-request" className="text-blue-600 hover:underline">
                Data Request
              </Link>
              {' - '}Access, export, or delete your data
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
