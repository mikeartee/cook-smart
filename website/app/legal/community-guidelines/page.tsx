import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines | Cook Smart',
  description: 'Community guidelines and content standards for Cook Smart users',
};

export default function CommunityGuidelinesPage(): React.ReactElement {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Community Guidelines</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 30, 2025<br />
          <strong>Effective Date:</strong> November 30, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Our Community Values</h2>
          <p>
            Cook Smart is a community of food lovers, home cooks, and culinary enthusiasts. We believe in creating a welcoming, respectful, and helpful environment for everyone.
          </p>
          <p>
            These guidelines help ensure our community remains a positive space where people can share recipes, cooking tips, and culinary experiences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Acceptable Use</h2>
          
          <h3 className="text-xl font-semibold mb-2">2.1 What We Encourage</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Share Original Recipes:</strong> Post your own recipes and cooking creations</li>
            <li><strong>Be Helpful:</strong> Provide constructive feedback and cooking tips</li>
            <li><strong>Give Credit:</strong> Attribute recipes and ideas to their original sources</li>
            <li><strong>Be Respectful:</strong> Treat all community members with kindness</li>
            <li><strong>Stay On Topic:</strong> Keep discussions related to food and cooking</li>
            <li><strong>Report Issues:</strong> Help us maintain quality by reporting violations</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.2 What We Don't Allow</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Harassment:</strong> Bullying, threats, or personal attacks</li>
            <li><strong>Hate Speech:</strong> Content that promotes hatred or discrimination</li>
            <li><strong>Spam:</strong> Excessive self-promotion or irrelevant content</li>
            <li><strong>Misinformation:</strong> Deliberately false or misleading information</li>
            <li><strong>Copyright Infringement:</strong> Posting content you don't have rights to</li>
            <li><strong>Inappropriate Content:</strong> Explicit, violent, or offensive material</li>
            <li><strong>Impersonation:</strong> Pretending to be someone else</li>
            <li><strong>Illegal Activity:</strong> Content promoting illegal activities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Content Standards</h2>
          
          <h3 className="text-xl font-semibold mb-2">3.1 Recipe Submissions</h3>
          <p>When sharing recipes, please ensure:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Recipes are clear, complete, and tested</li>
            <li>Ingredients and measurements are accurate</li>
            <li>Cooking times and temperatures are specified</li>
            <li>Allergen information is included when relevant</li>
            <li>Photos are your own or properly licensed</li>
            <li>Credit is given to original sources if adapted</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">3.2 Comments and Reviews</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Be honest but constructive in your feedback</li>
            <li>Focus on the recipe, not the person</li>
            <li>Share your experience and modifications</li>
            <li>Avoid spoilers or off-topic discussions</li>
            <li>Don't post duplicate or repetitive comments</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">3.3 Photos and Media</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Only upload photos you own or have permission to use</li>
            <li>Ensure photos are relevant to the recipe or discussion</li>
            <li>Keep images appropriate and food-related</li>
            <li>Respect copyright and intellectual property</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Health and Safety</h2>
          
          <h3 className="text-xl font-semibold mb-2">4.1 Food Safety</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Always include proper cooking temperatures for meat and poultry</li>
            <li>Warn about potential food safety risks</li>
            <li>Don't promote unsafe food handling practices</li>
            <li>Include storage and reheating instructions when relevant</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">4.2 Allergens and Dietary Restrictions</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Clearly label common allergens (nuts, dairy, gluten, etc.)</li>
            <li>Be accurate about dietary claims (vegan, gluten-free, etc.)</li>
            <li>Don't provide medical or nutritional advice</li>
            <li>Respect others' dietary choices and restrictions</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">4.3 Medical Disclaimer</h3>
          <p>
            <strong>Important:</strong> Cook Smart is not a source of medical or nutritional advice. Always consult healthcare professionals for dietary guidance, especially regarding allergies, medical conditions, or special diets.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
          
          <h3 className="text-xl font-semibold mb-2">5.1 Your Content</h3>
          <p>
            When you post content on Cook Smart:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>You retain ownership of your content</li>
            <li>You grant us a license to display and distribute it</li>
            <li>You confirm you have the right to share it</li>
            <li>You're responsible for any copyright violations</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">5.2 Others' Content</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Don't copy recipes word-for-word from other sources</li>
            <li>Always credit the original creator</li>
            <li>Link to original sources when possible</li>
            <li>Respect copyright and trademark rights</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">5.3 Copyright Infringement</h3>
          <p>
            If you believe content on Cook Smart infringes your copyright, please see our <a href="/legal/copyright" className="text-blue-600 hover:underline">DMCA Policy</a> for reporting procedures.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Moderation</h2>
          
          <h3 className="text-xl font-semibold mb-2">6.1 Our Approach</h3>
          <p>
            We moderate content to maintain community standards:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Automated filters for spam and inappropriate content</li>
            <li>User reports reviewed by our moderation team</li>
            <li>Context-based decisions on borderline cases</li>
            <li>Transparent communication about moderation actions</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">6.2 Enforcement Actions</h3>
          <p>
            Violations may result in:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Warning:</strong> First-time or minor violations</li>
            <li><strong>Content Removal:</strong> Deletion of violating content</li>
            <li><strong>Temporary Suspension:</strong> Limited access for repeated violations</li>
            <li><strong>Permanent Ban:</strong> Severe or repeated violations</li>
            <li><strong>Legal Action:</strong> For illegal activity or serious harm</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">6.3 Appeals</h3>
          <p>
            If you believe a moderation decision was made in error:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Contact us at <a href="mailto:support@cooksmartapp.com" className="text-blue-600 hover:underline">support@cooksmartapp.com</a></li>
            <li>Provide details about the content and decision</li>
            <li>We'll review and respond within 7 business days</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Reporting Violations</h2>
          
          <h3 className="text-xl font-semibold mb-2">7.1 How to Report</h3>
          <p>
            If you see content that violates these guidelines:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Use the "Report" button on the content</li>
            <li>Email <a href="mailto:report@cooksmartapp.com" className="text-blue-600 hover:underline">report@cooksmartapp.com</a></li>
            <li>Provide specific details about the violation</li>
            <li>Include links or screenshots if possible</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">7.2 What Happens Next</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>We review all reports within 24-48 hours</li>
            <li>Action is taken based on severity and context</li>
            <li>Reporters are notified of the outcome (when appropriate)</li>
            <li>False reports may result in consequences</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Privacy and Safety</h2>
          
          <h3 className="text-xl font-semibold mb-2">8.1 Personal Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Don't share your personal contact information publicly</li>
            <li>Don't request others' personal information</li>
            <li>Report any attempts to collect personal data</li>
            <li>See our <a href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> for data protection</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">8.2 Account Security</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Keep your password secure</li>
            <li>Don't share your account credentials</li>
            <li>Report suspicious activity immediately</li>
            <li>Enable two-factor authentication when available</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to Guidelines</h2>
          <p>
            We may update these Community Guidelines from time to time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of Cook Smart after changes constitutes acceptance of the updated guidelines.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p>
            Questions about these Community Guidelines?
          </p>
          <address className="not-italic">
            <strong>Community Team</strong><br />
            Cook Smart<br />
            Email: <a href="mailto:community@cooksmartapp.com" className="text-blue-600 hover:underline">community@cooksmartapp.com</a><br />
            Support: <a href="mailto:support@cooksmartapp.com" className="text-blue-600 hover:underline">support@cooksmartapp.com</a><br />
            Contact Form: <a href="/contact" className="text-blue-600 hover:underline">Submit Inquiry</a>
          </address>
        </section>
      </div>

      <div className="mt-12 p-6 bg-green-50 rounded-lg border border-green-200">
        <h2 className="text-xl font-semibold mb-4">Thank You for Being Part of Our Community</h2>
        <p className="mb-4">
          By following these guidelines, you help make Cook Smart a welcoming and helpful place for everyone. Happy cooking!
        </p>
        <div className="flex gap-4">
          <a
            href="/contact"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Contact Support
          </a>
          <a
            href="/legal/terms"
            className="inline-block px-6 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            View Terms of Service
          </a>
        </div>
      </div>
    </main>
  );
}
