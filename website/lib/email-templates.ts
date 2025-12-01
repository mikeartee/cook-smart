/**
 * Email Templates with Full Compliance
 * CAN-SPAM, CASL, and GDPR compliant email templates
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const COMPANY_INFO = {
  name: 'Cook Smart',
  address: '123 Recipe Lane',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  country: 'United States',
  email: 'services.cooksmart@gmail.com',
  supportEmail: 'services.cooksmart@gmail.com',
  unsubscribeEmail: 'services.cooksmart@gmail.com',
  website: 'https://cooksmartapp.com',
};

const getFooter = (unsubscribeToken: string): string => {
  return `
    <div style="margin-top: 40px; padding: 20px; background: #f5f5f5; font-size: 12px; color: #666; font-family: Arial, sans-serif;">
      <p style="margin: 0 0 10px 0;"><strong>${COMPANY_INFO.name}</strong></p>
      <p style="margin: 0 0 5px 0;">${COMPANY_INFO.address}</p>
      <p style="margin: 0 0 15px 0;">${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zip}</p>
      
      <p style="margin: 15px 0 10px 0;">
        You're receiving this email because you signed up for ${COMPANY_INFO.name} updates.
      </p>
      
      <p style="margin: 10px 0;">
        <a href="${COMPANY_INFO.website}/unsubscribe?token=${unsubscribeToken}" style="color: #0066cc; text-decoration: none;">Unsubscribe</a> | 
        <a href="${COMPANY_INFO.website}/email-preferences?token=${unsubscribeToken}" style="color: #0066cc; text-decoration: none;">Email Preferences</a> | 
        <a href="${COMPANY_INFO.website}/legal/privacy" style="color: #0066cc; text-decoration: none;">Privacy Policy</a>
      </p>
      
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999;">
        © ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.
      </p>
    </div>
  `;
};

const getTextFooter = (unsubscribeToken: string): string => {
  return `
---
${COMPANY_INFO.name}
${COMPANY_INFO.address}
${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zip}

You're receiving this email because you signed up for ${COMPANY_INFO.name} updates.

Unsubscribe: ${COMPANY_INFO.website}/unsubscribe?token=${unsubscribeToken}
Email Preferences: ${COMPANY_INFO.website}/email-preferences?token=${unsubscribeToken}
Privacy Policy: ${COMPANY_INFO.website}/legal/privacy

© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.
  `;
};

export const emailTemplates = {
  welcome: (userName: string, unsubscribeToken: string): EmailTemplate => ({
    subject: 'Welcome to Cook Smart! 🍳',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Cook Smart!</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${userName},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thanks for joining Cook Smart! We're excited to help you discover amazing recipes, 
            plan your meals, and make cooking easier.
          </p>
          
          <h2 style="color: #4F46E5; font-size: 20px; margin-top: 30px;">Get Started</h2>
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>Browse thousands of recipes</li>
            <li>Save your favorites</li>
            <li>Create meal plans</li>
            <li>Generate shopping lists</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${COMPANY_INFO.website}/recipes" 
               style="display: inline-block; padding: 15px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Explore Recipes
            </a>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Need help? Reply to this email or contact us at 
            <a href="mailto:${COMPANY_INFO.supportEmail}" style="color: #4F46E5;">${COMPANY_INFO.supportEmail}</a>
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Happy cooking!<br>
            The Cook Smart Team
          </p>
        </div>
        
        ${getFooter(unsubscribeToken)}
      </div>
    `,
    text: `
Welcome to Cook Smart!

Hi ${userName},

Thanks for joining Cook Smart! We're excited to help you discover amazing recipes, plan your meals, and make cooking easier.

Get Started:
- Browse thousands of recipes
- Save your favorites
- Create meal plans
- Generate shopping lists

Explore Recipes: ${COMPANY_INFO.website}/recipes

Need help? Reply to this email or contact us at ${COMPANY_INFO.supportEmail}

Happy cooking!
The Cook Smart Team

${getTextFooter(unsubscribeToken)}
    `,
  }),

  newsletter: (userName: string, recipes: Array<{ title: string; url: string; image: string }>, unsubscribeToken: string): EmailTemplate => ({
    subject: 'This Week\'s Top Recipes 🍽️',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">This Week's Top Recipes</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${userName},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Check out this week's most popular recipes from the Cook Smart community!
          </p>
          
          ${recipes.map(recipe => `
            <div style="margin: 30px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <img src="${recipe.image}" alt="${recipe.title}" style="width: 100%; height: 200px; object-fit: cover;">
              <div style="padding: 20px;">
                <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1f2937;">${recipe.title}</h2>
                <a href="${recipe.url}" 
                   style="display: inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                  View Recipe
                </a>
              </div>
            </div>
          `).join('')}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${COMPANY_INFO.website}/recipes" 
               style="display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Browse All Recipes
            </a>
          </div>
        </div>
        
        ${getFooter(unsubscribeToken)}
      </div>
    `,
    text: `
This Week's Top Recipes

Hi ${userName},

Check out this week's most popular recipes from the Cook Smart community!

${recipes.map(recipe => `
${recipe.title}
${recipe.url}
`).join('\n')}

Browse All Recipes: ${COMPANY_INFO.website}/recipes

${getTextFooter(unsubscribeToken)}
    `,
  }),

  passwordReset: (userName: string, resetUrl: string): EmailTemplate => ({
    subject: 'Reset Your Cook Smart Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${userName},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            We received a request to reset your Cook Smart password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 15px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #666;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email or contact us at 
            <a href="mailto:${COMPANY_INFO.supportEmail}" style="color: #4F46E5;">${COMPANY_INFO.supportEmail}</a>
          </p>
          
          <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            For security, this is a transactional email and cannot be unsubscribed from.
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background: #f5f5f5; font-size: 12px; color: #666; text-align: center;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
Password Reset Request

Hi ${userName},

We received a request to reset your Cook Smart password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email or contact us at ${COMPANY_INFO.supportEmail}

For security, this is a transactional email and cannot be unsubscribed from.

© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.
    `,
  }),

  dataRequest: (userName: string, requestType: string, requestId: string): EmailTemplate => ({
    subject: `Your Data ${requestType} Request - Confirmation`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Data Request Received</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${userName},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            We've received your request to <strong>${requestType}</strong> your personal data.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Request ID</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #1f2937;">${requestId}</p>
          </div>
          
          <h2 style="color: #4F46E5; font-size: 20px; margin-top: 30px;">What Happens Next?</h2>
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>We'll verify your identity</li>
            <li>Process your request within 30 days</li>
            <li>Send you a confirmation email</li>
            <li>Provide the requested data or confirmation of action</li>
          </ul>
          
          <p style="font-size: 16px; line-height: 1.6;">
            If you have questions, reply to this email or contact us at 
            <a href="mailto:services.cooksmart@gmail.com" style="color: #4F46E5;">services.cooksmart@gmail.com</a>
          </p>
          
          <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            This is a transactional email regarding your data rights and cannot be unsubscribed from.
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background: #f5f5f5; font-size: 12px; color: #666; text-align: center;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
Data Request Received

Hi ${userName},

We've received your request to ${requestType} your personal data.

Request ID: ${requestId}

What Happens Next?
- We'll verify your identity
- Process your request within 30 days
- Send you a confirmation email
- Provide the requested data or confirmation of action

If you have questions, reply to this email or contact us at services.cooksmart@gmail.com

This is a transactional email regarding your data rights and cannot be unsubscribed from.

© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.
    `,
  }),
};

export const getEmailHeaders = (unsubscribeToken: string) => {
  return {
    'List-Unsubscribe': `<mailto:${COMPANY_INFO.unsubscribeEmail}>, <${COMPANY_INFO.website}/unsubscribe?token=${unsubscribeToken}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
};
