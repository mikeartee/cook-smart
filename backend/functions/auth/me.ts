/**
 * Get Current User Lambda Function
 * GET /auth/me
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { extractToken, verifyToken } from '../shared/utils/jwtUtils';
import * as UserModel from '../shared/models/User';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract token from Authorization header
    const token = extractToken(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'No token provided',
        }),
      };
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'User not found',
        }),
      };
    }

    // Return user data (exclude password hash)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isCoFounder: user.is_co_founder,
          subscriptionStatus: user.subscription_status,
          subscriptionExpiresAt: user.subscription_expires_at,
          createdAt: user.created_at,
        },
      }),
    };
  } catch (error) {
    console.error('Get current user error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Authentication failed';

    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: errorMessage,
      }),
    };
  }
};
