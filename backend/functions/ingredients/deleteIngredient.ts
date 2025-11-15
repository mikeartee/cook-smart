/**
 * Lambda Function: Delete Ingredient
 * Removes an ingredient from user's inventory
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/db';
import { extractToken, verifyToken } from '../shared/utils/jwtUtils';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
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
    const userId = decoded.userId;

    const ingredientId = event.pathParameters?.id;
    const isCustom = event.queryStringParameters?.custom === 'true';

    if (!ingredientId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Ingredient ID is required' }),
      };
    }

    const tableName = isCustom ? 'custom_ingredients' : 'user_ingredients';

    const result = await query(
      `DELETE FROM ${tableName}
       WHERE user_id = $1 AND id = $2
       RETURNING id`,
      [userId, ingredientId]
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Ingredient not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Ingredient deleted successfully',
      }),
    };
  } catch (error: any) {
    console.error('Delete ingredient error:', error);

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
        error: 'Failed to delete ingredient',
      }),
    };
  }
};
