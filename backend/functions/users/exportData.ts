/**
 * Export User Data Lambda Function (GDPR)
 * GET /users/export
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

    // Export all user data
    const userData = await UserService.exportUserData(decoded.userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ userData }),
    };
  } catch (error) {
    console.error('Export data error:', error);

    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to export data',
      }),
    };
  }
};
