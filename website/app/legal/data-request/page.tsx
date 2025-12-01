'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DataRequestPage(): React.ReactElement {
  const [formData, setFormData] = useState({
    requestType: 'access',
    email: '',
    fullName: '',
    details: '',
    isAuthorizedAgent: false,
    agentName: '',
    agentEmail: '',
    agentRelationship: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // In production, this would send to your API
      const response = await fetch('/api/data-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
        setFormData({
          requestType: 'access',
          email: '',
          fullName: '',
          details: '',
          isAuthorizedAgent: false,
          agentName: '',
          agentEmail: '',
          agentRelationship: '',
        });
      } else {
        setError('Failed to submit request. Please try again or contact privacy@cooksmartapp.com');
      }
    } catch (err) {
      setError('Failed to submit request. Please contact privacy@cooksmartapp.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (isSuccess) {
    return (
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Request Submitted Successfully</h1>
          <p className="text-lg mb-6">
            We've received your data request and will respond within 30 days as required by law.
          </p>
          <p className="mb-6">
            You'll receive a confirmation email at the address you provided.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Return Home
            </Link>
            <button
              onClick={() => setIsSuccess(false)}
              className="px-6 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Data Subject Request Form</h1>

      <div className="prose prose-lg max-w-none mb-8">
        <p>
          Use this form to exercise your rights under GDPR, CCPA, and other privacy laws. We will respond to your request within 30 days.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Privacy Rights</h2>
        <ul className="space-y-2 text-sm">
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Delete:</strong> Request deletion of your personal data</li>
          <li><strong>Portability:</strong> Receive your data in a portable format</li>
          <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
          <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
          <li><strong>Object:</strong> Object to certain types of data processing</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type */}
        <div>
          <label htmlFor="requestType" className="block text-sm font-medium mb-2">
            Type of Request <span className="text-red-600">*</span>
          </label>
          <select
            id="requestType"
            name="requestType"
            value={formData.requestType}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="access">Access My Data - Request a copy of my personal information</option>
            <option value="delete">Delete My Data - Request deletion of my personal information</option>
            <option value="portability">Data Portability - Receive my data in a portable format</option>
            <option value="correction">Correct My Data - Update inaccurate information</option>
            <option value="withdraw">Withdraw Consent - Withdraw consent for data processing</option>
            <option value="object">Object to Processing - Object to certain data processing</option>
            <option value="other">Other - Specify in details below</option>
          </select>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-2">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your.email@example.com"
          />
          <p className="text-sm text-gray-600 mt-1">
            We'll use this email to verify your identity and respond to your request.
          </p>
        </div>

        {/* Details */}
        <div>
          <label htmlFor="details" className="block text-sm font-medium mb-2">
            Additional Details
          </label>
          <textarea
            id="details"
            name="details"
            value={formData.details}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Please provide any additional information that will help us process your request..."
          />
        </div>

        {/* Authorized Agent */}
        <div className="border border-gray-300 rounded-lg p-6">
          <div className="flex items-start mb-4">
            <input
              type="checkbox"
              id="isAuthorizedAgent"
              name="isAuthorizedAgent"
              checked={formData.isAuthorizedAgent}
              onChange={handleChange}
              className="mt-1 mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isAuthorizedAgent" className="text-sm font-medium">
              I am an authorized agent submitting this request on behalf of someone else
            </label>
          </div>

          {formData.isAuthorizedAgent && (
            <div className="space-y-4 mt-4 pl-7">
              <div>
                <label htmlFor="agentName" className="block text-sm font-medium mb-2">
                  Agent Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="agentName"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleChange}
                  required={formData.isAuthorizedAgent}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="agentEmail" className="block text-sm font-medium mb-2">
                  Agent Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  id="agentEmail"
                  name="agentEmail"
                  value={formData.agentEmail}
                  onChange={handleChange}
                  required={formData.isAuthorizedAgent}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="agentRelationship" className="block text-sm font-medium mb-2">
                  Relationship to Data Subject <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="agentRelationship"
                  name="agentRelationship"
                  value={formData.agentRelationship}
                  onChange={handleChange}
                  required={formData.isAuthorizedAgent}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Legal representative, Parent/Guardian"
                />
              </div>
              <p className="text-sm text-gray-600">
                Note: We may require additional documentation to verify your authorization.
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <Link
            href="/legal/privacy"
            className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View Privacy Policy
          </Link>
        </div>

        <p className="text-sm text-gray-600">
          By submitting this form, you confirm that the information provided is accurate and that you are the data subject or an authorized agent acting on their behalf.
        </p>
      </form>

      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">1.</span>
            <span>We'll send a confirmation email to verify your identity</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">2.</span>
            <span>We'll process your request within 30 days (or 45 days for complex requests)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">3.</span>
            <span>You'll receive a response via email with the requested information or confirmation of action taken</span>
          </li>
        </ol>
        <p className="mt-4 text-sm">
          <strong>Need help?</strong> Contact our privacy team at{' '}
          <a href="mailto:privacy@cooksmartapp.com" className="text-blue-600 hover:underline">
            privacy@cooksmartapp.com
          </a>
        </p>
      </div>
    </main>
  );
}

