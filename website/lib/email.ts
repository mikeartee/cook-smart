import { RESEND_API_KEY, EMAIL_FROM } from './constants';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend API
 * This function should only be called from server-side code (API routes, server components)
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // Check if API key is configured
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return { success: false, error: 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send a newsletter confirmation email
 */
export async function sendNewsletterConfirmation(email: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: 'Welcome to Cook Smart Newsletter!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Cook Smart!</h1>
        <p>Thank you for subscribing to our newsletter.</p>
        <p>You'll receive updates about:</p>
        <ul>
          <li>New recipes and cooking tips</li>
          <li>App features and updates</li>
          <li>Exclusive content and offers</li>
        </ul>
        <p>Happy cooking!</p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't subscribe to this newsletter, you can safely ignore this email.
        </p>
      </div>
    `,
    text: 'Welcome to Cook Smart! Thank you for subscribing to our newsletter.',
  });
}

/**
 * Send a contact form auto-reply
 */
export async function sendContactAutoReply(email: string, name: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: 'We received your message - Cook Smart',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Thank you for contacting us!</h1>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <p>Our support team typically responds within 24-48 hours.</p>
        <p>Best regards,<br>The Cook Smart Team</p>
      </div>
    `,
    text: `Hi ${name}, we've received your message and will get back to you as soon as possible.`,
  });
}

/**
 * Send a contact form notification to admin
 */
export async function sendContactNotification(
  name: string,
  email: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: 'support@cooksmartapp.com',
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f3f4f6; padding: 15px; border-radius: 5px;">${message}</p>
      </div>
    `,
    text: `New contact form submission from ${name} (${email}): ${message}`,
  });
}

