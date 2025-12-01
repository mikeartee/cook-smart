import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DMCA Copyright Policy | Cook Smart',
  description: 'Copyright infringement policy and DMCA takedown procedures',
};

export default function CopyrightPolicyPage(): React.ReactElement {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">DMCA Copyright Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 30, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Copyright Respect</h2>
          <p>
            Cook Smart respects the intellectual property rights of others and expects our users to do the same. We respond to notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act (DMCA).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Reporting Copyright Infringement</h2>
          <p>
            If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement and is accessible on our platform, please notify our Copyright Agent with the following information:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>A physical or electronic signature of the copyright owner or authorized representative</li>
            <li>Identification of the copyrighted work claimed to have been infringed</li>
            <li>Identification of the material that is claimed to be infringing, with information reasonably sufficient to locate it</li>
            <li>Your contact information (address, telephone number, email address)</li>
            <li>A statement that you have a good faith belief that use of the material is not authorized</li>
            <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. DMCA Notice Submission</h2>
          <p>
            Send your DMCA notice to our designated Copyright Agent:
          </p>
          <address className="not-italic bg-gray-100 p-6 rounded-lg my-4">
            <strong>Copyright Agent</strong><br />
            Cook Smart<br />
            Email: <a href="mailto:dmca@cooksmartapp.com" className="text-blue-600 hover:underline">dmca@cooksmartapp.com</a><br />
            Subject Line: "DMCA Takedown Notice"
          </address>
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material is infringing may be subject to liability.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Counter-Notification</h2>
          <p>
            If you believe that your content was removed or disabled by mistake or misidentification, you may file a counter-notification with our Copyright Agent. Your counter-notification must include:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your physical or electronic signature</li>
            <li>Identification of the material that was removed and its location before removal</li>
            <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake or misidentification</li>
            <li>Your name, address, telephone number, and email address</li>
            <li>A statement that you consent to the jurisdiction of the Federal District Court for your judicial district</li>
            <li>A statement that you will accept service of process from the person who provided the original DMCA notice</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Repeat Infringer Policy</h2>
          <p>
            Cook Smart will terminate the accounts of users who are repeat infringers of copyright. We reserve the right to terminate accounts of users who infringe the intellectual property rights of others, whether or not there is repeat infringement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. User-Generated Content</h2>
          <p>
            When you submit recipes, photos, or other content to Cook Smart:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>You represent that you own the content or have permission to share it</li>
            <li>You grant us a license to use, display, and distribute your content</li>
            <li>You agree not to upload content that infringes on others' rights</li>
            <li>You understand that infringing content may be removed without notice</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Third-Party Content</h2>
          <p>
            Cook Smart displays recipes from third-party sources, including TheMealDB. We respect the copyright of these sources and:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Properly attribute content to its source</li>
            <li>Link to original sources when available</li>
            <li>Remove content upon valid DMCA notice</li>
            <li>Comply with API terms of service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Recipe Copyright</h2>
          <p>
            <strong>Important Note:</strong> In the United States, recipes (lists of ingredients and basic instructions) are generally not protected by copyright. However:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Original recipe descriptions, stories, and photographs ARE protected</li>
            <li>Substantial literary expression in recipes IS protected</li>
            <li>Compilations of recipes MAY be protected</li>
            <li>Recipe names generally are NOT protected (but may be trademarked)</li>
          </ul>
          <p>
            We respect all intellectual property rights and encourage users to create original content or properly attribute sources.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Trademark Policy</h2>
          <p>
            Cook Smart and our logo are trademarks. Unauthorized use of our trademarks is prohibited. If you believe your trademark is being used without authorization, please contact us at{' '}
            <a href="mailto:legal@cooksmartapp.com" className="text-blue-600 hover:underline">
              legal@cooksmartapp.com
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
          <p>
            For copyright-related inquiries:
          </p>
          <address className="not-italic">
            <strong>Copyright Agent</strong><br />
            Cook Smart<br />
            Email: <a href="mailto:dmca@cooksmartapp.com" className="text-blue-600 hover:underline">dmca@cooksmartapp.com</a><br />
            Legal: <a href="mailto:legal@cooksmartapp.com" className="text-blue-600 hover:underline">legal@cooksmartapp.com</a>
          </address>
        </section>
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">Report Copyright Infringement</h2>
        <p className="mb-4">
          If you believe your copyright has been infringed, please send a DMCA notice to our Copyright Agent.
        </p>
        <a
          href="mailto:dmca@cooksmartapp.com?subject=DMCA Takedown Notice"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Send DMCA Notice
        </a>
      </div>

      <div className="mt-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Related Policies</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/legal/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/legal/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}

