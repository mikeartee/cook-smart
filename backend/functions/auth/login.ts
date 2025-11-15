/**
 * Login Lambda Function
 * POST /auth/login
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AuthService from '../shared/services/AuthService';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

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

    // Login user
    const result = await AuthService.login({
      email,
      password,
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
    console.error('Login error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Login failed';

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
