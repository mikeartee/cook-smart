import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW() as timestamp');
    
    res.status(200).json({
      status: 'OK',
      message: 'Cook Smart API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        timestamp: dbResult.rows[0].timestamp
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      database: {
        connected: false,
        error: 'Database connection failed'
      }
    });
  }
});

export default router;