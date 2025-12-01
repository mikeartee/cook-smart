import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, preferences } = body;

    if (!email || !preferences) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate preferences structure
    const validKeys = ['newsletter', 'recipes', 'tips', 'promotions', 'updates'];
    const hasValidKeys = Object.keys(preferences).every(key => validKeys.includes(key));
    
    if (!hasValidKeys) {
      return NextResponse.json(
        { error: 'Invalid preferences' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Update user preferences in database
    // 2. Log preference change
    // 3. Send confirmation email

    console.log('Email preferences updated:', {
      email,
      preferences,
      timestamp: new Date().toISOString(),
    });

    // Update database (in production)
    // await db.emailPreferences.upsert({
    //   where: { email },
    //   update: {
    //     ...preferences,
    //     updatedAt: new Date()
    //   },
    //   create: {
    //     email,
    //     ...preferences,
    //     createdAt: new Date()
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Your email preferences have been updated.',
    });
  } catch (error) {
    console.error('Email preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email parameter' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    // const preferences = await db.emailPreferences.findUnique({
    //   where: { email }
    // });

    // Return default preferences for now
    const preferences = {
      newsletter: true,
      recipes: true,
      tips: true,
      promotions: false,
      updates: true,
    };

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Get email preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
