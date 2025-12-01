import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const {
      requestType,
      email,
      fullName,
      details,
      isAuthorizedAgent,
      agentName,
      agentEmail,
      agentRelationship,
    } = body;

    // Validate required fields
    if (!requestType || !email || !fullName) {
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

    // Generate request ID
    const requestId = `DR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // In production, this would:
    // 1. Store the request in database
    // 2. Send confirmation email to user
    // 3. Notify privacy team
    // 4. Create ticket in support system

    // For now, log the request
    console.log('Data Request Received:', {
      requestId,
      requestType,
      email,
      fullName,
      isAuthorizedAgent,
      timestamp: new Date().toISOString(),
    });

    // Send confirmation email (in production)
    // await sendEmail({
    //   to: email,
    //   subject: `Data Request Confirmation - ${requestId}`,
    //   template: 'dataRequest',
    //   data: { fullName, requestType, requestId }
    // });

    // Notify privacy team (in production)
    // await sendEmail({
    //   to: 'privacy@cooksmartapp.com',
    //   subject: `New Data Request: ${requestType}`,
    //   template: 'dataRequestNotification',
    //   data: { requestId, email, fullName, requestType, details }
    // });

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Your request has been received. We will respond within 30 days.',
    });
  } catch (error) {
    console.error('Data request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
