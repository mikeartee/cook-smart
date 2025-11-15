/**
 * Lambda Function: Add Ingredient
 * Adds an ingredient to user's inventory
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/db';
import { extractToken, verifyToken } from '../shared/utils/jwtUtils';

interface AddIngredientBody {
  ingredientId?: number;
  customName?: string;
  category?: string;
  quantity: number;
  unit: string;
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

    const body: AddIngredientBody = JSON.parse(event.body);

    // Validate required fields
    if (!body.quantity || !body.unit) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Quantity and unit are required' }),
      };
    }

    // Check if it's a custom ingredient or standard ingredient
    if (body.customName) {
      // Add custom ingredient
      const result = await query(
        `INSERT INTO custom_ingredients 
          (user_id, name, category, quantity, unit, expiration_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          userId,
          body.customName,
          body.category || 'Other',
          body.quantity,
          body.unit,
          body.expirationDate || null,
        ]
      );

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Custom ingredient added successfully',
          ingredient: result.rows[0],
        }),
      };
    } else if (body.ingredientId) {
      // Add standard ingredient
      const result = await query(
        `INSERT INTO user_ingredients 
          (user_id, ingredient_id, quantity, unit, expiration_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          userId,
          body.ingredientId,
          body.quantity,
          body.unit,
          body.expirationDate || null,
        ]
      );

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Ingredient added successfully',
          ingredient: result.rows[0],
        }),
      };
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Either ingredientId or customName must be provided',
        }),
      };
    }
  } catch (error: any) {
    console.error('Add ingredient error:', error);

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
        error: 'Failed to add ingredient',
      }),
    };
  }
};
