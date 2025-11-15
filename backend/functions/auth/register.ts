/**
 * Registration Lambda Function
 * POST /auth/register
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AuthService from '../shared/services/AuthService';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { email, password, firstName, lastName } = body;

    // Validate required fields
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Email and password are required',
        }),
      };
    }

    // Register user
    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Registration error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Registration failed';

    return {
      statusCode: 400,
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
