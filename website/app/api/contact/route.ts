import { NextRequest, NextResponse } from 'next/server';
import { sendContactAutoReply, sendContactNotification } from '@/lib/email';
import {
  sendBetaRequestNotification,
  sendContactNotification as sendDiscordContactNotification,
} from '@/lib/discord';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send auto-reply to user
    const autoReplyResult = await sendContactAutoReply(email, name);

    // Send notification to admin
    const notificationResult = await sendContactNotification(name, email, message);

    // Send Discord notifications (don't block on failure)
    Promise.all([
      sendBetaRequestNotification(name, email, subject, message),
      sendDiscordContactNotification(name, email, subject, message),
    ]).catch((error) => {
      console.error('Discord notification failed:', error);
      // Don't fail the request if Discord fails
    });

    if (autoReplyResult.success && notificationResult.success) {
      // TODO: Log contact request in database for admin dashboard
      return NextResponse.json({
        success: true,
        message: "Message sent successfully! We'll get back to you soon.",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send message. Please try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
