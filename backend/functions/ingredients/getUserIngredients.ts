/**
 * Lambda Function: Get User Ingredients
 * Returns user's ingredient inventory
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

    // Get user's ingredients with details
    const result = await query(
      `SELECT 
        ui.id,
        ui.ingredient_id,
        i.name as ingredient_name,
        i.category,
        ui.quantity,
        ui.unit,
        ui.expiration_date,
        ui.added_at
      FROM user_ingredients ui
      JOIN ingredients i ON ui.ingredient_id = i.id
      WHERE ui.user_id = $1
      ORDER BY ui.added_at DESC`,
      [userId]
    );

    // Get user's custom ingredients
    const customResult = await query(
      `SELECT 
        id,
        name,
        category,
        quantity,
        unit,
        expiration_date,
        added_at
      FROM custom_ingredients
      WHERE user_id = $1
      ORDER BY added_at DESC`,
      [userId]
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ingredients: result.rows,
        customIngredients: customResult.rows,
        total: (result.rowCount || 0) + (customResult.rowCount || 0),
      }),
    };
  } catch (error: any) {
    console.error('Get user ingredients error:', error);
    
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
        error: 'Failed to fetch user ingredients',
      }),
    };
  }
};
