import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { token, reason } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    // Verify token
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [email, timestamp] = decoded.split(':');
      
      // Token should be valid for 30 days
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      if (tokenAge > maxAge) {
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 400 }
        );
      }

      // In production, this would:
      // 1. Update user preferences in database
      // 2. Add email to suppression list
      // 3. Log unsubscribe event
      // 4. Send confirmation email

      console.log('Unsubscribe request:', {
        email,
        reason: reason || 'Not specified',
        timestamp: new Date().toISOString(),
      });

      // Update database (in production)
      // await db.emailPreferences.update({
      //   where: { email },
      //   data: {
      //     marketing: false,
      //     newsletter: false,
      //     recipes: false,
      //     tips: false,
      //     promotions: false,
      //     unsubscribedAt: new Date(),
      //     unsubscribeReason: reason
      //   }
      // });

      return NextResponse.json({
        success: true,
        message: 'You have been unsubscribed from all marketing emails.',
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
