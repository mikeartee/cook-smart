import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility Statement | Cook Smart',
  description: 'Accessibility commitment and WCAG 2.1 AA compliance information for Cook Smart',
};

export default function AccessibilityStatementPage(): React.ReactElement {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Accessibility Statement</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 30, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
          <p>
            Cook Smart is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Conformance Status</h2>
          <p>
            The <a href="https://www.w3.org/WAI/WCAG21/quickref/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Web Content Accessibility Guidelines (WCAG)</a> defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.
          </p>
          <p className="mt-4">
            <strong>Cook Smart is designed to be conformant with WCAG 2.1 Level AA.</strong>
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Conformant:</strong> The content fully conforms to the accessibility standard without any exceptions</li>
            <li><strong>Partially Conformant:</strong> Some parts of the content do not fully conform to the accessibility standard</li>
            <li><strong>Not Conformant:</strong> The content does not conform to the accessibility standard</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Accessibility Features</h2>
          
          <h3 className="text-xl font-semibold mb-2">Keyboard Navigation</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>All interactive elements are keyboard accessible</li>
            <li>Logical tab order throughout the site</li>
            <li>Visible focus indicators on all focusable elements</li>
            <li>Skip navigation links to bypass repetitive content</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Screen Reader Support</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Semantic HTML5 elements for proper structure</li>
            <li>ARIA labels and landmarks for navigation</li>
            <li>Alternative text for all images</li>
            <li>Descriptive link text</li>
            <li>Form labels and error messages</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Visual Design</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Minimum color contrast ratio of 4.5:1 for normal text</li>
            <li>Minimum color contrast ratio of 3:1 for large text</li>
            <li>Text resizable up to 200% without loss of functionality</li>
            <li>No information conveyed by color alone</li>
            <li>Responsive design for various screen sizes</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Content</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Clear and simple language</li>
            <li>Consistent navigation and layout</li>
            <li>Descriptive page titles and headings</li>
            <li>Captions and transcripts for multimedia content</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Forms and Interactions</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Clear form labels and instructions</li>
            <li>Error identification and suggestions</li>
            <li>Sufficient time to complete tasks</li>
            <li>Ability to pause, stop, or hide moving content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Assistive Technologies</h2>
          <p>
            Cook Smart is designed to be compatible with the following assistive technologies:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Screen Readers:</strong> JAWS, NVDA, VoiceOver, TalkBack</li>
            <li><strong>Screen Magnification:</strong> ZoomText, MAGic</li>
            <li><strong>Speech Recognition:</strong> Dragon NaturallySpeaking</li>
            <li><strong>Keyboard Navigation:</strong> Standard keyboard and alternative input devices</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Browser Compatibility</h2>
          <p>
            Cook Smart is designed to work with the following browsers and their latest versions:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Google Chrome</li>
            <li>Mozilla Firefox</li>
            <li>Apple Safari</li>
            <li>Microsoft Edge</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Known Limitations</h2>
          <p>
            Despite our best efforts, some limitations may exist:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Third-Party Content:</strong> Some recipe images from external sources may lack alternative text</li>
            <li><strong>User-Generated Content:</strong> Content submitted by users may not meet accessibility standards</li>
            <li><strong>Legacy Content:</strong> Older content is being updated to meet current standards</li>
          </ul>
          <p>
            We are actively working to address these limitations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ongoing Efforts</h2>
          <p>
            We are committed to continuous improvement:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Regular accessibility audits and testing</li>
            <li>User testing with people with disabilities</li>
            <li>Staff training on accessibility best practices</li>
            <li>Monitoring and addressing user feedback</li>
            <li>Staying current with accessibility standards and guidelines</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Feedback and Contact</h2>
          <p>
            We welcome your feedback on the accessibility of Cook Smart. Please let us know if you encounter accessibility barriers:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Email:</strong> <a href="mailto:accessibility@cooksmartapp.com" className="text-blue-600 hover:underline">accessibility@cooksmartapp.com</a></li>
            <li><strong>Contact Form:</strong> <a href="/contact" className="text-blue-600 hover:underline">Submit Accessibility Feedback</a></li>
            <li><strong>Phone:</strong> Available upon request</li>
          </ul>
          <p className="mt-4">
            We aim to respond to accessibility feedback within 5 business days and to propose a solution within 10 business days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Technical Specifications</h2>
          <p>
            Accessibility of Cook Smart relies on the following technologies:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>HTML5</li>
            <li>WAI-ARIA</li>
            <li>CSS3</li>
            <li>JavaScript</li>
          </ul>
          <p>
            These technologies are relied upon for conformance with the accessibility standards used.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Assessment Approach</h2>
          <p>
            Cook Smart assessed the accessibility of this website by the following approaches:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Self-evaluation:</strong> Internal accessibility review</li>
            <li><strong>Automated Testing:</strong> Using tools like axe, WAVE, and Lighthouse</li>
            <li><strong>Manual Testing:</strong> Keyboard navigation and screen reader testing</li>
            <li><strong>User Testing:</strong> Feedback from users with disabilities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Legal Compliance</h2>
          <p>
            Cook Smart strives to comply with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>ADA:</strong> Americans with Disabilities Act</li>
            <li><strong>Section 508:</strong> Rehabilitation Act of 1973</li>
            <li><strong>WCAG 2.1 Level AA:</strong> Web Content Accessibility Guidelines</li>
            <li><strong>EN 301 549:</strong> European accessibility standard</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Formal Complaints</h2>
          <p>
            If you are not satisfied with our response to your accessibility concern, you may:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>File a complaint with the U.S. Department of Justice</li>
            <li>Contact your local disability rights organization</li>
            <li>Seek legal counsel regarding your rights under the ADA</li>
          </ul>
        </section>
      </div>

      <div className="mt-12 p-6 bg-green-50 rounded-lg border border-green-200">
        <h2 className="text-xl font-semibold mb-4">Accessibility Resources</h2>
        <p className="mb-4">
          Learn more about web accessibility:
        </p>
        <ul className="space-y-2">
          <li>
            <a href="https://www.w3.org/WAI/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              W3C Web Accessibility Initiative (WAI)
            </a>
          </li>
          <li>
            <a href="https://www.ada.gov/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              ADA.gov - Americans with Disabilities Act
            </a>
          </li>
          <li>
            <a href="https://www.section508.gov/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Section508.gov
            </a>
          </li>
        </ul>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">Report an Accessibility Issue</h2>
        <p className="mb-4">
          Found an accessibility barrier? We want to hear from you.
        </p>
        <a
          href="/contact?subject=Accessibility"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Report Issue
        </a>
      </div>
    </main>
  );
}

