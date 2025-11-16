import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AdminUserModel from '../models/AdminUser';
import ApprovedAdminEmailModel from '../models/ApprovedAdminEmail';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key';

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
 * Verifies JWT token and checks if user is an admin
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: AdminJWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as AdminJWTPayload;
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Verify admin still exists and is active
    const admin = await AdminUserModel.findById(decoded.id);

    if (!admin) {
      res.status(401).json({ error: 'Admin account not found' });
      return;
    }

    if (!admin.email_verified) {
      res.status(403).json({ error: 'Email not verified' });
      return;
    }

    // Check if email is still approved
    const isApproved = await ApprovedAdminEmailModel.isApproved(admin.email);

    if (!isApproved) {
      res.status(403).json({ error: 'Admin access revoked' });
      return;
    }

    // Attach admin info to request
    req.admin = {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      is_super_admin: await ApprovedAdminEmailModel.isSuperAdmin(admin.email),
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Middleware to require super admin authentication
 * Must be used after requireAdmin middleware
 */
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.admin.is_super_admin) {
      res.status(403).json({ error: 'Super admin access required' });
      return;
    }

    next();
  } catch (_error) {
    console.error('Super admin auth middleware error:', _error);
    res.status(500).json({ error: 'Authorization error' });
  }
};

/**
 * Rate limiting for login attempts
 * Simple in-memory rate limiter (5 attempts per 15 minutes per IP)
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export const rateLimitLogin = (
  req: Request,
  res: Response,
  next: NextFunction
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
      loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    }
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
  }

  next();
};

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of loginAttempts.entries()) {
    if (now > attempts.resetAt) {
      loginAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);
