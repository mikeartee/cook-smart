import { NextRequest, NextResponse } from 'next/server';
import { sendNewsletterConfirmation } from '@/lib/email';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, preferences } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Invalid email address' }, { status: 400 });
    }

    // TODO: Store subscription in database
    // For now, just send confirmation email
    const result = await sendNewsletterConfirmation(email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed! Check your email for confirmation.',
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to send confirmation email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

