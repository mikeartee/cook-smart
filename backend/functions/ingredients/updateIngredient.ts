/**
 * Lambda Function: Update Ingredient
 * Updates an ingredient in user's inventory
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/db';
import { extractToken, verifyToken } from '../shared/utils/jwtUtils';

interface UpdateIngredientBody {
  quantity?: number;
  unit?: string;
  expirationDate?: string;
}

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

    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body: UpdateIngredientBody = JSON.parse(event.body);

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (body.quantity !== undefined) {
      updates.push(`quantity = $${paramCount++}`);
      values.push(body.quantity);
    }

    if (body.unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(body.unit);
    }

    if (body.expirationDate !== undefined) {
      updates.push(`expiration_date = $${paramCount++}`);
      values.push(body.expirationDate);
    }

    if (updates.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No fields to update' }),
      };
    }

    // Add user_id and ingredient_id to values
    values.push(userId);
    values.push(ingredientId);

    const tableName = isCustom ? 'custom_ingredients' : 'user_ingredients';
    const idColumn = isCustom ? 'id' : 'id';

    const result = await query(
      `UPDATE ${tableName}
       SET ${updates.join(', ')}
       WHERE user_id = $${paramCount++} AND ${idColumn} = $${paramCount}
       RETURNING *`,
      values
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
        message: 'Ingredient updated successfully',
        ingredient: result.rows[0],
      }),
    };
  } catch (error: any) {
    console.error('Update ingredient error:', error);

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
        error: 'Failed to update ingredient',
      }),
    };
  }
};
