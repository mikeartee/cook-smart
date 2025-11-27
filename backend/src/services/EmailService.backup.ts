import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // For development, use console logging
    // For production, configure AWS SES or other email service
    if (process.env.NODE_ENV === 'production' && process.env.AWS_SES_REGION) {
      // AWS SES configuration
      this.transporter = nodemailer.createTransport({
        host: `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: process.env.AWS_SES_ACCESS_KEY,
          pass: process.env.AWS_SES_SECRET_KEY,
        },
      });
    } else {
      // Development: Log to console
      console.log(
        '📧 Email Service: Running in development mode (emails logged to console)',
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'services.cooksmart@gmail.com',
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
            .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
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

    if (this.transporter) {
      // Send actual email
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Password reset email sent to: ${email}`);
    } else {
      // Development: Log to console
      console.log('\n📧 ========== PASSWORD RESET EMAIL ==========');
      console.log(`To: ${email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Reset Code: ${resetToken}`);
      console.log(`Expires: 1 hour`);
      console.log('============================================\n');
    }
  }
}

export default new EmailService();
