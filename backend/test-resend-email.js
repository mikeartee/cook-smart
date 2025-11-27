const {Resend} = require('resend');
require('dotenv').config();

async function testResendEmail() {
  console.log('🧪 Testing Resend Email Service...\n');

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    console.log('Please add RESEND_API_KEY to your .env file');
    process.exit(1);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log('📧 Sending test email...');

    const result = await resend.emails.send({
      from: 'Cook Smart <onboarding@resend.dev>',
      to: 'tootallgames2020@gmail.com',
      subject: 'Test Email from Cook Smart',
      html: `
        <h1>🍳 Cook Smart Email Test</h1>
        <p>This is a test email from your Cook Smart backend.</p>
        <p>If you're seeing this, Resend is working correctly!</p>
        <p><strong>Test Code: 123456</strong></p>
      `,
      text: 'Cook Smart Email Test - If you are seeing this, Resend is working!',
    });

    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
    console.log('\n✅ Resend is configured correctly!');
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    process.exit(1);
  }
}

testResendEmail();
