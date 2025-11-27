import {Resend} from 'resend';

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    this.initializeResend();
  }

  private initializeResend() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log('📧 Email Service: Resend initialized');
    } else {
      console.log(
        '📧 Email Service: Running in development mode (emails logged to console)',
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const emailContent = {
      from: 'Cook Smart <noreply@cooksmartapp.com>',
      to: email,
      subject: 'Reset Your Cook Smart Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .token { background: #e5e7eb; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍳 Cook Smart</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Use the verification code below in the app:</p>
              
              <div class="token">
                <strong>${resetToken}</strong>
              </div>
              
              <p><strong>This code will expire in 1 hour.</strong></p>
              
              <p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
              
              <div class="footer">
                <p>Cook Smart - Making cooking easier, one recipe at a time</p>
                <p>This is an automated email, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Cook Smart - Reset Your Password
        
        We received a request to reset your password.
        
        Your verification code: ${resetToken}
        
        This code will expire in 1 hour.
        
        If you didn't request this password reset, you can safely ignore this email.
        
        - Cook Smart Team
      `,
    };

    if (this.resend) {
      try {
        const result = await this.resend.emails.send(emailContent);
        console.log(`📧 Password reset email sent to: ${email}`, result);
      } catch (error) {
        console.error('❌ Failed to send email via Resend:', error);
        throw error;
      }
    } else {
      console.log('\n📧 ========== PASSWORD RESET EMAIL ==========');
      console.log(`To: ${email}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Reset Code: ${resetToken}`);
      console.log(`Expires: 1 hour`);
      console.log('============================================\n');
    }
  }
}

export default new EmailService();
