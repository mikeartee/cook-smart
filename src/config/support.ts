/**
 * Customer Support Configuration
 */

export const SUPPORT_CONFIG = {
  email: 'services.cooksmart@gmail.com',
  responseTime: '24 hours',
  businessHours: 'Monday-Friday, 9 AM - 5 PM Central Time',

  // Support topics
  topics: {
    billing: 'Billing & Payments',
    subscription: 'Subscription Management',
    refund: 'Refund Requests',
    technical: 'Technical Issues',
    account: 'Account Issues',
    other: 'Other',
  },

  // Email templates
  getEmailSubject: (topic: string) => `Cook Smart Support: ${topic}`,

  getEmailBody: (userEmail: string, topic: string, message: string) =>
    `
Support Request from Cook Smart App

User Email: ${userEmail}
Topic: ${topic}
Message:
${message}

---
Sent from Cook Smart Mobile App
  `.trim(),
};

export default SUPPORT_CONFIG;
