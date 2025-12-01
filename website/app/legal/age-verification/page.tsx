import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Age Verification Policy | Cook Smart',
  description: 'Age requirements and verification policy for Cook Smart',
};

export default function AgeVerificationPage(): React.ReactElement {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Age Verification Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 30, 2025<br />
          <strong>Effective Date:</strong> November 30, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Age Requirements</h2>
          <p>
            Cook Smart is committed to protecting the privacy of children. Our services have specific age requirements based on your location:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>United States:</strong> You must be at least 13 years old</li>
            <li><strong>European Union/EEA:</strong> You must be at least 16 years old</li>
            <li><strong>Other Countries:</strong> You must meet the minimum age for digital consent in your country</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Why We Have Age Requirements</h2>
          <p>
            These age requirements are in place to comply with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>COPPA (USA):</strong> Children's Online Privacy Protection Act</li>
            <li><strong>GDPR (EU):</strong> General Data Protection Regulation</li>
            <li><strong>Local Laws:</strong> Age of digital consent laws in various countries</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Verify Age</h2>
          
          <h3 className="text-xl font-semibold mb-2">During Account Creation</h3>
          <p>
            When you create an account, we ask for your date of birth to verify you meet the minimum age requirement for your location.
          </p>

          <h3 className="text-xl font-semibold mb-2">What We Do With Your Birth Date</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Calculate your age to ensure compliance</li>
            <li>Store only the year of birth (not full date)</li>
            <li>Use it to provide age-appropriate content</li>
            <li>Never share it with third parties</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">If You're Under the Minimum Age</h2>
          
          <h3 className="text-xl font-semibold mb-2">United States (Under 13)</h3>
          <p>
            If you are under 13 years old in the United States, you cannot create an account. We do not knowingly collect personal information from children under 13.
          </p>

          <h3 className="text-xl font-semibold mb-2">European Union (Under 16)</h3>
          <p>
            If you are under 16 years old in the EU/EEA, you may only use Cook Smart with parental consent. We require:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Parent or guardian email address</li>
            <li>Parental consent verification</li>
            <li>Parent/guardian account oversight</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Parental Consent Process</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Minor provides parent/guardian email during signup</li>
            <li>We send verification email to parent/guardian</li>
            <li>Parent/guardian must confirm consent</li>
            <li>Account is activated only after parental approval</li>
            <li>Parent/guardian can manage or delete account at any time</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy Protection</h2>
          
          <h3 className="text-xl font-semibold mb-2">What We Don't Collect from Minors</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Precise geolocation data</li>
            <li>Photos or videos (without parental consent)</li>
            <li>Social security numbers or government IDs</li>
            <li>Financial information</li>
            <li>Biometric data</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">What We Do Collect (With Consent)</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Email address (for account access)</li>
            <li>Username (chosen by user)</li>
            <li>Dietary preferences (optional)</li>
            <li>Saved recipes and meal plans</li>
            <li>Usage data (anonymized)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Parental Rights and Controls</h2>
          <p>
            If your child has an account with parental consent, you have the right to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Review:</strong> Access all information collected about your child</li>
            <li><strong>Delete:</strong> Request deletion of your child's account and data</li>
            <li><strong>Refuse:</strong> Refuse further collection or use of your child's information</li>
            <li><strong>Manage:</strong> Control privacy settings and account features</li>
            <li><strong>Monitor:</strong> View your child's activity and usage</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">How to Exercise Parental Rights</h3>
          <p>
            Contact us at:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Email: <a href="mailto:parents@cooksmartapp.com" className="text-blue-600 hover:underline">parents@cooksmartapp.com</a></li>
            <li>Subject: Parental Rights Request</li>
            <li>Include: Child's username and your relationship</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">If We Discover Underage Users</h2>
          <p>
            If we learn that we have collected personal information from a child under the minimum age without proper consent:
          </p>
          <ol className="list-decimal pl-6 mb-4">
            <li>We will immediately suspend the account</li>
            <li>We will attempt to notify the parent/guardian</li>
            <li>We will delete all personal information</li>
            <li>We will not allow re-registration without proper consent</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Age-Appropriate Content</h2>
          <p>
            Cook Smart is designed to be family-friendly, but we take extra precautions for younger users:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>No alcohol-based recipes shown to minors</li>
            <li>Age-appropriate cooking safety warnings</li>
            <li>Moderated community features</li>
            <li>No direct messaging between users</li>
            <li>Restricted social features for minors</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Educational Use</h2>
          <p>
            Schools and educational institutions using Cook Smart for educational purposes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Must obtain parental consent for students under minimum age</li>
            <li>Can create supervised accounts for classroom use</li>
            <li>Have access to teacher/administrator controls</li>
            <li>Must comply with FERPA and other educational privacy laws</li>
          </ul>
          <p>
            Contact us at <a href="mailto:education@cooksmartapp.com" className="text-blue-600 hover:underline">education@cooksmartapp.com</a> for educational licensing.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">International Age Requirements</h2>
          <div className="overflow-x-auto my-4">
            <table className="min-w-full bg-white border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border-b text-left">Country/Region</th>
                  <th className="px-4 py-2 border-b text-left">Minimum Age</th>
                  <th className="px-4 py-2 border-b text-left">Parental Consent</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b">United States</td>
                  <td className="px-4 py-2 border-b">13 years</td>
                  <td className="px-4 py-2 border-b">Not required</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">European Union</td>
                  <td className="px-4 py-2 border-b">16 years</td>
                  <td className="px-4 py-2 border-b">Required if under 16</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">United Kingdom</td>
                  <td className="px-4 py-2 border-b">13 years</td>
                  <td className="px-4 py-2 border-b">Not required</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">Canada</td>
                  <td className="px-4 py-2 border-b">13 years</td>
                  <td className="px-4 py-2 border-b">Not required</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">Australia</td>
                  <td className="px-4 py-2 border-b">13 years</td>
                  <td className="px-4 py-2 border-b">Not required</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Note: Some EU member states may have different age requirements. We use the highest standard (16 years) for all EU users.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Reporting Underage Users</h2>
          <p>
            If you believe a user is under the minimum age without proper consent:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Email: <a href="mailto:compliance@cooksmartapp.com" className="text-blue-600 hover:underline">compliance@cooksmartapp.com</a></li>
            <li>Subject: Underage User Report</li>
            <li>Include: Username and reason for concern</li>
          </ul>
          <p>
            We will investigate all reports and take appropriate action within 48 hours.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p>
            We may update this Age Verification Policy from time to time. We will notify parents/guardians of material changes by:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Email notification to parent/guardian email on file</li>
            <li>Prominent notice on our website</li>
            <li>In-app notification</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <address className="not-italic">
            <strong>Privacy Team</strong><br />
            Cook Smart<br />
            Email: <a href="mailto:privacy@cooksmartapp.com" className="text-blue-600 hover:underline">privacy@cooksmartapp.com</a><br />
            Parents: <a href="mailto:parents@cooksmartapp.com" className="text-blue-600 hover:underline">parents@cooksmartapp.com</a><br />
            Compliance: <a href="mailto:compliance@cooksmartapp.com" className="text-blue-600 hover:underline">compliance@cooksmartapp.com</a>
          </address>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Related Policies</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <a href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            </li>
            <li>
              <a href="/legal/terms" className="text-blue-600 hover:underline">Terms of Service</a>
            </li>
            <li>
              <a href="/legal/community-guidelines" className="text-blue-600 hover:underline">Community Guidelines</a>
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-12 p-6 bg-purple-50 rounded-lg border border-purple-200">
        <h2 className="text-xl font-semibold mb-4">For Parents and Guardians</h2>
        <p className="mb-4">
          We take children's privacy seriously. If you have questions about your child's account or our privacy practices, please contact us.
        </p>
        <div className="flex gap-4">
          <a
            href="mailto:parents@cooksmartapp.com"
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Contact Parental Support
          </a>
          <a
            href="/legal/privacy"
            className="inline-block px-6 py-2 bg-white text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            View Privacy Policy
          </a>
        </div>
      </div>
    </main>
  );
}
