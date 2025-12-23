import express, {Request, Response} from 'express';
import {Resend} from 'resend';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.EMAIL_FROM || 'Cook Smart <noreply@cooksmartapp.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'services.cooksmart@gmail.com';

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {name, email, subject, message}: ContactRequest = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide name, email, subject, and message',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address',
      });
      return;
    }

    // Message length validation
    if (message.trim().length < 10) {
      res.status(400).json({
        error: 'Message too short',
        message: 'Please provide a message with at least 10 characters',
      });
      return;
    }

    // Send email to admin
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    });

    // Send confirmation email to user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'We received your message - Cook Smart',
      html: `
        <h2>Thank you for contacting Cook Smart!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <hr />
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
        <hr />
        <p>Best regards,<br />The Cook Smart Team</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message:
        'An error occurred while sending your message. Please try again or email us directly.',
    });
  }
});

export default router;
