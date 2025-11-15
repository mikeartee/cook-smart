/**
 * Lambda Function: Get User Recipes
 * Returns user's saved recipes
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/db';
import { extractToken, verifyToken } from '../shared/utils/jwtUtils';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const token = extractToken(event.headers);
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
    const userId = decoded.userId;

    const result = await query(
      `SELECT * FROM user_recipes
       WHERE user_id = $1
       ORDER BY saved_at DESC`,
      [userId]
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        recipes: result.rows,
        count: result.rowCount || 0,
      }),
    };
  } catch (error: any) {
    console.error('Get user recipes error:', error);

    if (error.message === 'Invalid token' || error.message === 'Token expired') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to fetch user recipes',
      }),
    };
  }
};
