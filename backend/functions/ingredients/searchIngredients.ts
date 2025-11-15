/**
 * Lambda Function: Search Ingredients
 * Searches the ingredients database
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

    verifyToken(token);

    const searchQuery = event.queryStringParameters?.q || '';
    const category = event.queryStringParameters?.category;
    const limit = parseInt(event.queryStringParameters?.limit || '50');

    if (!searchQuery && !category) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Search query or category is required',
        }),
      };
    }

    let sqlQuery = 'SELECT * FROM ingredients WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (searchQuery) {
      sqlQuery += ` AND name ILIKE $${paramCount++}`;
      values.push(`%${searchQuery}%`);
    }

    if (category) {
      sqlQuery += ` AND category = $${paramCount++}`;
      values.push(category);
    }

    sqlQuery += ` ORDER BY name LIMIT $${paramCount}`;
    values.push(limit);

    const result = await query(sqlQuery, values);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ingredients: result.rows,
        count: result.rowCount || 0,
      }),
    };
  } catch (error: any) {
    console.error('Search ingredients error:', error);

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
        error: 'Failed to search ingredients',
      }),
    };
  }
};
