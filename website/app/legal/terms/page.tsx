import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Cook Smart',
  description: 'Terms of Service and User Agreement for Cook Smart',
};

export default function TermsOfServicePage(): React.ReactElement {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 30, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Cook Smart ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p>
            Cook Smart provides a platform for discovering, sharing, and managing recipes. The Service includes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Recipe discovery and search functionality</li>
            <li>Meal planning tools</li>
            <li>Nutritional information</li>
            <li>User-generated content features</li>
            <li>Community features and interactions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <h3 className="text-xl font-semibold mb-2">3.1 Account Creation</h3>
          <p>
            To access certain features, you must create an account. You agree to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information</li>
            <li>Maintain the security of your password</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">3.2 Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or illegal activity.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
          <h3 className="text-xl font-semibold mb-2">4.1 Your Content</h3>
          <p>
            You retain ownership of content you submit to Cook Smart. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content in connection with the Service.
          </p>

          <h3 className="text-xl font-semibold mb-2">4.2 Content Standards</h3>
          <p>You agree not to post content that:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Violates any law or regulation</li>
            <li>Infringes on intellectual property rights</li>
            <li>Contains harmful, threatening, or abusive material</li>
            <li>Contains false or misleading information</li>
            <li>Promotes illegal activities</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">4.3 Content Moderation</h3>
          <p>
            We reserve the right to review, modify, or remove any user content that violates these Terms or is otherwise objectionable.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Content</h2>
          <p>
            Cook Smart may display recipes and content from third-party sources, including TheMealDB. We do not guarantee the accuracy, completeness, or reliability of third-party content.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
          <p>
            The Service and its original content (excluding user-generated content) are owned by Cook Smart and are protected by copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>The Service will be uninterrupted or error-free</li>
            <li>Defects will be corrected</li>
            <li>The Service is free of viruses or harmful components</li>
            <li>Nutritional information is accurate or complete</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, COOK SMART SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Health and Safety</h2>
          <p>
            <strong>Important:</strong> Cook Smart provides recipes and nutritional information for informational purposes only. We are not responsible for:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Allergic reactions or food sensitivities</li>
            <li>Foodborne illnesses</li>
            <li>Dietary restrictions or medical conditions</li>
            <li>Accuracy of nutritional information</li>
          </ul>
          <p>
            Always consult with healthcare professionals regarding dietary needs and restrictions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Privacy</h2>
          <p>
            Your use of the Service is also governed by our <a href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Continued use after changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Cook Smart operates, without regard to conflict of law principles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us at:
          </p>
          <address className="not-italic">
            <strong>Cook Smart</strong><br />
            Email: <a href="mailto:legal@cooksmartapp.com" className="text-blue-600 hover:underline">legal@cooksmartapp.com</a><br />
            Website: <a href="/contact" className="text-blue-600 hover:underline">Contact Form</a>
          </address>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Accessibility</h2>
          <p>
            We are committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards. For accessibility concerns, please see our <a href="/legal/accessibility" className="text-blue-600 hover:underline">Accessibility Statement</a>.
          </p>
        </section>
      </div>

      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Related Legal Documents</h2>
        <ul className="space-y-2">
          <li>
            <a href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
          </li>
          <li>
            <a href="/legal/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>
          </li>
          <li>
            <a href="/legal/accessibility" className="text-blue-600 hover:underline">Accessibility Statement</a>
          </li>
        </ul>
      </div>
    </main>
  );
}

