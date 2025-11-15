/**
 * Lambda Function: Save Recipe
 * Saves a recipe to user's collection
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/db';
import { extractToken, verifyToken } from '../shared/utils/jwtUtils';

interface SaveRecipeBody {
  recipeId: string;
  title: string;
  image?: string;
  sourceUrl?: string;
  servings?: number;
  readyInMinutes?: number;
  ingredients?: any[];
  instructions?: string;
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

    const body: SaveRecipeBody = JSON.parse(event.body);

    if (!body.recipeId || !body.title) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Recipe ID and title are required' }),
      };
    }

    // Check if recipe already saved
    const existing = await query(
      'SELECT id FROM user_recipes WHERE user_id = $1 AND recipe_id = $2',
      [userId, body.recipeId]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Recipe already saved' }),
      };
    }

    const result = await query(
      `INSERT INTO user_recipes 
        (user_id, recipe_id, title, image, source_url, servings, ready_in_minutes, ingredients, instructions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        userId,
        body.recipeId,
        body.title,
        body.image || null,
        body.sourceUrl || null,
        body.servings || null,
        body.readyInMinutes || null,
        JSON.stringify(body.ingredients || []),
        body.instructions || null,
      ]
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Recipe saved successfully',
        recipe: result.rows[0],
      }),
    };
  } catch (error: any) {
    console.error('Save recipe error:', error);

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
        error: 'Failed to save recipe',
      }),
    };
  }
};
