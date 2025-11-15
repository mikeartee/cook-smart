/**
 * Lambda Function: Get All Ingredients
 * Returns paginated list of ingredients with optional category filter
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/db';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { category, search, limit = '50', offset = '0' } = event.queryStringParameters || {};

    let sql = 'SELECT id, name, category, is_common FROM ingredients WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR id IN (SELECT ingredient_id FROM ingredient_synonyms WHERE synonym ILIKE $${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY is_common DESC, name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ingredients: result.rows,
        total: result.rowCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
      }),
    };
  } catch (error: any) {
    console.error('Get ingredients error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to fetch ingredients',
      }),
    };
  }
};
