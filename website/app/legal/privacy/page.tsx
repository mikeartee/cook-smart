import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Cook Smart',
  description: 'Privacy Policy and data protection information for Cook Smart',
};

export default function PrivacyPolicyPage(): React.ReactElement {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 30, 2025<br />
          <strong>Effective Date:</strong> November 30, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Cook Smart ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application.
          </p>
          <p>
            <strong>Your Rights:</strong> You have the right to access, correct, delete, or restrict the use of your personal data. See Section 9 for details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-2">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Account Information:</strong> Name, email address, password</li>
            <li><strong>Profile Information:</strong> Dietary preferences, cooking skill level, allergies</li>
            <li><strong>User Content:</strong> Recipes, comments, reviews, photos</li>
            <li><strong>Communication:</strong> Messages sent through contact forms or support</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.2 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Usage Data:</strong> Pages viewed, features used, time spent</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
            <li><strong>Cookies:</strong> See our <a href="/legal/cookies" className="text-blue-600 hover:underline">Cookie Policy</a></li>
            <li><strong>Analytics:</strong> Aggregated usage statistics</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.3 Third-Party Information</h3>
          <p>
            We may receive recipe data from third-party sources like TheMealDB. This data does not contain personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide and maintain the Service</li>
            <li>Personalize your experience</li>
            <li>Send you updates and newsletters (with your consent)</li>
            <li>Respond to your inquiries and support requests</li>
            <li>Improve our Service through analytics</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing (GDPR)</h2>
          <p>If you are in the European Economic Area (EEA), we process your data based on:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Consent:</strong> You have given clear consent for specific purposes</li>
            <li><strong>Contract:</strong> Processing is necessary to fulfill our contract with you</li>
            <li><strong>Legal Obligation:</strong> Processing is required by law</li>
            <li><strong>Legitimate Interests:</strong> Processing is in our legitimate interests and doesn't override your rights</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Information Sharing and Disclosure</h2>
          
          <h3 className="text-xl font-semibold mb-2">5.1 We Do Not Sell Your Data</h3>
          <p>
            We do not sell, rent, or trade your personal information to third parties.
          </p>

          <h3 className="text-xl font-semibold mb-2">5.2 We May Share Information With:</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Service Providers:</strong> Hosting, analytics, email services (under strict confidentiality agreements)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> When you explicitly agree to sharing</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">5.3 Third-Party Service Providers (Subprocessors)</h3>
          <p>
            We use the following third-party service providers to help us operate our business:
          </p>
          <div className="overflow-x-auto my-4">
            <table className="min-w-full bg-white border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border-b text-left">Provider</th>
                  <th className="px-4 py-2 border-b text-left">Purpose</th>
                  <th className="px-4 py-2 border-b text-left">Location</th>
                  <th className="px-4 py-2 border-b text-left">Privacy Policy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b">Vercel</td>
                  <td className="px-4 py-2 border-b">Website hosting</td>
                  <td className="px-4 py-2 border-b">USA</td>
                  <td className="px-4 py-2 border-b">
                    <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">Resend</td>
                  <td className="px-4 py-2 border-b">Email delivery</td>
                  <td className="px-4 py-2 border-b">USA</td>
                  <td className="px-4 py-2 border-b">
                    <a href="https://resend.com/legal/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">TheMealDB</td>
                  <td className="px-4 py-2 border-b">Recipe data</td>
                  <td className="px-4 py-2 border-b">UK</td>
                  <td className="px-4 py-2 border-b">
                    <a href="https://www.themealdb.com/privacy.php" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">AWS</td>
                  <td className="px-4 py-2 border-b">Database & storage</td>
                  <td className="px-4 py-2 border-b">USA</td>
                  <td className="px-4 py-2 border-b">
                    <a href="https://aws.amazon.com/privacy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            All service providers are contractually obligated to protect your data and comply with applicable privacy laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your data:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Encryption of data in transit (HTTPS/TLS)</li>
            <li>Encryption of sensitive data at rest</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
            <li>Employee training on data protection</li>
          </ul>
          <p>
            <strong>Note:</strong> No method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
          <p>
            We retain your personal information only as long as necessary for the purposes outlined in this Privacy Policy:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Account Data:</strong> Until you delete your account, plus 30 days</li>
            <li><strong>Usage Data:</strong> Aggregated data retained indefinitely for analytics</li>
            <li><strong>Legal Requirements:</strong> As required by applicable law</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Standard Contractual Clauses approved by the European Commission</li>
            <li>Privacy Shield certification (where applicable)</li>
            <li>Adequacy decisions by relevant authorities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Your Privacy Rights</h2>
          
          <h3 className="text-xl font-semibold mb-2">9.1 All Users</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your data</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">9.2 GDPR Rights (EEA Residents)</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Right to Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Right to Restriction:</strong> Limit how we use your data</li>
            <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your supervisory authority</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">9.3 CCPA Rights (California Residents)</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Right to Know:</strong> What personal information we collect and how we use it</li>
            <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
            <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (we don't sell data)</li>
            <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">9.4 How to Exercise Your Rights</h3>
          <p>
            To exercise any of these rights, contact us at:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Email: <a href="mailto:privacy@cooksmartapp.com" className="text-blue-600 hover:underline">privacy@cooksmartapp.com</a></li>
            <li>Account Settings: Manage preferences in your account</li>
            <li>Contact Form: <a href="/contact" className="text-blue-600 hover:underline">Submit a request</a></li>
          </ul>
          <p>
            We will respond to your request within 30 days (or as required by applicable law).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under 13 (or 16 in the EEA). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies. For detailed information, see our <a href="/legal/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Posting the new Privacy Policy on this page</li>
            <li>Updating the "Last Updated" date</li>
            <li>Sending an email notification (for significant changes)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or our privacy practices:
          </p>
          <address className="not-italic">
            <strong>Data Protection Officer</strong><br />
            Cook Smart<br />
            Email: <a href="mailto:privacy@cooksmartapp.com" className="text-blue-600 hover:underline">privacy@cooksmartapp.com</a><br />
            Contact Form: <a href="/contact" className="text-blue-600 hover:underline">Submit Inquiry</a>
          </address>
        </section>
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">Your Privacy Matters</h2>
        <p className="mb-4">
          We are committed to transparency and protecting your privacy. If you have any concerns or questions, please don't hesitate to contact us.
        </p>
        <div className="flex gap-4">
          <a
            href="/contact"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Us
          </a>
          <a
            href="/legal/cookies"
            className="inline-block px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Cookie Settings
          </a>
        </div>
      </div>
    </main>
  );
}

