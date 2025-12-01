import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Do Not Sell My Personal Information | Cook Smart',
  description: 'Information about personal data sales and your rights under CCPA',
};

export default function DoNotSellPage(): React.ReactElement {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Do Not Sell My Personal Information</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 30, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
          <p className="text-lg font-semibold text-green-600 mb-4">
            Cook Smart does NOT sell your personal information.
          </p>
          <p>
            We want to be clear: we do not sell, rent, or trade your personal information to third parties for monetary or other valuable consideration. This has always been our policy, and it will continue to be.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What This Means</h2>
          <p>
            Under the California Consumer Privacy Act (CCPA), you have the right to opt-out of the sale of your personal information. However, since we don't sell your data, there's nothing to opt-out of.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p>
            We only use your personal information to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide and improve our services</li>
            <li>Communicate with you about your account</li>
            <li>Send you updates and newsletters (with your consent)</li>
            <li>Analyze usage to improve user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p>
            While we don't sell your data, we do use third-party service providers to help us operate our business:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Hosting providers</strong> - To host our website and app</li>
            <li><strong>Email services</strong> - To send you important communications</li>
            <li><strong>Analytics services</strong> - To understand how our service is used</li>
          </ul>
          <p>
            These service providers are contractually obligated to protect your data and can only use it to provide services to us. They cannot sell your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your CCPA Rights</h2>
          <p>
            As a California resident, you have the following rights:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Right to Know:</strong> What personal information we collect and how we use it</li>
            <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
            <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (not applicable since we don't sell)</li>
            <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of your privacy choices</li>
          </ul>
          <p>
            To exercise these rights, visit our{' '}
            <Link href="/legal/data-request" className="text-blue-600 hover:underline">
              Data Request Form
            </Link>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Advertising and Tracking</h2>
          <p>
            We may use cookies and similar technologies for analytics and to improve your experience. You can control these through our{' '}
            <Link href="/legal/cookies" className="text-blue-600 hover:underline">
              Cookie Settings
            </Link>
            .
          </p>
          <p className="mt-4">
            We do not participate in third-party advertising networks that track you across websites for targeted advertising purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Questions or Concerns?</h2>
          <p>
            If you have questions about how we handle your personal information:
          </p>
          <address className="not-italic mt-4">
            <strong>Privacy Team</strong><br />
            Cook Smart<br />
            Email: <a href="mailto:services.cooksmart@gmail.com" className="text-blue-600 hover:underline">services.cooksmart@gmail.com</a><br />
            Data Request Form: <Link href="/legal/data-request" className="text-blue-600 hover:underline">Submit Request</Link>
          </address>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Related Information</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              {' '}- Full details on data collection and use
            </li>
            <li>
              <Link href="/legal/cookies" className="text-blue-600 hover:underline">
                Cookie Policy
              </Link>
              {' '}- Information about cookies and tracking
            </li>
            <li>
              <Link href="/legal/data-request" className="text-blue-600 hover:underline">
                Data Request Form
              </Link>
              {' '}- Exercise your privacy rights
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-12 p-6 bg-green-50 rounded-lg border border-green-200">
        <h2 className="text-xl font-semibold mb-4">Your Privacy Matters</h2>
        <p className="mb-4">
          We believe in transparency and protecting your privacy. We will never sell your personal information, and we're committed to using your data responsibly.
        </p>
        <div className="flex gap-4">
          <Link
            href="/legal/privacy"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Read Privacy Policy
          </Link>
          <Link
            href="/legal/data-request"
            className="inline-block px-6 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            Submit Data Request
          </Link>
        </div>
      </div>
    </main>
  );
}

