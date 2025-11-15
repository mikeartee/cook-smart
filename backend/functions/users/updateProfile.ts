/**
 * Update Profile Lambda Function
 * PUT /users/profile
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { extractToken, verifyToken } from '../shared/utils/jwtUtils';
import * as UserService from '../shared/services/UserService';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract and verify token
    const token = extractToken(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No token provided' }),
      };
    }

    const decoded = verifyToken(token);

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { firstName, lastName } = body;

    // Update profile
    const updatedUser = await UserService.updateProfile(decoded.userId, {
      firstName,
      lastName,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ user: updatedUser }),
    };
  } catch (error) {
    console.error('Update profile error:', error);

    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to update profile',
      }),
    };
  }
};
