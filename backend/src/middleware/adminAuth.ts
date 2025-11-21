import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key';

interface AdminJWTPayload {
  id: number;
  email: string;
  username: string;
  is_super_admin: boolean;
}

// Extend Express Request to include admin
declare global {
  namespace Express {
    interface Request {
      admin?: AdminJWTPayload;
    }
  }
}

/**
 * Middleware to require admin authentication
 * Verifies JWT token and checks if user has is_admin flag
 * Simple approach - only checks users table
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({error: 'Authentication required'});
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (_error) {
      res.status(401).json({error: 'Invalid or expired token'});
      return;
    }

    // Get user/admin from database
    const pool = require('../config/database').default;
    const userId = decoded.userId || decoded.id;

    // Check users table first (for regular users with admin flags)
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, is_admin, is_co_founder, is_creator FROM users WHERE id = $1',
      [userId],
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      // Check if user has admin privileges
      if (user.is_admin || user.is_co_founder || user.is_creator) {
        req.admin = {
          id: user.id,
          email: user.email,
          username: user.first_name || user.email,
          is_super_admin: user.is_co_founder || user.is_creator,
        };
        next();
        return;
      }
    }

    // Fallback: check admin_users table (for dedicated admin accounts)
    const adminResult = await pool.query(
      'SELECT id, email, username, name, is_super_admin FROM admin_users WHERE id = $1',
      [userId],
    );

    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      req.admin = {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        is_super_admin: admin.is_super_admin,
      };
      next();
      return;
    }

    // No admin access found
    res.status(403).json({error: 'Admin access denied'});

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({error: 'Authentication error'});
  }
};

/**
 * Middleware to require super admin authentication
 * Must be used after requireAdmin middleware
 */
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({error: 'Authentication required'});
      return;
    }

    if (!req.admin.is_super_admin) {
      res.status(403).json({error: 'Super admin access required'});
      return;
    }

    next();
  } catch (_error) {
    console.error('Super admin auth middleware error:', _error);
    res.status(500).json({error: 'Authorization error'});
  }
};

/**
 * Rate limiting for login attempts
 * Simple in-memory rate limiter (5 attempts per 15 minutes per IP)
 */
const loginAttempts = new Map<string, {count: number; resetAt: number}>();

export const rateLimitLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const attempts = loginAttempts.get(ip);

  if (attempts) {
    if (now < attempts.resetAt) {
      if (attempts.count >= maxAttempts) {
        res.status(429).json({
          error: 'Too many login attempts. Please try again later.',
        });
        return;
      }
      attempts.count++;
    } else {
      // Reset window
      loginAttempts.set(ip, {count: 1, resetAt: now + windowMs});
    }
  } else {
    loginAttempts.set(ip, {count: 1, resetAt: now + windowMs});
  }

  next();
};

// Clean up old entries every hour
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, attempts] of loginAttempts.entries()) {
      if (now > attempts.resetAt) {
        loginAttempts.delete(ip);
      }
    }
  },
  60 * 60 * 1000,
);
