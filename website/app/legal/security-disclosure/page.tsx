import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Disclosure Policy | Cook Smart',
  description: 'Responsible disclosure policy for security vulnerabilities',
};

export default function SecurityDisclosurePage(): React.ReactElement {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Security Disclosure Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 30, 2025<br />
          <strong>Version:</strong> 1.0
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Commitment to Security</h2>
          <p>
            Cook Smart takes the security of our users' data seriously. We appreciate the security research community's efforts in helping us maintain the security of our platform.
          </p>
          <p>
            This policy outlines our guidelines for responsible disclosure of security vulnerabilities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Reporting a Vulnerability</h2>
          
          <h3 className="text-xl font-semibold mb-2">How to Report</h3>
          <p>
            If you believe you've found a security vulnerability in Cook Smart, please report it to us:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:services.cooksmart@gmail.com" className="text-blue-600 hover:underline">
                services.cooksmart@gmail.com
              </a>
            </li>
            <li>
              <strong>Subject Line:</strong> [SECURITY] Brief description of the issue
            </li>
            <li>
              <strong>Response Time:</strong> We aim to respond within 48 hours
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">What to Include</h3>
          <p>
            Please provide as much information as possible:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)</li>
            <li>Affected URL(s) or component(s)</li>
            <li>Step-by-step instructions to reproduce the issue</li>
            <li>Proof of concept (if applicable)</li>
            <li>Potential impact of the vulnerability</li>
            <li>Any suggested remediation steps</li>
            <li>Your contact information (optional, for follow-up)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Responsible Disclosure Guidelines</h2>
          
          <h3 className="text-xl font-semibold mb-2">Please Do:</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Report vulnerabilities as soon as you discover them</li>
            <li>Provide sufficient detail to reproduce the issue</li>
            <li>Give us reasonable time to address the issue before public disclosure</li>
            <li>Act in good faith to avoid privacy violations and service disruption</li>
            <li>Use test accounts when possible</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Please Don't:</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Access or modify other users' data without permission</li>
            <li>Perform actions that could harm the reliability or integrity of our services</li>
            <li>Use social engineering, phishing, or physical attacks</li>
            <li>Publicly disclose the vulnerability before we've had time to fix it</li>
            <li>Demand payment or compensation for reporting vulnerabilities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Response Process</h2>
          
          <h3 className="text-xl font-semibold mb-2">Timeline</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Initial Response:</strong> Within 48 hours of report</li>
            <li><strong>Triage:</strong> Within 5 business days</li>
            <li><strong>Status Updates:</strong> Every 7 days until resolved</li>
            <li><strong>Resolution:</strong> Based on severity (see below)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Severity Levels</h3>
          <div className="overflow-x-auto my-4">
            <table className="min-w-full bg-white border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border-b text-left">Severity</th>
                  <th className="px-4 py-2 border-b text-left">Description</th>
                  <th className="px-4 py-2 border-b text-left">Target Resolution</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b font-semibold text-red-600">Critical</td>
                  <td className="px-4 py-2 border-b">Remote code execution, authentication bypass, data breach</td>
                  <td className="px-4 py-2 border-b">24-48 hours</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-semibold text-orange-600">High</td>
                  <td className="px-4 py-2 border-b">Privilege escalation, SQL injection, XSS</td>
                  <td className="px-4 py-2 border-b">7 days</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-semibold text-yellow-600">Medium</td>
                  <td className="px-4 py-2 border-b">CSRF, information disclosure, security misconfiguration</td>
                  <td className="px-4 py-2 border-b">30 days</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-semibold text-blue-600">Low</td>
                  <td className="px-4 py-2 border-b">Minor information leaks, best practice violations</td>
                  <td className="px-4 py-2 border-b">90 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scope</h2>
          
          <h3 className="text-xl font-semibold mb-2">In Scope</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>cooksmartapp.com (website)</li>
            <li>api.cooksmartapp.com (API)</li>
            <li>Cook Smart mobile applications (iOS and Android)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Out of Scope</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Third-party services and websites</li>
            <li>Social engineering attacks</li>
            <li>Physical security issues</li>
            <li>Denial of Service (DoS) attacks</li>
            <li>Spam or social media issues</li>
            <li>Issues in outdated browsers or platforms</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recognition</h2>
          <p>
            We appreciate the security research community's contributions. With your permission, we will:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Acknowledge your contribution in our security acknowledgments page</li>
            <li>Credit you in our release notes (if appropriate)</li>
            <li>Provide a reference letter upon request</li>
          </ul>
          <p>
            <strong>Note:</strong> We do not currently offer a bug bounty program, but we deeply value responsible disclosure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Safe Harbor</h2>
          <p>
            Cook Smart commits to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Not pursue legal action against researchers who follow this policy</li>
            <li>Work with you to understand and resolve the issue quickly</li>
            <li>Recognize your contribution to our security</li>
          </ul>
          <p>
            If you follow these guidelines when reporting an issue, we consider your research to be:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Authorized under the Computer Fraud and Abuse Act (CFAA)</li>
            <li>Exempt from DMCA anti-circumvention provisions</li>
            <li>Exempt from restrictions in our Terms of Service that would interfere with security research</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Public Disclosure</h2>
          <p>
            We believe in transparency and will publicly disclose security issues after they are resolved:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>We will coordinate disclosure timing with you</li>
            <li>Typical disclosure is 90 days after the fix is deployed</li>
            <li>We may request additional time for complex issues</li>
            <li>We will credit you in the disclosure (with your permission)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <address className="not-italic">
            <strong>Security Team</strong><br />
            Cook Smart<br />
            Email: <a href="mailto:services.cooksmart@gmail.com" className="text-blue-600 hover:underline">services.cooksmart@gmail.com</a><br />
            PGP Key: <a href="/security-pgp-key.txt" className="text-blue-600 hover:underline">Download</a> (optional)<br />
            Security.txt: <a href="/.well-known/security.txt" className="text-blue-600 hover:underline">View</a>
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
              <a href="/legal/data-request" className="text-blue-600 hover:underline">Data Request Form</a>
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">Thank You</h2>
        <p className="mb-4">
          We appreciate the security research community's efforts in helping us keep Cook Smart secure. Your responsible disclosure helps protect our users.
        </p>
        <a
          href="mailto:services.cooksmart@gmail.com"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Report a Vulnerability
        </a>
      </div>
    </main>
  );
}
