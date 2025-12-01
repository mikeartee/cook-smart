'use client';

import React from 'react';

export default function CookiePolicyPage(): React.ReactElement {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 30, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
          <p>
            Cook Smart uses cookies to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Keep you signed in</li>
            <li>Remember your preferences</li>
            <li>Understand how you use our website</li>
            <li>Improve your experience</li>
            <li>Provide personalized content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>

          <h3 className="text-xl font-semibold mb-2">3.1 Essential Cookies</h3>
          <p>
            <strong>Purpose:</strong> These cookies are necessary for the website to function properly.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Session cookies:</strong> Keep you logged in during your visit</li>
            <li><strong>Security cookies:</strong> Protect against fraud and abuse</li>
            <li><strong>Load balancing:</strong> Distribute traffic across servers</li>
          </ul>
          <p>
            <strong>Duration:</strong> Session (deleted when you close your browser) or up to 1 year
          </p>
          <p>
            <strong>Can be disabled:</strong> No - these are required for the site to work
          </p>

          <h3 className="text-xl font-semibold mb-2">3.2 Functional Cookies</h3>
          <p>
            <strong>Purpose:</strong> Remember your preferences and choices.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Language preference:</strong> Remember your language choice</li>
            <li><strong>Theme preference:</strong> Remember dark/light mode</li>
            <li><strong>Dietary preferences:</strong> Remember your dietary restrictions</li>
          </ul>
          <p>
            <strong>Duration:</strong> Up to 1 year
          </p>
          <p>
            <strong>Can be disabled:</strong> Yes - but some features may not work properly
          </p>

          <h3 className="text-xl font-semibold mb-2">3.3 Analytics Cookies</h3>
          <p>
            <strong>Purpose:</strong> Help us understand how visitors use our website.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Google Analytics:</strong> Track page views, sessions, and user behavior</li>
            <li><strong>Performance monitoring:</strong> Identify technical issues</li>
            <li><strong>A/B testing:</strong> Test different versions of features</li>
          </ul>
          <p>
            <strong>Duration:</strong> Up to 2 years
          </p>
          <p>
            <strong>Can be disabled:</strong> Yes - through cookie settings
          </p>

          <h3 className="text-xl font-semibold mb-2">3.4 Marketing Cookies</h3>
          <p>
            <strong>Purpose:</strong> Track your activity to show relevant advertisements.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Advertising networks:</strong> Show relevant ads on other websites</li>
            <li><strong>Social media:</strong> Enable sharing and track engagement</li>
            <li><strong>Retargeting:</strong> Show ads for products you've viewed</li>
          </ul>
          <p>
            <strong>Duration:</strong> Up to 2 years
          </p>
          <p>
            <strong>Can be disabled:</strong> Yes - through cookie settings
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
          <p>
            We use services from third parties that may set their own cookies:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Google Analytics:</strong> Website analytics</li>
            <li><strong>YouTube:</strong> Embedded videos</li>
            <li><strong>Social Media:</strong> Sharing buttons (Facebook, Twitter, Pinterest)</li>
          </ul>
          <p>
            These third parties have their own privacy policies. We recommend reviewing them:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
            <li><a href="https://www.facebook.com/privacy/explanation" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Facebook Privacy Policy</a></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Managing Cookies</h2>

          <h3 className="text-xl font-semibold mb-2">5.1 Cookie Settings</h3>
          <p>
            You can manage your cookie preferences through our cookie banner or settings page.
          </p>

          <h3 className="text-xl font-semibold mb-2">5.2 Browser Settings</h3>
          <p>
            Most browsers allow you to control cookies through their settings:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><a href="https://support.google.com/chrome/answer/95647" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Edge</a></li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">5.3 Opt-Out Tools</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
            <li><a href="https://optout.aboutads.info/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance Opt-out</a></li>
            <li><a href="https://www.youronlinechoices.com/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Your Online Choices (EU)</a></li>
          </ul>

          <p className="mt-4">
            <strong>Note:</strong> Disabling cookies may affect the functionality of our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Do Not Track</h2>
          <p>
            Some browsers have a "Do Not Track" feature. When enabled, it sends a signal to websites requesting not to be tracked. Currently, there is no industry standard for how to respond to these signals. We honor Do Not Track signals by:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Not using analytics cookies when DNT is enabled</li>
            <li>Not using marketing cookies when DNT is enabled</li>
            <li>Still using essential cookies (required for functionality)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Cookie Consent</h2>
          <p>
            When you first visit our website, you'll see a cookie banner asking for your consent. You can:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Accept All:</strong> Allow all cookies</li>
            <li><strong>Reject Non-Essential:</strong> Only allow essential cookies</li>
            <li><strong>Customize:</strong> Choose which types of cookies to allow</li>
          </ul>
          <p>
            You can change your preferences at any time through the cookie settings link in the footer.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. We will notify you of significant changes by updating the "Last Updated" date at the top of this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
          <p>
            If you have questions about our use of cookies:
          </p>
          <address className="not-italic">
            <strong>Cook Smart</strong><br />
            Email: <a href="mailto:privacy@cooksmartapp.com" className="text-blue-600 hover:underline">privacy@cooksmartapp.com</a><br />
            Contact Form: <a href="/contact" className="text-blue-600 hover:underline">Submit Inquiry</a>
          </address>
        </section>
      </div>

      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Cookie Summary Table</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 border-b text-left">Cookie Type</th>
                <th className="px-4 py-2 border-b text-left">Purpose</th>
                <th className="px-4 py-2 border-b text-left">Duration</th>
                <th className="px-4 py-2 border-b text-left">Can Disable?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border-b">Essential</td>
                <td className="px-4 py-2 border-b">Site functionality</td>
                <td className="px-4 py-2 border-b">Session - 1 year</td>
                <td className="px-4 py-2 border-b">No</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b">Functional</td>
                <td className="px-4 py-2 border-b">Remember preferences</td>
                <td className="px-4 py-2 border-b">Up to 1 year</td>
                <td className="px-4 py-2 border-b">Yes</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b">Analytics</td>
                <td className="px-4 py-2 border-b">Usage statistics</td>
                <td className="px-4 py-2 border-b">Up to 2 years</td>
                <td className="px-4 py-2 border-b">Yes</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b">Marketing</td>
                <td className="px-4 py-2 border-b">Targeted advertising</td>
                <td className="px-4 py-2 border-b">Up to 2 years</td>
                <td className="px-4 py-2 border-b">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">Manage Your Cookie Preferences</h2>
        <p className="mb-4">
          Control which cookies we use on your device.
        </p>
        <button
          onClick={() => {
            // This would open a cookie consent modal
            alert('Cookie preferences modal would open here');
          }}
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Cookie Settings
        </button>
      </div>
    </main>
  );
}

